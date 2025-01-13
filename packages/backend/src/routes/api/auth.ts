import {
  CreateMagicLinkResponse,
  RefreshTokenResponse,
} from "@kitchensync/common/loginmodel";
import Router from "@koa/router";
import bodyParser from "koa-bodyparser";
import {
  consumeRefreshToken,
  createMagicLink,
  refreshTokenExpiry,
} from "../../data/auth";
import sgMail from "@sendgrid/mail";

if (!process.env.SENDGRID_API_KEY) {
  throw new Error("missing SENDGRID_API_KEY env variable");
}
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const authRouter = new Router();

function isValidByEmailBody(body: unknown): body is { email: string } {
  return body != null && typeof body === "object" && "email" in body;
}

async function sendMagicLinkEmail(email: string, url: string) {
  // TODO restore
  // await sgMail.send({
  //   to: email,
  //   from: "noreply@sync.kitchen",
  //   templateId: "d-53ff9735d23544d295a756bdddac863d",
  //   dynamicTemplateData: {
  //     url,
  //   },
  // });
}

// this is logging in, either for the first time or for an existing user
authRouter.post("/by_email", bodyParser(), async (ctx, next) => {
  const body = ctx.request.body;
  if (!isValidByEmailBody(body)) {
    ctx.response.status = 400;
    ctx.response.body = { success: false, message: "Missing email" };
    return;
  }
  const { email } = body;
  const { link, session_secret, id } = await createMagicLink(
    email,
    ctx.request.ip,
    ctx.request.header["user-agent"] ?? "No UA"
  );
  const url = `https://${ctx.request.host}${link}`;
  try {
    await sendMagicLinkEmail(email, url);
  } catch (e) {
    console.error(e);
    ctx.response.status = 500;
    ctx.response.body = { success: false, message: "Failed to send email" };
    return;
  }
  const response: CreateMagicLinkResponse = {
    session_secret,
    id,
  };
  ctx.response.body = response;
});

export const refreshTokenCookieSettings = {
  httpOnly: true,
  maxAge: refreshTokenExpiry,
  sameSite: "strict",
  overwrite: true,
  secure: true,
} as const;

authRouter.get("/refresh", async (ctx, next) => {
  const refresh_token = ctx.cookies.get("refresh_token");
  if (!refresh_token) {
    ctx.response.body = { success: false, message: "No refresh token" };
    ctx.response.status = 401;
    return;
  }
  const tokens = await consumeRefreshToken(
    refresh_token,
    ctx.request.ip,
    ctx.request.header["user-agent"] ?? "No UA"
  );
  if (!tokens) {
    ctx.response.body = { success: false, message: "Invalid refresh token" };
    ctx.response.status = 401;
    return;
  }
  ctx.cookies.set(
    "refresh_token",
    tokens.refresh_token,
    refreshTokenCookieSettings
  );
  ctx.response.body = {
    success: true,
    access_token: tokens.access_token,
  } as RefreshTokenResponse;
});

authRouter.get("/logout", (ctx) => {
  ctx.cookies.set("refresh_token", null);
  ctx.response.status = 200;
});
