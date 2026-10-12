/*!
 * ryuu星軍 本部 — 星軍基地（hiroba.html）のサーバー側の処理（Cloud Functions for Firebase）
 * 受付時間・返信回数・リンクの保留・個人情報らしい文字列・IP の記録は、ブラウザ側だけだと
 * すり抜けられるため、ここで判定する。書き込みはすべてこの関数を通す（Firestore のルールで直接の書き込みを禁止）。
 */
"use strict";

const crypto = require("node:crypto");
const { setGlobalOptions } = require("firebase-functions/v2");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret, defineString } = require("firebase-functions/params");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue, Timestamp } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");

initializeApp();
const db = getFirestore();

// 東京リージョンで動かし、同時に立ち上がる数を絞って、荒らしで請求が膨らまないようにする
setGlobalOptions({ region: "asia-northeast1", maxInstances: 3 });

// IP アドレスの暗号化と、利用停止したメールアドレスの照合に使う秘密の値（Secret Manager に保存）
const HIROBA_SECRET = defineSecret("HIROBA_SECRET");
// 運営者のメールアドレス（カンマ区切り）。kanri.html の「運営者として有効にする」で使う
const ADMIN_EMAILS = defineString("ADMIN_EMAILS", { description: "運営者のメールアドレス（カンマ区切り）" });

const MIN = 60 * 1000, HOUR = 60 * MIN, DAY = 24 * HOUR;
const JST_OFFSET = 9 * HOUR;

const RULES = {
  closedFrom: 23,            // 新規投稿を止める時刻（日本時間）
  closedUntil: 6,            // 新規投稿を再開する時刻（日本時間）
  replyLimit: 3,             // 同じ相手への返信の上限
  replyWindowMs: DAY,        // 上限を数える期間
  minIntervalMs: 20 * 1000,  // 投稿・返信の間隔（連投の防止）
  postMax: 1000,
  replyMax: 500,
  handleMax: 20,
  noteMax: 500,
  newsMax: 5,
  suspendMs: 7 * DAY,                // 投稿停止の期間
  ipRetentionMs: 90 * DAY,           // 投稿時の IP と日時（プライバシーポリシー 2.）
  reportRetentionMs: 90 * DAY,       // 対応を終えた通報
  banRetentionMs: 365 * DAY          // 利用停止にしたアカウントの記録
};
const TERMS_VERSION = "2026-10-案";   // 利用規約を改めたら上げる（同意の記録に残る）
const TAGS = ["感想", "おすすめ動画", "質問", "雑談"];
const REASONS = ["個人情報", "誹謗中傷", "無断転載", "なりすまし", "スパム", "ネタバレ", "その他"];
const ACTIONS = ["approve", "hide", "restore", "warn", "suspend", "lift", "ban"];

/* ------------------------------------------------------------ 共通 */

function fail(code, message, reason, extra) {
  return new HttpsError(code, message, Object.assign({ reason: reason || code }, extra || {}));
}

// エミュレーターでのテストに限り、時刻を差し替えられる（本番では無視する）
function now(request) {
  const t = request && request.data && request.data._testNow;
  if (process.env.FUNCTIONS_EMULATOR === "true" && typeof t === "number") return t;
  return Date.now();
}
function ts(ms) { return Timestamp.fromMillis(ms); }
function jstHour(ms) { return new Date(ms + JST_OFFSET).getUTCHours(); }
function jstLabel(ms) {
  const d = new Date(ms + JST_OFFSET);
  return (d.getUTCMonth() + 1) + "月" + d.getUTCDate() + "日 " + d.getUTCHours() + ":" + String(d.getUTCMinutes()).padStart(2, "0");
}

function str(v) { return typeof v === "string" ? v : ""; }
function docId(v) {
  const s = str(v);
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(s)) throw fail("invalid-argument", "対象が見つかりません。", "bad-id");
  return s;
}
function textField(v, max, label) {
  const s = str(v).trim();
  if (!s) throw fail("invalid-argument", label + "を入力してください。", "empty");
  if (s.length > max) throw fail("invalid-argument", label + "は" + max + "文字までです。", "too-long");
  return s;
}

