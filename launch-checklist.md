# 正式運用前の確認リスト（星軍基地・お問い合わせフォーム）

作成日：**2026-10-12**（main の `3cc86ba` 時点のファイルを読んで作成）
更新日：**2026-10-12**（main の `ee2f514` 時点で読み直し、テストを実行し直しました。漏れていた項目には 🆕 を付けています。同じ日に、1-7・1-8・通知メール・通報の期限をコードで直しました）
再確認：**2026-10-12**（main の `e56d8b7` 時点で読み直し、テストを実行し直し、エミュレーターで試しました。新しく見つかった項目には 🔎 を付けています。同じ日に 1-9・1-10 をコードで直し、「案」の表示を外し、公開日とメールサービス以外の「要記入」を埋めました）
更新：**2026-10-12**（運営者が運営専用の Gmail を作ったので、`privacy.html` 6. のメールサービスを埋め、お問い合わせフォームと参加登録の同意の文に Gmail を書き足しました。アドレスそのものは、公開しているこのリポジトリには書いていません）
再確認：**2026-10-14**（main の `719d67d` 時点で、テストを実行し直し、公開中の配信と本番の読める範囲を確かめました。結果は「0. いまの状態」の 📋 の項目です。新しい必須項目はありません）
更新：**2026-10-17**（公開日が **2026年11月14日** に決まったので、`privacy.html`・`terms.html` の制定日と附則に入れました。運営者から、1-3・1-4・2・3 は確認済み、1-1 のお知らせは入れた、1-5 のデプロイは Cloud Shell で確認中、と連絡がありました）
更新：**2026-10-17**（運営者から、1-5 のデプロイが完了して確かめた、と連絡がありました。お知らせ欄は本番の `config/site` を読んで、入っていることを確かめました〔2026-10-17 12:01 日本時間に保存〕。このとき「運営者不在」もオンになっていました）
更新：**2026-10-17**（公開前の盛り上げの準備〔`launch-plan.md`〕で、関数を変えました：参加登録は 11/14 6:00 から、運営者の投稿・返信に「運営」の印、運営者の投稿への返信は回数に数えない、運営者のリンクは確認待ちにしない。基地は100件ずつ読み「もっと見る」を付けました。`terms.html` 第5条・附則も合わせて直しました。新しい項目には 🚀 を付けています。**もう一度のデプロイ（1-11）が必要です**）
更新：**2026-10-22**（運営者の希望で、参加登録の受付を **2026年10月23日（金）6:00** に前倒ししました。`privacy.html`・`terms.html` の制定日と附則も 10月23日 にしました。11月14日 は「正式オープン（活動3周年）」の告知として残します。10/23 の朝の作業は「8. 参加登録の受付開始の日」です）

星軍基地（`hiroba.html`）とお問い合わせフォーム（`contact.html`）を正式に公開する前に、確かめることをまとめました。
上から順に進めてください。

| 印 | 意味 |
| --- | --- |
| **必須** | 公開前に必ず済ませる |
| **推奨** | できれば公開前に済ませる |
| **任意** | 公開後でもよい |

> [!NOTE]
> 法令にかかわる項目は、公的機関の資料をもとにした整理で、法的な助言ではありません。
> 判断に迷うときは、弁護士などの専門家に確かめてください。

### まだ済んでいない必須項目（ひと目で）

| | やること | どこで | 状態（2026-10-17） |
| --- | --- | --- | --- |
| 1-1 | 基地のお知らせ欄に「試験運用中」を入れる | `kanri.html` | **済み**（本番で確かめた：「ただいま試験運用中です。11月14日の運用開始までしばらくお待ちください……」）。「運営者不在」もオンなので、新規の投稿・返信は止まっている。参加登録・★・通報は止まらない |
| 1-2 | 規約・ポリシーの残りの「要記入」（公開日）を埋める | `privacy.html`・`terms.html` | **済み**（2026-10-22 に 2026年10月23日 へ前倒し。前は 2026年11月14日）。main にマージすると公開中のページに出る |
| 1-3 | ポリシーに「しています」と書いた対策を、本当にしておく | 各サービスの設定 | 運営者が確認済み |
| 1-4 | 運営専用の Gmail（2026-10-12 作成）に二段階認証をかけ、EmailJS のテンプレートの宛先をそのアドレスに替える（運営者ページのログインは私用のまま） | Google アカウント・EmailJS | 運営者が確認済み |
| 1-5 | 1-5・1-7・1-8・1-9・1-10・通報の期限・`TERMS_VERSION` の修正をデプロイする（まとめて1回でよい。ルールも含む） | Cloud Shell で `bash setup.sh` | **済み**（運営者が確認） |
| 2 | コンソールの設定を確かめる | Firebase・Google Cloud・GitHub・EmailJS | 運営者が確認済み |
| 3 | 本番で一通り試す（通知メールが最後まで入るか 🆕 を含む） | ブラウザ・メールアプリ | 運営者が確認済み。1-5 のデプロイより前に試した場合は、利用停止で投稿・返信が消えること（1-8）だけ、デプロイ後にもう一度試す |
| 1-11 | 🚀 2026-10-17 の関数の変更をデプロイし、運営者のアカウントで基地に参加登録しておく | Cloud Shell で `bash setup.sh`・`hiroba.html` | **まだ**（main にマージしてから。**10/23 6:00 より前に**） |

---

## 0. いまの状態（2026-10-12 に確かめたこと）

- **テストはすべて合格**（`ee2f514` で実行し直しました）：エミュレーターでのルール・関数のテスト 15件（`npm test`）と、画面を通した確認（`npm run test:e2e`。星軍基地と運営者ページ）。
- 🆕 **サーバー側の部品に、既知の脆弱性はなし**：`firebase/functions` で `npm audit --omit=dev` の結果は 0件です。
  手元で使う道具（`firebase/` の firebase-tools やテスト用の部品）には、既知の脆弱性の報告が 17件あります。これらはデプロイされません。ブラウザ用の部品（`assets/js/vendor/firebase-hiroba.js`）には、報告のあった `@grpc/grpc-js`（Node.js 用）が入っていないことも確かめました。
- **基地はすでに本番の Firebase につながっている**：`assets/js/hiroba-config.js` に接続先が入っています。main を GitHub Pages で配信していれば、`hiroba.html` で本当に登録・投稿ができる状態です（この作業環境からは公開中のページを開けなかったので、ブラウザで確かめてください）。
- **メールのリンクでのログインは、先回りの乗っ取りに強い**：他人が同じメールアドレスで、確認していないパスワードのアカウントを先に作っていても、メールのリンクでログインした時点でそのパスワードは消されます（Firebase 公式）。この攻撃（account pre-hijacking）は、人気サービス 75 のうち少なくとも 35 で見つかったと報告されていますが（Sudhodanan & Paverd, USENIX Security 2022）、この基地は Firebase のこのしくみで防げています。
- **ログイン用メールの上限**：Blaze プランでは 1日 25,000 通まで（Spark は 5 通）。基地の規模なら足ります。
- 🔎 **`e56d8b7` でもテストはすべて合格**：`npm test` 16件と `npm run test:e2e`。`firebase/functions` の `npm audit --omit=dev` も 0件のままです。
- 🔎 **本番のお知らせ欄はまだ空**：誰でも読める `config/site` を読んでみると、文書がまだありませんでした（1-1 のお知らせが入っていない）。公開されている投稿は 1件（2026-10-12）でした。
  `hiroba.html` は本番につながると「ページ案（デモ）」の表示を自動で隠し、「基地に参加する」を出します。参加登録を止めるしくみはないので、いまは誰でも「案」の規約のまま登録できます
