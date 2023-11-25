import { context } from "./config.mjs";

console.log("building frontend...");

await context.rebuild();

await context.dispose();

console.log("frontend built.")