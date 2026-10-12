# お問い合わせメールのテンプレート（EmailJS）

お問い合わせフォーム（`contact.html`）から運営者の Gmail に届くメールの見た目です。
EmailJS のテンプレートはダッシュボードに保存されるので、このファイルを書き換えただけでは変わりません。**中身を EmailJS に貼り付けて保存** してください。

| ファイル | 中身 |
| --- | --- |
| `contact-template.html` | テンプレートの本文（Content）。全部コピーして貼り付ける |

## 貼り付けかた

1. EmailJS のダッシュボード → **Email Templates** → いま使っているテンプレート（Template ID `template_w407ihr`）を開く
2. 本文（Content）の編集画面を、HTML のソースを直接書ける表示に切り替える
3. いまの本文を全部消してから、`contact-template.html` の中身を全部貼り付ける
4. 件名（Subject）は、一覧で種類が見分けられるように次をおすすめします
   ```
   【ryuu星軍 本部】{{title}}
   ```
5. **To Email・Reply To（`{{email}}`）・From は変えない**。本文だけ差し替えます
6. 保存して、サイトのフォームから **改行を入れた文** でテスト送信し、Gmail のパソコン版とスマホアプリで確かめる

使っている変数は、フォームの `name` 属性と同じ `{{name}}` `{{email}}` `{{title}}` `{{message}}` だけです（`assets/js/contact.js` は変えていません）。

## テスト送信で確かめること

- [ ] 内容の **改行がそのまま** 出ている。
  改行は `white-space:pre-wrap` で残しています。貼り付けたあと EmailJS の編集画面が HTML を整形して、`{{message}}` の前に改行や空白が入ると、本文の頭に空白が出ます。その場合は `...white-space:pre-wrap;word-break:break-word;">{{message}}</div>` が1行につながるように直してください
- [ ] 一覧のプレビュー（件名の横の灰色の文）に、内容の書き出しが出ている（本文の先頭に、内容を隠して入れてあります）
- [ ] スマホの Gmail をダークモードにしても読める。
  Gmail は `color-scheme` に対応していないので、ダークモードでの色の変え方は Gmail 任せになり、こちらでは決められません

## 変えるときの決まり

- 入力された値は必ず **二重かっこ**（`{{message}}` の形）で入れる。**三重かっこ（`{` と `}` を3つずつ重ねる形）にしない**。
  二重かっこは HTML をエスケープして文字として出します。三重かっこにすると、フォームに書かれた HTML がメールの中でそのまま効いてしまいます（EmailJS も危険だと注意しています）
- レイアウトは表（`<table>`）、スタイルは **タグに直接書く（インライン）**。
  Gmail は `<style>` を `<body>` の中では使えず、Gmail 以外のアカウントで読むアプリでは `<style>` 自体が効きません。`display:flex` なども同じです
- 色はサイトの5色（`assets/css/style.css` の `:root`）をもとに、白地で小さい文字が読めるよう2色だけ足しています。文字と背景のコントラスト比はどれも 4.5:1 以上（WCAG 2.x の AA）です

| 色 | 使いどころ | コントラスト比 |
| --- | --- | --- |
| `#1c1a20`（サイトの黒） | ヘッダーの背景・本文の文字 | 本文 16.8:1 |
| `#f7eaec`（サイトの白） | ヘッダーの文字・外側の背景 | ヘッダー 14.7:1 |
| `#e1c1c6`（サイトの淡いピンク） | ヘッダーの小さい文字 | 10.4:1 |
| `#ff4d5e`（サイトの赤） | ヘッダーの★・赤い線・内容の左の線 | 黒地の★ 5.3:1。白地では 3.2:1 しかないので、白地の **文字には使わない** |
| `#c4283a`（濃い赤・追加） | 白地の小見出し（★ お問い合わせの種類 など） | 5.5:1 |
| `#6b5f63`（灰・追加） | 白地の補足（項目名・返信のしかた） | 5.9:1 |

純白・真っ黒は、ダークモードで色が強く変わりやすいので使っていません（カードは `#fffbfb`）。

## 情報源

- EmailJS: [Dynamic variables in templates](https://www.emailjs.com/docs/user-guide/dynamic-variables-templates/)（二重かっこはエスケープされる、三重かっこはエスケープされず危険、渡されなかった変数は空になる）
- EmailJS: [Creating email templates](https://www.emailjs.com/docs/user-guide/creating-email-templates/) ／ [Can I send HTML emails?](https://www.emailjs.com/docs/faq/can-i-send-html-emails/) ／ [Can I send HTML from my code?](https://www.emailjs.com/docs/faq/can-i-send-html-from-my-code/)
- Google: [Gmail の CSS サポート](https://developers.google.com/workspace/gmail/design/css)
- Can I email（各メールアプリの HTML・CSS 対応表）: [`<style>`](https://www.caniemail.com/features/html-style/)（Gmail は `<body>` 内では不可・Gmail 以外のアカウントでは不可）／ [white-space](https://www.caniemail.com/features/css-white-space/)（Gmail は対応。アプリは Gmail 以外のアカウントでは不可、`pre` の値は不可）／ [color-scheme](https://www.caniemail.com/features/css-color-scheme/)（Gmail は不可）／ [display](https://www.caniemail.com/features/css-display/)（`display:none` は Gmail で可。`flex` などは Gmail 以外のアカウントでは不可）
- W3C: [WCAG 2.2 達成基準 1.4.3 コントラスト（最低限）](https://www.w3.org/TR/WCAG22/#contrast-minimum)
- eSputnik: [Dark Mode in Emails](https://docs.esputnik.com/docs/dark-mode-in-emails)（Gmail の iOS アプリは全反転、Android アプリは部分反転。純白・真っ黒を避ける）
