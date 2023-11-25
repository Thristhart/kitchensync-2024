import { Next, ParameterizedContext } from "koa";
import WebSocket from "ws";

export const makeWebsocketMiddleware = () => {
    const wss = new WebSocket.Server({ noServer: true });
    return async (ctx: ParameterizedContext, next: Next) => {
        const upgradeHeader = (ctx.request.headers.upgrade || "").split(",").map((s: string) => s.trim());

        if (upgradeHeader.indexOf("websocket") !== -1) {
            ctx.ws = () =>
                new Promise((resolve) => {
                    wss.handleUpgrade(ctx.req, ctx.request.socket, Buffer.alloc(0), resolve);
                    ctx.respond = false;
                });
        }

        await next();
    };
};

export type ContextWithWebsocket = ParameterizedContext & { ws?: () => Promise<WebSocket> };