- 📋 **`719d67d` でもテストはすべて合格**（2026-10-14）：`npm test` 17件と `npm run test:e2e`（星軍基地と運営者ページ）。`firebase/functions` の `npm audit --omit=dev` は 0件、手元で使う道具の 17件は前と同じで、デプロイされません。
- 📋 **GitHub Pages は最新の main を配信している**：GitHub Actions の「pages build and deployment」が、`719d67d` で成功しています（2026-10-12 21:35 日本時間）。
  お問い合わせフォームは、新しいサービス `contact_service` で送る状態です。1-4 の「main に出たら、公開中の `contact.html` からテスト送信」に進めます
- 📋 **お問い合わせフォームの `integrity` は正しい**：npm で公開されている `@emailjs/browser@4.4.1` の `dist/email.min.js` から計算した値と一致しました。
  2026-10 に 5 系（`5.0.3` まで）が出ていますが、4.4.1 に非推奨の印は付いていません。版を上げるときは `integrity` も計算し直す
- 📋 **本番のお知らせ欄は、2026-10-14 もまだ空**（`config/site` がない）。公開されている投稿も 1件（2026-10-12）のままです。1-1 はまだ済んでいません
- 📋 **1-5 のデプロイが済んだかは、この作業環境からは確かめられませんでした**（Cloud Functions の URL に届かない。ルールの違いも、ログインしないと見分けられない）。
  Firebase コンソール →「Functions」に `cleanupUnregistered` があり、Google Cloud コンソール →「Cloud Run」の一覧で、関数の最終デプロイが 2026-10-12 19:30（日本時間。1-9・1-10 の修正が main に入った時刻）より後なら、デプロイ済みと考えられます。
  分からなければ、`firebase/README.md`「途中で止まったとき」の2つめの1行（GitHub の最新に合わせてから `bash setup.sh`）で、もう一度デプロイすれば確実です（何度実行しても大丈夫。運営者のメールアドレスは私用のまま Enter）

テストで確かめられないもの（コンソールの設定、メールの届き方、規約の中身、運営体制）が、以下のリストの中心です。

---

## 1. 必須：公開前に直すこと

### 1-1. 「デモ」の案内と、実際の動きがずれている

- [x] `index.html` の基地の紹介（`#hiroba`）には「いまはデモ版です。投稿はどこにも送信されません。」とありました。ところが `hiroba.html` は本番につながっていて、デモの表示は自動で隠れます。
  **2026-10-12 修正**：「試験運用中です。投稿は実際に保存され、誰でも見られます。参加登録は正式公開までお待ちください」に直しました。
  （接続設定を `null` に戻す方法もありますが、そうすると `kanri.html` と本番での動作確認も使えなくなるため、こちらにしました）
- [x] **2026-10-17**：`hiroba.html` を直接開いた人には `index.html` の案内が見えないので、`kanri.html` のお知らせ欄に「試験運用中です。正式公開までは参加登録をお待ちください」などを入れる。本番の `config/site` に入っていることを確かめました
  （🔎 2026-10-12 に本番の `config/site` を読んだときは、まだ入っていませんでした）
- [x] 🚀 **2026-10-17 修正**：参加登録は、受付開始（2026-10-22 に 11/14 から **10/23 6:00**〔日本時間〕に前倒し）より前は断るようにしました（関数 `registerProfile`。運営者のメールアドレスだけは前でも登録できる）。基地の画面も、それまでは「参加する」の代わりに受付開始の日時を出します。1-11 のデプロイで本番に入ります
- [ ] 🔎 お知らせはお願いにすぎず、登録そのものは止まりません（1-11 のデプロイまで）。公開日の前に、Firebase コンソールの「Authentication」→「ユーザー」と Firestore の `users` を見て、運営者・テスト以外の登録がないか確かめる。
  あれば 1-2 の「すでに『案』のまま登録した人」の扱いを決める
- [x] 🚀 **2026-10-17 修正**：`index.html` の基地の紹介は、10/23 6:00 に「先行オープン中」、11/14 6:00 に「オープン中」へ自動で切り替わります（`assets/js/main.js` の `OPEN_AT`・`LAUNCH_AT`）。公開日に書き換える作業はいりません

### 1-2. 規約・ポリシーの「要記入」と「案」を片づける

| ファイル | 箇所 | いまの記載 |
| --- | --- | --- |
| `privacy.html` | 制定日 | **2026年10月23日**（2026-10-17 に 11月14日 で記入、2026-10-22 に前倒し） |
| `privacy.html` | 2. お問い合わせフォームの内容の保存期間 | **1年**（2026-10-12 記入） |
| `privacy.html` | 6. 運営者のメールの送受信（サービス名・国） | **Gmail（Google LLC）、米国／サーバーの国は特定できない**（2026-10-12 記入。1-4 を参照） |
| `privacy.html` | 6. 運営者のメールサービスがとっている対策 | **Google の公表している対策**（2026-10-12 記入） |
| `privacy.html` | 6. EmailJS に履歴を残さない設定 | 「要確認」を外した（1-3 の設定を必ずする） |
| `privacy.html` | 9. 請求に答えるまでの目安 | **14日**（2026-10-12 記入） |
| `terms.html` | 制定日、附則の適用日 | **2026年10月23日**（2026-10-17 に 11月14日 で記入、2026-10-22 に前倒し） |
| `terms.html` | 第8条 異議の申立ての期限 | **14日**（2026-10-12 記入。`kanri.js` の通知メールの文と同じ） |
| `terms.html` | 第12条 基地を終えるときの予告 | **30日**（2026-10-12 記入） |

- [x] **2026-10-12 記入**：運営者のメールサービスの3か所（1-4 の Gmail）
- [x] **2026-10-17 記入**：公開日を埋める（`privacy.html` の制定日、`terms.html` の制定日と附則。2026年11月14日）
- [ ] 異議の期限を 14日以外にするときは、`assets/js/kanri.js` の通知メールの文（「14日以内」と直接書いてある）も同じ日数に直す
- [x] **2026-10-12 修正**：「案」の囲みと、`<title>`・説明文・フッターの「（案）」「ページ案」を外しました（`hiroba.html`・`terms.html`・`privacy.html`、コードのコメントと README も）。「案内」「案件」はそのままです
- [x] **2026-10-12 修正**：`TERMS_VERSION` を `"v1"` にしました（規約を改めたら `v2`、`v3` … と上げる）。デプロイするまで、本番は `"2026-10-案"` のままです（1-5）
- [ ] それより前に登録した人の同意の記録は `"2026-10-案"` のままです。1-1 で確かめて、運営者・テスト以外の登録があれば、扱い（もう一度同意してもらうなど）を決める
- [x] 🚀 **2026-10-17**：関数の変更に合わせて、`terms.html` 第5条（運営者のリンク・返信の回数・「運営」の印）と附則（参加登録は11/14 6:00から）を直しました。まだ適用前（11/14 から）の規約なので、`TERMS_VERSION` は `"v1"` のままです。それより前に登録したテストの記録は、直す前の文への同意になります（上の「すでに登録した人」の確認で扱う）。**2026-10-22**：適用日と受付開始を 10/23（6:00）に前倒しました。10/23 に初めて適用するので、`TERMS_VERSION` は `"v1"` のままです
- [ ] 🔎 2. で「対応を終えてから1年」としたお問い合わせは、運営者のメールボックスに残るものです。自動では消えないので、1年たったメールを消す日（例：月に1回）を決める

### 1-3. ポリシーに「しています」と書いたことを、本当にしておく

`privacy.html` は「〜しています」と書いているので、公開した時点で利用者への約束になります。事実と違うと、誤った説明をしたことになります。

- [ ] Google アカウント（Firebase の持ち主）・GitHub・EmailJS・運営者のメールに **二段階認証** をかける（7. 技術的な対策）。EmailJS にも多要素認証があります
- [ ] 管理に使うスマホ・パソコンに **画面ロック** をかけ、**なくしたときに遠隔でロック・消去** できるようにする（7. 物理的な対策。iPhone なら「探す」、Android なら「デバイスを探す」）
- [ ] EmailJS のテンプレートの設定で、**送信の履歴を残さない** ようにする（6.）。EmailJS は、初期設定では履歴と入力内容を保存し、テンプレートの設定から止められます
- [ ] Firebase に **Google アナリティクスをつないでいない** ことを確かめる（2.「アクセス解析・広告のタグは使いません」）
- [ ] Cloud Logging の `_Default` バケットの保存期間を **30日のまま** にしておく（2.「30日で自動削除」）。30日は初期値で、変更もできてしまうため

