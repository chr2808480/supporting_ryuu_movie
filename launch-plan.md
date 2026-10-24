# 始動の盛り上げ計画とページ案（2026-10-23 の受付開始と 2026-11-14 の正式オープンに向けて）

作成日：**2026-10-17**（main の `d1c7edb` 時点のファイルを読んで作成）
更新：**2026-10-17**（運営者の決定を受けて、公開前にできる作業を済ませました。「決まったこと・済んだこと」を見てください）
更新：**2026-10-22**（運営者の希望で、参加登録の受付を **10月23日（金）6:00** に前倒ししました。11月14日 は正式オープン・活動3周年の日として残します）
更新：**2026-10-24**（受付開始から1日たっても参加登録が0人なので、登録が通るかの確かめ方と、宣伝の打ち手を「7.」に足しました）

星軍基地の正式公開を、初日から人が集まり、そのあとも続く形で始めるための計画と、これから足すページの案です。
公開前の設定・法令の確認は [`launch-checklist.md`](launch-checklist.md) にあります。こちらは「人が来て、また来たくなる」ための計画です。

> [!NOTE]
> 論文は、この作業環境の通信の制限で本文を開けなかったため、Web 検索で得た要旨と、ほかの論文での紹介から整理しました（`research.md` の調査と同じ制約です）。
> 数値は要旨にあるものだけを載せ、ほかの論文の紹介によるものには「（二次情報）」と付けています。
> 確度の記号（✅ 🟡 ⚠️）は `research.md` と同じ意味です。

---

## 決まったこと・済んだこと（2026-10-17）

| | 内容 |
| --- | --- |
| X のアカウント | 作らない。告知は本部トップの告知欄と、ファンが使える「X で知らせる」リンクで行う |
| 参加登録の受付 | **10/23（金）6:00 から**（2026-10-22 に前倒し）。10/23〜11/13 を先行オープンの期間とし、11/14（土）を正式オープン・活動3周年の日にする。先に中身と常連ができた状態で 11/14 を迎えられる（1. の1・2） |
| RyuU さんへの一報 | **済み**（運営者がマシュマロで送った）。マシュマロ返信の配信で読まれたら、その内容に従う。読まれると急に人が来ることがある（4.） |
| 公開前の作業 | 下のとおり**すべて済み**。残りは、関数のデプロイと運営者の参加登録（`launch-checklist.md` 1-11。**10/23 6:00 より前に**） |

| 済んだ作業 | どこ |
| --- | --- |
| 11.14 正式オープンの告知（先行オープン中・当日・翌日からで自動で切り替わる。受付前の文は受付開始の後に外した） | `index.html` の `.launch`、`assets/js/main.js` の `LAUNCH_AT` |
| 「はじめての方へ」（どこから観る・観る前に・用語集） | `guide.html`（トップのメニュー・ボタン・入軍案内・FAQ から案内） |
| 共有したときの画像と、X で知らせる・書くリンク | `assets/img/ogp.png`、`index.html`・`guide.html` の OGP、入軍案内の4と告知欄のリンク |
| 基地は100件ずつ読み、「前の投稿をもっと見る」で続きを読む（2-1） | `assets/js/hiroba-firebase.js` |
| 参加登録は 10/23 6:00 から（それまでは開始日時を表示。運営者だけは前でも登録できる） | `firebase/functions/index.js` の `OPEN_AT`、`assets/js/hiroba.js` |
| 運営者の投稿・返信に「運営」の印。リンクがあってもすぐ公開。運営者の投稿への返信・運営者の返信は、回数の上限に数えない（2-2・2-3・2-4） | `firebase/functions/index.js`、`assets/js/hiroba.js`、`terms.html` 第5条、`hiroba.html` の「運営からの約束」 |

関数の変更は、デプロイするまで本番では動きません（画面の変更は main に入れば GitHub Pages に出ます）。
画面だけ先に出ても困らないように作っています（印は、デプロイ後の投稿から付きます）。

---

## 0. 計画の前提になる3つの事実

| | 内容 | 確度 |
| --- | --- | --- |
| 公開日は土曜日 | 2026-11-14 は土曜日。毎週土曜 13:00 の定期配信の日です（X のプロフィール） | 🟡 |
| ちょうど活動3周年 | YouTube チャンネルの開始日は 2023-11-14（`research.md` の年表と同じ）。公開日でちょうど3年です | 🟡 |
| 投稿できる時間 | 基地は 6:00〜23:00 に投稿を受け付けます。配信のあとの感想の時間がまるごと入ります | ✅（コードで確認） |

