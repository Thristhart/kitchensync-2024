import Router from "@koa/router";
import { AssertionResult, AttestationResult, Fido2Lib } from "fido2-lib";
import { authenticationMiddleware } from "../../middleware/authenticate";
import {
  associatePublicKeyWithUser,
  createTokensForUser,
  getPublicKeyById,
  getWebauthnChallenge,
  saveWebauthnChallenge,
  updateCounter,
} from "../../data/auth";
import bodyParser from "koa-bodyparser";
import { getUserById } from "../../data/user";
import * as base64 from "base64-arraybuffer";
import { randomBytes } from "node:crypto";
import { WebauthnLoginRequest } from "@kitchensync/common/loginmodel";
import { refreshTokenCookieSettings } from "./auth";

export const webAuthnRouter = new Router();

function getFidoForRp(rpId: string) {
  return new Fido2Lib({
    timeout: 42,
    rpId,
    rpName: "Kitchen Sync",
    rpIcon: "https://sync.kitchen/logo.png",
    challengeSize: 128,
    attestation: "none",
    cryptoParams: [-7, -257],
    authenticatorAttachment: "platform",
    authenticatorRequireResidentKey: true,
    authenticatorUserVerification: "preferred",
  });
}
// called by a signed in user to begin the process of associating with a passkey
webAuthnRouter.get("/register", authenticationMiddleware, async (ctx) => {
  const fido2 = getFidoForRp(ctx.request.hostname);

  const registrationOptions = await fido2.attestationOptions();

  const userInfo = await getUserById(ctx.claims.sub);

  registrationOptions.user.id = base64.encode(
    randomBytes(16)
  ) as unknown as ArrayBuffer;
  registrationOptions.user.name = userInfo.email;
  registrationOptions.user.displayName = userInfo.email;

  const challengeBase64 = base64.encode(registrationOptions.challenge);
  const challengeId = base64.encode(randomBytes(32));
  await saveWebauthnChallenge(challengeId, challengeBase64);

  ctx.body = {
    ...registrationOptions,
    challenge: challengeBase64,
    challengeId,
  };
});

function isRegisterRequest(body: unknown): body is { challengeId: string } {
  return !!body && typeof body === "object" && "challengeId" in body;
}

webAuthnRouter.post(
  "/register",
  authenticationMiddleware,
  bodyParser(),
  async (ctx) => {
    const clientAttestationResponse = ctx.request.body as AttestationResult;
    if (!isRegisterRequest(ctx.request.body)) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        error: "Missing challengeId",
      };
      return;
    }
    const challenge = await getWebauthnChallenge(ctx.request.body.challengeId);
    if (!challenge) {
      ctx.status = 403;
      ctx.body = {
        success: false,
        error: "No stored challenge, did it time out?",
      };
      return;
    }
    const fido2 = getFidoForRp(ctx.request.hostname);
    // type is wrong because it's string encoded on the client
    const idBase64 = clientAttestationResponse.rawId as unknown as string;
    clientAttestationResponse.rawId = base64.decode(idBase64);

    try {
      const result = await fido2.attestationResult(clientAttestationResponse, {
        challenge,
        origin: ctx.request.headers.origin!, // this should maybe be hardcoded per environment or something, or saved with the initial request
        factor: "either",
      });
      await associatePublicKeyWithUser(
        ctx.claims.sub,
        result.authnrData.get("counter"),
        result.authnrData.get("credentialPublicKeyPem"),
        idBase64
      );
      ctx.body = {
        success: true,
      };
    } catch (e) {
      console.error(e);
      ctx.status = 403;
      ctx.body = {
        success: false,
        error: "Failed to validate attestation challenge",
      };
    }
  }
);

webAuthnRouter.get("/login", async (ctx) => {
  const fido2 = getFidoForRp(ctx.request.hostname);
  const assertionOptions = await fido2.assertionOptions();

  const challengeBase64 = base64.encode(assertionOptions.challenge);
  const challengeId = base64.encode(randomBytes(32));
  await saveWebauthnChallenge(challengeId, challengeBase64);

  ctx.body = { ...assertionOptions, challenge: challengeBase64, challengeId };
});

function isLoginRequest(body: unknown): body is { challengeId: string } {
  return !!body && typeof body === "object" && "challengeId" in body;
}

webAuthnRouter.post("/login", bodyParser(), async (ctx) => {
  const clientAssertionResponse = ctx.request.body as WebauthnLoginRequest;
  if (!isLoginRequest(ctx.request.body)) {
    ctx.status = 400;
    ctx.body = {
      success: false,
      error: "Missing challengeId",
    };
    return;
  }
  const challenge = await getWebauthnChallenge(ctx.request.body.challengeId);
  if (!challenge) {
    ctx.status = 403;
    ctx.body = {
      success: false,
      error: "No stored challenge, did it time out?",
    };
    return;
  }
  // TODO: we should probably also check if the user associated with the pubkey exists
  const publicKeyData = await getPublicKeyById(clientAssertionResponse.id);
  if (!publicKeyData) {
    ctx.status = 403;
    ctx.body = {
      success: false,
      error: "No user associated with that credential",
    };
    return;
  }
  const fido2 = getFidoForRp(ctx.request.hostname);
  const result = await fido2.assertionResult(
    {
      id: base64.decode(clientAssertionResponse.id),
      response: {
        clientDataJSON: clientAssertionResponse.response.clientDataJSON,
        authenticatorData: base64.decode(
          clientAssertionResponse.response.authenticatorData
        ),
        signature: clientAssertionResponse.response.signature,
        userHandle: clientAssertionResponse.response.userHandle,
      },
    },
    {
      challenge,
      origin: ctx.request.headers.origin!, // this should maybe be hardcoded per environment or something, or saved with the initial request
      factor: "either",
      prevCounter: publicKeyData.counter!,
      publicKey: publicKeyData.public_key!,
      userHandle: clientAssertionResponse.response.userHandle ?? null,
    }
  );
  if (result.audit.validExpectations && result.audit.validRequest) {
    await updateCounter(
      clientAssertionResponse.id,
      result.authnrData.get("counter")
    );
    const tokens = await createTokensForUser(
      publicKeyData.user_id!,
      ctx.request.ip,
      ctx.request.header["user-agent"] ?? "No UA"
    );
    ctx.cookies.set(
      "refresh_token",
      tokens.refresh_token,
      refreshTokenCookieSettings
    );
    ctx.response.body = { success: true, access_token: tokens.access_token };
    return;
  }

  ctx.status = 403;
  ctx.body = {
    success: false,
    error: "Failed to validate login",
  };
});
