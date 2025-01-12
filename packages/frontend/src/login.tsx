import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  ConsumeMagicLinkResponse,
  CreateMagicLinkResponse,
  RegisterCredentialsOptionsResponse,
  RequestCredentialsOptionsResponse,
  WebauthnLoginRequest,
  WebauthnLoginResponse,
} from "@kitchensync/common/loginmodel";
import { useStore } from "zustand";
import {
  isFailedResponse,
  makeAuthenticatedRequest,
  userStore,
} from "./userstate";
import * as base64 from "base64-arraybuffer";

async function supportsCMA() {
  return (
    "PublicKeyCredential" in window &&
    window.PublicKeyCredential.isConditionalMediationAvailable &&
    (await window.PublicKeyCredential.isConditionalMediationAvailable())
  );
}

async function authenticatorAvailable() {
  return (
    "PublicKeyCredential" in window &&
    window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable &&
    (await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable())
  );
}

export async function canCreatePasskey() {
  const [cma, authenticator] = await Promise.all([
    supportsCMA(),
    authenticatorAvailable(),
  ]);
  return cma && authenticator;
}

async function registerPasskey() {
  const credentialCreationOptions =
    await makeAuthenticatedRequest<RegisterCredentialsOptionsResponse>(
      "/api/webauthn/register"
    );
  if (isFailedResponse(credentialCreationOptions)) {
    return false;
  }
  const credential = (await navigator.credentials.create({
    publicKey: {
      ...credentialCreationOptions,
      challenge: base64.decode(credentialCreationOptions.challenge),
      user: {
        ...credentialCreationOptions.user,
        id: base64.decode(credentialCreationOptions.user.id),
      },
    },
  })) as PublicKeyCredential;

  if (!credential) {
    return false;
  }

  const response = credential.response as AuthenticatorAttestationResponse;
  const body = {
    response: {
      attestationObject: base64.encode(response.attestationObject),
      clientDataJSON: base64.encode(response.clientDataJSON),
    },
    rawId: base64.encode(credential.rawId),
    transports: response.getTransports(),
    challengeId: credentialCreationOptions.challengeId,
  };
  const registrationSuccess = await makeAuthenticatedRequest<{ success: true }>(
    "/api/webauthn/register",
    {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "content-type": "application/json" },
    }
  );
  return registrationSuccess.success;
}

// I wanted to use conditional mediation here, but it doesn't appear that works with bitwarden on desktop :(
// so, seperate button
async function attemptPasskeyLogin() {
  if (!(await supportsCMA())) {
    return false;
  }

  const credentialRequestOptions = (await (
    await fetch("/api/webauthn/login")
  ).json()) as RequestCredentialsOptionsResponse;
  if (isFailedResponse(credentialRequestOptions)) {
    return false;
  }

  const credential = (await navigator.credentials.get({
    publicKey: {
      ...credentialRequestOptions,
      challenge: base64.decode(credentialRequestOptions.challenge),
    },
  })) as PublicKeyCredential;

  if (!credential) {
    return false;
  }

  const response = credential.response as AuthenticatorAssertionResponse;
  const body: WebauthnLoginRequest = {
    id: base64.encode(credential.rawId),
    response: {
      clientDataJSON: base64.encode(response.clientDataJSON),
      authenticatorData: base64.encode(response.authenticatorData),
      signature: base64.encode(response.signature),
      userHandle: response.userHandle
        ? base64.encode(response.userHandle)
        : undefined,
    },
    challengeId: credentialRequestOptions.challengeId,
  };
  const loginResponse = await fetch("/api/webauthn/login", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
  const loginResponseBody =
    (await loginResponse.json()) as WebauthnLoginResponse;
  if (loginResponseBody.success) {
    userStore.getState().login(loginResponseBody.access_token);
    return true;
  } else {
    return false;
  }
}

interface WaitingForMagicLinkProps {
  magicLink: CreateMagicLinkResponse;
}
function WaitingForMagicLink(props: WaitingForMagicLinkProps) {
  const { magicLink } = props;

  const userState = useStore(userStore);

  const consumeQuery = useQuery({
    queryKey: ["consumeMagicLink"],
    async queryFn() {
      const response = await fetch(
        `/api/link/consume/${magicLink.id}/${magicLink.session_secret}`
      );
      return (await response.json()) as ConsumeMagicLinkResponse;
    },
    refetchInterval(query) {
      if (query.state.data?.success) {
        return undefined;
      }
      return 1000;
    },
  });

  useEffect(() => {
    if (consumeQuery.data?.success) {
      userState.login(consumeQuery.data.access_token);
    }
  }, [consumeQuery.data]);

  return (
    <span>
      We've sent an email to your email address. Click the link in that email
      within the next 15 minutes to log in on this device.
      <button>Resend</button>
    </span>
  );
}
export function MagicLinkLogin() {
  const formRef = useRef<HTMLFormElement>(null);
  const [magicLink, setMagicLink] = useState<
    CreateMagicLinkResponse | undefined
  >(undefined);
  const loginMutation = useMutation({
    async mutationFn() {
      if (!formRef.current) {
        return;
      }
      const data = new FormData(formRef.current);
      const response = await fetch(formRef.current.action, {
        method: "POST",
        body: JSON.stringify({ email: data.get("email") }),
        headers: {
          "content-type": "application/json",
        },
      });
      const responseData = await response.json();
      return responseData as CreateMagicLinkResponse;
    },
  });

  const cmaLoginMutation = useMutation({
    mutationFn: attemptPasskeyLogin,
    retry: false,
  });

  if (magicLink) {
    return <WaitingForMagicLink magicLink={magicLink} />;
  }
  return (
    <>
      <form
        ref={formRef}
        method="POST"
        action="/api/auth/by_email"
        onSubmit={async (event) => {
          event.preventDefault();
          const linkData = await loginMutation.mutateAsync();
          if (linkData) {
            setMagicLink(linkData);
          }
        }}
      >
        <label>
          Log in via email:
          <input
            type="text"
            name="email"
            autoComplete="email webauthn"
            disabled={loginMutation.isPending}
          />
        </label>
      </form>
      <button onClick={() => cmaLoginMutation.mutate()}>
        Login via passkey
      </button>
    </>
  );
}
export function PasskeyRegistration() {
  const [canRegister, setCanRegister] = useState(false);
  useEffect(() => {
    canCreatePasskey().then((supports) => setCanRegister(supports));
  }, []);

  if (!canRegister) {
    return null;
  }
  return <button onClick={() => registerPasskey()}>Create a passkey</button>;
}

export function LogoutButton() {
  const user = useStore(userStore);
  return <button onClick={() => user.logout()}>Log out</button>;
}