### 1-4. 運営者用のメールアドレスを用意する

運営で使うメールアドレスには、次の役割があります。**すべて同じでも、別々でも動きます。**
利用者に見えるのは「送る・返信する」アドレスだけなので、そこを私用と分けるのが大事です。

| 役割 | どこで決まるか | 利用者に見えるか |
| --- | --- | --- |
| 運営者ページ（`kanri.html`）のログイン | `setup.sh` で入力した `ADMIN_EMAILS`（`functions/.env.（プロジェクトID）` に保存） | 見えない |
| 処置の通知を送る | 「通知メールを作る」で開いたメールアプリの差出人 | **見える** |
| お問い合わせの受け取りと返信 | EmailJS の Email Services でつないだアカウント、テンプレートの宛先 | 返信すると **見える** |
| Firebase コンソールに入る Google アカウント | Firebase プロジェクトの持ち主 | 見えない |

- [x] **2026-10-12**：運営専用のアドレスとして Gmail を作りました（運営者から受け取り済み）。
  アドレスは、公開しているこのリポジトリには書きません。`ADMIN_EMAILS` を `.gitignore` で公開しないのと同じ理由で、運営者ページにログインできるアドレスを、なりすましメールの的にしないためです
- [ ] その Gmail に **二段階認証** をかけ、なくしたときのための再設定用の電話番号かメールアドレスを登録する
- [x] 🔎 使い捨てのメールアドレス（捨てメアド）は、このアドレスに使わない。2026-10-12 に運営者から最初に聞いたアドレスは使い捨てのサービスのもので、Web 検索では運営元が分かりませんでした。次の理由から、`privacy.html` 6. に書けず、運営にも向きません（**2026-10-12**：上の Gmail に替えたので解決）
  - 事業者名・国・安全対策が分からないと、6. の「要記入」と、個人情報保護法第28条の情報提供が書けない。委託先を監督する（第25条）こともできない
  - 7.「二段階認証で守ります」を満たせない。サービスによっては、アドレスを知っている人なら誰でも受信箱を読める
  - 受信だけのサービスが多く、処置の通知（利用規約 第8条）やお問い合わせへの返信を送れないおそれがある。メールが一定時間で消えると、異議（14日）や請求（14日）の記録が残らない
- [ ] 「通知メールを作る」は、端末のいつものメールアプリを開くだけで、差出人はこのサイトからは決められません（`mailto:` のしくみ）。
  送る前に、差出人が運営専用のアドレスになっているか毎回確かめる（運営専用のアカウントを既定にした端末で `kanri.html` を使うと間違えにくい）
- [ ] **必須**：EmailJS のテンプレートの宛先（To Email）を運営専用の Gmail にする。
  運営専用の Gmail は対応・返信に使うので、お問い合わせもそこに届くようにします。私用のアドレスに届いたまま返信すると、差出人として私用のアドレスが相手に見えてしまいます（テンプレートの Reply To に `{{email}}` を入れているため、返信ボタンでそのまま相手に送れてしまう）
- [x] **2026-10-12**：運営者が EmailJS に新しいサービス `contact_service` を作ったので、`assets/js/contact.js` の `serviceId` を `service_rwf3ey8` から差し替えました（Template ID・Public Key はそのまま）。main にマージして GitHub Pages に出るまでは、公開中のフォームは前のサービスで送ります
- [ ] main に出たら、公開中の `contact.html` からテスト送信し、運営専用の Gmail に届くこと、届いたメールの返信先が入力したアドレスになることを確かめる
- [ ] 使わなくなった前のサービス `service_rwf3ey8` を EmailJS の Email Services から削除する。Service ID・Template ID・Public Key はどれもページに出ている値なので、残しておくと、誰でも前のサービスを使って送れてしまいます。
  前のサービスを私用の Gmail につないでいたなら、私用の Google アカウントの「サードパーティとの接続」から EmailJS のアクセス権も削除する
- [ ] **推奨**：Email Services でつないだアカウント（お問い合わせのメールを送る側）も運営専用の Gmail にする（`contact_service` をどちらにつないだか確かめる）。
  私用のままでも動き、利用者にも見えません。ただし、送った控えが私用の Gmail の「送信済み」にもたぶん残り（Gmail API で送ったメールには「送信済み」のラベルが自動で付きます。EmailJS の送り方は公表されていないので、テスト送信で確かめる）、お問い合わせの内容が2つのメールボックスに分かれます。私用のままにするなら、1-2 の「1年たったメールを消す」を両方でする。
  サービスを新しく作ると Service ID が変わるので、`assets/js/contact.js` の `serviceId` も直す
- [x] **2026-10-12 記入**：そのサービス名・事業者の国・サーバーの国・公表している安全対策を、`privacy.html` 6. に書きました。
  - Gmail（一般向け）は、Google が規約の上でメールの中身を処理できる（迷惑メールの判定など）ため、個人情報保護委員会 Q&A 7-53 の「クラウド事業者が個人データを取り扱わないこととなっている場合」には当たらないと考え、Firebase・EmailJS と同じく外国にある事業者への委託として扱いました（同委員会「クラウドサービス提供事業者が個人情報保護法上の個人情報取扱事業者に該当する場合の留意点について（注意喚起）」2024-03-25 も参照）
  - サーバーの国は、Google が国を選ばせないため「特定できない」とし、Q&A 10-25 に従って、その理由と、Google が公表しているデータセンターの所在国（11か国）と各国の制度を書きました。データセンターが増えたら書き足す
  - 第28条の同意を取るため、`contact.html` と `hiroba.html`（参加登録）の同意の文に Gmail を書き足しました。それより前に登録した人は Gmail の部分に同意していないので、1-1 で運営者・テスト以外の登録がないかを確かめる
- [ ] 運営者ページのログインはメールのリンクなので、**`ADMIN_EMAILS` のメールボックスを開ける人は運営者になれる** ものとして守る（二段階認証）
- [x] **2026-10-12 決定**：運営者ページのログイン（`ADMIN_EMAILS`）は、いまの私用のアドレスのままにする。利用者には見えず、ログイン用のメールに利用者の情報は入らないためです。
  1-5 のデプロイで `bash setup.sh` を実行するときは、「運営者ページにログインするメールアドレス」の `[ ]` の中に出ているいまのアドレスのまま Enter を押す（Cloud Shell のホームフォルダが消えていて何も出ないときは、私用のアドレスを入れ直す）
- [ ] 私用のアカウントにも **二段階認証** をかけておく（上の「メールボックスを開ける人は運営者になれる」ため。`privacy.html` 7. の「管理画面…を二段階認証で守ります」にも当たります）
- [ ] 🔎 あとで運営者ページのログインも運営専用の Gmail に替えるときは、`bash setup.sh` で新しいアドレスを入れてデプロイし、新しいアドレスで `kanri.html` の「運営者として有効にする」を押す。
  **古いアカウントの運営者の権限は自動では消えません**（`claimAdmin` は権限を付けるだけで、外す処理はない）。Firebase コンソール →「Authentication」→「ユーザー」から古いアカウントを削除する（そのアカウントで基地に参加登録していたなら、先に退会する）
- [ ] GitHub のコミットには、作者のメールアドレスが公開の記録として残ります。このリポジトリのマージのコミットには私用の Gmail アドレスが記録されているので、GitHub の設定 →「Emails」→「Keep my email addresses private」をオンにして、これから先のコミットに出ないようにする（過去のコミットの記録は変わりません）

### 1-5. 利用停止にした人の記録の一部が、消えずに残る（コードの修正が必要）

