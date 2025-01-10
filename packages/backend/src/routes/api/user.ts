import Router from "@koa/router";
import { authenticationMiddleware } from "../../middleware/authenticate";
import { getUserById } from "../../data/user";

export const userRouter = new Router();

userRouter.use(authenticationMiddleware);

userRouter.get<{}, { claims: { sub: number } }>("/self", async (ctx) => {
  const user = await getUserById(ctx.claims.sub);
  ctx.body = user;
});