**計画の軸**：「3周年の日に、ファンの基地が開く」。
ただし公式の企画ではないので、「ファンが勝手にお祝いする」形を崩しません。
RyuU さんが当日に3周年の配信をするかは、1週間前に X で確かめます。しない場合や別の日にする場合も、基地は予定どおり開きます。

---

## 1. 研究から分かっていること

どれも、この基地でそのまま使える打ち手につながるものです。

| # | 分かっていること | 根拠 | この基地での打ち手 |
| --- | --- | --- | --- |
| 1 | 中身のない場所には人が来ず、人がいないと中身が増えない（クリティカルマスの問題）。最初の投稿・ルール・見守りが、始めのうちほど効く | Kraut & Resnick 2012（二次情報） | 開いた時点で、運営者の投稿が3つほど並んでいるようにする |
| 2 | 最初の投稿に返事をもらった新しい人は、また投稿しやすい。返事の中身の出来（気持ちの温かさ、質問に答えたか）は関係がなかった | Joyce & Kraut 2006（2,777人。再投稿は全体で44%、返事がなかった人は39%） | 最初の投稿には、短くてもいいので早めに返事か★を付ける |
| 3 | 新しい人は、反応をもらい、多くの人に見てもらえると、そのあとよく投稿する | Burke ほか 2009（Facebook の新しい利用者 約14万人の最初の2週間） | ★（「オラ！」）を、運営者も気軽に送る |
| 4 | 人は、その場で先に見た振る舞いを真似る。立場が上の人の振る舞いはなおさら真似される | Seering ほか 2017（Twitch のチャット） | 運営者の最初の投稿を、基地に増えてほしい投稿の見本にする |
| 5 | ルールを目に入る所に出すと、新しい人がルールを守る割合が8ポイント以上、参加する割合が平均70%上がった | Matias 2019（r/science の 2,190 の話題での実験） | いまの「基地の約束」をページの上にいつも出す作りを変えない |
| 6 | 新しい人の書き込みを退けると、善意の新しい人ほど去っていく | Halfaker ほか 2013（Wikipedia） | 初めての軽い違反は「注意」から（いまの段階どおり）。リンク入りの確認待ちを長く放っておかない |
| 7 | 新しい人が気軽に質問できる場所に招くと、定着する人が増えた | Morgan & Halfaker 2018（Wikipedia Teahouse。比べる組を置いた実験） | 「質問」タグを入口として案内し、運営者が答える |
| 8 | 読むだけの人が大半（約9割）。読むだけの人も、答えは探している | van Mierlo 2014（6万4千人・58万投稿で、読むだけ・ときどき・常連が約90%・9%・1%）、Preece ほか 2004 | 投稿数だけで成否を決めない。読むだけで役に立つページ（ガイド・用語集）を用意する |
| 9 | 急に人が増えても、ルールを守るしくみが重なっていれば場は持ちこたえる | Kiene ほか 2016（掲示板 NoSleep） | RyuU さんに触れてもらうなどで急に増えたときの止め方を決めておく（4.） |
| 10 | 荒らしは深夜に多く、朝に少ない | Cheng ほか 2017 | いまの 23:00〜6:00 の投稿休止を続ける |
| 11 | 立ち上げた人がよく来て書き、運営者が1人だけでないグループほど続く | Kraut & Fiore 2014（二次情報） | 最初の2週間は毎日のぞく。手伝ってくれる人がいれば2人目の運営者に |
| 12 | 配信は、家でも職場でもない「第三の場所」としてファンが集まる場になる | Hamilton ほか 2014（Twitch） | 実況は配信のチャットで、基地は配信のあとに語る場所、と役割を分ける（いまのルールどおり） |

---

## 2. いまのしくみで、公開当日に引っかかりそうな所（コードで確認）

