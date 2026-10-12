import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { db, auth, call, signIn, member, reasonOf, reset, at, tick, NOON, NIGHT, HOUR, PROJECT } from "./helpers.mjs";

beforeEach(reset);

async function post(user, body, extra) {
  return call("createPost", Object.assign({ tag: "感想", body }, extra || {}), user);
}

test("参加登録：同意・表示名の確認と、表示名の重複", async () => {
  const a = await signIn("a@example.com");
  assert.equal(await reasonOf(call("registerProfile", { handle: "流れ星", age16: true }, a)), "consent");
  assert.equal(await reasonOf(call("registerProfile", { handle: "090-1234-5678", age16: true, agree: true }, a)), "pii");
  assert.equal(await reasonOf(call("registerProfile", { handle: "星軍運営", age16: true, agree: true }, a)), "reserved");
  assert.equal((await call("registerProfile", { handle: "流れ星", age16: true, agree: true }, a)).handle, "流れ星");
  assert.equal(await reasonOf(call("registerProfile", { handle: "別の名前", age16: true, agree: true }, a)), "registered");

  const b = await signIn("b@example.com");
  // 全角・半角や大文字・小文字の違いだけの名前も、同じ名前として扱う
  await call("registerProfile", { handle: "Star", age16: true, agree: true }, b);
  const c = await signIn("c@example.com");
  assert.equal(await reasonOf(call("registerProfile", { handle: "ｓｔａｒ", age16: true, agree: true }, c)), "handle-taken");

  // 見えない文字を混ぜて「運営」や他の人と同じに見える名前、空白を入れた「Ryu U」は使えない
  const d = await signIn("d@example.com");
  for (const bad of ["運\u200B営", "管\u2060理人", "流れ\u200D星", "abc\u202Edef", "運\uFE0F営", "\u3164"]) {
    assert.equal(await reasonOf(call("registerProfile", { handle: bad, age16: true, agree: true }, d)), "bad-char", JSON.stringify(bad));
  }
  assert.equal(await reasonOf(call("registerProfile", { handle: "Ryu U", age16: true, agree: true }, d)), "reserved");
  // 絵文字の見た目を選ぶ文字と、絵文字どうしをつなぐ文字は使える。重複の判定では取り除いて比べる
  assert.equal((await call("registerProfile", { handle: "星⭐\uFE0F", age16: true, agree: true }, d)).handle, "星⭐\uFE0F");
  const e = await signIn("e@example.com");
  assert.equal(await reasonOf(call("registerProfile", { handle: "星⭐", age16: true, agree: true }, e)), "handle-taken");
  assert.equal((await call("registerProfile", { handle: "❤\uFE0F\u200D🔥", age16: true, agree: true }, e)).handle, "❤\uFE0F\u200D🔥");

  const user = (await db.doc("users/" + a.uid).get()).data();
  assert.equal(user.consent.age16, true);
  assert.equal(user.consent.termsVersion, "v1");
  assert.equal(user.email, undefined, "メールアドレスは Firestore に置かない");
});

test("投稿：受付時間・運営者不在・個人情報の確認・リンクの保留・連投の間隔", async () => {
  assert.equal(await reasonOf(call("createPost", { tag: "感想", body: "x" })), "unauthenticated");
  const a = await signIn("a@example.com");
  assert.equal(await reasonOf(post(a, "登録前")), "no-profile");
  await call("registerProfile", { handle: "流れ星", age16: true, agree: true }, a);

  at(NIGHT);
  assert.equal(await reasonOf(post(a, "夜の投稿")), "night");
  at(NOON);
  await db.doc("config/site").set({ absent: true });
  assert.equal(await reasonOf(post(a, "不在中")), "absent");
  await db.doc("config/site").set({ absent: false });

  assert.equal(await reasonOf(post(a, "連絡は 090-1234-5678 まで")), "pii");
  assert.equal((await post(a, "連絡は 090-1234-5678 まで", { piiConfirmed: true })).state, "public");
  assert.equal(await reasonOf(post(a, "すぐ次", { _testNow: tick(5 * 1000) })), "interval");
  const held = await post(a, "おすすめ https://example.com/video");
  assert.equal(held.state, "held");
  assert.equal(await reasonOf(call("createPost", { tag: "なし", body: "x" }, a)), "tag");
  assert.equal(await reasonOf(post(a, "x".repeat(1001))), "too-long");

  const stats = (await db.doc("postStats/" + held.id).get()).data();
  assert.deepEqual(stats, { authorUid: a.uid, stars: 0 });
});