`adminAct` の利用停止（`ban`）は、`users/{uid}` に1年後の `expireAt` を付けて、TTL（期限が来たら自動で消すしくみ）で消します。
ところが **Firestore の TTL は、サブコレクションを消しません**。そのため次の記録が、1年たっても残り続けます。

- `users/{uid}/private/prefs`（ミュート・ブロックした相手の表示名の一覧）
- `users/{uid}/private/replyLog`（返信の相手と日時）
- その人が送った★（`posts/*/stars/{uid}`）

`privacy.html` 2. の保存期間（「解除するか、退会するまで」「利用停止から1年で自動削除」）と食い違います。

- [x] **2026-10-12 修正**：利用停止の処理で、`private` の下と送った★もその場で消すようにし、テストを足しました。`privacy.html` 2. の保存期間にも「利用停止になるまで」を書き足しました
- [x] **2026-10-17 済み**：Cloud Shell で `bash setup.sh` を実行してデプロイし直す（デプロイするまで、本番は前の動きのままです）

### 1-6. お問い合わせフォームの外部プログラムの版を固定する

`contact.html` は EmailJS を `https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js` から読み込んでいます。
`@4` は「4 系の最新版」を自動で読み込む指定で、jsDelivr 自身も本番では版を固定するよう案内しています。
このフォームは開示請求など個人情報を受け取る窓口なので、知らないうちに中身が変わらないようにします。

- [x] **2026-10-12 修正**：4 系の最新版 `@4.4.1`（いま `@4` で読み込まれているのと同じ版）に固定し、`integrity` 属性（SRI：ファイルが変わっていたら実行しない）と `crossorigin="anonymous"` を付けました
- [ ] 公開後、`contact.html` から1通送って届くことを確かめる（万一ハッシュが合わないと、フォームに「現在フォームから送信できません」と出ます）
- [ ] （推奨）EmailJS の Domains（許可するドメイン）に `chr2808480.github.io` だけを入れる（プランによって使えるか確認）。荒らしが多ければ reCAPTCHA v2 も検討

### 1-7. 🆕 ログインだけして参加登録を済ませていない人のメールアドレスが、期限なく残る

メールのリンクを開いた時点で、Firebase Authentication にアカウント（メールアドレス）ができます。
表示名が重なって登録が止まった人や、別の端末でリンクを開いて途中でやめた人は、参加登録（`users/{uid}`）がないまま、アカウントだけが残ります。
運営者ページ（`kanri.html`）でログイン用リンクを試しただけの人も同じです。

- 基地の画面は、参加登録が済むまで「退会する」を出さないので、本人は消せません（サーバー側の `deleteAccount` は、参加登録がなくても動きます）
- `privacy.html` 2. のメールアドレスの保存期間は「退会後すぐ削除（利用停止の場合は下記）」だけで、この場合が書かれていません
- 個人情報保護法第22条は、使う必要がなくなった個人データを遅滞なく消すよう努めることを求めています
- Firebase には、使われていないアカウントを自動で消すしくみはありません

- [x] **2026-10-12 修正**：次の2つで消せるようにし、テストを足しました
  - 定期処理 `cleanupUnregistered`：毎日4時（日本時間）に、参加登録のないまま最後に使ってから7日たったアカウントを削除する。運営者（権限を持つ人と `ADMIN_EMAILS` のメールアドレス）は消さない。Cloud Scheduler を1件使います（請求先アカウントごとに月3件まで無料）
  - 基地のマイメニュー：ログインしたまま参加登録がまだの人に「登録をやめる」（メールアドレスを削除）を出す
  - `privacy.html` 2. に「ログインしたまま参加登録を済ませなかったときは、最後に使ってから7日で自動削除」と書き足した
- [x] **2026-10-17 済み**：Cloud Shell で `bash setup.sh` を実行してデプロイし直す（1-5 と一緒でよい）。デプロイ後、Google Cloud コンソール →「Cloud Scheduler」に、`cleanupUnregistered` のジョブ（毎日 4:00、Asia/Tokyo）ができていることを確かめる

### 1-8. 🆕 利用停止にした人の投稿が、期限なく残る

利用停止のとき「投稿・返信もすべて削除する」にチェックしないと、その人の投稿・返信は公開されたまま残ります。
本人はログイン情報を消されているので、自分では消せず、退会もできません。
`privacy.html` 2. の投稿・返信の保存期間「自分で削除するか、退会するまで」が、この場合はいつまでも来ないことになります。

- [x] **2026-10-12 修正**：利用停止にすると、投稿・返信を必ず消すようにしました（運営者ページのチェックボックスはなくし、テストを足しました）。
  `privacy.html` 2. の保存期間に「利用停止になるまで」、`terms.html` 第8条と基地のルールに「利用停止になると、投稿・返信もすべて削除する（元に戻せない）」と書き足しました
- [x] **2026-10-17 済み**：Cloud Shell で `bash setup.sh` を実行してデプロイし直す（1-5 と一緒でよい）

### 1-9. 🔎 利用停止の直後に、本人の古いログインで処置の記録を消せる

利用停止（`ban`）はログイン情報を削除しますが、本人の手元のログインの証明（ID トークン）は、期限（最長1時間）が来るまで使えます。
Cloud Functions の呼び出しも Firestore のルールも、トークンが取り消されたかどうかは確かめません（Firebase 公式：ふつうの確認では取り消しを調べない）。
エミュレーターで、利用停止の直後に本人の古いトークンで試したところ、次のようになりました。

- `deleteAccount`（退会）を呼ぶと、**処置の記録（`moderation`）・`users/{uid}`・表示名の予約（`handles`）が消え**、最後にエラーで止まる。
  その後、別のメールアドレスで同じ表示名を登録できた（`bans` のハッシュは残るので、同じメールアドレスでの再登録は止まる）
- `users/{uid}/private/prefs` に書き込めた。利用停止の処理で消したはずの階層がまたでき、TTL ではこの階層は消えない（1-5）

`privacy.html` 2. の「利用停止にしたアカウントの…処置の記録：利用停止から1年」と食い違い、異議や開示請求のときに記録がない、ということになります。

- [x] **2026-10-12 修正**：`deleteAccount` で、`users/{uid}` の `status` が `banned` なら断るようにしました
- [x] **2026-10-12 修正**：`firestore.rules` の `private/prefs` の書き込みに、`users/{uid}` があって `status` が `active` であることを足しました（未登録の人の書き込みも止まる。下の推奨項目）
- [x] テストを足しました。修正前のコードでは落ち、修正後は通ることを確かめました（`npm test` 17件・`npm run test:e2e`）
- [x] **2026-10-17 済み**：Cloud Shell で `bash setup.sh` を実行してデプロイし直す（1-5 と一緒でよい。ルールも一緒にデプロイされます）

### 1-10. 🔎 見えない文字を混ぜると、「運営」や他の人と同じに見える表示名を作れる

`cleanHandle` は「運営・管理人・公式・admin」と「RyuU」を断りますが、幅のない文字（ゼロ幅スペース U+200B、ゼロ幅接合子 U+200D、語結合子 U+2060 など）は通します。
エミュレーターで試すと、「運」と「営」の間にゼロ幅スペースを入れた表示名（画面では「運営」）と、すでにある「しずか」にゼロ幅スペースを混ぜた表示名が、どちらも登録できました。
右から左に並べ替える文字（U+202E）も通ります。利用規約 第7条の「運営者を装って、ログイン用のリンクを聞き出す」を、見た目のうえで止められません。

Unicode の識別子の安全基準（UTS #39）は、こうした「表示されない文字」（Default_Ignorable_Code_Point）を、初めから使えない文字としています。

- [x] **2026-10-12 修正**：`cleanHandle` で、表示されない文字と書式の文字（`\p{Default_Ignorable_Code_Point}` と `\p{Cf}`）を断るようにしました。
  絵文字を使えるよう、絵文字のすぐ後の見た目を選ぶ文字（U+FE0E・U+FE0F）と、絵文字どうしをつなぐ文字（ZWJ）だけは認めます。
  重複の判定（`handleKey`）では、それらを取り除いて比べます（「星⭐️」と「星⭐」は同じ名前）。空白を入れただけの「Ryu U」も断ります。
  基地の参加画面（`hiroba.js`）でも、ログイン用リンクを送る前に同じ判定をします