/* ---- 個人情報らしい文字列とリンク（hiroba.js と同じ判定。目安） */
const PII_PATTERNS = [
  { label: "電話番号", re: /(?:^|[^\d])(?:\+81[-\s]?\d{1,4}|0\d{1,4})[-\s]?\d{1,4}[-\s]?\d{4}(?!\d)/ },
  { label: "メールアドレス", re: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/ },
  { label: "住所", re: /(?:東京都|北海道|大阪府|京都府|[^\s、。]{2,3}県)[^\s、。]{1,8}?[市区町村郡]|\d+\s*(?:丁目|番地)/ }
];
function normalize(s) {
  return s
    .replace(/[０-９Ａ-Ｚａ-ｚ＠．＋]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xFEE0))
    .replace(/[－ー―‐]/g, "-");
}
function detectPII(text) {
  const s = normalize(text);
  return PII_PATTERNS.filter((p) => p.re.test(s)).map((p) => p.label);
}
function hasLink(text) { return /https?:\/\/|www\./i.test(normalize(text)); }
function checkPII(text, confirmed) {
  const found = detectPII(text);
  if (found.length && confirmed !== true) {
    throw fail("failed-precondition", found.join("・") + "らしい文字列が含まれています。この投稿は誰でも見られます。", "pii", { found });
  }
}

/* ---- 表示名 */
const RESERVED = /運営|管理人|管理者|公式|official|admin/i;
function cleanHandle(v) {
  const s = str(v).normalize("NFKC").replace(/\s+/g, " ").trim();
  if (!s) throw fail("invalid-argument", "表示名を入力してください。", "empty");
  if (s.length > RULES.handleMax) throw fail("invalid-argument", "表示名は" + RULES.handleMax + "文字までです。", "too-long");
  if (/[\u0000-\u001f\u007f<>]/.test(s)) throw fail("invalid-argument", "表示名に使えない文字が含まれています。", "bad-char");
  if (detectPII(s).length || hasLink(s)) throw fail("invalid-argument", "表示名に連絡先や住所らしい文字列が含まれています。", "pii");
  if (RESERVED.test(s) || /^ryuu$/i.test(s)) throw fail("invalid-argument", "運営や RyuU さんと紛らわしい表示名は使えません。", "reserved");
  return s;
}
function handleKey(handle) { return handle.normalize("NFKC").toLowerCase().replace(/\s+/g, ""); }

/* ---- 暗号化（IP）と照合用のハッシュ（利用停止のメールアドレス） */
function keys() {
  const master = HIROBA_SECRET.value();
  if (!master || master.length < 32) throw new Error("HIROBA_SECRET が未設定か短すぎます（32文字以上）");
  const derive = (info) => Buffer.from(crypto.hkdfSync("sha256", Buffer.from(master, "utf8"), Buffer.alloc(0), info, 32));
  return { ip: derive("hiroba-ip-v1"), email: derive("hiroba-email-v1") };
}
function encrypt(text, key) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([c.update(text, "utf8"), c.final()]);
  return "v1:" + Buffer.concat([iv, c.getAuthTag(), enc]).toString("base64");
}
function emailHash(email) {
  return crypto.createHmac("sha256", keys().email).update(String(email).trim().toLowerCase()).digest("hex");
}

// 転送ヘッダーは利用者が書き足せるため、どれが本当の接続元かをここでは決めない。
// 開示請求のときに判断できるよう、ヘッダー全体と接続元の両方をそのまま暗号化して残す。
function ipLog(request, uid, kind, path, t) {
  const raw = request.rawRequest || {};
  const headers = raw.headers || {};
  const source = JSON.stringify({
    xff: str(headers["x-forwarded-for"]),
    ip: str(raw.ip) || str(raw.socket && raw.socket.remoteAddress)
  });
  return { uid, kind, path, ip: encrypt(source, keys().ip), createdAt: ts(t), expireAt: ts(t + RULES.ipRetentionMs) };
}