| # | 引っかかる所 | どこ | 対策 |
| --- | --- | --- | --- |
| 2-1 | 基地に出るのは、新しい投稿 **50件**・返信 **300件** まで。「もっと見る」はありません。当日に50件を超えると、朝の運営者の投稿から見えなくなります。タグの絞り込みも、この50件の中だけです | `assets/js/hiroba-firebase.js` の `loadAll()` | ✅ **済み**：100件ずつ読み、「前の投稿をもっと見る」を付けた。前の投稿への返信も読む |
| 2-2 | 同じ相手への返信は、24時間で **3回** まで。数えるのは投稿した人ごとなので、運営者が立てた投稿（お祝い・質問・感想）への返信は、全部まとめて「運営者への返信」として3回までです | `firebase/functions/index.js` の `RULES.replyLimit` | ✅ **済み**：運営者の投稿への返信と、運営者の返信は数えないようにした（デプロイが要る）。ほかの人どうしは3回まで。当日の企画も、新しい投稿を勧める形はそのままでよい |
| 2-3 | リンクを含む投稿は「確認待ち」になります。「おすすめ動画」は YouTube のリンクを貼ることが多いので、当日はここに溜まります | 同 `hasLink()` | 当日は `kanri.html` の確認待ちを1〜2時間ごとに見る（1. の6）。✅ 運営者のリンク入りの投稿は、確認待ちにしないようにした |
| 2-4 | 「運営」「管理人」「公式」を含む表示名は、運営者も含めて誰も使えません。運営者の投稿は、ふつうの人の投稿と見分けがつきません | 同 `RESERVED` | ✅ **済み**：運営者の投稿・返信に「運営」の印を付けた（デプロイが要る）。当日はお知らせ欄にも表示名を書く |
| 2-5 | いまは「運営者不在」がオンで、新規の投稿・返信が止まっています | 本番の `config/site` | 当日の朝6:00より前にオフにする（`launch-checklist.md` 8. の5） |
| 2-6 | 話題タグは4つで固定です（感想・おすすめ動画・質問・雑談） | 同 `TAGS` | 「3周年」タグは足さない。お祝いは「雑談」で。最初は分けすぎない方が、1か所に投稿が集まって賑わって見えます |
| 2-7 | 利用規約 第6条で、投稿は「基地での表示」など運営に必要な範囲でしか使えません | `terms.html` | お祝いの投稿を基地の外（まとめのページ、印刷、本人へのお届け）で使うなら、投稿した人ごとに同意をもらう |
| 2-8 | 基地のルールで「複数アカウントによる自作自演」を禁止しています | `hiroba.html` | 賑やかしの「さくら」は運営者もしない。最初の投稿は運営者の名前で書き、ファンには本人の言葉での参加をお願いする |
| 2-9 | アクセス解析は使わないとポリシーに書いています。基地では SNS のボタンも使いません | `privacy.html` 2.・7. | 数字は `kanri.html` と Firestore の件数で見る。✅ X への共有は、外部のプログラムを読み込まない**ふつうのリンク**にした。基地のページには置いていない |

---

## 3. 進め方（タイムライン）

### 4週間前〜1週間前（10/17〜11/7）

- [x] RyuU さんに一報する（マシュマロで送った）。紹介や拡散のお願いはしない。止めてほしいと言われたら止める
- [ ] `research.md` の未確認の項目（Twitch のチャンネル名、ファンアートなどのガイドライン）を本人の導線で確かめる
- [x] 公開前に入れるページと部品を作る（5. の A1〜A4、2-1）
- [ ] 関数の変更を main に入れてデプロイし、運営者のアカウントで基地に参加登録する（`launch-checklist.md` 1-11）
- [ ] 当日の運営者の投稿3つと、お知らせ欄の文を下書きしておく（下の「当日」）
- [ ] 手伝ってくれる人がいれば、2人目の運営者にする（`launch-checklist.md` 6.）

### 参加登録の受付開始 10/23（金）

| 時刻（日本時間） | やること |
| --- | --- |
| 〜6:00 | 関数のデプロイと運営者の参加登録を済ませておく（`launch-checklist.md` 1-11） |
| 6:00〜 | `launch-checklist.md` 8. （運営者不在をオフ、お知らせ欄を受付開始用に。トップの告知と参加登録の受付は 6:00 に自動で切り替わる） |
| 6:00〜 | 運営者の投稿を2つ：① ようこそと基地の使い方（雑談）② 「はじめての人は、なんでも『質問』タグで」（質問） |
| この日から | 初めての投稿には、なるべく数時間以内に返事か★。`kanri.html` を毎日見る。11/14 までの3週間で、投稿と常連を少しずつ増やす（1. の1〜3） |

### 1週間前〜前日（11/7〜11/13）