- [x] テストを足しました（修正前のコードでは落ちることも確かめました）
- [x] **2026-10-17 済み**：Cloud Shell で `bash setup.sh` を実行してデプロイし直す（1-5 と一緒でよい）
- [ ] デプロイ前に登録された表示名に、こうした文字が入っていないか確かめる（いまは登録が少ないので、Firebase コンソールで `handles` を見れば足ります）。
  絵文字の U+FE0F を含む表示名が前からあれば、重複の判定の形が変わったので、退会のときに表示名の予約が残ることがあります（そのときはコンソールで `handles` の該当する文書を消す）

### 1-11. 🚀 2026-10-17 の関数の変更をデプロイする

- [ ] main にマージしたあと、Cloud Shell で `firebase/README.md`「途中で止まったとき」の2つめの1行（GitHub の最新に合わせてから `bash setup.sh`）を実行する。運営者のメールアドレスは私用のまま Enter。Firestore のルールと索引は変えていません
- [ ] デプロイが済んだら、運営者のメールアドレスで `kanri.html` にログインした同じブラウザで `hiroba.html` を開き、表示名を決めて参加登録する（運営者のメールアドレスだけは、受付開始より前でも登録できる）。表示名に「運営」は使えません。その表示名を、当日のお知らせ欄で伝える
- [ ] 運営者のアカウントで試しに投稿し、「運営」の印が付くことと、リンクを入れてもすぐ公開されることを確かめてから、その投稿を消す（「運営者不在」がオンのままだと投稿できないので、試す間だけオフにする）
- [ ] 10/23 6:00 より前なら、運営者でないテスト用のアドレスで `hiroba.html` を開き、「参加登録は 10月23日（金）6:00 から受け付けます」が出ることを確かめる（6:00 を過ぎたら「基地に参加する」が出る）
- 参加登録の受付開始を変えるときは、2か所を同じ日時にする：`firebase/functions/index.js` の `OPEN_AT`（変えたらデプロイ）、`assets/js/hiroba.js` の `CONFIG.openAt`。`terms.html`・`privacy.html` の制定日・附則も直す（`index.html` の受付前の告知は、受付開始の後に外しました）
- 正式オープン（11/14）の告知の切り替えは `assets/js/main.js` の `LAUNCH_AT` だけ（関数とは関係がない）

### 🔎 推奨：参加登録していない人が、設定の文書に何でも書き込める

`firestore.rules` の `users/{uid}/private/prefs` は「本人なら書ける」だけで、参加登録が済んでいるかと、一覧の中身を確かめていません。
README の手順4で「メール / パスワード」もオンにしているため、メールアドレスを確かめないアカウントを API から作ることもできます。
そうしたアカウントでも、最大で約1MB の文書を書けます（エミュレーターで 1万文字の書き込みが通りました）。
`cleanupUnregistered` はログイン情報だけを消すので、この文書は残り続けます。

- [x] **2026-10-12 修正**：1-9 のルールの修正（`users/{uid}` があり `status` が `active`）で、参加登録していない人は書けなくなりました（テストあり。デプロイは 1-5 と一緒）
- [ ] （任意）一覧の各項目の中身までは、Firestore のルールでは1件ずつ確かめられません。参加登録した人が自分の文書に大きなデータを書くことはまだできるので、気になるなら、書き込みを Cloud Functions に移す

---

## 2. 必須：Firebase・Google Cloud・GitHub・EmailJS の設定を確かめる

- [ ] **予算アラート** が設定されていて、通知メールが届く。予算アラートはメールを送るだけで、**課金は止まりません**
- [ ] （推奨）Cloud Functions に **spend cap（使いすぎの上限）** を設定する。2026年9月に始まった機能で、上限に達するとその月は関数が止まります。
  プレビュー版で、使用量の反映に遅れがあるため、上限を少し超えてから止まります。**Firestore は対象外** なので、予算アラートと読み込み件数の制限（ルールの `small()`）で守ります。
  🆕 上限と比べる金額は、割引やクレジットを差し引く前の金額です（Firebase 公式）。低すぎる値にすると、ふだんの利用でも関数（＝投稿・登録）が止まるおそれがあるので、設定したら数日は使用量を見て確かめる。止まったときは Cloud コンソールで上限を上げ、再開まで最大1時間ほどかかります
- [ ] プロジェクトの設定 →「全般」→ **公開名** を「ryuu星軍 本部」などにする。ログイン用メールに出る名前です（プロジェクトID は `spporting-ryuu-movie` で、つづりが利用者にはなじみません）
- [ ] Authentication →「テンプレート」で、差出人名と返信先を確かめる
- [ ] Authentication → 承認済みドメインに `chr2808480.github.io` がある。
  🆕 `localhost` があれば外す（他人が自分のパソコンから本番のプロジェクトにつなぐのを防ぐ。2025年4月28日より後に作ったプロジェクトには、初めから入っていません）。
  `（プロジェクトID）.firebaseapp.com` と `.web.app` は Firebase が使うので、外さない
- [ ] Firestore の TTL（`ipLogs`・`reports`・`bans`・`moderation`・`users`・`handles` の `expireAt`）が **有効（Serving）** になっている。
  期限が過ぎてから実際に消えるまでは、通常24時間以内のずれがあります
- [ ] IAM（プロジェクトのメンバー）に、運営者以外がいない
- [ ] 合言葉（`HIROBA_SECRET`）をパスワード管理アプリに控えてある。
  テスト投稿の `ipLogs` を `scripts/decrypt-ip.mjs` で一度読んでみる（IP が記録できていることと、控えた合言葉が正しいことの両方を確かめられます）
- [ ] 🆕（推奨）Artifact Registry（デプロイのたびに作られる部品の置き場所）に、古い部品を自動で消す設定（クリーンアップポリシー）があるか確かめる。
  なければ Cloud Shell の `firebase` フォルダで `npx firebase functions:artifacts:setpolicy --project spporting-ryuu-movie` を実行する（初期値は1日より古いものを削除。Firebase CLI 14 以降）。README の「部品の保存で数円」の請求を抑えられます

### 🆕 GitHub（サイトの配信元）

`main` に書き込める人は、公開中のページ（接続先の `hiroba-config.js` や、お問い合わせの送り先の `contact.js` を含む）を書き換えられます。

- [ ] リポジトリの Settings →「Collaborators」に、運営者以外がいない
- [ ] （推奨）Settings →「Branches」で `main` にルール（ブランチ保護）を付け、プルリクエストを通さない直接の書き込みを止める
- [ ] Settings →「Pages」で、配信元が `main` の `/ (root)` になっている

### 🆕 EmailJS（お問い合わせフォーム）

- [ ] プランの1か月の送信数の上限と、いまの使用量を確かめる（第三者のまとめでは、無料プランは月200通。EmailJS の料金ページで確かめる）。
  上限に達するとフォームから送れなくなり、開示などの請求の窓口（`privacy.html` 9.）も止まります
- [ ] フォームが使えないときの予備の窓口を決める。README は GitHub の Issue を案内していますが、**Issue は誰でも読める** ので、個人情報を含む請求には使わないよう案内する

---

## 3. 必須：本番での動作確認（テスト用のメールアドレスで）

`firebase/README.md` の手順10に、次を足して確かめます。

- [ ] 参加登録 → 投稿 → ★ → 返信 → 通報 → 退会
- [ ] リンクを含む投稿が「確認待ち」に入り、`kanri.html` で公開できる
- [ ] 処置をひととおり：注意・非表示・公開に戻す・投稿停止・停止の解除・利用停止。
  「通知メールを作る」の文面（どのルールか・期間・異議の出し方・期限）を読む
