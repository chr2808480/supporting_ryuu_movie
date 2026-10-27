import { test, before, after, beforeEach } from "node:test";
import { readFileSync } from "node:fs";
import { initializeTestEnvironment, assertSucceeds, assertFails } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, collection, collectionGroup, query, where, orderBy, limit, getDocs } from "firebase/firestore";

let env;
const [host, port] = (process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080").split(":");

before(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-hiroba-rules",
    firestore: { rules: readFileSync(new URL("../firestore.rules", import.meta.url), "utf8"), host, port: Number(port) }
  });
});
after(async () => { await env.cleanup(); });

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    const now = new Date();
    await setDoc(doc(db, "config/site"), { absent: false, news: [] });
    await setDoc(doc(db, "posts/pub"), { authorUid: "alice", authorHandle: "A", state: "public", body: "公開", createdAt: now });
    await setDoc(doc(db, "posts/held"), { authorUid: "alice", authorHandle: "A", state: "held", body: "確認待ち", createdAt: now });
    await setDoc(doc(db, "posts/pub/replies/r1"), { postId: "pub", authorUid: "bob", state: "public", body: "返信", createdAt: now });
    await setDoc(doc(db, "posts/pub/replies/r2"), { postId: "pub", authorUid: "bob", state: "held", body: "確認待ちの返信", createdAt: now });
    await setDoc(doc(db, "posts/pub/stars/bob"), { uid: "bob", postId: "pub" });
    await setDoc(doc(db, "postStats/pub"), { authorUid: "alice", stars: 1 });
    await setDoc(doc(db, "users/alice"), { handle: "A", status: "active" });
    await setDoc(doc(db, "moderation/m1"), { targetUid: "alice", action: "warn" });
    await setDoc(doc(db, "reports/x1"), { reporterUid: "bob", postId: "pub", status: "open", createdAt: now });
    await setDoc(doc(db, "ipLogs/i1"), { uid: "alice", ip: "v1:..." });
  });
});

const guest = () => env.unauthenticatedContext().firestore();
const as = (uid, claims) => env.authenticatedContext(uid, claims).firestore();

test("公開中の投稿・返信は誰でも読める。件数の上限をつけた読み方だけ通す", async () => {
  await assertSucceeds(getDoc(doc(guest(), "posts/pub")));
  await assertSucceeds(getDocs(query(collection(guest(), "posts"), where("state", "==", "public"), orderBy("createdAt", "desc"), limit(50))));
  await assertFails(getDocs(query(collection(guest(), "posts"), where("state", "==", "public"))));
  await assertFails(getDocs(query(collection(guest(), "posts"), where("state", "==", "public"), limit(500))));
  await assertSucceeds(getDocs(query(collectionGroup(guest(), "replies"), where("state", "==", "public"), orderBy("createdAt", "desc"), limit(300))));
  await assertFails(getDocs(query(collectionGroup(guest(), "replies"), limit(300))));
  await assertSucceeds(getDoc(doc(guest(), "config/site")));
});

test("確認待ちの投稿・返信は、本人と運営者だけが読める", async () => {
  await assertFails(getDoc(doc(guest(), "posts/held")));
  await assertFails(getDoc(doc(as("bob"), "posts/held")));
  await assertSucceeds(getDoc(doc(as("alice"), "posts/held")));
  await assertSucceeds(getDoc(doc(as("admin", { admin: true }), "posts/held")));
  await assertSucceeds(getDocs(query(collection(as("alice"), "posts"), where("authorUid", "==", "alice"), where("state", "==", "held"), limit(100))));
  await assertFails(getDoc(doc(as("alice"), "posts/pub/replies/r2")));
  await assertSucceeds(getDoc(doc(as("bob"), "posts/pub/replies/r2")));
});

