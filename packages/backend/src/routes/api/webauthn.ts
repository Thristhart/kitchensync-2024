import Router from "@koa/router";
import { Fido2Lib } from "fido2-lib";

const fido2 = new Fido2Lib({
  timeout: 42,
  rpId: "sync.kitchen",
  rpName: "Kitchen Sync",
  rpIcon: "https://sync.kitchen/logo.png",
  challengeSize: 128,
  attestation: "none",
  cryptoParams: [-7, -257],
  authenticatorAttachment: "platform",
  authenticatorRequireResidentKey: false,
  authenticatorUserVerification: "preferred",
});

export const webAuthnRouter = new Router();
