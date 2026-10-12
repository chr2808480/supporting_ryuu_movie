// 画面を通した確認（npm run test:e2e）。エミュレーターにつないだ hiroba.html / kanri.html をブラウザで操作する。
// メールは送られないので、Auth エミュレーターが発行したログイン用リンクを直接開く。
// 本番の受付時間（毎日23:00〜6:00 はお休み）の判定はサーバーの時計で行うため、日本時間の6時〜23時に実行すること。
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join as joinPath, normalize } from "node:path";
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { db, PROJECT } from "./helpers.mjs";

const ROOT = new URL("../../", import.meta.url).pathname;
const PORT = 8765;
const ORIGIN = "http://127.0.0.1:" + PORT;
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".png": "image/png" };
const TEST_CONFIG = "window.HB_FIREBASE = " + JSON.stringify({
  config: { apiKey: "fake-api-key", authDomain: PROJECT + ".firebaseapp.com", projectId: PROJECT, appId: "demo" },
  region: "asia-northeast1",
  useEmulators: true
}) + ";";

const server = createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, ORIGIN).pathname)).replace(/^\/+/, "");
  if (path === "assets/js/hiroba-config.js") {
    res.writeHead(200, { "content-type": TYPES[".js"] });
    return res.end(TEST_CONFIG);
  }
  try {
    const body = await readFile(joinPath(ROOT, path || "index.html"));
    res.writeHead(200, { "content-type": TYPES[extname(path)] || "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end();
  }
}).listen(PORT, "127.0.0.1");

const jstHour = new Date(Date.now() + 9 * 3600 * 1000).getUTCHours();
if (jstHour >= 23 || jstHour < 6) {
  console.log("日本時間の23時〜6時は投稿をお休みする時間なので、確認を飛ばします");
  process.exit(0);
}

async function linkFor(email) {
  const res = await fetch("http://127.0.0.1:9099/emulator/v1/projects/" + PROJECT + "/oobCodes");
  const all = (await res.json()).oobCodes || [];
  const codes = all.filter((c) => c.email === email && c.requestType === "EMAIL_SIGNIN");
  if (!codes.length) console.log("oobCodes:", JSON.stringify(all));
  const code = codes[codes.length - 1];
  assert.ok(code, "ログイン用リンクが発行されていない: " + email);
  return ORIGIN + "/hiroba.html?apiKey=fake-api-key&oobCode=" + code.oobCode + "&mode=signIn&lang=ja";
}

async function join(page, email, handle) {
  await page.goto(ORIGIN + "/hiroba.html");
  await page.waitForSelector("#hb-join:not([hidden])");
  await page.click('#hb-join [data-open="join"]');
  await page.check('input[name="age"]');
  await page.check('input[name="agree"]');
  await page.click("[data-next]");
  await page.fill("#join-email", email);
  await page.fill("#join-name", handle);
  await page.click('#join-form button[type="submit"]');
  await page.waitForFunction(() => !document.getElementById("dlg-join").open);
  await page.goto(await linkFor(email));
  await page.waitForSelector("#hb-form:not([hidden])");
  assert.equal(await page.textContent("#hb-me-name"), handle);
  assert.ok(!page.url().includes("oobCode"), "ログイン後にリンクの値を URL から消す");
}

// 前の知らせが残っていることがあるので、期待する文が出るまで待つ
async function expectToast(page, pattern) {
  await page.waitForFunction((src) => {
    const t = document.getElementById("toast");
    return t.classList.contains("is-visible") && new RegExp(src).test(t.textContent);
  }, pattern.source, { timeout: 15000 });
}

const browser = await chromium.launch();
const errors = [];
try {
  const a = await (await browser.newContext()).newPage();
  const b = await (await browser.newContext()).newPage();
  for (const p of [a, b]) p.on("pageerror", (e) => errors.push(e.message));

  // 1. 参加登録（メールのリンク → 表示名の登録）と、デモ表示が消えていること
  await join(a, "a@example.com", "流れ星");
  assert.equal(await a.isVisible(".hb-demo"), false);

  // 2. 投稿：個人情報らしい文字列の確認 → このまま投稿
  await a.check('input[name="tag"][value="感想"]');
  await a.fill("#hb-body", "土曜の配信が最高でした。連絡は 090-1234-5678");
  await a.click('#hb-form button[type="submit"]');
  await a.waitForSelector("#hb-pii:not([hidden])");
  await a.click('[data-pii="post"]');
  await expectToast(a, /投稿しました/);
  await a.waitForSelector(".hb-post .hb-body >> text=土曜の配信が最高でした");

  // 3. リンクを含む投稿は確認待ち（本人にだけ表示）
  await a.waitForTimeout(21000);   // 連投の間隔（20秒）
  await a.check('input[name="tag"][value="おすすめ動画"]');
  await a.fill("#hb-body", "おすすめ https://example.com/video");
  await a.click('#hb-form button[type="submit"]');
  await expectToast(a, /運営の確認後/);
  await a.waitForSelector(".hb-hold");

  // 4. 別の人：確認待ちは見えない。★を送り、返信し、通報する
  await join(b, "b@example.com", "星屑");
  assert.equal(await b.locator(".hb-hold").count(), 0);
  const post = b.locator(".hb-post", { hasText: "土曜の配信が最高でした" });
  await post.locator('[data-action="star"]').click();
  await b.waitForSelector(".hb-ora");
  await post.locator('[data-action="reply"]').click();
  await post.locator('textarea[name="reply"]').fill("わかります！");
  await post.locator('.hb-replyform button[type="submit"]').click();
  await expectToast(b, /返信しました/);
  await b.waitForSelector(".hb-reply >> text=わかります！");
  await b.locator(".hb-post", { hasText: "土曜の配信が最高でした" }).locator("summary").first().click();
  await b.click('.hb-post:has-text("土曜の配信が最高でした") [data-action="report"]');
  await b.check('input[name="reason"][value="個人情報"]');
  await b.click('#report-form button[type="submit"]');
  await expectToast(b, /通報を受け付けました/);

  // 5. 投稿した本人には★の数が見える
  await a.reload();
  await a.waitForSelector(".hb-starcount >> text=1");

  // 6. 記録がサーバー側にできている
  const reports = await db.collection("reports").get();
  assert.equal(reports.size, 1);
  assert.equal((await db.collection("ipLogs").get()).size, 3);

  // 7. ミュートすると投稿が隠れ、退会するとデータが消える
  await b.reload();
  await b.waitForSelector('.hb-post:has-text("土曜の配信が最高でした")');
  await b.locator(".hb-post", { hasText: "土曜の配信が最高でした" }).locator("summary").first().click();
  await b.click('.hb-post:has-text("土曜の配信が最高でした") [data-action="mute"]');
  await b.waitForSelector("#hb-hidden-note:not([hidden])");
  await b.reload();
  await b.waitForSelector("#hb-hidden-note:not([hidden])");   // 保存され、開き直しても残る
  await b.click('[data-action="leave"]');
  await b.click("#dlg-confirm-ok");
  await expectToast(b, /退会しました/);
  await b.waitForSelector("#hb-join:not([hidden])");
  assert.equal((await db.collectionGroup("replies").where("body", "==", "わかります！").get()).size, 0);

  console.log("e2e: hiroba ok");
  if (errors.length) throw new Error("ページのエラー: " + errors.join(" / "));
} finally {
  await browser.close();
  server.close();
}