/* ---- 利用者の確認 */
async function member(request) {
  if (!request.auth) throw fail("unauthenticated", "ログインしてください。");
  const ref = db.doc("users/" + request.auth.uid);
  const snap = await ref.get();
  if (!snap.exists) throw fail("failed-precondition", "参加登録が済んでいません。", "no-profile");
  const user = snap.data();
  if (user.status === "banned") throw fail("permission-denied", "このアカウントは利用停止になっています。", "banned");
  return { uid: request.auth.uid, user, ref };
}
function assertNotSuspended(user, t) {
  const until = user.suspendedUntil && user.suspendedUntil.toMillis();
  if (until && until > t) throw fail("permission-denied", "投稿停止中です（" + jstLabel(until) + "まで）。", "suspended");
}
async function assertOpen(t) {
  const h = jstHour(t);
  if (h >= RULES.closedFrom || h < RULES.closedUntil) {
    throw fail("failed-precondition", "ただいま新規投稿をお休みしています（毎日23:00〜6:00・日本時間）。", "night");
  }
  const site = (await db.doc("config/site").get()).data() || {};
  if (site.absent) throw fail("failed-precondition", "運営者が不在のため、新規投稿をお休みしています。", "absent");
}
function assertInterval(user, t) {
  const last = user.lastPostAt && user.lastPostAt.toMillis();
  if (last && t - last < RULES.minIntervalMs) {
    throw fail("resource-exhausted", "続けて投稿するときは、" + Math.ceil(RULES.minIntervalMs / 1000) + "秒ほど間をあけてください。", "interval");
  }
}
function requireAdmin(request) {
  if (!request.auth || request.auth.token.admin !== true) throw fail("permission-denied", "運営者のみの操作です。", "not-admin");
  return request.auth.uid;
}

/* ------------------------------------------------------------ 参加登録 */

exports.registerProfile = onCall({ secrets: [HIROBA_SECRET] }, async (request) => {
  const auth = request.auth;
  if (!auth) throw fail("unauthenticated", "ログインしてください。");
  if (!auth.token.email || auth.token.email_verified !== true) throw fail("failed-precondition", "メールのリンクからログインしてください。", "unverified");
  const d = request.data || {};
  if (d.age16 !== true || d.agree !== true) throw fail("failed-precondition", "16歳以上であることと、利用規約・基地のルールへの同意が必要です。", "consent");
  const handle = cleanHandle(d.handle);
  const t = now(request);

  if ((await db.doc("bans/" + emailHash(auth.token.email)).get()).exists) {
    await getAuth().deleteUser(auth.uid);
    throw fail("permission-denied", "このメールアドレスでは登録できません。", "banned");
  }

  const userRef = db.doc("users/" + auth.uid);
  const handleRef = db.doc("handles/" + handleKey(handle));
  await db.runTransaction(async (tx) => {
    const [u, h] = await Promise.all([tx.get(userRef), tx.get(handleRef)]);
    if (u.exists) throw fail("already-exists", "すでに参加登録が済んでいます。", "registered");
    if (h.exists) throw fail("already-exists", "その表示名はすでに使われています。", "handle-taken");
    tx.set(handleRef, { uid: auth.uid });
    tx.set(userRef, {
      handle,
      status: "active",
      violations: 0,
      suspendedUntil: null,
      lastPostAt: null,
      consent: { termsVersion: TERMS_VERSION, age16: true, agreedAt: ts(t) },
      createdAt: ts(t)
    });
  });
  return { handle };
});

/* ------------------------------------------------------------ 投稿・返信 */

exports.createPost = onCall({ secrets: [HIROBA_SECRET] }, async (request) => {
  const t = now(request);
  const { uid, user, ref } = await member(request);
  assertNotSuspended(user, t);
  await assertOpen(t);

  const d = request.data || {};
  const tag = str(d.tag);
  if (!TAGS.includes(tag)) throw fail("invalid-argument", "話題タグを一つ選んでください。", "tag");
  const body = textField(d.body, RULES.postMax, "投稿の内容");
  checkPII(body, d.piiConfirmed);
  const state = hasLink(body) ? "held" : "public";

  const postRef = db.collection("posts").doc();
  await db.runTransaction(async (tx) => {
    assertInterval((await tx.get(ref)).data(), t);
    tx.set(postRef, {
      authorUid: uid, authorHandle: user.handle, tag, body, spoiler: d.spoiler === true,
      state, createdAt: ts(t), editedAt: null
    });
    tx.set(db.doc("postStats/" + postRef.id), { authorUid: uid, stars: 0 });
    tx.update(ref, { lastPostAt: ts(t) });
    tx.set(db.collection("ipLogs").doc(), ipLog(request, uid, "post", postRef.path, t));
  });
  return { id: postRef.id, state };
});

