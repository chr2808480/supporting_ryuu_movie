// 画面を通した確認（npm run test:e2e）。エミュレーターにつないだ hiroba.html / kanri.html をブラウザで操作する。
// メールは送られないので、Auth エミュレーターが発行したログイン用リンクを直接開く。
// 本番の受付時間（毎日23:00〜6:00 はお休み）の判定はサーバーの時計で行うため、日本時間の6時〜23時に実行すること。
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join as joinPath, normalize } from "node:path";
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { Timestamp } from "firebase-admin/firestore";
import { db, auth, PROJECT } from "./helpers.mjs";

const ROOT = new URL("../../", import.meta.url).pathname;
const PORT = 8765;
const ORIGIN = "http://127.0.0.1:" + PORT;
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".png": "image/png" };
const TEST_CONFIG = "window.HB_FIREBASE = " + JSON.stringify({
  config: { apiKey: "fake-api-key", authDomain: PROJECT + ".firebaseapp.com", projectId: PROJECT, appId: "demo" },
  region: "asia-northeast1",
  useEmulators: true,
  openAt: Date.parse("2026-10-01T06:00:00+09:00")   // 参加登録の受付開始（functions/.env.demo-hiroba と同じ）
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
  await page.waitForSelector("#hb-join-sent:not([hidden])");   // 届かないときの案内が残る
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

  // 1. 参加登録（メールのリンク → 表示名の登録）
  await join(a, "a@example.com", "流れ星");

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

  // 7. 運営者ページ：ログイン → 権限を有効にする → 確認待ちを公開 → 通報された投稿を非表示にして通知メールを作る
  const k = await (await browser.newContext()).newPage();
  k.on("pageerror", (e) => errors.push(e.message));
  await k.goto(ORIGIN + "/kanri.html");
  await k.waitForSelector("#kn-login:not([hidden])");
  await k.fill("#kn-email", "admin@example.com");
  await k.click('#kn-login button[type="submit"]');
  await expectToast(k, /ログイン用のリンクを送りました/);
  await k.goto((await linkFor("admin@example.com")).replace("/hiroba.html", "/kanri.html"));
  await k.waitForSelector("#kn-claim:not([hidden])");
  await k.click("#kn-claim-btn");
  await k.waitForSelector("#kn-app:not([hidden])");
  await k.click('#kn-held [data-do="approve"]');
  await expectToast(k, /公開しました/);
  await k.click('#kn-reports [data-do="pick"]');
  await k.waitForSelector("#kn-act");
  await k.selectOption('#kn-act select[name="action"]', "hide");
  await k.fill('#kn-act input[name="rule"]', "禁止事項1：個人情報の投稿");
  await k.fill('#kn-act textarea[name="reason"]', "電話番号が書かれていたため");
  await k.click('#kn-act button[type="submit"]');
  await k.waitForSelector("#kn-user a.btn");
  const mail = decodeURIComponent(await k.getAttribute("#kn-user a.btn", "href"));
  assert.match(mail, /^mailto:a@example\.com\?subject=/);
  assert.match(mail, /禁止事項1：個人情報の投稿/);
  assert.match(mail, /14日以内/);
  // メールアプリで本文が切れたときのために、同じ本文をコピーできる
  const body = await k.inputValue("#kn-notice-body");
  assert.match(body, /14日以内/);
  assert.match(body, /ryuu星軍 本部 運営$/);
  assert.equal(await k.textContent("#kn-user .kn-notice dd"), "a@example.com");
  await k.context().grantPermissions(["clipboard-read", "clipboard-write"], { origin: ORIGIN });
  await k.click('#kn-user [data-copy="body"]');
  await expectToast(k, /コピーしました/);
  assert.equal(await k.evaluate(() => navigator.clipboard.readText()), body);
  if (process.env.E2E_SHOTS) await k.screenshot({ path: process.env.E2E_SHOTS + "/kanri.png", fullPage: true });
  await k.click('#kn-reports [data-do="resolve"]');
  await expectToast(k, /対応済みにしました/);

  // 7b. 運営者が基地で参加登録して投稿すると「運営」の印が付き、リンクがあってもすぐ公開される。
  //     運営者の投稿への返信には回数の上限がない
  const h = await k.context().newPage();
  h.on("pageerror", (e) => errors.push(e.message));
  await h.goto(ORIGIN + "/hiroba.html");
  await h.waitForFunction(() => document.getElementById("dlg-join").open);   // ログイン済みで表示名がまだ
  await h.check('input[name="age"]');
  await h.check('input[name="agree"]');
  await h.click("[data-next]");
  await h.fill("#join-name", "見張り番");
  await h.click('#join-form button[type="submit"]');
  await expectToast(h, /参加登録が済みました/);
  await h.check('input[name="tag"][value="雑談"]');
  await h.fill("#hb-body", "星軍基地へようこそ。案内は https://example.com/guide.html");
  await h.click('#hb-form button[type="submit"]');
  await expectToast(h, /投稿しました ★/);
  await b.reload();
  const welcome = b.locator(".hb-post", { hasText: "星軍基地へようこそ" });
  await welcome.waitFor();
  assert.equal(await welcome.locator(".hb-post-head .hb-staff").textContent(), "運営");
  await welcome.locator('[data-action="reply"]').click();
  assert.match(await welcome.locator(".hb-limit").textContent(), /上限はありません/);
  await welcome.locator('[data-action="reply"]').click();
  assert.equal(await b.locator('.hb-post:has-text("おすすめ https://example.com/video") .hb-staff').count(), 0);

  // 公開された投稿は別の人にも見え、非表示にした投稿は見えない。処置は本人のメニューに出る
  await b.reload();
  await b.waitForSelector('.hb-post:has-text("おすすめ https://example.com/video")');
  assert.equal(await b.locator('.hb-post:has-text("土曜の配信が最高でした")').count(), 0);
  await a.reload();
  await a.waitForSelector("text=あなたが受けた処置");
  if (process.env.E2E_SHOTS) await a.screenshot({ path: process.env.E2E_SHOTS + "/hiroba-live.png", fullPage: true });

  // 8. ミュートすると投稿が隠れ、退会するとデータが消える
  const target = '.hb-post:has-text("おすすめ https://example.com/video")';
  await b.locator(target).locator("summary").first().click();
  await b.click(target + ' [data-action="mute"]');
  await b.waitForSelector("#hb-hidden-note:not([hidden])");
  await b.reload();
  await b.waitForSelector("#hb-hidden-note:not([hidden])");   // 保存され、開き直しても残る
  await b.click('[data-action="leave"]');
  await b.click("#dlg-confirm-ok");
  await expectToast(b, /退会しました/);
  await b.waitForSelector("#hb-join:not([hidden])");
  assert.equal((await db.collectionGroup("replies").where("body", "==", "わかります！").get()).size, 0);

  // 9. 別の端末でリンクを開き（メールアドレスを聞かれる）、参加登録をせずに「登録をやめる」とメールアドレスが消える
  const c1 = await (await browser.newContext()).newPage();
  await c1.goto(ORIGIN + "/hiroba.html");
  await c1.waitForSelector("#hb-join:not([hidden])");
  await c1.click('#hb-join [data-open="join"]');
  await c1.check('input[name="age"]');
  await c1.check('input[name="agree"]');
  await c1.click("[data-next]");
  await c1.fill("#join-email", "c@example.com");
  await c1.fill("#join-name", "流星群");
  await c1.click('#join-form button[type="submit"]');
  await c1.waitForFunction(() => !document.getElementById("dlg-join").open);
  const c2 = await (await browser.newContext()).newPage();
  c2.on("pageerror", (e) => errors.push(e.message));
  c2.on("dialog", (d) => d.accept("c@example.com"));
  await c2.goto(await linkFor("c@example.com"));
  await c2.waitForFunction(() => document.getElementById("dlg-join").open);   // 表示名を決めるよう案内される
  await c2.click('#dlg-join [data-step="1"] button[data-close]');
  await c2.waitForSelector("#hb-menu >> text=参加登録がまだ済んでいません");
  const pendingUid = (await auth.getUserByEmail("c@example.com")).uid;
  await c2.click('#hb-menu [data-action="leave"]');
  await c2.click("#dlg-confirm-ok");
  await expectToast(c2, /メールアドレスを削除しました/);
  await c2.waitForSelector("#hb-join:not([hidden])");
  await assert.rejects(auth.getUser(pendingUid));

  // 10. 参加登録の受付開始より前は、参加の案内の代わりに開始日時を出し、★からもリンクを送る画面を開かない
  const soon = await (await browser.newContext()).newPage();
  soon.on("pageerror", (e) => errors.push(e.message));
  await soon.route("**/assets/js/hiroba-config.js", (route) => route.fulfill({
    contentType: "text/javascript",
    body: TEST_CONFIG.replace(/"openAt":\d+/, '"openAt":' + (Date.now() + 7 * 24 * 3600 * 1000))
  }));
  await soon.goto(ORIGIN + "/hiroba.html");
  await soon.waitForSelector("#hb-join-soon:not([hidden])");
  assert.match(await soon.textContent("#hb-join-soon"), /参加登録は .+ から受け付けます/);
  assert.equal(await soon.isVisible('#hb-join [data-open="join"]'), false);
  assert.equal(await soon.locator('#hb-menu [data-open="join"]').count(), 0);
  await soon.locator('.hb-post [data-action="star"]').first().click();
  await expectToast(soon, /から受け付けます/);
  assert.equal(await soon.evaluate(() => document.getElementById("dlg-join").open), false);

  // 11. 投稿が100件を超えたら「もっと見る」で前の投稿を読む。前の投稿への返信も、返信が300件を超えていても出る
  const seed = db.batch();
  const base = Date.now() - 24 * 3600 * 1000;
  const ids = [];
  for (let i = 0; i < 105; i++) {
    const ref = db.collection("posts").doc();
    ids.push(ref.id);
    seed.set(ref, {
      authorUid: "seed", authorHandle: "種まき", byAdmin: false, tag: "雑談", body: "古い投稿-" + String(i).padStart(3, "0"),
      spoiler: false, state: "public", createdAt: Timestamp.fromMillis(base - i * 60 * 1000), editedAt: null
    });
  }
  const reply = (postId, body, t) => seed.set(db.collection("posts/" + postId + "/replies").doc(), {
    postId, authorUid: "seed2", authorHandle: "返信係", byAdmin: false, toUid: "seed", toHandle: "種まき",
    body, state: "public", createdAt: Timestamp.fromMillis(t)
  });
  for (let j = 0; j < 301; j++) reply(ids[0], "新しい返信-" + j, base + (j + 1) * 1000);
  reply(ids[104], "いちばん古い返信", base - 104 * 60 * 1000 + 1000);
  await seed.commit();

  const many = await (await browser.newContext()).newPage();
  many.on("pageerror", (e) => errors.push(e.message));
  await many.goto(ORIGIN + "/hiroba.html");
  await many.waitForSelector('[data-action="more-posts"]');
  assert.equal(await many.locator(".hb-post").count(), 100);
  assert.equal(await many.locator('.hb-post:has-text("古い投稿-104")').count(), 0);
  await many.click('[data-action="more-posts"]');
  await many.waitForSelector('.hb-post:has-text("古い投稿-104") .hb-reply >> text=いちばん古い返信');
  assert.equal(await many.locator(".hb-post").count(), 107);
  assert.equal(await many.locator('[data-action="more-posts"]').count(), 0);
  assert.equal(await many.locator('.hb-post:has-text("古い投稿-000") .hb-reply').count(), 301);
  if (process.env.E2E_SHOTS) await h.screenshot({ path: process.env.E2E_SHOTS + "/hiroba-staff.png", fullPage: false });

  console.log("e2e: hiroba + kanri ok");
  if (errors.length) throw new Error("ページのエラー: " + errors.join(" / "));
} finally {
  await browser.close();
  server.close();
}