test("投稿時の IP と日時：暗号化して保存し、90日後に消える印をつける", async () => {
  const a = await member("a@example.com", "流れ星");
  const t = tick();
  const { id } = await post(a, "記録のテスト", { _testNow: t });
  const logs = (await db.collection("ipLogs").get()).docs.map((d) => d.data());
  assert.equal(logs.length, 1);
  assert.equal(logs[0].uid, a.uid);
  assert.equal(logs[0].path, "posts/" + id);
  assert.match(logs[0].ip, /^v1:/);
  assert.ok(!logs[0].ip.includes("127.0.0.1"), "平文の IP を保存しない");
  assert.equal(logs[0].expireAt.toMillis() - logs[0].createdAt.toMillis(), 90 * 24 * HOUR);
});

test("返信：同じ相手には24時間で3回まで・自分の投稿には制限なし・ブロック・確認待ちの投稿", async () => {
  const a = await member("a@example.com", "流れ星");
  const b = await member("b@example.com", "星屑");
  const { id } = await post(a, "感想です");

  for (let i = 0; i < 3; i++) await call("createReply", { postId: id, body: "返信" + i }, b);
  assert.equal(await reasonOf(call("createReply", { postId: id, body: "4回目" }, b)), "reply-limit");
  tick(24 * HOUR);
  await call("createReply", { postId: id, body: "翌日" }, b);

  for (let i = 0; i < 5; i++) await call("createReply", { postId: id, body: "本人" + i }, a);

  await db.doc("users/" + a.uid + "/private/prefs").set({ muted: [], blocked: [{ uid: b.uid, handle: "星屑" }] });
  assert.equal(await reasonOf(call("createReply", { postId: id, body: "ブロック後" }, b)), "blocked");

  const held = await post(a, "https://example.com");
  assert.equal(await reasonOf(call("createReply", { postId: held.id, body: "確認待ちへの返信" }, b)), "no-post");
  assert.equal(await reasonOf(call("createReply", { postId: id, body: "x".repeat(501) }, a)), "too-long");

  const reply = await call("createReply", { postId: id, body: "www.example.com を見て" }, a);
  assert.equal(reply.state, "held");
});

test("編集と削除：本人だけ。リンクを足すと確認待ちに戻る", async () => {
  const a = await member("a@example.com", "流れ星");
  const b = await member("b@example.com", "星屑");
  const { id } = await post(a, "元の文");
  assert.equal(await reasonOf(call("editPost", { postId: id, body: "書き換え" }, b)), "no-post");
  assert.equal((await call("editPost", { postId: id, body: "直した文" }, a)).state, "public");
  assert.equal((await call("editPost", { postId: id, body: "https://example.com" }, a)).state, "held");

  const r = await call("createReply", { postId: (await post(a, "二つ目")).id, body: "返信" }, b);
  assert.ok(r.id);
  assert.equal(await reasonOf(call("deletePost", { postId: id }, b)), "no-post");
  await call("deletePost", { postId: id }, a);
  assert.equal((await db.doc("posts/" + id).get()).exists, false);
  assert.equal((await db.doc("postStats/" + id).get()).exists, false);
});

test("★：自分の投稿には送れない。押すたびに送る・取り消す", async () => {
  const a = await member("a@example.com", "流れ星");
  const b = await member("b@example.com", "星屑");
  const { id } = await post(a, "★のテスト");
  assert.equal(await reasonOf(call("toggleStar", { postId: id }, a)), "own");
  assert.equal((await call("toggleStar", { postId: id }, b)).starred, true);
  assert.equal((await db.doc("postStats/" + id).get()).data().stars, 1);
  assert.equal((await call("toggleStar", { postId: id }, b)).starred, false);
  assert.equal((await db.doc("postStats/" + id).get()).data().stars, 0);
});

test("通報：運営者だけが読める記録になる", async () => {
  const a = await member("a@example.com", "流れ星");
  const b = await member("b@example.com", "星屑");
  const { id } = await post(a, "通報される投稿");
  assert.equal(await reasonOf(call("submitReport", { postId: id, reason: "適当" }, b)), "reason");
  await call("submitReport", { postId: id, reason: "誹謗中傷", note: "補足" }, b);
  const reports = (await db.collection("reports").get()).docs.map((d) => d.data());
  assert.equal(reports.length, 1);
  assert.equal(reports[0].reporterUid, b.uid);
  assert.equal(reports[0].targetUid, a.uid);
  assert.equal(reports[0].status, "open");
});