exports.createReply = onCall({ secrets: [HIROBA_SECRET] }, async (request) => {
  const t = now(request);
  const { uid, user, ref } = await member(request);
  assertNotSuspended(user, t);
  await assertOpen(t);

  const d = request.data || {};
  const postId = docId(d.postId);
  const body = textField(d.body, RULES.replyMax, "返信の内容");
  checkPII(body, d.piiConfirmed);
  const state = hasLink(body) ? "held" : "public";

  const postRef = db.doc("posts/" + postId);
  const replyRef = postRef.collection("replies").doc();
  const logRef = db.doc("users/" + uid + "/private/replyLog");
  await db.runTransaction(async (tx) => {
    const [postSnap, meSnap, logSnap] = await Promise.all([tx.get(postRef), tx.get(ref), tx.get(logRef)]);
    if (!postSnap.exists || postSnap.data().state !== "public") throw fail("not-found", "この投稿には返信できません。", "no-post");
    const post = postSnap.data();
    const toSelf = post.authorUid === uid;

    const since = t - RULES.replyWindowMs;
    const entries = ((logSnap.exists && logSnap.data().entries) || []).filter((e) => e.at > since);
    if (!toSelf) {
      const prefs = await tx.get(db.doc("users/" + post.authorUid + "/private/prefs"));
      const blocked = (prefs.exists && prefs.data().blocked) || [];
      if (blocked.some((b) => b.uid === uid)) throw fail("permission-denied", "この投稿には返信できません。", "blocked");
      if (entries.filter((e) => e.to === post.authorUid).length >= RULES.replyLimit) {
        throw fail("resource-exhausted", post.authorHandle + " さんとのやりとりが " + RULES.replyLimit + " 回に達しました。24時間たつと、また返信できます。", "reply-limit");
      }
    }
    assertInterval(meSnap.data(), t);

    tx.set(replyRef, {
      postId, authorUid: uid, authorHandle: user.handle, toUid: post.authorUid, toHandle: post.authorHandle,
      body, state, createdAt: ts(t)
    });
    if (!toSelf) tx.set(logRef, { entries: entries.concat([{ to: post.authorUid, at: t }]) });
    tx.update(ref, { lastPostAt: ts(t) });
    tx.set(db.collection("ipLogs").doc(), ipLog(request, uid, "reply", replyRef.path, t));
  });
  return { id: replyRef.id, state };
});

exports.editPost = onCall({ secrets: [HIROBA_SECRET] }, async (request) => {
  const t = now(request);
  const { uid, user } = await member(request);
  assertNotSuspended(user, t);

  const d = request.data || {};
  const postRef = db.doc("posts/" + docId(d.postId));
  const body = textField(d.body, RULES.postMax, "内容");
  checkPII(body, d.piiConfirmed);

  let state;
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(postRef);
    if (!snap.exists || snap.data().authorUid !== uid) throw fail("not-found", "編集できる投稿が見つかりません。", "no-post");
    const post = snap.data();
    if (post.state === "hidden") throw fail("failed-precondition", "非表示になった投稿は編集できません。", "hidden");
    // リンクを足したら、公開中でも運営の確認待ちに戻す
    state = post.state === "held" || hasLink(body) ? "held" : "public";
    tx.update(postRef, { body, state, editedAt: ts(t) });
    tx.set(db.collection("ipLogs").doc(), ipLog(request, uid, "edit", postRef.path, t));
  });
  return { state };
});

exports.deletePost = onCall(async (request) => {
  if (!request.auth) throw fail("unauthenticated", "ログインしてください。");
  const postRef = db.doc("posts/" + docId((request.data || {}).postId));
  const snap = await postRef.get();
  const admin = request.auth.token.admin === true;
  if (!snap.exists || (snap.data().authorUid !== request.auth.uid && !admin)) throw fail("not-found", "削除できる投稿が見つかりません。", "no-post");
  await db.recursiveDelete(postRef);   // 返信と★の記録もまとめて消す
  await db.doc("postStats/" + postRef.id).delete();
  return { ok: true };
});