- [ ] 🆕 「通知メールを作る」で開いたメールに、本文が **最後（異議の申立て方と署名）まで** 入っているかを、実際に使う端末のメールアプリで確かめる。理由の欄に長め（300字ほど）の文を入れても試す。
  通知はメールアプリを開くリンク（`mailto:`）で作るので、日本語は1文字が9文字分に変わります。計算すると、理由が空でも約2,200文字、対象の投稿200字と理由100字で約4,800文字、理由1,000字なら約13,000文字です。
  長いリンクをどこまで受け取れるかはメールアプリやブラウザによって違い、途中で切れることがあります。異議の申立て方は本文の最後にあるので、切れると利用規約第8条の通知になりません。
  **2026-10-12 修正**：運営者ページの「通知メールを作る」の下に、宛先・件名・本文を表示し、それぞれコピーできるボタンを付けました。切れていたら、コピーして貼り付けて送ります
- [ ] 利用停止にしたメールアドレスで、もう一度登録できない
- [ ] ログイン用メールが届くか：Gmail・iCloud・Yahoo!メール・キャリアメール（docomo / au / SoftBank）。
  迷惑メールに入る・受信拒否されるときは、基地の参加画面に「届かないとき」の案内を足す（独自ドメインから送る設定もあります）
- [ ] リンクを別の端末・別のブラウザで開く（メールアドレスの入力を求められる流れ）。iPhone の Safari、Android の Chrome、メールアプリの中のブラウザ
- [ ] 🆕 ログインしたまま参加登録をせず、マイメニューの「登録をやめる」を押すと、Firebase コンソールの「Authentication」→「ユーザー」からそのアカウントが消える
- [ ] 🆕 利用停止にした人の投稿・返信が、基地から消えている
- [ ] お問い合わせフォームから送って、届くこと・返信できること
- [ ] 終わったら、テスト用のアカウントを退会し、テスト投稿を消す（`ipLogs` は90日で自動で消えます）

---

## 4. 推奨：法令まわり

### 個人情報保護法

2017年の改正で「5,000人分以上」という件数の条件がなくなり、少ない人数でも個人情報のデータベースを使う人は「個人情報取扱事業者」になります。
`privacy.html` はこれを前提に書かれています。

- [ ] `privacy.html` 1. は、運営者の氏名・住所を「求めがあったら遅滞なく知らせる」としています（法第32条第1項の「本人の求めに応じて遅滞なく回答する場合を含む」による）。
  **求められたら本名と住所を伝えることになる** ので、受け入れられるか確かめる
- [ ] 漏えいなどが起きたときの流れを確かめる。報告が必要なのは、不正アクセスなど故意によるもの、1,000人を超えるものなどです。
  速報は気づいてから **おおむね3〜5日以内**、確報は **30日以内**（不正アクセスなど故意のものは **60日以内**）。報告は個人情報保護委員会のホームページのフォームから
- [ ] 🆕 2024年4月1日から、入力フォームに不正なプログラムを仕込んで入力内容を盗む「Webスキミング」のように、**これから取得しようとしている個人情報** の漏えいも、報告と本人への通知の対象になりました（施行規則第7条第3号の改正）。
  お問い合わせフォームは外部（jsDelivr）のプログラムを読み込むので、1-6 の版の固定と `integrity` を外さない。フォームを直すときも、外部のプログラムを増やさない
- [ ] Firebase Authentication は、ログインの IP アドレスを数週間記録します（Firebase 公式）。`privacy.html` 2. の表に載っていないので、足すか検討する。
  なお「削除してから最長180日でバックアップからも消える」という記載は、Firebase の公表と一致しています

### 情報流通プラットフォーム対処法（旧プロバイダ責任制限法。2025年4月1日施行）

削除の申出に7日以内に判断する、といった新しい義務は大規模な事業者向けで、この基地は当たりません。

- [ ] 権利侵害の申出を受けて投稿を消すとき、投稿した人に照会して **7日以内に反論がなければ**、投稿した人に対する責任を免れます（第3条第2項第2号）。
  `terms.html` 第8条第3項の「意見をお聞きします」に使うメールの型を用意しておく
- [ ] 開示請求や裁判所の命令が来たときの相談先（弁護士など）を決めておく

### 🆕 青少年インターネット環境整備法

誰でも見られるページを置くサーバーを、他人の求めに応じて使わせる人は「特定サーバー管理者」に当たり（第2条第11項）、基地の運営者もこれに当たると考えられます。
次の2つは **努力義務**（罰則はありません）です。

- [ ] 青少年に有害な情報が投稿されたと **知ったとき** は、青少年が見られないようにする措置をとる（第21条）。基地では「非表示」で対応できます。いつも見回る義務ではありません
- [ ] そうした情報についての連絡を受け付ける窓口を整える（第22条）。お問い合わせフォームの種類「星軍基地の投稿の削除依頼・処置への異議」で受けると決めておく

### 電気通信事業法

総務省のマニュアルでは、利益を得る目的などで反復継続して行う場合に「事業」と判断されます。
非営利の個人運営なら届出などが必要になる可能性は低いと考えられますが、**広告や投げ銭など収益化をするなら確かめ直す** こと。迷ったら、地域の総合通信局に問い合わせます。

---

## 5. 推奨：ファンサイトとして

- [ ] RyuU さんの X の固定ポストなどで、ファンアート・二次創作・切り抜き・ファンの集まりについてのガイドラインを確かめる（`research.md` の未確認項目）
- [ ] Twitch のチャンネル名（`research.md` で ⚠️）を本人の導線で確かめる
- [x] できれば RyuU さんに「非公式の交流スペースを開きます。問題があれば止めます」と一報する（`operations.md` 1.）。**2026-10-17 までに**、運営者がマシュマロで一報を送りました。マシュマロ返信の配信で読まれたら、その内容（止めてほしい・ガイドラインなど）に従う
- [ ] `research.md` の最終調査日を更新する
- [ ] 🔎 `index.html` の紹介文のうち「JO☆GAMERS という声真似配信者グループ」「中華ゲームや単発ゲーム」「RyuU（りゅう）」の読み、プレイリスト名『ゲーム実況動画ァ！』は、`research.md` に情報源の記録がありません。本人の導線で確かめて、`research.md` に情報源を足す
- [ ] 🔎 Twitch（`game_ryuu`）は、トップとフッターで公式リンクとして案内しています。2026-10-12 の Web 検索でも本人のものと確かめられませんでした。確かめられるまでは、リンクを外すか「未確認」と添える

---

## 6. 推奨：運営の体制

- [ ] **通報の確認のしかたを決める**。新しい通報が来ても運営者に知らせるしくみはないので、`kanri.html` を見る頻度（例：投稿を受け付けている時間に1日1回）を決める。見られない日は「運営者不在」をオンにする
- [x] 🆕 **通報が「対応済みにする」を押すまで消えなかった**：**2026-10-12 修正**：通報した日から180日で自動で消える印を付けるようにしました（対応済みにすると、その日から90日に置き換わります）。`privacy.html` 2. にも書き足しました
- [ ] 処置をしなかった通報も、確かめたら「対応済みにする」を押す（押せば90日で消えます）
- [ ] デプロイより前に届いていた通報には、消える印が付いていません。デプロイ後、`kanri.html` の「未対応の通報」をすべて確かめて「対応済みにする」を押す
- [ ] 個人情報の晒しなどは「段階を飛ばして、すぐに」対応すると規約に書いてあります（第8条第2項）。その速さで対応できるか
- [ ] 運営者が2人以上なら、`ADMIN_EMAILS` への追加と、情報の扱いのルールの共有（`privacy.html` 7. 人的な対策）
- [ ] Firestore のバックアップは設定していません。データが消えたら戻せないことを受け入れるか、バックアップを取るかを決める。取るなら、退会した人の情報がバックアップに残る期間をポリシーに書く
- [ ] 開示請求の手順（`firebase/README.md`「日々の運営」）を読み、合言葉の保管場所を確かめる
- [ ] 🆕 Cloud Shell は、120日開かないとホームフォルダ（`~/supporting_ryuu_movie` ごと）が消えます（事前にメールで知らせが来ます）。
  消えるのは Cloud Shell の中のコピーと運営者のメールアドレスの控え（`functions/.env.spporting-ryuu-movie`）だけで、合言葉は Secret Manager に、本番の設定は Firebase に残ります。
  次にデプロイするときは README 手順7の最初の1行からやり直し、運営者のメールアドレスを入れ直す（入れ忘れると `kanri.html` にログインできなくなります）

