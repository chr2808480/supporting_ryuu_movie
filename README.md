# ryuu星軍 本部 — RyuU 非公式ファンクラブ

声真似配信者 **RyuU**（X: [@RyuU_Movie](https://x.com/RyuU_Movie)）さんを応援する、
**ファンによる非公式・非営利**の応援サイトです。

> [!IMPORTANT]
> 当サイトは RyuU さんご本人および関係各所とは**一切関係がありません**。
> 掲載内容は公開情報をもとにファンがまとめたもので、ご本人の公式発表ではありません。
> 正確な情報は必ず公式アカウントでご確認ください。
> ご本人・権利者の方からご連絡をいただいた場合は、速やかに修正・削除します。

## 公式アカウント（応援はこちらへ）

| | |
| --- | --- |
| YouTube | [@RyuU-movie](https://www.youtube.com/@RyuU-movie) |
| X（旧Twitter） | [@RyuU_Movie](https://x.com/RyuU_Movie) |
| TikTok | [@ryuu_douga](https://www.tiktok.com/@ryuu_douga) |
| Twitch | [game_ryuu](https://www.twitch.tv/game_ryuu) |

ファンアート・感想のタグは **`#ryuu星軍`**。

## サイトの内容

- RyuU さんの紹介（声真似 / ゲーム配信 / 歌ってみた）とプロフィール早見表
- 視聴前の注意（ジョジョ 1〜9 部のネタバレ、並行世界の承太郎という設定）
- 公式リンク集
- 活動の歩み（年表）
- 応援のはじめ方と、応援マナー（やること / やらないこと）
- ファン交流スペース「星軍基地」の案内（準備中・試験運用中の基地へのリンク）
- よくある質問

## 動かす

ビルド不要の静的サイトです。`index.html` をブラウザで開くだけで確認できます。

```bash
python3 -m http.server 8000   # → http://localhost:8000
```

公開手順（GitHub Pages）は [`operations.md`](operations.md) を参照してください。

## 構成

```
index.html              サイト本体（1 ページ完結）
assets/css/style.css    配色・レイアウト
assets/js/main.js       メニュー / 配信カウントダウン / タグコピー
hiroba.html             星軍基地（ファン交流スペース）。Firebase を設定するまではデモ・noindex（index.html の入軍案内から案内）
terms.html              星軍基地の利用規約。参加登録で同意をもらう・noindex
privacy.html            星軍基地とお問い合わせフォームのプライバシーポリシー。預かる情報・保存期間・請求の窓口・noindex
assets/css/hiroba.css   星軍基地・利用規約・プライバシーポリシー用のスタイル
assets/js/hiroba.js     星軍基地の画面。hiroba-config.js が null ならデモ（どこにも送信しない）
assets/js/hiroba-config.js    Firebase の接続先（公開して問題ない値）。null ならデモ
assets/js/hiroba-firebase.js  Firebase とのやりとり（メールリンクのログイン・読み込み・書き込み）
assets/js/vendor/       Firebase の部品をまとめたもの（firebase/ で npm run build:web）
kanri.html              運営者ページ（確認待ちの公開・通報・処置・お知らせ）。noindex・どこからもリンクしない
emailjs/                お問い合わせメールの見た目（EmailJS のテンプレート本文）。EmailJS のダッシュボードに貼り付けて使う
firebase/               サーバー側（Cloud Functions・Firestore のルール・テスト）。手順は firebase/README.md
launch-checklist.md     星軍基地を正式に公開する前の確認リスト（設定・規約・法令・運営体制）
research.md             調査メモ・情報源・確度（更新前に必読）
operations.md           運営ガイド（非公式サイトとして守ること、更新手順）
```

## 情報の更新について

掲載している日付・数値・ハンドル名は変わることがあります。
どの情報がどこまで裏取りできているかは [`research.md`](research.md) にまとめてあります。
⚠️ が付いた項目は、公式アカウントの導線から確認したうえで更新してください。

## 修正・削除のご依頼

このリポジトリの Issue までご連絡ください。ご本人・権利者の方からのご連絡には最優先で対応します。
