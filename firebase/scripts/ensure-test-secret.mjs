// エミュレーター用の秘密の値を作る（本番の値は Secret Manager に置き、このファイルは使わない）
import { existsSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";

const file = new URL("../functions/.secret.local", import.meta.url);
if (!existsSync(file)) writeFileSync(file, "HIROBA_SECRET=" + randomBytes(32).toString("base64url") + "\n");