exports.deleteReply = onCall(async (request) => {
  if (!request.auth) throw fail("unauthenticated", "ログインしてください。");
  const d = request.data || {};
  const replyRef = db.doc("posts/" + docId(d.postId) + "/replies/" + docId(d.replyId));
  const snap = await replyRef.get();
  const admin = request.auth.token.admin === true;
  if (!snap.exists || (snap.data().authorUid !== request.auth.uid && !admin)) throw fail("not-found", "削除できる返信が見つかりません。", "no-reply");
  await replyRef.delete();
  return { ok: true };
});

/* ------------------------------------------------------------ ★・通報 */

// ★ は誰が送ったかを公開しない。数は postStats に置き、投稿した本人だけが読める（Firestore のルール）
exports.toggleStar = onCall(async (request) => {
  const t = now(request);
  const { uid } = await member(request);
  const postId = docId((request.data || {}).postId);
  const postRef = db.doc("posts/" + postId);
  const starRef = postRef.collection("stars").doc(uid);
  const statsRef = db.doc("postStats/" + postId);

  let starred;
  await db.runTransaction(async (tx) => {
    const [post, star] = await Promise.all([tx.get(postRef), tx.get(starRef)]);
    if (!post.exists || post.data().state !== "public") throw fail("not-found", "この投稿には★を送れません。", "no-post");
    if (post.data().authorUid === uid) throw fail("failed-precondition", "自分の投稿には★を送れません。", "own");
    starred = !star.exists;
    if (starred) tx.set(starRef, { uid, postId, createdAt: ts(t) });
    else tx.delete(starRef);
    tx.set(statsRef, { stars: FieldValue.increment(starred ? 1 : -1) }, { merge: true });
  });
  return { starred };
});

exports.submitReport = onCall(async (request) => {
  const t = now(request);
  const { uid, user, ref } = await member(request);
  const d = request.data || {};
  const reason = str(d.reason);
  if (!REASONS.includes(reason)) throw fail("invalid-argument", "理由を選んでください。", "reason");
  const note = str(d.note).trim().slice(0, RULES.noteMax);
  const postId = docId(d.postId);
  const replyId = d.replyId ? docId(d.replyId) : null;
  const target = await db.doc("posts/" + postId + (replyId ? "/replies/" + replyId : "")).get();
  if (!target.exists) throw fail("not-found", "対象の投稿が見つかりません。", "no-target");

  const last = user.lastReportAt && user.lastReportAt.toMillis();
  if (last && t - last < 5000) throw fail("resource-exhausted", "少し時間をおいてから、もう一度お試しください。", "interval");
  await db.collection("reports").add({
    reporterUid: uid, postId, replyId, targetUid: target.data().authorUid,
    excerpt: target.data().body.slice(0, 200), reason, note, status: "open", createdAt: ts(t)
  });
  await ref.update({ lastReportAt: ts(t) });
  return { ok: true };
});

/* ------------------------------------------------------------ 退会 */

// 投稿・返信・★・ミュート/ブロック・処置の記録・表示名・メールアドレス（ログイン情報）を消す。
// 投稿時の IP と日時、この人が出した通報は、プライバシーポリシーの期間が過ぎるまで残す。
exports.deleteAccount = onCall(async (request) => {
  if (!request.auth) throw fail("unauthenticated", "ログインしてください。");
  const uid = request.auth.uid;
  const userRef = db.doc("users/" + uid);
  const user = (await userRef.get()).data();

  const [posts, replies, stars, mods] = await Promise.all([
    db.collection("posts").where("authorUid", "==", uid).get(),
    db.collectionGroup("replies").where("authorUid", "==", uid).get(),
    db.collectionGroup("stars").where("uid", "==", uid).get(),
    db.collection("moderation").where("targetUid", "==", uid).get()
  ]);
  for (const p of posts.docs) {
    await db.recursiveDelete(p.ref);
    await db.doc("postStats/" + p.id).delete();
  }
  const ownPosts = new Set(posts.docs.map((p) => p.id));
  const writer = db.bulkWriter();
  replies.docs.forEach((r) => { if (!ownPosts.has(r.data().postId)) writer.delete(r.ref); });
  stars.docs.forEach((s) => {
    if (ownPosts.has(s.data().postId)) return;
    writer.delete(s.ref);
    writer.update(db.doc("postStats/" + s.data().postId), { stars: FieldValue.increment(-1) }).catch(() => {});
  });
  mods.docs.forEach((m) => writer.delete(m.ref));
  await writer.close();

  await db.recursiveDelete(userRef);
  if (user && user.handle) await db.doc("handles/" + handleKey(user.handle)).delete();
  await getAuth().deleteUser(uid);
  return { ok: true };
});

