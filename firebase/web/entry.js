// 星軍基地で使う Firebase の部品だけをまとめる（npm run build:web で assets/js/vendor/firebase-hiroba.js を作る）
export { initializeApp } from "firebase/app";
// メールのリンクでのログインだけを使うので、ポップアップ用の部品（外部の iframe）は読み込まない
export {
  initializeAuth, indexedDBLocalPersistence, browserLocalPersistence,
  connectAuthEmulator, onAuthStateChanged, signOut,
  sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink
} from "firebase/auth";
export {
  getFirestore, connectFirestoreEmulator, doc, getDoc, setDoc,
  collection, collectionGroup, query, where, orderBy, limit, getDocs
} from "firebase/firestore/lite";
export { getFunctions, connectFunctionsEmulator, httpsCallable } from "firebase/functions";
