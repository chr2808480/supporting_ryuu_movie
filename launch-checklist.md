# 正式運用前の確認リスト（星軍基地・お問い合わせフォーム）

作成日：**2026-10-12**（main の `3cc86ba` 時点のファイルを読んで作成）

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

---

## 0. いまの状態（2026-10-12 に確かめたこと）

- **テストはすべて合格**：エミュレーターでのルール・関数のテスト 15件（`npm test`）と、画面を通した確認（`npm run test:e2e`）。
- **基地はすでに本番の Firebase につながっている**：`assets/js/hiroba-config.js` に接続先が入っています。main を GitHub Pages で配信していれば、`hiroba.html` で本当に登録・投稿ができる状態です（この作業環境からは公開中のページを開けなかったので、ブラウザで確かめてください）。
- **メールのリンクでのログインは、先回りの乗っ取りに強い**：他人が同じメールアドレスで、確認していないパスワードのアカウントを先に作っていても、メールのリンクでログインした時点でそのパスワードは消されます（Firebase 公式）。この攻撃（account pre-hijacking）は、人気サービス 75 のうち少なくとも 35 で見つかったと報告されていますが（Sudhodanan & Paverd, USENIX Security 2022）、この基地は Firebase のこのしくみで防げています。
- **ログイン用メールの上限**：Blaze プランでは 1日 25,000 通まで（Spark は 5 通）。基地の規模なら足ります。

テストで確かめられないもの（コンソールの設定、メールの届き方、規約の中身、運営体制）が、以下のリストの中心です。

---

## 1. 必須：公開前に直すこと

### 1-1. 「デモ」の案内と、実際の動きがずれている

- [ ] `index.html` の基地の紹介（`#hiroba`）には「いまはデモ版です。投稿はどこにも送信されません。」とあります。ところが `hiroba.html` は本番につながっていて、デモの表示は自動で隠れます。
  このままだと、案内を信じた人が「案」の規約に同意して、本当に登録・投稿できてしまいます。次のどちらかにしてください。
  - (a) 公開日まで `hiroba-config.js` を `null` に戻しておく
  - (b) 公開する日に、紹介文を本番用に直す（「8. 公開当日の作業」）

### 1-2. 規約・ポリシーの「要記入」と「案」を片づける

| ファイル | 箇所 | いまの記載 |
| --- | --- | --- |
| `privacy.html` | 制定日 | 要記入：公開日 |
| `privacy.html` | 2. お問い合わせフォームの内容の保存期間 | 要記入：1年 |
| `privacy.html` | 6. 運営者のメールの送受信（サービス名・国） | 要記入 |
| `privacy.html` | 6. 運営者のメールサービスがとっている対策 | 要記入 |
| `privacy.html` | 6. EmailJS に履歴を残さない設定 | 要確認 |
| `privacy.html` | 9. 請求に答えるまでの目安 | 要記入：14日 |
| `terms.html` | 制定日、附則の適用日 | 要記入：公開日 |
| `terms.html` | 第8条 異議の申立ての期限 | 要記入：14日 |
| `terms.html` | 第12条 基地を終えるときの予告 | 要記入：30日 |

- [ ] 上の表をすべて埋める
- [ ] 異議の期限を 14日以外にするときは、`assets/js/kanri.js` の通知メールの文（「14日以内」と直接書いてある）も同じ日数に直す
- [ ] 「案」の囲みと、`<title>`・フッターの「（案）」を外す（`hiroba.html`・`terms.html`・`privacy.html`）
- [ ] `firebase/functions/index.js` の `TERMS_VERSION`（いまは `"2026-10-案"`）を確定版の名前（例：制定日）に変えて、デプロイし直す。
  同意の記録に残る値なので、すでに「案」のまま登録した人がいれば、扱い（もう一度同意してもらうなど）を決める

### 1-3. ポリシーに「しています」と書いたことを、本当にしておく

`privacy.html` は「〜しています」と書いているので、公開した時点で利用者への約束になります。事実と違うと、誤った説明をしたことになります。

- [ ] Google アカウント（Firebase の持ち主）・GitHub・EmailJS・運営者のメールに **二段階認証** をかける（7. 技術的な対策）。EmailJS にも多要素認証があります
- [ ] 管理に使うスマホ・パソコンに **画面ロック** をかけ、**なくしたときに遠隔でロック・消去** できるようにする（7. 物理的な対策。iPhone なら「探す」、Android なら「デバイスを探す」）
- [ ] EmailJS のテンプレートの設定で、**送信の履歴を残さない** ようにする（6.）。EmailJS は、初期設定では履歴と入力内容を保存し、テンプレートの設定から止められます
- [ ] Firebase に **Google アナリティクスをつないでいない** ことを確かめる（2.「アクセス解析・広告のタグは使いません」）
- [ ] Cloud Logging の `_Default` バケットの保存期間を **30日のまま** にしておく（2.「30日で自動削除」）。30日は初期値で、変更もできてしまうため