/* ------------------------------------------------------------ 運営者 */

// 設定を入力するときに矢印キーなどを押すと、見えない制御文字が混ざることがあるので、取り除いてから比べる
function adminEmails(value) {
  return String(value || "")
    .replace(/\u001b\[[0-9;?]*[A-Za-z~]/g, "")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .normalize("NFKC")
    .split(/[,\s]+/)
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.includes("@"));
}

exports.claimAdmin = onCall(async (request) => {
  const auth = request.auth;
  if (!auth) throw fail("unauthenticated", "ログインしてください。");
  const email = str(auth.token.email).toLowerCase();
  const allowed = adminEmails(ADMIN_EMAILS.value());
  if (auth.token.email_verified !== true || !allowed.includes(email)) throw fail("permission-denied", "運営者として登録されていないメールアドレスです。", "not-admin");
  await getAuth().setCustomUserClaims(auth.uid, { admin: true });
  return { ok: true };
});

// 運営者の処置。どの投稿がどのルールに当たるかを記録し、本人も読めるようにする（Firestore のルール）
exports.adminAct = onCall({ secrets: [HIROBA_SECRET] }, async (request) => {
  const adminUid = requireAdmin(request);
  const t = now(request);
  const d = request.data || {};
  const action = str(d.action);
  if (!ACTIONS.includes(action)) throw fail("invalid-argument", "処置の種類が正しくありません。", "action");
  const rule = str(d.rule).trim().slice(0, 200);
  const reason = str(d.reason).trim().slice(0, 1000);

  let targetRef = null, target = null;
  if (d.postId) {
    targetRef = db.doc("posts/" + docId(d.postId) + (d.replyId ? "/replies/" + docId(d.replyId) : ""));
    const snap = await targetRef.get();
    if (!snap.exists) throw fail("not-found", "対象の投稿が見つかりません。", "no-target");
    target = snap.data();
  }
  const targetUid = d.uid ? docId(d.uid) : target && target.authorUid;
  if (!targetUid) throw fail("invalid-argument", "対象の利用者が分かりません。", "no-user");
  const userRef = db.doc("users/" + targetUid);

  if (action === "approve") {
    if (!targetRef || target.state !== "held") throw fail("failed-precondition", "確認待ちの投稿ではありません。", "not-held");
    await targetRef.update({ state: "public" });
    return { ok: true };
  }
  if ((action === "hide" || action === "restore") && !targetRef) throw fail("invalid-argument", "対象の投稿を指定してください。", "no-target");
  if (action !== "restore" && action !== "lift" && !rule) throw fail("invalid-argument", "当てはまるルールを書いてください。", "rule");

  const userSnap = await userRef.get();
  if (!userSnap.exists) throw fail("not-found", "対象の利用者が見つかりません。", "no-user");
  const user = userSnap.data();
  const entry = {
    targetUid, targetHandle: user.handle, action, rule, reason,
    postId: d.postId || null, replyId: d.replyId || null, excerpt: target ? target.body.slice(0, 200) : null,
    until: null, revoked: false, by: adminUid, createdAt: ts(t)
  };

  // 異議が通ったとき：投稿を戻す（restore）・停止を解く（lift）。直近の処置を取り消し扱いにする
  if (action === "restore" || action === "lift") {
    const kind = action === "restore" ? "hide" : "suspend";
    const past = await db.collection("moderation").where("targetUid", "==", targetUid).where("action", "==", kind).where("revoked", "==", false).get();
    const latest = past.docs
      .filter((m) => action === "lift" || (m.data().postId === entry.postId && m.data().replyId === entry.replyId))
      .sort((a, b) => b.data().createdAt.toMillis() - a.data().createdAt.toMillis())[0];
    const writer = db.batch();
    if (action === "restore") writer.update(targetRef, { state: "public" });
    else writer.update(userRef, { suspendedUntil: null });
    if (latest) {
      writer.update(latest.ref, { revoked: true, revokedAt: ts(t) });
      writer.update(userRef, { violations: FieldValue.increment(-1) });
    }
    await writer.commit();
    return { ok: true };
  }

  if (action === "ban") {
    const authUser = await getAuth().getUser(targetUid).catch(() => null);
    const expireAt = ts(t + RULES.banRetentionMs);
    const writer = db.batch();
    if (authUser && authUser.email) writer.set(db.doc("bans/" + emailHash(authUser.email)), { createdAt: ts(t), expireAt });
    writer.set(db.collection("moderation").doc(), Object.assign(entry, { expireAt }));
    writer.update(userRef, { status: "banned", violations: FieldValue.increment(1), expireAt });
    writer.set(db.doc("handles/" + handleKey(user.handle)), { uid: targetUid, expireAt });
    const old = await db.collection("moderation").where("targetUid", "==", targetUid).get();
    old.docs.forEach((m) => writer.update(m.ref, { expireAt }));
    await writer.commit();
    if (d.deleteContent === true) {
      const posts = await db.collection("posts").where("authorUid", "==", targetUid).get();
      for (const p of posts.docs) { await db.recursiveDelete(p.ref); await db.doc("postStats/" + p.id).delete(); }
      const replies = await db.collectionGroup("replies").where("authorUid", "==", targetUid).get();
      const w = db.bulkWriter();
      replies.docs.forEach((r) => w.delete(r.ref));
      await w.close();
    }
    // ログイン情報（メールアドレス）は消す。照合用には復元できないハッシュだけを残す
    if (authUser) await getAuth().deleteUser(targetUid);
    return { ok: true };
  }

  const writer = db.batch();
  if (action === "hide") writer.update(targetRef, { state: "hidden" });
  if (action === "suspend") {
    entry.until = ts(t + RULES.suspendMs);
    writer.update(userRef, { suspendedUntil: entry.until });
  }
  writer.set(db.collection("moderation").doc(), entry);
  writer.update(userRef, { violations: FieldValue.increment(1) });
  await writer.commit();
  return { ok: true, until: entry.until ? entry.until.toMillis() : null };
});

