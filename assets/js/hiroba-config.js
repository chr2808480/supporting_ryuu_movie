/*!
 * 星軍基地の接続先（Firebase）。null のままなら、デモとして動く（どこにも送信しない）。
 * Firebase コンソール → プロジェクトの設定 → マイアプリ（ウェブ）の firebaseConfig を貼る。
 * apiKey などはページに公開して問題ない値です（守りは Firestore のルールと Cloud Functions で行う）。
 * 手順は firebase/README.md を参照。
 */
window.HB_FIREBASE = null;

/* 例：
window.HB_FIREBASE = {
  config: {
    apiKey: "…",
    authDomain: "（プロジェクトID）.firebaseapp.com",
    projectId: "（プロジェクトID）",
    appId: "…"
  },
  region: "asia-northeast1"
};
*/
