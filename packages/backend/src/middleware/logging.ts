import { Middleware, Next, ParameterizedContext } from "koa";

export const logMiddleware: Middleware = async (ctx: ParameterizedContext, next: Next) => {
    console.log(`${ctx.method} ${ctx.url}`);
    const start = new Date();
    await next();
    console.log(`=> ${ctx.status} in ${new Date().getTime() - start.getTime()}ms`);
};