// 処置の通知メールを運営者のメールから送るために、相手のメールアドレスと記録を返す
exports.adminUserInfo = onCall(async (request) => {
  requireAdmin(request);
  const uid = docId((request.data || {}).uid);
  const [authUser, userSnap, mods] = await Promise.all([
    getAuth().getUser(uid).catch(() => null),
    db.doc("users/" + uid).get(),
    db.collection("moderation").where("targetUid", "==", uid).get()
  ]);
  if (!userSnap.exists) throw fail("not-found", "対象の利用者が見つかりません。", "no-user");
  const user = userSnap.data();
  return {
    uid,
    email: authUser ? authUser.email : null,
    handle: user.handle,
    status: user.status,
    violations: user.violations || 0,
    suspendedUntil: user.suspendedUntil ? user.suspendedUntil.toMillis() : null,
    history: mods.docs.map((m) => {
      const x = m.data();
      return { id: m.id, action: x.action, rule: x.rule, reason: x.reason, revoked: x.revoked, until: x.until ? x.until.toMillis() : null, createdAt: x.createdAt.toMillis() };
    }).sort((a, b) => b.createdAt - a.createdAt)
  };
});

exports.adminResolveReport = onCall(async (request) => {
  requireAdmin(request);
  const t = now(request);
  const ref = db.doc("reports/" + docId((request.data || {}).reportId));
  if (!(await ref.get()).exists) throw fail("not-found", "通報が見つかりません。", "no-report");
  await ref.update({ status: "resolved", resolvedAt: ts(t), expireAt: ts(t + RULES.reportRetentionMs) });
  return { ok: true };
});

exports.adminSetSite = onCall(async (request) => {
  requireAdmin(request);
  const d = request.data || {};
  const news = Array.isArray(d.news) ? d.news.map((s) => str(s).trim().slice(0, 200)).filter(Boolean).slice(0, RULES.newsMax) : [];
  await db.doc("config/site").set({ absent: d.absent === true, news }, { merge: true });
  return { ok: true };
});