### 1-4. 運営者用のメールアドレスを用意する

`kanri.html` の「通知メールを作る」は、運営者のメールアプリから、処置を受けた人へ直接送るしくみです。
私用のアドレスで送ると、そのアドレスと差出人名が相手に伝わります。

- [ ] 基地の運営専用のアドレスを作り、二段階認証をかける
- [ ] そのサービス名・事業者の国・サーバーの国・公表している安全対策を、`privacy.html` 6. の「要記入」に書く（外国の事業者なら、個人情報保護法第28条の情報提供に当たります）
- [ ] 運営者ページのログインもメールのリンクなので、**このメールボックスを開ける人は運営者になれる** ものとして守る

### 1-5. 利用停止にした人の記録の一部が、消えずに残る（コードの修正が必要）

`adminAct` の利用停止（`ban`）は、`users/{uid}` に1年後の `expireAt` を付けて、TTL（期限が来たら自動で消すしくみ）で消します。
ところが **Firestore の TTL は、サブコレクションを消しません**。そのため次の記録が、1年たっても残り続けます。

- `users/{uid}/private/prefs`（ミュート・ブロックした相手の表示名の一覧）
- `users/{uid}/private/replyLog`（返信の相手と日時）
- その人が送った★（`posts/*/stars/{uid}`）

`privacy.html` 2. の保存期間（「解除するか、退会するまで」「利用停止から1年で自動削除」）と食い違います。

- [ ] 利用停止の処理で、これらも消す（または `expireAt` を付けて TTL の対象にする）ように直し、テストを足す

### 1-6. お問い合わせフォームの外部プログラムの版を固定する

`contact.html` は EmailJS を `https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js` から読み込んでいます。
`@4` は「4 系の最新版」を自動で読み込む指定で、jsDelivr 自身も本番では版を固定するよう案内しています。
このフォームは開示請求など個人情報を受け取る窓口なので、知らないうちに中身が変わらないようにします。

- [ ] 正確な版（`@4.x.y`）に固定し、`integrity` 属性（SRI：ファイルが改ざんされていたら実行しない）と `crossorigin="anonymous"` を付ける
- [ ] （推奨）EmailJS の Domains（許可するドメイン）に `chr2808480.github.io` だけを入れる（プランによって使えるか確認）。荒らしが多ければ reCAPTCHA v2 も検討

---

## 2. 必須：Firebase・Google Cloud のコンソールで確かめる

- [ ] **予算アラート** が設定されていて、通知メールが届く。予算アラートはメールを送るだけで、**課金は止まりません**
- [ ] （推奨）Cloud Functions に **spend cap（使いすぎの上限）** を設定する。2026年9月に始まった機能で、上限に達するとその月は関数が止まります。
  プレビュー版で、使用量の反映に数分の遅れがあるため、上限は低めにします。**Firestore は対象外** なので、予算アラートと読み込み件数の制限（ルールの `small()`）で守ります
- [ ] プロジェクトの設定 →「全般」→ **公開名** を「ryuu星軍 本部」などにする。ログイン用メールに出る名前です（プロジェクトID は `spporting-ryuu-movie` で、つづりが利用者にはなじみません）
- [ ] Authentication →「テンプレート」で、差出人名と返信先を確かめる
- [ ] Authentication → 承認済みドメインに `chr2808480.github.io` がある。使わないドメインは外す
- [ ] Firestore の TTL（`ipLogs`・`reports`・`bans`・`moderation`・`users`・`handles` の `expireAt`）が **有効（Serving）** になっている。
  期限が過ぎてから実際に消えるまでは、通常24時間以内のずれがあります
- [ ] IAM（プロジェクトのメンバー）に、運営者以外がいない
- [ ] 合言葉（`HIROBA_SECRET`）をパスワード管理アプリに控えてある。
  テスト投稿の `ipLogs` を `scripts/decrypt-ip.mjs` で一度読んでみる（IP が記録できていることと、控えた合言葉が正しいことの両方を確かめられます）

---

## 3. 必須：本番での動作確認（テスト用のメールアドレスで）

`firebase/README.md` の手順10に、次を足して確かめます。

