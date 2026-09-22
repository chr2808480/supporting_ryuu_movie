# ryuu星軍 本部 — RyuU 非公式ファンクラブ

声真似配信者 **RyuU**（X: [@RyuU_Movie](https://x.com/RyuU_Movie)）さんを応援する、
**ファン有志による非公式・非営利**の応援サイトです。

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
| Twitch | [game_ryuu](https://www.twitch.tv/game_ryuu)（※要確認） |

ファンアート・感想のタグは **`#ryuu星軍`**。

## サイトの内容

- RyuU さんの紹介（声真似 / ゲーム配信 / 歌ってみた）とプロフィール早見表
- 視聴前の注意（ジョジョ 1〜9 部のネタバレ、並行世界の承太郎という設定）
- 公式リンク集と、似た名前の別アカウントへの注意喚起
- 定期配信（毎週土曜 13:00 JST）と次回までのカウントダウン
- 活動の歩み（年表）
- 応援のはじめ方と、応援マナー（やること / やらないこと）
- よくある質問

## 動かす

ビルド不要の静的サイトです。`index.html` をブラウザで開くだけで確認できます。

```bash
python3 -m http.server 8000   # → http://localhost:8000
```

公開手順（GitHub Pages）は [`docs/operations.md`](docs/operations.md) を参照してください。

## 構成

```
index.html              サイト本体（1 ページ完結）
assets/css/style.css    配色・レイアウト
assets/js/main.js       メニュー / 配信カウントダウン / タグコピー
docs/research.md        調査メモ・情報源・確度（更新前に必読）
docs/operations.md      運営ガイド（非公式サイトとして守ること、更新手順）
```

## 情報の更新について

掲載している日付・数値・ハンドル名は変わることがあります。
どの情報がどこまで裏取りできているかは [`docs/research.md`](docs/research.md) にまとめてあります。
⚠️ が付いた項目は、公式アカウントの導線から確認したうえで更新してください。

## 修正・削除のご依頼

このリポジトリの Issue までご連絡ください。ご本人・権利者の方からのご連絡には最優先で対応します。
