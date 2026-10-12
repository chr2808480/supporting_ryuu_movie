// エミュレーター（npm test が起動する）に対して、関数を呼ぶ・利用者を作る・データを消すための道具
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

export const PROJECT = "demo-hiroba";
const AUTH_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || "127.0.0.1:9099";
const FS_HOST = process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080";
const FN_BASE = "http://127.0.0.1:5001/" + PROJECT + "/asia-northeast1/";

process.env.FIREBASE_AUTH_EMULATOR_HOST = AUTH_HOST;
process.env.FIRESTORE_EMULATOR_HOST = FS_HOST;
if (!getApps().length) initializeApp({ projectId: PROJECT });
export const db = getFirestore();
export const auth = getAuth();

const HOUR = 3600 * 1000;
// 日本時間 2026-10-12 12:00（受付中）を基準にする。連投の間隔に引っかからないよう、呼ぶたびに1分進める
let clock = Date.UTC(2026, 9, 12, 3, 0, 0);
export function tick(ms = 60 * 1000) { clock += ms; return clock; }
export function at(ms) { clock = ms; return clock; }
export const NOON = Date.UTC(2026, 9, 12, 3, 0, 0);
export const NIGHT = Date.UTC(2026, 9, 12, 15, 30, 0);   // 日本時間 0:30
export { HOUR };

export async function reset() {
  clock = NOON;
  await fetch("http://" + FS_HOST + "/emulator/v1/projects/" + PROJECT + "/databases/(default)/documents", { method: "DELETE" });
  await fetch("http://" + AUTH_HOST + "/emulator/v1/projects/" + PROJECT + "/accounts", { method: "DELETE" });
}

async function idt(path, body) {
  const res = await fetch("http://" + AUTH_HOST + "/identitytoolkit.googleapis.com/v1/" + path + "?key=fake", {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body)
  });
  const json = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(json));
  return json;
}

// メールのリンクでログインした人と同じく、メール確認済みの利用者を作ってトークンを返す
export async function signIn(email, claims) {
  const password = "pw-" + email;
  let uid;
  try {
    uid = (await idt("accounts:signUp", { email, password, returnSecureToken: true })).localId;
  } catch {
    uid = (await auth.getUserByEmail(email)).uid;
  }
  await auth.updateUser(uid, { emailVerified: true });
  if (claims) await auth.setCustomUserClaims(uid, claims);
  const token = (await idt("accounts:signInWithPassword", { email, password, returnSecureToken: true })).idToken;
  return { uid, token, email };
}

export async function call(name, data, user) {
  const headers = { "content-type": "application/json" };
  if (user) headers.authorization = "Bearer " + user.token;
  const res = await fetch(FN_BASE + name, {
    method: "POST", headers, body: JSON.stringify({ data: Object.assign({ _testNow: tick() }, data || {}) })
  });
  const json = await res.json();
  if (json.error) {
    const err = new Error(json.error.message);
    err.status = json.error.status;
    err.reason = json.error.details && json.error.details.reason;
    throw err;
  }
  return json.result;
}

export async function member(email, handle) {
  const user = await signIn(email);
  await call("registerProfile", { handle, age16: true, agree: true }, user);
  return user;
}

// 失敗するはずの呼び出しの理由（details.reason）を返す
export async function reasonOf(promise) {
  try { await promise; } catch (e) { return e.reason || e.status; }
  return "ok";
}
