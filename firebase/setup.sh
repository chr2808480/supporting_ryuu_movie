#!/usr/bin/env bash
# 星軍基地のサーバー側を Firebase に送る（デプロイする）ための手順を、1つにまとめたもの。
# Firebase コンソールの Cloud Shell で、firebase フォルダの中から次のように実行する（firebase/README.md 参照）。
#   bash setup.sh
# 何度実行しても大丈夫（登録済みの合言葉は作り直さない）。
set -euo pipefail
cd "$(dirname "$0")"

say()  { printf '\n\033[1;31m★\033[0m \033[1m%s\033[0m\n' "$*"; }
fail() { printf '\n\033[1;31m止まりました：\033[0m%s\n\n' "$*" >&2; exit 1; }
# 日本語入力のまま打った全角の文字（ｙ、全角の英数字や空白）も、半角にそろえて受け取る
ask()  { local answer; read -r -p "$1" answer; node -e 'process.stdout.write(process.argv[1].normalize("NFKC").trim())' "$answer"; }

# Cloud Shell には firebase コマンドが最初から入っている。なければ npx で取ってくる
if command -v firebase >/dev/null 2>&1; then FB=(firebase); else FB=(npx --yes firebase-tools@15.31.0); fi

# ---- Node.js（Firebase の道具を動かすのに使う）
major=$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0)
(( major >= 20 )) || fail "Node.js 20 以上が必要です（いまは $(node -v 2>/dev/null || echo 入っていません)）。"

say "星軍基地のサーバー側を、Firebase に設定します。"
cat <<'EOF'
始める前に、Firebase コンソールで次の4つが済んでいるか確かめてください（README の手順1〜4）。
  1. プロジェクトを作った
  2. Blaze プランにして、予算アラートを設定した
  3. Firestore Database を「asia-northeast1（東京）」に作った
  4. Authentication で「メール/パスワード」と「メールリンク」をオンにし、
     承認済みドメインに chr2808480.github.io を追加した
EOF
ok=$(ask "済んでいれば y を入力して Enter：")
[[ "$ok" == "y" || "$ok" == "Y" || "$ok" == "はい" ]] || fail "先に Firebase コンソールでの準備を済ませてから、もう一度 bash setup.sh を実行してください（済んでいるのに止まったときは、日本語入力をオフにして y を入力してください）。"

# ---- プロジェクト
default_project="${GOOGLE_CLOUD_PROJECT:-spporting-ryuu-movie}"
project=$(ask "プロジェクトID（表示のままでよければ、そのまま Enter）[$default_project]：")
project="${project:-$default_project}"

say "プロジェクト $project の Firestore を確かめています…"
db_err=$(mktemp)
if ! db_json=$("${FB[@]}" firestore:databases:get "(default)" --project "$project" --json 2>"$db_err"); then
  echo "---- Firebase からの返事（原因の手がかり）----"
  { printf '%s\n' "$db_json"; cat "$db_err"; } | grep -v '^\s*$' | tail -n 15
  echo "----------------------------------------------"
  rm -f "$db_err"
  fail "プロジェクト $project の Firestore Database を確かめられませんでした。手順3で Firestore を作ったかを確かめてください。作ってあるのに止まるときは、上の「Firebase からの返事」をコピーして Claude に貼ってください。"
fi
rm -f "$db_err"
location=$(printf '%s' "$db_json" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const j=JSON.parse(s);console.log((j.result&&(j.result.locationId||j.result.location))||"")}catch(e){console.log("")}})')
if [[ -n "$location" && "$location" != "asia-northeast1" ]]; then
  fail "Firestore の場所が $location になっています。プライバシーポリシーでは東京（asia-northeast1）としているため、このままでは進めません。Claude に相談してください。"
fi
echo "  → Firestore を確認しました（${location:-場所は確認できませんでした}）"

# ---- 運営者のメールアドレス（kanri.html にログインできる人）
envfile="functions/.env.$project"
current=""
[[ -f "$envfile" ]] && current=$(sed -n 's/^ADMIN_EMAILS=//p' "$envfile")
emails=$(ask "運営者ページにログインするメールアドレス（複数ならカンマ区切り）[${current}]：")
emails="${emails:-$current}"
emails="${emails// /}"
[[ "$emails" == *@* ]] || fail "メールアドレスを入力してください。"
printf 'ADMIN_EMAILS=%s\n' "$emails" > "$envfile"
echo "  → $envfile に保存しました（この Cloud Shell の中だけに置かれ、公開されません）"

# ---- サーバー側の部品
say "サーバー側の部品を準備しています（1〜2分かかります）…"
(cd functions && npm ci --no-audit --no-fund --loglevel=error)

# ---- 合言葉（IP アドレスの暗号化と、利用停止したメールアドレスの照合に使う）
# 作り直すと以前の記録が読めなくなるので、登録済みかどうかを2つの方法で確かめる
secret_exists() {
  "${FB[@]}" functions:secrets:access HIROBA_SECRET --project "$project" >/dev/null 2>&1 && return 0
  command -v gcloud >/dev/null 2>&1 && gcloud secrets describe HIROBA_SECRET --project "$project" >/dev/null 2>&1 && return 0
  return 1
}
if secret_exists; then
  say "合言葉（HIROBA_SECRET）はもう登録されているので、そのまま使います。"
else
  say "合言葉（HIROBA_SECRET）を作って、Firebase に登録します…"
  secret=$(node -e 'console.log(require("crypto").randomBytes(32).toString("base64url"))')
  tmp=$(mktemp)
  chmod 600 "$tmp"
  printf '%s' "$secret" > "$tmp"
  if ! "${FB[@]}" functions:secrets:set HIROBA_SECRET --data-file "$tmp" --project "$project"; then
    rm -f "$tmp"
    fail "合言葉を登録できませんでした。Blaze プランになっているか確かめて、もう一度 bash setup.sh を実行してください。"
  fi
  rm -f "$tmp"
  cat <<EOF

  ┌──────────────────────────────────────────────────────────────┐
    次の合言葉を、パスワード管理アプリなどに必ず控えてください。

        $secret

    ・開示請求を受けたとき、投稿者の IP アドレスを読むのに使います
    ・なくすと読めなくなります。人には見せないでください
  └──────────────────────────────────────────────────────────────┘
EOF
  ask "控えたら Enter を押してください：" >/dev/null
fi

# ---- 送る（デプロイ）
say "Firebase に送っています。初回は5〜10分ほどかかります…"
if ! "${FB[@]}" deploy --only firestore,functions --project "$project" --force; then
  fail "送るのに失敗しました。初回は Google 側の準備が間に合わないことがあります。5分ほど待ってから、もう一度 bash setup.sh を実行してください（合言葉は作り直しません）。それでも失敗するときは、表示された英語のメッセージを Claude に貼ってください。"
fi

say "できました！"
cat <<EOF
次にすること：
  1. Claude に「デプロイできた」と伝える
     （ページの接続設定を入れて、公開の準備をします）
  2. 公開されたら、次のページを開いて ${emails%%,*} でログインし、
     「運営者として有効にする」を押す
     https://chr2808480.github.io/supporting_ryuu_movie/kanri.html

自動削除（90日・1年）の設定は、有効になるまで少し時間がかかります。
EOF
