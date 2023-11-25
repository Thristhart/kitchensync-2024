import Koa from 'koa';
import { logMiddleware } from '@kitchensync/backend/middleware/logging';
import { rootRouter } from './routes';
import bodyParser from "koa-bodyparser";
import staticMiddleware from "koa-static";
import path from 'node:path';

const app = new Koa();

app.use(logMiddleware)

app.use(staticMiddleware(path.dirname(require.resolve("@kitchensync/frontend/lobby.html"))))

app.use(
    bodyParser({
        enableTypes: ["json", "form"],
    })
);

app.use(rootRouter.routes());

console.log("listening on", `http://localhost:3000`)

app.listen(3000);