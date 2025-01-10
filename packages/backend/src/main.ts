import { logMiddleware } from "@kitchensync/backend/middleware/logging";
import Koa from "koa";
import staticMiddleware from "koa-static";
import path from "node:path";
import { rootRouter } from "./routes";

const app = new Koa();

app.proxy = true;
app.keys = ["kitchensync"];
if (process.env.KOA_KEY) {
  app.keys.push(process.env.KOA_KEY);
}

// tell koa that we're in a secure cookies context (behind an https proxy)
app.use(async (ctx, next) => {
  ctx.cookies.secure = true;
  await next();
});
app.use(logMiddleware);

app.use(
  staticMiddleware(
    path.dirname(require.resolve("@kitchensync/frontend/lobby.html"))
  )
);

app.use(rootRouter.routes());

console.log("listening on", `http://localhost:3000`);

app.listen(3000);