- [ ] RyuU さんの X で、11/14 の配信の予定（3周年の配信か、時間の変更はないか）を確かめる
- [ ] 告知は本部トップの告知欄で行う（X のアカウントは作らない）。ファンが自分で知らせたいときのために「このサイトを X で知らせる」リンクを置いた。`#ryuu星軍` はファンアート・感想のためのタグなので、このリンクにはタグを付けていない。RyuU さんへの返信や引用で宣伝しない（軍の作法の「宣伝行為」と同じ考え方）

### 当日 11/14（土）

| 時刻（日本時間） | やること |
| --- | --- |
| 〜6:00 | `launch-checklist.md` 8b.（お知らせ欄を正式オープン・3周年用に。トップの告知は 6:00 に自動で切り替わる） |
| 6:00〜 | 運営者の投稿：「3周年のお祝いを、それぞれ新しい投稿でどうぞ」（雑談）。ようこそ・質問の投稿は 10/23 に済ませてある |
| 午前 | 先に声をかけておいたファンに、来られたら一言をお願いする（さくらではなく、本人の言葉で） |
| 13:00〜 | 配信。基地では実況しない（「実況コメントは公式のチャットで」） |
| 配信のあと | お知らせ欄に「今日の配信の感想は『感想』タグで」 |
| 一日じゅう | 初めての投稿には、なるべく数時間以内に返事か★。確認待ちは1〜2時間ごとに見る |
| 23:00 | 投稿の受付が自動で止まる |

### 受付開始（10/23）から、正式オープンの2週間後まで

- [ ] 毎日1回 `kanri.html`（通報・確認待ち）を見る。見られない日は「運営者不在」をオンにする
- [ ] 参加登録が通るかを確かめる（7-1。**10/30 ごろまでに**）
- [ ] 初めての投稿への返事を続ける
- [ ] 2回目の土曜（11/21）も同じ流れにして、毎週の型にする

### 1か月後の振り返り（12/12 ごろ）

| 見るもの | どこで |
| --- | --- |
| 参加登録した人の数 | Firestore の `users` |
| 投稿した人の数と、2回以上投稿した人の割合 | Firestore の `posts` |
| 確認待ちが公開されるまでの時間 | `kanri.html` |
| 通報と処置の件数 | `kanri.html` |

これをもとに、表示件数、タグの追加、5. の B・C のページを決めます。
2回以上投稿した人の割合は、ほかの場所の数字（Joyce & Kraut 2006 の 44%）と単純には比べられません。月ごとの変化を見ます。

---

## 4. 急に人が増えたときの備え

RyuU さんに触れてもらったり、投稿が広まったりすると、一気に人が来ることがあります。

- **止め方**：`kanri.html` の「運営者不在」をオンにすると、新規の投稿・返信が止まり、閲覧は続きます。対応が追いつかないときのブレーキとして使います
- **費用**：Firestore の読み取りは1日5万件まで無料で、超えた分も10万件あたり約0.03ドルです。1回の表示で、投稿100件・返信300件（返信がそれより多く、前の投稿への返信もあるときは、さらに300件ずつ）と設定を読みます。返信が300件までなら1,000回表示されても約40万件、0.1ドル前後です。「もっと見る」を押すと、前の分も読み直します。予算アラートと上限は設定済みです（`launch-checklist.md` 2.）
- **ログイン用のメール**：Blaze プランで1日25,000通まで（`launch-checklist.md` 0.）

---

## 5. ページ案（優先度つき）

### A. 公開までに作りたいもの（文字とリンクだけで、危険が少ない）— ✅ 2026-10-17 すべて済み

| | ページ・部品 | 中身 | ねらい | 気をつけること |
| --- | --- | --- | --- | --- |
| A1 | **11.14 基地オープンの告知**（`index.html` の一区画） | 日付、基地でできること、`#ryuu星軍` | 来る理由と日時を1か所にまとめる | 公式の3周年企画と誤解されない書き方にする。「非公式」の表示は残す |
| A2 | **はじめての方へ**（初見さん向けガイド） | 「まずはこの3本」と一言、ジョジョのネタバレの注意、配信の時間、応援のしかた | 入口で迷わない（1. の7・8） | 動画は埋め込まずリンクで。サムネイルは載せない。タイトルは本人のページで確かめる |
| A3 | **用語集** | 星軍、空条穹太郎、並行世界の承太郎、「オラ！」（基地の★）など | 内輪の言葉で新しい人を置いていかない（1. の6） | 情報源の記録がない言葉（`launch-checklist.md` 5. の JO☆GAMERS など）は確かめてから載せる |
| A4 | **共有の部品** | OGP 画像と `twitter:card`、「X で `#ryuu星軍` を付けてポスト」のリンク | X で広まるときの見え方を整える | 画像は文字だけ（本人の画像・ロゴは使わない）。X のカードは SVG 不可・5MB 未満。共有はふつうのリンク（`https://x.com/intent/tweet?hashtags=ryuu星軍&url=…`）で、X の部品は読み込まない |