---

## 7. 任意：公開後でもよい強化

- [ ] **App Check**（reCAPTCHA Enterprise）で、このサイト以外からの Firestore・Cloud Functions の呼び出しを断る。
  `firebase/web/entry.js` と `assets/js/hiroba-firebase.js` の変更が必要。まず指標を見て、正しい利用者が弾かれないのを確かめてから強制をオンにする
- [ ] ブラウザ用の API キーに、使う API とリファラー（`chr2808480.github.io`）の制限をかける。
  Authentication の API を許可から外すとログインが壊れるので、変更後に必ずログインを試す
- [ ] 新しい通報を運営者にメールで知らせるしくみ
- [ ] 🆕 ページに `Content-Security-Policy`（読み込んでよい場所の制限）を書き、万一の書き換えや外部プログラムの混入に備える。GitHub Pages ではレスポンスヘッダーを自由に設定できないので、`<meta http-equiv>` で書く（一部の機能は使えません）。書いたら、基地・運営者ページ・お問い合わせフォームが動くか必ず確かめる
- [x] **2026-10-12 修正**：`README.md`・`operations.md` の `docs/operations.md`・`docs/research.md` を、リポジトリ直下のファイルへのリンクに直しました

### 🆕 公開後の定期点検

- [ ] **2027年4月30日までに**、Cloud Functions の実行環境を Node.js 22 から Node.js 24 に上げる。
  Node.js 22 は 2027-04-30 に非推奨、2027-10-31 に廃止の予定です（廃止後は関数を更新できなくなり、止められることもある）。Google は非推奨の90日前から知らせを送ります。
  `firebase/firebase.json` の `runtime` と `firebase/functions/package.json` の `engines` を直し、`npm test` を通してから `bash setup.sh` でデプロイし直す
- [ ] 数か月に一度、部品（`firebase-functions`・`firebase-admin`・ブラウザ用の `firebase`・`firebase-tools`）を更新し、`npm audit` とテストを実行する。ブラウザ用の `firebase` を上げたら `npm run build:web` で `assets/js/vendor/firebase-hiroba.js` を作り直す
- [ ] `research.md` の最終調査日が古くなっていないか（公式アカウントの情報は変わります）

---

## 8. 参加登録の受付開始の日（2026-10-23 金）の作業

1. 1-1〜1-11 の修正が main に入り、デプロイ済みであることを確かめる（1-11 は 6:00 より前に）。前の日までに、Firebase コンソールの「Authentication」と Firestore の `users` を見て、運営者・テスト以外の登録がないか確かめる（1-1）
2. 🚀 `index.html` の告知と基地の紹介、基地の参加の案内は、6:00 に自動で切り替わる（書き換えはいらない）。6:00 を過ぎたら、トップを開き直して「先行オープン中」になったことだけ確かめる
3. `hiroba.html` の `noindex` を外すか決める（いまのコメントでは、企画書 第2章に沿って「検索エンジンに載せない・sitemap.xml にも入れない」方針です）。外すなら `sitemap.xml` に `hiroba.html` などを足す
4. シークレットウィンドウで トップ → 基地 → 参加登録 まで開いて確かめる
5. `kanri.html` のお知らせ欄の「試験運用中」の文を消し、受付開始のお知らせに替える。「運営者不在」をオフにする（オンのままだと、登録した人が投稿・返信できない）。運営者の表示名も書く（例：「運営者の表示名は〇〇です。運営の投稿には『運営』の印が付きます」）
6. 🚀 運営者のアカウントで、最初の投稿を3つする（`launch-plan.md` 3.）
7. この日から、`kanri.html`（通報・確認待ち）を毎日見る（6.）。見られない日は「運営者不在」をオンにする

## 8b. 正式オープンの日（2026-11-14 土・活動3周年）の作業

1. 🚀 `index.html` の告知は、6:00 に「本日、正式オープン」、翌日0:00 に消える形へ自動で切り替わる
2. `kanri.html` のお知らせ欄を、正式オープン・3周年のお知らせに替える
3. 運営者のアカウントで、3周年のお祝いを「それぞれ新しい投稿で」と呼びかける投稿をする（`launch-plan.md` 3. 当日）

---

## 情報源

### Firebase・Google Cloud（公式）

