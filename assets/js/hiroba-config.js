/*!
 * 星軍基地の接続先（Firebase）。
 * Firebase コンソール → プロジェクトの設定 → マイアプリ（ウェブ）の firebaseConfig の値です。
 * apiKey などはページに公開して問題ない値です（守りは Firestore のルールと Cloud Functions で行う）。
 * 手順は firebase/README.md を参照。
 */
window.HB_FIREBASE = {
  config: {
    apiKey: "AIzaSyBG3FKpbj7L5ZYebaSKJuAo1c5ehNSjhN8",
    authDomain: "spporting-ryuu-movie.firebaseapp.com",
    projectId: "spporting-ryuu-movie",
    appId: "1:497020866392:web:66e6fc3a21ad49c294df2d"
  },
  region: "asia-northeast1"
};
