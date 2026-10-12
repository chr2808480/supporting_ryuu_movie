// 開示請求などで、投稿時の IP（ipLogs の ip 欄）を読む必要があるときに使う。
//   HIROBA_SECRET='（Secret Manager の値）' node scripts/decrypt-ip.mjs 'v1:....'
// 結果は {"xff": 転送ヘッダー全体, "ip": 接続元} です。扱いは法令と専門家の助言に従ってください。
import { createDecipheriv, hkdfSync } from "node:crypto";

const secret = process.env.HIROBA_SECRET;
const value = process.argv[2];
if (!secret || !value || !value.startsWith("v1:")) {
  console.error("使い方: HIROBA_SECRET='...' node scripts/decrypt-ip.mjs 'v1:...'");
  process.exit(1);
}
const key = Buffer.from(hkdfSync("sha256", Buffer.from(secret, "utf8"), Buffer.alloc(0), "hiroba-ip-v1", 32));
const raw = Buffer.from(value.slice(3), "base64");
const decipher = createDecipheriv("aes-256-gcm", key, raw.subarray(0, 12));
decipher.setAuthTag(raw.subarray(12, 28));
console.log(Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString("utf8"));
