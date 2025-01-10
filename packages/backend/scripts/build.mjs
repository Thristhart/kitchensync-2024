import esbuild from "esbuild";
import sqlts from "@rmp135/sql-ts";
import * as dbmate from "dbmate";
import { execFileSync } from "child_process";
import fs from "fs/promises";
import "dotenv/config";

if (process.env.DATABASE_URL) {
  console.log("dbmate up");
  execFileSync(dbmate.resolveBinary(), ["up"], { stdio: "inherit" });

  console.log("generating TS bindings for SQL...");
  const tsReadString = await sqlts.toTypeScript({
    client: "better-sqlite3",
    connection: {
      filename: "./db/dev.sqlite3",
    },
    useNullAsDefault: true,
    interfaceNameFormat: "${table}DBO",
    tableNameCasing: "pascal",
    singularTableNames: true,
    globalOptionality: "required",
  });
  const tsWriteString = await sqlts.toTypeScript({
    client: "better-sqlite3",
    connection: {
      filename: "./db/dev.sqlite3",
    },
    useNullAsDefault: true,
    interfaceNameFormat: "Write${table}DBO",
    tableNameCasing: "pascal",
    singularTableNames: true,
    globalOptionality: "dynamic",
  });
  const tsString = tsReadString + "\n" + tsWriteString;

  const modelPath = "./src/data/model.ts";

  const existingModel = await fs.readFile(modelPath, "utf8");
  if (existingModel !== tsString) {
    await fs.writeFile(modelPath, tsString);
  }
}

console.log("building backend...");

await esbuild.build({
  entryPoints: ["src/main.ts"],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "esm",
  charset: "utf8",
  sourcemap: true,
  outdir: "./dist",
  banner: {
    js: `
import { createRequire as topLevelCreateRequire } from 'module';
import { fileURLToPath as topLevelFileUrlToPath } from "node:url";
const require = topLevelCreateRequire( import.meta.url );
const __dirname = topLevelFileUrlToPath( new URL( ".", import.meta.url ) );
const __filename = topLevelFileUrlToPath( import.meta.url );
        `,
  },
  external: ["dbmate", "better-sqlite3", "argon2"],
});

console.log("backend built.");