### B. 公開後1か月以内に

| | ページ・部品 | 中身 | 気をつけること |
| --- | --- | --- | --- |
| B1 | **配信アーカイブの索引** | 日付・タイトル・シリーズ・リンク（文字だけ） | 転載しない。更新は月に1回まとめて |
| B2 | **活動の歩み**（年表）の拡張 | 3周年を足す | 登録者数は 🟡 のまま扱う |
| B3 | **基地の毎週の型** | 土曜は配信のあとの感想、週の半ばに運営者からのお題 | 運営者の投稿への返信は3回まで（2-2）。お題への答えも新しい投稿で |
| B4 | **本部の更新履歴** | いつ何を足したか | 戻ってくる理由になる |
| B5 | ~~基地の「もっと見る」~~ | ✅ 公開前に済んだ（2-1） | — |

### C. 許可やしくみが要るので、急がないもの

| | ページ・部品 | 先に要ること |
| --- | --- | --- |
| C1 | ファンアートのギャラリー | 描き手本人の許可。利用規約 第6条の範囲の外。原作の権利も絡むので、当面は X のタグ検索へのリンクで |
| C2 | お祝いの言葉のまとめ・本人へのお届け | 投稿した人ごとの同意（2-7）と、RyuU さんの受け取り方の確認 |
| C3 | ~~運営者の投稿の印、返信の上限の例外~~ | ✅ 公開前に済んだ。デプロイは `launch-checklist.md` 1-11 |
| C4 | 新しい通報のメールでのお知らせ | `launch-checklist.md` 7. |

### やらない方がよいもの

- **プレゼント企画**：住所などを集めることになり、プライバシーポリシーの範囲を超えます
- **応援広告など、お金を集める企画**：収益化しない方針です（`operations.md` 1.）
- **切り抜き・動画の転載**
- **さくらの投稿**（2-8）

---

## 6. 運営者の決定（2026-10-17）

1. X のアカウントはなく、作る予定もない → 告知は本部トップで。ファン向けに共有のリンクを置いた
2. RyuU さんには、マシュマロで一報済み。マシュマロ返信の配信で読まれればよい
3. 公開前にできることは全部やる → 5. の A1〜A4 と 2-1 を済ませた
4. 分かりやすくするため、関数の変更もする → 運営の印・返信の上限の例外・運営者のリンク・参加登録の受付開始を入れた。Cloud Shell でのデプロイがもう一度要る（`launch-checklist.md` 1-11）

---

## 7. 受付開始のあと、参加登録が0人のとき（2026-10-24）

10/24 の時点で、参加登録は0人です。宣伝を足す前に、まず登録が通るかを確かめます。
論文と公式の資料は、この作業環境からは本文を開けなかったため、Web 検索で得た要旨と紹介から整理しました（冒頭の注意と同じ制約です）。

### 7-1. まず、登録が通るか確かめる

| # | 確かめること | どこで | なぜ |
| --- | --- | --- | --- |
| 1 | 関数の最終デプロイが **2026-10-22 22:15（日本時間）より後** か | Google Cloud コンソール →「Cloud Run」 | 10/17 版の関数は、受付開始が **11/14 6:00** です。10/23 6:00 にした版が main に入ったのは 10/22 22:15 です。その間にデプロイしたままだと、画面には「基地に参加する」が出るのに、メールのリンクを開いたあとで「参加登録は 11月14日（土）6:00 から受け付けます」と断られます。前なら `launch-checklist.md` 1-11 のとおりデプロイし直す |
| 2 | 運営者**でない**アドレスで、シークレットウィンドウから最後まで登録できるか | `hiroba.html` | 運営者のアドレスは受付前でも登録できるので、運営者で試しても 1 に気づけません。試したら退会する |
| 3 | 「Authentication」にいる人が、Firestore の `users` にいないことはないか | Firebase コンソール | いれば、メールのリンクを開いたあとで止まっています（1 のほか、表示名が使えなかったなど）。登録しないままのログインは7日で自動で消える（`cleanupUnregistered`）ので、**10/30 ごろまでに**見る |
| 4 | ログイン用のメールが迷惑メールに入らないか | Gmail・iCloud・キャリアメールなど（`launch-checklist.md` 3.） | ✅ **2026-10-24 済み**：リンクを送ったあと、基地の参加の案内に「数分たっても届かないときは、迷惑メールのフォルダも見てください」を残すようにした（知らせはすぐ消えるため）。Firebase の標準のメールは Google から送られ、変えられる所が少ない |