test("退会：投稿・返信・★・表示名・ログイン情報を消し、IP の記録と出した通報は残す", async () => {
  const a = await member("a@example.com", "流れ星");
  const b = await member("b@example.com", "星屑");
  const own = await post(b, "退会する人の投稿");
  const other = await post(a, "残る投稿");
  await call("createReply", { postId: other.id, body: "退会する人の返信" }, b);
  await call("createReply", { postId: own.id, body: "退会する人の投稿への返信" }, a);
  await call("toggleStar", { postId: other.id }, b);
  await call("submitReport", { postId: other.id, reason: "その他" }, b);
  await db.doc("users/" + b.uid + "/private/prefs").set({ muted: [{ uid: a.uid, handle: "流れ星" }], blocked: [] });

  await call("deleteAccount", {}, b);

  assert.equal((await db.doc("posts/" + own.id).get()).exists, false);
  assert.equal((await db.collection("posts/" + other.id + "/replies").get()).size, 0);
  assert.equal((await db.doc("postStats/" + other.id).get()).data().stars, 0);
  assert.equal((await db.doc("users/" + b.uid).get()).exists, false);
  assert.equal((await db.doc("users/" + b.uid + "/private/prefs").get()).exists, false);
  assert.equal((await db.doc("handles/星屑").get()).exists, false);
  await assert.rejects(auth.getUser(b.uid));
  assert.ok((await db.collection("ipLogs").where("uid", "==", b.uid).get()).size >= 1);
  assert.equal((await db.collection("reports").get()).size, 1);

  // 表示名はまた使えるようになる
  const c = await signIn("c@example.com");
  await call("registerProfile", { handle: "星屑", age16: true, agree: true }, c);
});

