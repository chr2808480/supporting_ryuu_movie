# 星軍基地のサーバー側（Firebase）

`hiroba.html` を本番で動かすための設定と手順です。`assets/js/hiroba-config.js` が `null` のあいだは、
これまでどおりデモとして動き、どこにも送信しません。

## しくみ

```
GitHub Pages（hiroba.html・kanri.html）
   │  読む：Cloud Firestore（公開中の投稿・返信など。ルールで守る）
   │  書く：Cloud Functions（すべての書き込みはここで確かめてから保存）
   │  ログイン：Firebase Authentication（メールのリンク。パスワードなし）
   ▼
Firebase（Google LLC）── Firestore・Functions は東京（asia-northeast1）、Authentication は米国
```

| 置き場所 | 中身 |
| --- | --- |
| `functions/index.js` | 投稿・返信・編集・削除・★・通報・退会・運営者の処置。受付時間（23時〜6時はお休み）、運営者不在、同じ相手への返信は24時間で3回まで、リンクを含む投稿の保留、個人情報らしい文字列の確認、20秒の連投防止、ブロック、投稿停止・利用停止をここで判定する |
| `firestore.rules` | 読み書きの決まり。書き込みは Functions だけ（例外はミュート・ブロックの設定）。★の数は投稿した本人だけ、通報は運営者だけ、IP の記録は誰も画面から読めない |
| `firestore.indexes.json` | 検索用の索引と、自動削除（TTL）の設定。IP の記録は90日、対応済みの通報は90日、利用停止の記録は1年で消える |
| `web/entry.js` | ブラウザで使う Firebase の部品。`npm run build:web` で `assets/js/vendor/firebase-hiroba.js` を作る |
| `scripts/decrypt-ip.mjs` | 開示請求のときに、暗号化した IP を読む道具 |
| `test/` | エミュレーター（手元で Firebase を再現するもの）でのテスト |

期間や回数を変えるときは `functions/index.js` の `RULES` と、`privacy.html`・`terms.html`・`hiroba.html` の記載を一緒に直してください。

## 料金について

- **Blaze プラン（従量課金・クレジットカードの登録が必要）にする必要があります。** メールリンクでのログインは無料の Spark プランだと1日5通まで、Cloud Functions と自動削除（TTL）は Blaze でしか使えないためです。
- Blaze にも無料枠があり、ファンの交流スペースの規模なら、基本は月0円の見込みです（Firestore：1日あたり読み取り5万件・書き込み2万件、Cloud Functions：月200万回の呼び出しなど）。
- Functions の部品の保存で、数円程度の請求が出ることがあります。
- **Firestore の利用には上限をかけられません。** 予算アラートを必ず設定してください。荒らし対策として、Functions は同時に3つまでしか立ち上がらないようにし、一度に読める件数もルールで絞っています。

## はじめての設定

用意するもの：Google アカウント、クレジットカード、Node.js 22、（テストを動かすなら Java 21 以上）。

1. **プロジェクトを作る**
   [Firebase コンソール](https://console.firebase.google.com/) でプロジェクトを作ります。Google アナリティクスは使いません（オフにする）。
2. **Blaze プランにして、予算アラートを設定する**
   「使用量と請求額」から Blaze に切り替え、予算アラート（例：500円）を設定します。手順は公式の
   [Avoid surprise bills](https://firebase.google.com/docs/projects/billing/avoid-surprise-bills) を見てください。
   Cloud Functions には、使いすぎたら止まる上限（spend cap）も設定できます。
3. **Firestore を作る**
   「Firestore Database」→ データベースを作成。エディションは Standard、**ロケーションは `asia-northeast1`（東京）**、本番環境モードで作ります（ロケーションは後から変えられません）。
4. **ログインの方法を有効にする**
   「Authentication」→「ログイン方法」→「メール / パスワード」を有効にし、**「メールリンク（パスワードなしでログイン）」もオン**にします。
   「設定」→「承認済みドメイン」に `chr2808480.github.io` を追加します（独自ドメインを使うならそれも）。
5. **ウェブアプリを登録し、接続先を貼る**
   「プロジェクトの設定」→「マイアプリ」→ ウェブアプリを追加（Firebase Hosting は使いません）。
   表示された `firebaseConfig` を、`assets/js/hiroba-config.js` の例にならって貼ります。
6. **手元の準備**
   ```bash
   cd firebase
   npm install
   (cd functions && npm install)
   npx firebase login
   npx firebase use --add        # 作ったプロジェクトを選ぶ
   ```
7. **秘密の値を登録する**（IP の暗号化と、利用停止したメールアドレスの照合に使う）
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"   # 値を作る
   npx firebase functions:secrets:set HIROBA_SECRET                                # 作った値を貼る
   ```
   **この値はパスワード管理アプリなどに控えておいてください。** 開示請求のときに IP を読むのに必要です。
   なくすと記録を読めなくなり、変えると以前の記録と利用停止の照合が使えなくなります。
8. **デプロイする**
   ```bash
   npm run deploy
   ```
   途中で `ADMIN_EMAILS` を聞かれたら、運営者のメールアドレスを入れます（複数ならカンマ区切り）。
   入れた値は `functions/.env.（プロジェクトID）` に保存されます。このファイルは `.gitignore` で公開しないようにしてあります。
   自動削除（TTL）の設定は、有効になるまで少し時間がかかります。
9. **運営者として有効にする**
   `https://chr2808480.github.io/supporting_ryuu_movie/kanri.html` を開き、`ADMIN_EMAILS` のメールアドレスでログイン →「運営者として有効にする」。
10. **公開前の確認**
    - `privacy.html`・`terms.html` の「要記入」を埋める（制定日、運営者のメールサービス、異議の期限など）
    - 実際に登録・投稿・★・返信・通報・退会を一通り試す
    - `hiroba.html` の「ページ案（デモ）」表示は、本番では自動で隠れます

## 日々の運営（kanri.html）

- **確認待ち**：リンクを含む投稿・返信が並びます。「公開する」か「非表示・処置へ」。
- **未対応の通報**：「投稿者への処置へ」で、注意・投稿の非表示・7日間の投稿停止・利用停止を記録します。
  記録したら「通知メールを作る」で、どの投稿がどのルールに当たるか・処置の内容と期間・異議の申立て方を書いたメールが、運営者のメールアプリに用意されます（利用規約 第8条）。
- **非表示にした投稿**：異議が通ったら「公開に戻す」。投稿停止の取り消しは、処置の画面の「投稿停止の解除」。
- **基地の状態とお知らせ**：運営者不在（新規投稿をお休み）と、お知らせ欄の文。
- **開示請求**：法令に基づく請求を受けたら、専門家に相談のうえ、Firestore の `ipLogs` の `ip` 欄を
  `HIROBA_SECRET='…' node scripts/decrypt-ip.mjs 'v1:…'` で読みます。転送ヘッダー全体（`xff`）と接続元（`ip`）が出ます。

## テスト

```bash
cd firebase
npm test            # ルールと関数（エミュレーター。Java 21 以上が必要）
npm run test:e2e    # 画面を通した確認（npx playwright install chromium が必要。日本時間の6時〜23時に実行）
```

Firebase の部品（`firebase` パッケージ）を更新したら、`npm run build:web` で `assets/js/vendor/firebase-hiroba.js` を作り直してください。
