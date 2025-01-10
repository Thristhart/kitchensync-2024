import Router from "@koa/router";
import { webAuthnRouter } from "./webauthn";
import { authRouter } from "./auth";
import { linkRouter } from "./links";
import { userRouter } from "./user";

export const apiRouter = new Router();
apiRouter.use(
  "/webauthn",
  webAuthnRouter.routes(),
  webAuthnRouter.allowedMethods()
);

apiRouter.use("/auth", authRouter.routes(), authRouter.allowedMethods());
apiRouter.use("/link", linkRouter.routes(), linkRouter.allowedMethods());
apiRouter.use("/user", userRouter.routes(), userRouter.allowedMethods());