- [ ] 参加登録 → 投稿 → ★ → 返信 → 通報 → 退会
- [ ] リンクを含む投稿が「確認待ち」に入り、`kanri.html` で公開できる
- [ ] 処置をひととおり：注意・非表示・公開に戻す・投稿停止・停止の解除・利用停止。
  「通知メールを作る」の文面（どのルールか・期間・異議の出し方・期限）を読む
- [ ] 利用停止にしたメールアドレスで、もう一度登録できない
- [ ] ログイン用メールが届くか：Gmail・iCloud・Yahoo!メール・キャリアメール（docomo / au / SoftBank）。
  迷惑メールに入る・受信拒否されるときは、基地の参加画面に「届かないとき」の案内を足す（独自ドメインから送る設定もあります）
- [ ] リンクを別の端末・別のブラウザで開く（メールアドレスの入力を求められる流れ）。iPhone の Safari、Android の Chrome、メールアプリの中のブラウザ
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
- [ ] Firebase Authentication は、ログインの IP アドレスを数週間記録します（Firebase 公式）。`privacy.html` 2. の表に載っていないので、足すか検討する。
  なお「削除してから最長180日でバックアップからも消える」という記載は、Firebase の公表と一致しています

### 情報流通プラットフォーム対処法（旧プロバイダ責任制限法。2025年4月1日施行）

削除の申出に7日以内に判断する、といった新しい義務は大規模な事業者向けで、この基地は当たりません。

- [ ] 権利侵害の申出を受けて投稿を消すとき、投稿した人に照会して **7日以内に反論がなければ**、投稿した人に対する責任を免れます（第3条第2項第2号）。
  `terms.html` 第8条第3項の「意見をお聞きします」に使うメールの型を用意しておく
- [ ] 開示請求や裁判所の命令が来たときの相談先（弁護士など）を決めておく

### 電気通信事業法

総務省のマニュアルでは、利益を得る目的などで反復継続して行う場合に「事業」と判断されます。
非営利の個人運営なら届出などが必要になる可能性は低いと考えられますが、**広告や投げ銭など収益化をするなら確かめ直す** こと。迷ったら、地域の総合通信局に問い合わせます。

---

## 5. 推奨：ファンサイトとして

- [ ] RyuU さんの X の固定ポストなどで、ファンアート・二次創作・切り抜き・ファンの集まりについてのガイドラインを確かめる（`research.md` の未確認項目）
- [ ] Twitch のチャンネル名（`research.md` で ⚠️）を本人の導線で確かめる
- [ ] できれば RyuU さんに「非公式の交流スペースを開きます。問題があれば止めます」と一報する（`operations.md` 1.）
- [ ] `research.md` の最終調査日を更新する

---

## 6. 推奨：運営の体制

- [ ] **通報の確認のしかたを決める**。新しい通報が来ても運営者に知らせるしくみはないので、`kanri.html` を見る頻度（例：投稿を受け付けている時間に1日1回）を決める。見られない日は「運営者不在」をオンにする
- [ ] 個人情報の晒しなどは「段階を飛ばして、すぐに」対応すると規約に書いてあります（第8条第2項）。その速さで対応できるか
- [ ] 運営者が2人以上なら、`ADMIN_EMAILS` への追加と、情報の扱いのルールの共有（`privacy.html` 7. 人的な対策）
- [ ] Firestore のバックアップは設定していません。データが消えたら戻せないことを受け入れるか、バックアップを取るかを決める。取るなら、退会した人の情報がバックアップに残る期間をポリシーに書く
- [ ] 開示請求の手順（`firebase/README.md`「日々の運営」）を読み、合言葉の保管場所を確かめる

---

## 7. 任意：公開後でもよい強化

- [ ] **App Check**（reCAPTCHA Enterprise）で、このサイト以外からの Firestore・Cloud Functions の呼び出しを断る。
  `firebase/web/entry.js` と `assets/js/hiroba-firebase.js` の変更が必要。まず指標を見て、正しい利用者が弾かれないのを確かめてから強制をオンにする
- [ ] ブラウザ用の API キーに、使う API とリファラー（`chr2808480.github.io`）の制限をかける。
  Authentication の API を許可から外すとログインが壊れるので、変更後に必ずログインを試す
- [ ] 新しい通報を運営者にメールで知らせるしくみ
- [ ] `README.md` の `docs/operations.md`・`docs/research.md` へのリンクを直す（ファイルはリポジトリの直下にあります）

---

## 8. 公開当日の作業

1. 1-1〜1-6 の修正を main に入れる（`TERMS_VERSION` や関数を変えたら、Cloud Shell で `bash setup.sh` を実行してデプロイし直す）
2. `index.html` の基地の紹介を「準備中・デモ版」から本番用に直す
3. `hiroba.html` の `noindex` を外すか決める。外すなら `sitemap.xml` に `hiroba.html` などを足す
4. 数分後に、シークレットウィンドウで トップ → 基地 → 参加登録 まで開いて確かめる
5. `kanri.html` のお知らせ欄に、開始のお知らせを入れる

