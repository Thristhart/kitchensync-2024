import Database from "better-sqlite3";
import * as dbmate from "dbmate";
import { execFileSync } from "child_process";
import "dotenv/config";

execFileSync(dbmate.resolveBinary(), ["up"], { stdio: "inherit" });

export const database = new Database(
  process.env.DATABASE_URL?.split("sqlite:")?.[1] ?? ":memory:"
);
database.pragma("journal_mode = WAL");
database.pragma("foreign_keys = ON");
