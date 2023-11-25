import type { ParameterizedContext } from "koa";
import send from "koa-send";
import path from "path";

export async function sendPackageFile(ctx: ParameterizedContext, packagePath: string)
{
    const resolvedPath = require.resolve(packagePath);
    return send(ctx, path.basename(resolvedPath), {root: path.dirname(require.resolve(packagePath))});
}