- [Authenticate with Firebase Using Email Link in JavaScript](https://firebase.google.com/docs/auth/web/email-link-auth)（メールのリンクでログインすると、確認していないパスワードが消される）
- [Control Access with Custom Claims and Security Rules](https://firebase.google.com/docs/auth/admin/custom-claims)（運営者の権限〔custom claims〕は、次に ID トークンが発行されたときに反映される）
- [Firebase Authentication Limits](https://firebase.google.com/docs/auth/limits)（ログイン用メールの上限）
- [Manage data retention with TTL policies](https://firebase.google.com/docs/firestore/ttl)（通常24時間以内に削除、サブコレクションは消えない）
- [Set up budget alerts for Firebase services](https://firebase.google.com/docs/projects/billing/budget-alerts)
- [Set up spend caps for Firebase services](https://firebase.google.com/docs/projects/billing/spend-caps) ／ [Introducing Firebase spend caps（Firebase Blog, 2026-09）](https://firebase.blog/posts/2026/09/firebase-spend-caps/)
- [Privacy and Security in Firebase](https://firebase.google.com/support/privacy)（Authentication の IP 記録は数週間、削除後180日以内にバックアップからも削除）
- [Customize Firebase Authentication emails（Firebase ヘルプ）](https://support.google.com/firebase/answer/7000714) ／ [Use a custom domain for auth emails](https://firebase.google.com/docs/auth/email-custom-domain)
- [Learn about using and managing API keys for Firebase](https://firebase.google.com/docs/projects/api-keys) ／ [Authentication FAQ and troubleshooting](https://firebase.google.com/docs/auth/faq-and-troubleshooting)
- [Firebase App Check](https://firebase.google.com/docs/app-check) ／ [reCAPTCHA Enterprise provider（Web）](https://firebase.google.com/docs/app-check/web/recaptcha-enterprise-provider)
- [Cloud Logging: Store log entries](https://docs.cloud.google.com/logging/docs/store-log-entries) ／ [Configure log buckets](https://docs.cloud.google.com/logging/docs/buckets)（`_Default` は初期値30日・変更可、`_Required` は400日固定）
- 🆕 [Firebase FAQ](https://firebase.google.com/support/faq)（spend cap は割引・クレジットを差し引く前の金額で数える。上限を上げてから再開まで最大1時間）
- 🆕 [Firebase launch checklist](https://firebase.google.com/support/guides/launch-checklist)（予算アラートは上限ではない、App Check の強制）
- 🆕 [Authentication FAQ and troubleshooting](https://firebase.google.com/docs/auth/faq-and-troubleshooting) ／ [Email Link in JavaScript](https://firebase.google.com/docs/auth/web/email-link-auth)（本番では localhost を承認済みドメインから外す。2025-04-28 より後に作ったプロジェクトには初めから入っていない）
- 🆕 [Manage users（Admin SDK）](https://firebase.google.com/docs/auth/admin/manage-users)（アカウントの一覧・削除。自動で消すしくみはない）
- 🆕 [Manage functions](https://firebase.google.com/docs/functions/manage-functions)（`functions:artifacts:setpolicy`。初期値は1日より古い部品を削除、Firebase CLI 14 以降）
- 🆕 [Cloud Run functions runtimes](https://docs.cloud.google.com/run/docs/runtimes/function-runtimes) ／ [Cloud Run runtime lifecycle](https://docs.cloud.google.com/run/docs/runtime-support)（`nodejs22`：2027-04-30 非推奨、2027-10-31 廃止。90日前から通知）
- 🆕 [Cloud Shell: Quotas and limits](https://docs.cloud.google.com/shell/docs/quotas-limits)（120日開かないとホームフォルダが削除される）
- 🔎 [Verify ID Tokens](https://firebase.google.com/docs/auth/admin/verify-id-tokens) ／ [Manage User Sessions](https://firebase.google.com/docs/auth/admin/manage-sessions)（ふつうの ID トークンの確認では、取り消しを調べない。ルールで止めるには自分で記録して比べる）
- 🆕 [Schedule functions](https://firebase.google.com/docs/functions/schedule-functions) ／ [Cloud Scheduler pricing](https://cloud.google.com/scheduler/pricing)（定期処理は Cloud Scheduler のジョブを使う。請求先アカウントごとに月3件まで無料、その後は1件あたり月0.10ドル）

### Gmail（Google 公式。1-4・`privacy.html` 6.）

- [Google プライバシー ポリシー](https://policies.google.com/privacy?hl=ja)（世界各地のサーバーで処理することがある。伝送中の暗号化、担当者を限り守秘義務を課す）
- [Google「Data Center Locations」](https://datacenters.google/locations/)（データセンターの所在国。2026-10 時点で稼働中は11か国）
- [Google セーフティ センター「Gmail」](https://safety.google/intl/ja_ALL/products/gmail/)（保存中もデータセンター間の送信中も暗号化）
- [Gmail ヘルプ「Gmail でメールが暗号化される仕組み」](https://support.google.com/mail/answer/6330403?hl=ja)（ほかのメールサービスとは、相手が対応していれば TLS）
- [Gmail API: Manage labels](https://developers.google.com/workspace/gmail/api/guides/labels)（`messages.send` で送ったメールには SENT〔送信済み〕が自動で付く）

### EmailJS・配信（公式）

- [EmailJS Pricing](https://www.emailjs.com/pricing/)（履歴は初期設定で保存、テンプレートの設定で止められる。🆕 プランごとの1か月の送信数）
- [EmailJS Privacy Policy](https://www.emailjs.com/legal/privacy-policy/)
- [EmailJS: /send API](https://www.emailjs.com/docs/rest-api/send/)（送るのに要るのは service_id・template_id・Public Key〔user_id〕で、どれもページに出る値）
- [Google アカウント ヘルプ「Google アカウントとサードパーティの接続を管理する」](https://support.google.com/accounts/answer/13533235?hl=ja)（「アクセス権を削除」）
- [EmailJS: Creating email templates](https://www.emailjs.com/docs/user-guide/creating-email-templates/)（To Email・From Email・Reply To。From は「既定のアドレス」にすると、つないだサービスのアドレスになる）／ [Connecting email services](https://www.emailjs.com/docs/user-guide/connecting-email-services/)
- [EmailJS: Multi-Factor Authentication](https://www.emailjs.com/docs/user-guide/multi-factor-authentication/)
- [EmailJS: Can I add my domain to the allowlist?](https://www.emailjs.com/docs/faq/can-i-add-my-domain-to-allowlist/) ／ [Adding CAPTCHA verification](https://www.emailjs.com/docs/user-guide/adding-captcha-verification/)
- [GitHub Docs: Setting your commit email address](https://docs.github.com/en/account-and-profile/how-tos/email-preferences/setting-your-commit-email-address)（「Keep my email addresses private」でウェブ上の操作のコミットに noreply アドレスを使う）
- [jsDelivr（GitHub）](https://github.com/jsdelivr/jsdelivr)（版を固定しない読み込みは本番では非推奨）
- [MDN: integrity 属性](https://developer.mozilla.org/ja/docs/Web/HTML/Reference/Attributes/integrity) ／ [Mozilla Hacks: Subresource Integrity](https://hacks.mozilla.org/2015/09/subresource-integrity-in-firefox-43/)
- 🆕 [MDN: Content Security Policy (CSP)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP) ／ [MDN: `<meta http-equiv>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/meta/http-equiv)（ヘッダーを使えないときは `<meta>` で書ける。一部の機能は使えない）

### 法令（公的機関）

- [個人情報の保護に関する法律（e-Gov 法令検索）](https://laws.e-gov.go.jp/law/415AC0000000057)
- [個人情報保護委員会：ガイドライン（通則編）](https://www.ppc.go.jp/personalinfo/legal/guidelines_tsusoku/)
- [個人情報保護委員会：漏えい等の対応とお役立ち資料](https://www.ppc.go.jp/personalinfo/legal/leakAction/)
- [個人情報保護委員会 Q&A 7-53](https://www.ppc.go.jp/all_faq_index/faq1-q7-53/)（クラウド事業者が個人データを「取り扱わないこととなっている」なら提供・委託に当たらない。契約とアクセス制御で判断）／ [クラウドサービス提供事業者が個人情報取扱事業者に該当する場合の留意点（注意喚起、2024-03-25）](https://www.ppc.go.jp/files/pdf/240325_alert_cloud_service_provider.pdf)
- [個人情報保護委員会 Q&A 10-25](https://www.ppc.go.jp/all_faq_index/faq1-q10-25/)（外国のクラウドを使うときの外的環境の把握。サーバーの国を特定できないときは、その旨・理由・候補の国などを示す）
- [平成31年個人情報保護委員会告示第1号](https://www.ppc.go.jp/files/pdf/190123_h31iinkaikokuji01.pdf)（EU・EEA を日本と同等の水準の国として指定）／ [外国制度（台湾）](https://www.ppc.go.jp/enforcement/infoprovision/laws/offshore_report_taiwan/)
- [チリ国会図書館：Ley 21.719](https://www.bcn.cl/leychile/navegar?idNorma=1209272)（2024-12-13 公布。法律第19.628号を改め、個人データ保護庁を置く）
- 🆕 [個人情報保護委員会：令和5年度年次報告の概要](https://www.ppc.go.jp/files/pdf/060611_annual_report_gaiyou.pdf) ／ [令和5年度 年次報告](https://www.ppc.go.jp/aboutus/report/annual_report_2023/)（Webスキミングを漏えい等報告・本人通知の対象にするため、施行規則を改正〔令和5年12月公布、令和6年4月1日施行〕）
- 🆕 [青少年が安全に安心してインターネットを利用できる環境の整備等に関する法律（e-Gov 法令検索）](https://laws.e-gov.go.jp/law/420AC1000000079)（第2条第11項 特定サーバー管理者、第21条・第22条 努力義務）
- [総務省：プロバイダ責任制限法の免責要件（照会して7日以内に反論がない場合）](https://www.soumu.go.jp/main_content/001012037.pdf)
- [京都府：情報流通プラットフォーム対処法の概要](https://www.pref.kyoto.jp/koho/dayori/202605/jinken.html)
- [総務省：電気通信事業参入マニュアル［追補版］（令和5年1月30日改定）](https://www.soumu.go.jp/main_content/000477428.pdf)

### Unicode（表示名）

- 🔎 [UTS #39: Unicode Security Mechanisms](https://www.unicode.org/reports/tr39/)（識別子の一般的な安全基準では、Default_Ignorable_Code_Point を使えない文字とする）
- 🔎 [UAX #31: Unicode Identifiers and Syntax](https://unicode.org/reports/tr31/)（表示されない文字を使うと、見た目が同じで中身の違う文字列を作れる）

### 論文

- Avinash Sudhodanan, Andrew Paverd. [Pre-hijacked accounts: An Empirical Study of Security Failures in User Account Creation on the Web](https://www.usenix.org/conference/usenixsecurity22/presentation/sudhodanan). USENIX Security 2022.（[arXiv:2205.10174](https://arxiv.org/abs/2205.10174)）