### 7-2. いまの数字の見方

- 受付開始から約1日で、入口は本部トップと検索だけです。X のアカウントは作らない決定（6. の1）なので、ほかに知らせる経路がまだありません
- Google は、新しいページが検索に載るまで数日〜数週間かかるとしています
- 来た人の大半は読むだけです（1. の8）。小さいままの場にも、参加する人にとっての価値があります（Hwang & Foote 2021。Reddit の小さいコミュニティの聞き取り）。0人は、まだ失敗の判定にはなりません。成否は1か月後の振り返り（3.）で見ます

### 7-3. 宣伝の打ち手（効く順）

| # | 打ち手 | 根拠 | 気をつけること |
| --- | --- | --- | --- |
| 1 | **知り合いのファンに、1人ずつ声をかける。** お互いに知り合いの3〜5人に、同じころに「一緒に入らない？」と誘う | Kraut ほか 2012（新しい人の章の設計原則2：口コミは、人を介さない広告よりずっと強い。研究をまとめた分析では約10倍〔二次情報〕）。Trusov ほか 2009（SNS の新規登録で、会員からの紹介は広告より長く効き、効き目も大きい）。Backstrom ほか 2006（加わる見込みは、中にいる友だちの数で上がり〔増え方はだんだん小さくなる。二次情報〕、その友だち同士のつながり方にもよる）。Centola 2010（健康のフォーラムへの登録の実験。複数の知り合いから後押しされた人ほど登録した） | 本人のアカウントで、本人の言葉で書いてもらう（2-8 のさくらにしない）。知らない人への一斉の DM はしない（X の規約では、大量で強引なふるまいはスパム） |
| 2 | **`#ryuu星軍` でよく描く・書くファンを、個別に誘う** | Zhu・Kraut・Kittur 2014（Wikia の 5,673 のコミュニティ。ほかの成熟したコミュニティで中心にいる人が一緒に参加している新しいコミュニティほど続く） | 宣伝のお願いではなく、参加のお誘いとして。断られたら重ねて誘わない |
| 3 | **運営者の個人の X で、自分の言葉で1回だけ紹介する** | ファンが集まっているのは X です（`research.md`：告知の本命の導線） | 個人のアカウントがあり、運営者だと知られてもよい場合だけ。サイト用のアカウントは作らない（6. の1）。`#ryuu星軍` は付けない（3. の1週間前〜前日） |
| 4 | **Google Search Console で `sitemap.xml` を送り、トップと `guide.html` の「インデックス登録をリクエスト」を押す** | Google（sitemap は、公開したばかりのサイトに特に役立つ。同じ URL を何度リクエストしても早くはならない） | ✅ **2026-10-24 済み**：`sitemap.xml` の更新日を、ページを最後に変えた日に合わせた（トップ 10/23、お問い合わせ 10/12）。ページを変えたら、ここも直す |
| 5 | **11/14（3周年）に、3 の紹介と、1 で誘った人の発信を合わせる** | その日はファンの投稿が増えると見込んでいます（推測） | 公式の企画と誤解されない書き方にする（5. の A1） |
| 6 | **来た人が空っぽの基地を見ないようにする** | Resnick・Kraut（中身がたまっていることが新しい人を呼ぶ）、1. の1 | 運営者の最初の投稿（`launch-checklist.md` 8. の6）が済んでいるか確かめる |

### 7-4. やらないこと

- RyuU さんの動画のコメント欄や配信のチャットに、このサイトの URL を貼る。YouTube の規約は、閲覧者を誤ってサイトの外へ誘導するコメントと、同じコメントや相手を選ばないコメントの大量の投稿を禁じています。軍の作法の「宣伝行為」にも当たります
- 知らない人への X の一斉の返信・DM（X の Platform manipulation and spam policy）
- `#ryuu星軍` での宣伝、マシュマロの送り直し（催促になる。軍の作法）、さくらの投稿（2-8）

