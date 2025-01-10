import Router from "@koa/router";
import {
  consumeMagicLink,
  createTokensForUser,
  validateMagicLink,
} from "../../data/auth";
import {
  doesUserExistWithEmail,
  getUserByEmail,
  registerUser,
} from "../../data/user";
import { refreshTokenCookieSettings } from "./auth";

export const linkRouter = new Router();

linkRouter.get("/:id/:token", async (ctx, next) => {
  const email = await validateMagicLink(ctx.params.id, ctx.params.token);
  if (!email) {
    ctx.response.body = "Failed to validate login link. Did it expire?";
    ctx.response.status = 401;
    return;
  }
  ctx.response.body = "valid, yay. your email is " + email;
});

linkRouter.get("/consume/:id/:session_secret", async (ctx, next) => {
  const email = await consumeMagicLink(
    ctx.params.id,
    ctx.params.session_secret
  );
  if (!email) {
    ctx.response.body = { success: false };
    ctx.response.status = 401;
    return;
  }
  // maybe there should be an explicit register flow instead of just creating on login attempt?
  // but for now, just make the user if they don't exist
  if (!doesUserExistWithEmail(email)) {
    await registerUser(email);
  }
  const user = await getUserByEmail(email);
  const tokens = await createTokensForUser(
    user.id,
    ctx.request.ip,
    ctx.request.header["user-agent"] ?? "No UA"
  );
  ctx.cookies.set(
    "refresh_token",
    tokens.refresh_token,
    refreshTokenCookieSettings
  );
  ctx.response.body = { success: true, access_token: tokens.access_token };
});
