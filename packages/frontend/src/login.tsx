import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  ConsumeMagicLinkResponse,
  CreateMagicLinkResponse,
} from "@kitchensync/common/loginmodel";
import { useStore } from "zustand";
import { userStore } from "./userstate";

async function supportsCMA() {
  return (
    "PublicKeyCredential" in window &&
    window.PublicKeyCredential.isConditionalMediationAvailable &&
    (await window.PublicKeyCredential.isConditionalMediationAvailable())
  );
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

  if (magicLink) {
    return <WaitingForMagicLink magicLink={magicLink} />;
  }
  return (
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
  );
}

export function LogoutButton() {
  const user = useStore(userStore);
  return <button onClick={() => user.logout()}>Log out</button>;
}