---

## 情報源

### RyuU さん（公式の導線。確度は検索結果の要約によるもの）

- [RyuU@声真似太郎⭐️✋ (@RyuU_Movie) / X](https://x.com/RyuU_Movie)（プロフィールに毎週土曜13時の定期配信）🟡
- [RyuU - YouTube（@RyuU-movie）](https://www.youtube.com/@RyuU-movie)（チャンネルの開始日 2023-11-14）🟡
- [【崩壊：スターレイル】空条穹太郎は導かない【声真似/配信】（X の告知）](https://x.com/RyuU_Movie/status/2080866326718079079)（2026-07 の配信）🟡

### 論文

- Robert E. Kraut, Paul Resnick ほか. [Building Successful Online Communities: Evidence-Based Social Design](https://direct.mit.edu/books/monograph/2912/Building-Successful-Online-CommunitiesEvidence). MIT Press, 2012.（「Starting New Online Communities」の章。クリティカルマスの問題）
- Elisabeth Joyce, Robert E. Kraut. [Predicting Continued Participation in Newsgroups](https://academic.oup.com/jcmc/article-abstract/11/3/723/4617705). Journal of Computer-Mediated Communication 11(3): 723–747, 2006.（実験ではないので、因果とは言い切れないと著者が注記）
- Moira Burke, Cameron Marlow, Thomas Lento. [Feed Me: Motivating Newcomer Contribution in Social Network Sites](https://research.facebook.com/publications/feed-me-motivating-newcomer-contribution-in-social-network-sites/). CHI 2009: 945–954. doi:10.1145/1518701.1518847
- Joseph Seering, Robert Kraut, Laura Dabbish. [Shaping Pro and Anti-Social Behavior on Twitch Through Moderation and Example-Setting](https://dl.acm.org/doi/10.1145/2998181.2998277). CSCW 2017: 111–125.
- J. Nathan Matias. [Preventing Harassment and Increasing Group Participation through Social Norms in 2,190 Online Science Discussions](https://www.pnas.org/doi/10.1073/pnas.1813486116). PNAS 116(20): 9785–9789, 2019.
- Aaron Halfaker, R. Stuart Geiger, Jonathan T. Morgan, John Riedl. [The Rise and Decline of an Open Collaboration System](https://meta.wikimedia.org/wiki/Research:The_Rise_and_Decline). American Behavioral Scientist 57(5): 664–688, 2013.
- Jonathan T. Morgan, Aaron Halfaker. [Evaluating the Impact of the Wikipedia Teahouse on Newcomer Socialization and Retention](https://dl.acm.org/doi/10.1145/3233391.3233544). OpenSym 2018.
- Trevor van Mierlo. [The 1% Rule in Four Digital Health Social Networks: An Observational Study](https://www.jmir.org/2014/2/e33). JMIR 16(2): e33, 2014.
- Jennifer Preece, Blair Nonnecke, Dorine Andrews. [The Top Five Reasons for Lurking](https://www.socs.uoguelph.ca/~nonnecke/research/CHB_Proof.pdf). Computers in Human Behavior 20(2): 201–223, 2004.
- Charles Kiene, Andrés Monroy-Hernández, Benjamin Mako Hill. [Surviving an "Eternal September": How an Online Community Managed a Surge of Newcomers](https://mako.cc/copyrighteous/surviving-an-eternal-september-how-an-online-community-managed-a-surge-of-newcomers). CHI 2016: 1152–1156.（[arXiv:1605.08841](https://arxiv.org/abs/1605.08841)）
- Justin Cheng, Michael Bernstein, Cristian Danescu-Niculescu-Mizil, Jure Leskovec. [Anyone Can Become a Troll: Causes of Trolling Behavior in Online Discussions](https://cs.stanford.edu/~jure/pubs/trolling-cscw17.pdf). CSCW 2017: 1217–1230.
- Robert E. Kraut, Andrew T. Fiore. [The Role of Founders in Building Online Groups](https://www.researchgate.net/publication/262153576_The_role_of_founders_in_building_online_groups). CSCW 2014: 722–732.（結果は [arXiv:2405.00601](https://arxiv.org/abs/2405.00601) での紹介による）
- William A. Hamilton, Oliver Garretson, Andruid Kerne. Streaming on Twitch: Fostering Participatory Communities of Play within Live Mixed Media. CHI 2014: 1315–1324. doi:10.1145/2556288.2557048
- 🆕（7.）Robert E. Kraut, Moira Burke, John Riedl, Paul Resnick. [Dealing with Newcomers](https://kraut.hciresearch.info/wp-content/uploads/2020/02/kraut10-Newcomers-current.pdf). Kraut & Resnick 2012 の第5章（著者のサイトの原稿）。設計原則2「口コミは、人を介さない広告よりずっと強い」
- 🆕（7.）Paul Resnick, Robert E. Kraut. [Evidence-based social design: Introduction](https://collablab.northwestern.edu/CollabolabDistro/nucmc/Resnick10-Intro-current.pdf). Kraut & Resnick 2012 の序章（原稿）
- 🆕（7.）Michael Trusov, Randolph E. Bucklin, Koen Pauwels. [Effects of Word-of-Mouth Versus Traditional Marketing: Findings from an Internet Social Networking Site](https://eresearch.ozyegin.edu.tr/handle/10679/56). Journal of Marketing 73(5): 90–102, 2009. doi:10.1509/jmkg.73.5.90
- 🆕（7.）Lars Backstrom, Dan Huttenlocher, Jon Kleinberg, Xiangyang Lan. [Group Formation in Large Social Networks: Membership, Growth, and Evolution](https://www.cs.cornell.edu/courses/cs789/2006fa/LarsBackstrom9.06.htm). KDD 2006: 44–54. doi:10.1145/1150402.1150412（増え方がだんだん小さくなる点は [Science News の紹介](https://new.sciencenews.org/article/mining-yesternet) による）
- 🆕（7.）Damon Centola. [The Spread of Behavior in an Online Social Network Experiment](https://pubmed.ncbi.nlm.nih.gov/20813952). Science 329(5996): 1194–1197, 2010. doi:10.1126/science.1185231
- 🆕（7.）Haiyi Zhu, Robert E. Kraut, Aniket Kittur. [The Impact of Membership Overlap on the Survival of Online Communities](https://experts.umn.edu/en/publications/the-impact-of-membership-overlap-on-the-survival-of-online-commun/). CHI 2014: 281–290. doi:10.1145/2556288.2557213
- 🆕（7.）Sohyeon Hwang, Jeremy Foote. [Why do people participate in small online communities?](https://arxiv.org/abs/2108.04282) Proc. ACM HCI 5(CSCW2): 462, 2021. doi:10.1145/3479606

### Google・YouTube・X（公式。7.）

- [Google 検索セントラル「Google に再クロールを依頼する」](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl?hl=ja)（URL 検査と sitemap。クロールには数日〜数週間かかる。同じ URL を何度リクエストしても早くならない）
- [Google 検索セントラル「Search Console スタートガイド」](https://developers.google.com/search/docs/beginner/search-console)（sitemap を送ると、見つけてもらうのが早くなることがある）
- [Firebase: Generating Email Action Links](https://firebase.google.com/docs/auth/admin/email-action-links)（標準のメールは Google から送られ、変えられる所が少ない）
- [YouTube「スパム、欺瞞行為、詐欺に関するポリシー」](https://support.google.com/youtube/answer/2801973)（閲覧者を誤って YouTube の外へ誘導するコメント、同じコメントや相手を選ばないコメントの大量の投稿）
- [X「Platform manipulation and spam policy」](https://help.x.com/rules-and-policies/platform-manipulation)（大量・強引・欺く形で、ほかの人の体験を乱すふるまい）

### X・Firebase（公式）

- [X for Websites: Web Intent](https://docs.x.com/x-for-websites/post-button/guides/web-intent)（`intent/tweet` の `text`・`url`・`hashtags`。ハッシュタグは `#` を付けずカンマ区切り。合わせて280文字まで）
- [X Developer: Cards markup](https://developer.x.com/cards/markup)（`summary_large_image`、画像は5MB未満、JPG・PNG・WEBP・GIF、SVG は不可）
- [Understand Cloud Firestore billing](https://firebase.google.com/docs/firestore/pricing) ／ [Firestore pricing](https://cloud.google.com/firestore/pricing)（読み取りは1日5万件まで無料、10万件あたり0.03ドル）