test("投稿・返信・設定を、画面から直接書き換えることはできない", async () => {
  await assertFails(setDoc(doc(as("alice"), "posts/new"), { authorUid: "alice", state: "public", body: "x" }));
  await assertFails(setDoc(doc(as("alice"), "posts/pub"), { state: "public", body: "改ざん" }, { merge: true }));
  await assertFails(setDoc(doc(as("bob"), "posts/pub/replies/r3"), { authorUid: "bob", state: "public" }));
  await assertFails(setDoc(doc(as("admin", { admin: true }), "config/site"), { absent: true }));
  await assertFails(setDoc(doc(as("alice"), "users/alice"), { status: "active", violations: 0 }));
  // 来訪者の数も、関数を通さずに増やしたり書き換えたりできない
  await assertFails(setDoc(doc(guest(), "stats/visitors"), { count: 999999 }));
  await assertFails(getDoc(doc(guest(), "stats/visitors")));
});

test("★を送った記録は本人だけ、★の数は投稿した本人だけが読める", async () => {
  await assertSucceeds(getDoc(doc(as("bob"), "posts/pub/stars/bob")));
  await assertFails(getDoc(doc(as("alice"), "posts/pub/stars/bob")));
  await assertSucceeds(getDocs(query(collectionGroup(as("bob"), "stars"), where("uid", "==", "bob"))));
  await assertFails(getDocs(query(collectionGroup(as("alice"), "stars"), where("uid", "==", "bob"))));
  await assertSucceeds(getDoc(doc(as("alice"), "postStats/pub")));
  await assertFails(getDoc(doc(as("bob"), "postStats/pub")));
  await assertFails(getDoc(doc(guest(), "postStats/pub")));
});

test("ミュート・ブロックは本人だけが読み書きできる", async () => {
  await assertSucceeds(setDoc(doc(as("alice"), "users/alice/private/prefs"), { muted: [{ uid: "bob", handle: "B" }], blocked: [] }));
  await assertSucceeds(getDoc(doc(as("alice"), "users/alice/private/prefs")));
  await assertFails(getDoc(doc(as("bob"), "users/alice/private/prefs")));
  await assertFails(setDoc(doc(as("bob"), "users/alice/private/prefs"), { muted: [], blocked: [] }));
  await assertFails(setDoc(doc(as("alice"), "users/alice/private/prefs"), { muted: [], blocked: [], admin: true }));
  await assertFails(setDoc(doc(as("alice"), "users/alice/private/prefs"), { muted: "bob" }));
  await assertFails(setDoc(doc(as("alice"), "users/alice/private/replyLog"), { entries: [] }));
});

test("ミュート・ブロックを書けるのは、参加登録が済み、利用停止になっていない人だけ", async () => {
  // 参加登録していない人（ログインだけした人・メールアドレスを確かめていないアカウント）
  await assertFails(setDoc(doc(as("bob"), "users/bob/private/prefs"), { muted: [], blocked: [] }));
  // 利用停止の直後に、本人の手元のログインで書き戻そうとする
  await env.withSecurityRulesDisabled((ctx) => setDoc(doc(ctx.firestore(), "users/carol"), { handle: "C", status: "banned" }));
  await assertFails(setDoc(doc(as("carol"), "users/carol/private/prefs"), { muted: [], blocked: [] }));
});

test("利用者の記録・処置は本人と運営者、通報は運営者だけ。IP の記録は誰も読めない", async () => {
  await assertSucceeds(getDoc(doc(as("alice"), "users/alice")));
  await assertFails(getDoc(doc(as("bob"), "users/alice")));
  await assertSucceeds(getDoc(doc(as("admin", { admin: true }), "users/alice")));
  await assertSucceeds(getDoc(doc(as("alice"), "moderation/m1")));
  await assertFails(getDoc(doc(as("bob"), "moderation/m1")));
  await assertFails(getDoc(doc(as("bob"), "reports/x1")));
  await assertSucceeds(getDoc(doc(as("admin", { admin: true }), "reports/x1")));
  await assertFails(getDoc(doc(as("admin", { admin: true }), "ipLogs/i1")));
  await assertFails(getDoc(doc(as("alice"), "ipLogs/i1")));
});