test("運営者：登録したメールだけが有効にでき、確認・非表示・停止・利用停止ができる", async () => {
  const a = await member("a@example.com", "流れ星");
  const b = await member("b@example.com", "星屑");
  assert.equal(await reasonOf(call("claimAdmin", {}, b)), "not-admin");
  await signIn("admin@example.com");
  await call("claimAdmin", {}, await signIn("admin@example.com"));
  const admin = await signIn("admin@example.com");   // 権限を反映したトークンを取り直す
  assert.equal(await reasonOf(call("adminAct", { action: "approve", postId: "x" }, b)), "not-admin");

  const held = await post(b, "https://example.com");
  await call("adminAct", { action: "approve", postId: held.id }, admin);
  assert.equal((await db.doc("posts/" + held.id).get()).data().state, "public");

  const bad = await post(b, "ひどい投稿");
  assert.equal(await reasonOf(call("adminAct", { action: "hide", postId: bad.id }, admin)), "rule");
  await call("adminAct", { action: "hide", postId: bad.id, rule: "禁止事項3（誹謗中傷）", reason: "相手を貶す表現" }, admin);
  assert.equal((await db.doc("posts/" + bad.id).get()).data().state, "hidden");
  assert.equal((await db.doc("users/" + b.uid).get()).data().violations, 1);
  await call("adminAct", { action: "restore", postId: bad.id }, admin);
  assert.equal((await db.doc("posts/" + bad.id).get()).data().state, "public");
  assert.equal((await db.doc("users/" + b.uid).get()).data().violations, 0);

  const s = await call("adminAct", { action: "suspend", uid: b.uid, rule: "同じ違反の2回目" }, admin);
  assert.ok(s.until > NOON);
  assert.equal(await reasonOf(post(b, "停止中")), "suspended");
  await call("adminAct", { action: "lift", uid: b.uid }, admin);
  await post(b, "停止が解けた");

  const info = await call("adminUserInfo", { uid: b.uid }, admin);
  assert.equal(info.email, "b@example.com");
  assert.equal(info.history.length, 2);

  const liked = await post(a, "★をもらう投稿");
  await call("toggleStar", { postId: liked.id }, b);
  await call("createReply", { postId: liked.id, body: "返信" }, b);
  await db.doc("users/" + b.uid + "/private/prefs").set({ muted: [{ uid: a.uid, handle: "流れ星" }], blocked: [] });

  // 投稿・返信は、指定しなくても消す（本人はもうログインできず、自分では消せないため）
  await call("adminAct", { action: "ban", uid: b.uid, rule: "違反が計3回" }, admin);
  await assert.rejects(auth.getUser(b.uid));
  assert.equal((await db.collection("posts").where("authorUid", "==", b.uid).get()).size, 0);
  assert.equal((await db.collectionGroup("replies").where("authorUid", "==", b.uid).get()).size, 0);
  // ミュート・ブロック、返信の記録、送った★は消す（users/{uid} は TTL で消えても、その下の階層は残るため）
  assert.equal((await db.doc("users/" + b.uid + "/private/prefs").get()).exists, false);
  assert.equal((await db.doc("users/" + b.uid + "/private/replyLog").get()).exists, false);
  assert.equal((await db.doc("posts/" + liked.id + "/stars/" + b.uid).get()).exists, false);
  assert.equal((await db.doc("postStats/" + liked.id).get()).data().stars, 0);
  assert.equal((await db.doc("users/" + b.uid).get()).data().status, "banned");
  assert.equal((await db.collection("bans").get()).size, 1);
  const ban = (await db.collection("bans").get()).docs[0];
  assert.ok(!ban.id.includes("example"), "照合用のハッシュだけを残す");

  // 利用停止の直後でも、本人の手元のログイン（ID トークン）は期限まで使える。
  // それで退会して、処置の記録や表示名の予約を消すことはできない
  const mods = (await db.collection("moderation").where("targetUid", "==", b.uid).get()).size;
  assert.ok(mods >= 1);
  assert.equal(await reasonOf(call("deleteAccount", {}, b)), "banned");
  assert.equal((await db.collection("moderation").where("targetUid", "==", b.uid).get()).size, mods);
  assert.equal((await db.doc("users/" + b.uid).get()).data().status, "banned");
  assert.equal((await db.doc("handles/星屑").get()).exists, true);

  // 同じメールアドレスでは登録し直せない
  const again = await signIn("b@example.com");
  assert.equal(await reasonOf(call("registerProfile", { handle: "別名", age16: true, agree: true }, again)), "banned");

  const c = await member("c@example.com", "流星群");
  const r = await post(a, "通報される");
  await call("submitReport", { postId: r.id, reason: "その他" }, c);
  const report = (await db.collection("reports").get()).docs[0];
  // 対応しないままでも、通報から180日で消える。対応済みにすると、その日から90日に置き換える
  const open = report.data();
  assert.equal(open.expireAt.toMillis() - open.createdAt.toMillis(), 180 * 24 * HOUR);
  await call("adminResolveReport", { reportId: report.id }, admin);
  const x = (await report.ref.get()).data();
  assert.equal(x.status, "resolved");
  assert.equal(x.expireAt.toMillis() - x.resolvedAt.toMillis(), 90 * 24 * HOUR);

  await call("adminSetSite", { absent: true, news: ["お知らせ1", "", "お知らせ2"] }, admin);
  assert.deepEqual((await db.doc("config/site").get()).data(), { absent: true, news: ["お知らせ1", "お知らせ2"] });
});

// 定期処理（毎日4時）は、エミュレーターでは時刻どおりに動かないので、関数を読み込んで直接実行する。
// scheduleTime を先の日付にして、日数がたったときの動きを確かめる
function scheduled(name) {
  process.env.GCLOUD_PROJECT = process.env.GCLOUD_PROJECT || PROJECT;
  process.env.ADMIN_EMAILS = "admin@example.com";
  const fns = createRequire(import.meta.url)("../functions/index.js");
  return (daysLater) => fns[name].run({ scheduleTime: new Date(Date.now() + daysLater * 24 * HOUR).toISOString() });
}

test("定期処理：参加登録のないまま7日たったアカウントを消す（運営者は消さない）", async () => {
  const cleanup = scheduled("cleanupUnregistered");
  const a = await member("a@example.com", "流れ星");                    // 参加登録済み
  const pending = await signIn("pending@example.com");                  // ログインだけして、登録していない
  const admin = await signIn("admin@example.com");                      // ADMIN_EMAILS（権限を有効にする前）
  const helper = await signIn("helper@example.com", { admin: true });   // 運営者の権限を持つ

  await cleanup(1);
  await auth.getUser(pending.uid);   // まだ7日たっていない
  await cleanup(8);
  await assert.rejects(auth.getUser(pending.uid));
  for (const u of [a, admin, helper]) await auth.getUser(u.uid);
});
