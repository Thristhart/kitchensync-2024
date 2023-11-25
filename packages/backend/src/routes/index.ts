import { createLobby, getLobbyFromDatabaseById } from "@kitchensync/backend/data/lobby";
import Router from "@koa/router";
import send from "koa-send";
import { apiRouter } from "./api";
import path from "node:path";
import { ParameterizedContext } from "koa";
import { sendPackageFile } from "./frontendcontent";

export const rootRouter = new Router();

rootRouter.use("/api", apiRouter.routes(), apiRouter.allowedMethods());

rootRouter.get(["/create", "/"], async (ctx) => {
    const id = createLobby();
    ctx.redirect(id);
});

rootRouter.get("/:id", async (ctx, next) => {
    const lobby = getLobbyFromDatabaseById(ctx.params.id);
    if (!lobby) {
        ctx.status = 404;
        return;
    }

    return sendPackageFile(ctx, "@kitchensync/frontend/lobby.html");
});
