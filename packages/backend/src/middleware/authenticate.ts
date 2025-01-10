import { Middleware, Next, ParameterizedContext } from "koa";
import { validateAccessToken } from "../data/auth";

export const authenticationMiddleware: Middleware = async (
  ctx: ParameterizedContext,
  next: Next
) => {
  const access_token = ctx.get("Authorization");
  if (!access_token) {
    ctx.response.body = {
      success: false,
      message: "Missing Authorization header",
    };
    ctx.response.status = 401;
    return;
  }
  const claims = await validateAccessToken(access_token);
  if (!claims) {
    ctx.response.body = {
      success: false,
      message: "Invalid or expired access_token",
    };
    ctx.response.status = 401;
    return;
  }
  ctx.claims = claims;
  await next();
};