---

## 情報源

### Firebase・Google Cloud（公式）

- [Authenticate with Firebase Using Email Link in JavaScript](https://firebase.google.com/docs/auth/web/email-link-auth)（メールのリンクでログインすると、確認していないパスワードが消される）
- [Firebase Authentication Limits](https://firebase.google.com/docs/auth/limits)（ログイン用メールの上限）
- [Manage data retention with TTL policies](https://firebase.google.com/docs/firestore/ttl)（通常24時間以内に削除、サブコレクションは消えない）
- [Set up budget alerts for Firebase services](https://firebase.google.com/docs/projects/billing/budget-alerts)
- [Set up spend caps for Firebase services](https://firebase.google.com/docs/projects/billing/spend-caps) ／ [Introducing Firebase spend caps（Firebase Blog, 2026-09）](https://firebase.blog/posts/2026/09/firebase-spend-caps/)
- [Privacy and Security in Firebase](https://firebase.google.com/support/privacy)（Authentication の IP 記録は数週間、削除後180日以内にバックアップからも削除）
- [Customize Firebase Authentication emails（Firebase ヘルプ）](https://support.google.com/firebase/answer/7000714) ／ [Use a custom domain for auth emails](https://firebase.google.com/docs/auth/email-custom-domain)
- [Learn about using and managing API keys for Firebase](https://firebase.google.com/docs/projects/api-keys) ／ [Authentication FAQ and troubleshooting](https://firebase.google.com/docs/auth/faq-and-troubleshooting)
- [Firebase App Check](https://firebase.google.com/docs/app-check) ／ [reCAPTCHA Enterprise provider（Web）](https://firebase.google.com/docs/app-check/web/recaptcha-enterprise-provider)
- [Cloud Logging: Store log entries](https://docs.cloud.google.com/logging/docs/store-log-entries) ／ [Configure log buckets](https://docs.cloud.google.com/logging/docs/buckets)（`_Default` は初期値30日・変更可、`_Required` は400日固定）

### EmailJS・配信（公式）

- [EmailJS Pricing](https://www.emailjs.com/pricing/)（履歴は初期設定で保存、テンプレートの設定で止められる）
- [EmailJS Privacy Policy](https://www.emailjs.com/legal/privacy-policy/)
- [EmailJS: Multi-Factor Authentication](https://www.emailjs.com/docs/user-guide/multi-factor-authentication/)
- [EmailJS: Can I add my domain to the allowlist?](https://www.emailjs.com/docs/faq/can-i-add-my-domain-to-allowlist/) ／ [Adding CAPTCHA verification](https://www.emailjs.com/docs/user-guide/adding-captcha-verification/)
- [jsDelivr（GitHub）](https://github.com/jsdelivr/jsdelivr)（版を固定しない読み込みは本番では非推奨）
- [MDN: integrity 属性](https://developer.mozilla.org/ja/docs/Web/HTML/Reference/Attributes/integrity) ／ [Mozilla Hacks: Subresource Integrity](https://hacks.mozilla.org/2015/09/subresource-integrity-in-firefox-43/)

### 法令（公的機関）

- [個人情報の保護に関する法律（e-Gov 法令検索）](https://laws.e-gov.go.jp/law/415AC0000000057)
- [個人情報保護委員会：ガイドライン（通則編）](https://www.ppc.go.jp/personalinfo/legal/guidelines_tsusoku/)
- [個人情報保護委員会：漏えい等の対応とお役立ち資料](https://www.ppc.go.jp/personalinfo/legal/leakAction/)
- [総務省：プロバイダ責任制限法の免責要件（照会して7日以内に反論がない場合）](https://www.soumu.go.jp/main_content/001012037.pdf)
- [京都府：情報流通プラットフォーム対処法の概要](https://www.pref.kyoto.jp/koho/dayori/202605/jinken.html)
- [総務省：電気通信事業参入マニュアル［追補版］（令和5年1月30日改定）](https://www.soumu.go.jp/main_content/000477428.pdf)

### 論文

- Avinash Sudhodanan, Andrew Paverd. [Pre-hijacked accounts: An Empirical Study of Security Failures in User Account Creation on the Web](https://www.usenix.org/conference/usenixsecurity22/presentation/sudhodanan). USENIX Security 2022.（[arXiv:2205.10174](https://arxiv.org/abs/2205.10174)）
