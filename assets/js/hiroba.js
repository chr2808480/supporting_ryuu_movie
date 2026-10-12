/*!
 * ryuu星軍 本部 — 星軍基地（ページ案）
 * hiroba-config.js に接続先がなければデモとして動き、投稿・通報・登録はどこにも送信しない。
 * 接続先があれば Firebase につなぐ（hiroba-firebase.js）。受付時間・往復回数・個人情報らしい文字列・
 * 保留の判定はサーバー側の関数でも行う（ブラウザ側だけのチェックは簡単にすり抜けられるため）。
 * 投稿・返信の authorId は、デモでは表示名、本番では利用者の ID。
 */
(function () {
  "use strict";

  var CONFIG = {
    closedFrom: 23,                      // 新規投稿を止める時刻（日本時間）
    closedUntil: 6,                      // 新規投稿を再開する時刻（日本時間）
    replyLimit: 3,                       // 同じ相手とのやりとりの上限
    replyWindowMs: 24 * 60 * 60 * 1000   // 上限を数える期間
  };

  var MIN = 60 * 1000, HOUR = 60 * MIN, DAY = 24 * HOUR;
  var JST_OFFSET = 9 * HOUR;   // 端末のタイムゾーンに左右されないよう、日本時間は UTC から計算する
  var DEMO_HANDLE = "あなた（デモ）";

  /* ------------------------------------------------ サンプル投稿（実在の人物・発言ではありません） */
  var seq = 0;
  function nextId() { seq += 1; return "p" + seq; }

  function sample(author, tag, body, ago, extra) {
    var p = { id: nextId(), authorId: author, author: author, tag: tag, body: body, at: Date.now() - ago, stars: 0, spoiler: false, held: false, replies: [] };
    if (extra) Object.keys(extra).forEach(function (k) { p[k] = extra[k]; });
    return p;
  }
  function sampleReply(author, to, body, ago) {
    return { id: nextId(), authorId: author, author: author, toId: to, to: to, body: body, at: Date.now() - ago };
  }

  var live = null;   // Firebase につないだときの窓口（hiroba-firebase.js）。null ならデモ

  var state = {
    me: null,          // 自分の表示名
    meId: null,        // 自分の ID（デモでは表示名と同じ）
    suspendedUntil: 0, // 投稿停止の期限
    site: { absent: false, news: [] },
    notices: [],       // 自分が受けた処置
    loading: false,    // 本番で読み込み中（終わるまで操作を受け付けない。デモの動きに落ちないように）
    demoNight: false,
    demoAbsent: false,
    filter: "all",
    muted: [],         // { id, name }
    blocked: [],       // { id, name }
    starred: {},
    popStar: null,     // 「オラ！」を弾ませる投稿の id（押した直後だけ）
    replyLog: [],      // { to: 相手の ID, at: 時刻 }
    replyingTo: null,  // 返信フォームを開いている投稿の id
    editing: null,     // 編集中の投稿の id
    editWarned: false,
    openSpoilers: {},  // 開いたネタバレ折りたたみ（描き直しても閉じないように）
    piiAccepted: false,
    posts: [
      sample("しずかな流れ星", "感想",
        "（サンプル）土曜の配信、ゲームの説明まで承太郎の声のままで、最後まで笑いっぱなしでした。初めての人にもすすめたい回。",
        40 * MIN, { replies: [sampleReply("星屑ノート", "しずかな流れ星", "（サンプル）わかります、ツッコミまで声が崩れないのがすごい。", 25 * MIN)] }),
      sample("はじめての星", "質問",
        "（サンプル）最近知りました。最初に観るならどの動画がいいですか？ ジョジョはアニメで少し観たくらいです。",
        3 * HOUR, { replies: [sampleReply("しずかな流れ星", "はじめての星", "（サンプル）本部の「入軍案内」にあるゲーム実況のプレイリストから入るのがおすすめです！", 2 * HOUR)] }),
      sample("夜ふかしの星", "感想",
        "（サンプル）ここに、原作のうちアニメ化されていない範囲に触れる感想が入ります。折りたたみを開いた人だけが読めます。",
        DAY + 2 * HOUR, { spoiler: true }),
      sample("星屑ノート", "おすすめ動画",
        "（サンプル）歌ってみたも聴いてほしい。YouTube のチャンネルから探せます。",
        2 * DAY + 5 * HOUR),
      sample("まったり星見", "雑談",
        "（サンプル）#ryuu星軍 のタグで流れてくるファンアートを見るのが、毎週の楽しみになっています。",
        3 * DAY + 8 * HOUR)
    ]
  };

  /* ------------------------------------------------ 小道具 */
  var $ = function (sel, root) { return (root || document).querySelector(sel); };

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v === null || v === undefined || v === false) return;
        if (k === "text") node.textContent = v;
        else if (k === "className") node.className = v;
        else node.setAttribute(k, v === true ? "" : String(v));
      });
    }
    (children || []).forEach(function (c) {
      if (c) node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return node;
  }

  var toastEl = $("#toast");
  var toastTimer;
  function toast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("is-visible"); }, 2600);
  }

  function jstHour(t) { return new Date(t + JST_OFFSET).getUTCHours(); }

  function timeLabel(t) {
    var d = Date.now() - t;
    if (d < MIN) return "たった今";
    if (d < HOUR) return Math.floor(d / MIN) + "分前";
    if (d < DAY) return Math.floor(d / HOUR) + "時間前";
    var j = new Date(t + JST_OFFSET);
    return (j.getUTCMonth() + 1) + "月" + j.getUTCDate() + "日";
  }

  function isMine(id) { return !!state.meId && id === state.meId; }
  function listed(list, id) { return list.some(function (m) { return m.id === id; }); }
  function isHidden(id) { return listed(state.muted, id) || listed(state.blocked, id); }
  function findPost(id) {
    for (var i = 0; i < state.posts.length; i++) if (state.posts[i].id === id) return state.posts[i];
    return null;
  }

  /* ------------------------------------------------ 受付時間（毎日23時〜6時と、運営者の不在中は止める） */
  function postingState() {
    var h = jstHour(Date.now());
    if (state.suspendedUntil > Date.now()) return { open: false, reason: "suspended" };
    if (state.demoNight || h >= CONFIG.closedFrom || h < CONFIG.closedUntil) return { open: false, reason: "night" };
    if (state.demoAbsent || state.site.absent) return { open: false, reason: "absent" };
    return { open: true };
  }

  var CLOSED_TEXT = {
    night: "ただいま新規投稿をお休みしています（毎日23:00〜6:00・日本時間）。6:00に再開します。閲覧はいつでもできます。",
    absent: "運営者が不在のため、新規投稿をお休みしています。閲覧はできます。再開はお知らせ欄で告知します。",
    suspended: "運営の処置により、投稿を停止しています。期限や理由は、登録したメールアドレスにお送りしています。"
  };

  /* ------------------------------------------------ 個人情報らしい文字列（投稿前に警告するだけ。判定は目安） */
  var PII_PATTERNS = [
    { label: "電話番号", re: /(?:^|[^\d])(?:\+81[-\s]?\d{1,4}|0\d{1,4})[-\s]?\d{1,4}[-\s]?\d{4}(?!\d)/ },
    { label: "メールアドレス", re: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/ },
    { label: "住所", re: /(?:東京都|北海道|大阪府|京都府|[^\s、。]{2,3}県)[^\s、。]{1,8}?[市区町村郡]|\d+\s*(?:丁目|番地)/ }
  ];

  function normalize(s) {
    return s
      .replace(/[０-９Ａ-Ｚａ-ｚ＠．＋]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) - 0xFEE0); })
      .replace(/[－ー―‐]/g, "-");
  }
  function detectPII(text) {
    var s = normalize(text);
    return PII_PATTERNS.filter(function (p) { return p.re.test(s); }).map(function (p) { return p.label; });
  }
  function hasLink(text) { return /https?:\/\/|www\./i.test(text); }

  /* ------------------------------------------------ 返信の上限（同じ相手と24時間で3回まで） */
  function repliesLeft(toId) {
    if (isMine(toId)) return Infinity;
    var since = Date.now() - CONFIG.replyWindowMs;
    var used = state.replyLog.filter(function (r) { return r.to === toId && r.at > since; }).length;
    return Math.max(0, CONFIG.replyLimit - used);
  }

  /* ================================================ 描画 */
  var statusEl = $("#hb-status");
  var joinBox = $("#hb-join");
  var form = $("#hb-form");
  var fields = $("#hb-fields");
  var closedEl = $("#hb-closed");
  var bodyEl = $("#hb-body");
  var countEl = $("#hb-count");
  var formMsg = $("#hb-form-msg");
  var piiBox = $("#hb-pii");
  var piiText = $("#hb-pii-text");
  var postsEl = $("#hb-posts");
  var hiddenNote = $("#hb-hidden-note");
  var menuEl = $("#hb-menu");

  function render() {
    var focusKey = document.activeElement && document.activeElement.getAttribute("data-key");
    renderStatus();
    renderComposer();
    renderFeed();
    renderMenu();
    renderDemo();
    if (focusKey) {
      var keyed = document.querySelectorAll("[data-key]");
      for (var i = 0; i < keyed.length; i++) {
        if (keyed[i].getAttribute("data-key") === focusKey) { keyed[i].focus(); break; }
      }
    }
  }

  function renderStatus() {
    var ps = postingState();
    statusEl.classList.toggle("is-open", ps.open);
    statusEl.textContent = "";
    if (ps.open) {
      statusEl.appendChild(el("span", null, [
        el("strong", { text: "投稿受付中" }),
        "　毎日23:00〜6:00（日本時間）と運営者の不在中は、新規投稿をお休みします。"
      ]));
    } else {
      statusEl.appendChild(el("span", null, [el("strong", { text: "投稿お休み中" }), "　" + CLOSED_TEXT[ps.reason]]));
    }
  }

  function renderComposer() {
    var ps = postingState();
    joinBox.hidden = !!state.me || state.loading;
    form.hidden = !state.me || state.loading;
    if (!state.me) return;
    $("#hb-me-name").textContent = state.me;
    fields.disabled = !ps.open;
    closedEl.hidden = ps.open;
    if (!ps.open) closedEl.textContent = CLOSED_TEXT[ps.reason];
  }

  function renderFeed() {
    postsEl.textContent = "";
    var hiddenCount = 0;
    var visible = state.posts.filter(function (p) {
      if (p.held && !isMine(p.authorId)) return false;
      if (isHidden(p.authorId)) { hiddenCount += 1; return false; }
      return state.filter === "all" || p.tag === state.filter;
    });

    hiddenNote.hidden = hiddenCount === 0;
    hiddenNote.textContent = "ミュート・ブロック中の人の投稿 " + hiddenCount + " 件を表示していません（相手には知らされません）。";

    if (!visible.length) {
      postsEl.appendChild(el("p", { className: "hb-panel hb-empty", text: "この話題の投稿はまだありません。" }));
      return;
    }
    visible.forEach(function (p) { postsEl.appendChild(renderPost(p)); });
  }

  function renderBody(p) {
    var body = el("p", { className: "hb-body", text: p.body });
    if (!p.spoiler) return body;
    return el("details", { className: "hb-spoiler", "data-id": p.id, open: !!state.openSpoilers[p.id] }, [
      el("summary", { text: "ネタバレを含む投稿です（開くと表示）" }),
      body
    ]);
  }

  function renderPost(p) {
    var mine = isMine(p.authorId);
    var head = el("header", { className: "hb-post-head" }, [
      el("span", { className: "hb-handle", text: p.author }),
      mine ? el("span", { className: "hb-you", text: "あなた" }) : null,
      el("span", { className: "hb-tag", text: p.tag }),
      el("time", { className: "hb-time", datetime: new Date(p.at).toISOString(), text: timeLabel(p.at) })
    ]);

    var article = el("article", { className: "hb-post" + (mine ? " is-mine" : ""), "aria-label": p.author + "さんの投稿" }, [head]);

    if (p.held) {
      article.appendChild(el("p", { className: "hb-hold", text: "運営の確認待ち（あなたにだけ表示）：リンクを含む投稿は、運営が確認してから公開されます。" }));
    }

    if (state.editing === p.id) {
      article.appendChild(renderEditForm(p));
    } else {
      article.appendChild(renderBody(p));
      article.appendChild(renderActions(p, mine));
    }

    var replies = p.replies.filter(function (r) { return !isHidden(r.authorId); });
    if (replies.length) {
      article.appendChild(el("ol", { className: "hb-replies", "aria-label": "返信" }, replies.map(function (r) {
        return renderReply(p, r);
      })));
    }

    if (state.replyingTo === p.id) article.appendChild(renderReplyForm(p));
    return article;
  }

  // 赤い打ち文字の ★（絵文字の ⭐ ではない）。記号名で読み上げられないよう、読み上げには「星」と伝える
  function starMark() {
    return el("span", { className: "hb-star-mark" }, [
      el("span", { "aria-hidden": "true", text: "★" }),
      el("span", { className: "sr-only", text: "星" })
    ]);
  }

  function renderActions(p, mine) {
    var actions = el("div", { className: "hb-actions" });

    // ★ の数は投稿者本人にだけ見せる（他人には数を出さない）
    if (mine) {
      actions.appendChild(el("span", { className: "hb-starcount" }, [
        starMark(), " ", el("strong", { text: String(p.stars) }), "（数はあなたにだけ表示）"
      ]));
    } else {
      // 押す前は ★ だけ。押したら ★ がほんのり光り「オラ！」と出す（もう一度押すと取り消し）
      var on = !!state.starred[p.id];
      actions.appendChild(el("button", {
        type: "button", className: "hb-act hb-star" + (state.popStar === p.id ? " is-pop" : ""),
        "data-action": "star", "data-id": p.id, "data-key": "star:" + p.id, "aria-pressed": on ? "true" : "false"
      }, on
        ? [starMark(), el("span", { className: "hb-ora", text: "オラ！" })]
        : [starMark(), el("span", { className: "sr-only", text: "を送る" })]
      ));
    }

    actions.appendChild(el("button", {
      type: "button", className: "hb-act", "data-action": "reply", "data-id": p.id, "data-key": "reply:" + p.id,
      "aria-expanded": state.replyingTo === p.id ? "true" : "false", text: "返信"
    }));

    actions.appendChild(renderMore(p, mine));
    return actions;
  }

  function menuButton(action, id, label, sub, danger) {
    return el("button", { type: "button", className: danger ? "is-danger" : null, "data-action": action, "data-id": id, "data-key": action + ":" + id }, [
      label, sub ? el("small", { text: sub }) : null
    ]);
  }

  function renderMore(p, mine) {
    var items = mine
      ? [menuButton("edit", p.id, "編集する"), menuButton("delete", p.id, "削除する", null, true)]
      : [
          menuButton("report", p.id, "通報する", "相手には知らされません", true),
          menuButton("mute", p.id, p.author + " さんをミュート", "この人の投稿を表示しない"),
          menuButton("block", p.id, p.author + " さんをブロック", "表示しない＋あなたに返信できなくする")
        ];
    return el("details", { className: "hb-more" }, [
      el("summary", { "aria-label": "その他の操作", "data-key": "more:" + p.id, text: "…" }),
      el("div", { className: "hb-more-menu" }, items)
    ]);
  }

  function renderReply(p, r) {
    var mine = isMine(r.authorId);
    var actions = el("div", { className: "hb-actions" });
    if (mine) {
      actions.appendChild(el("button", { type: "button", className: "hb-act", "data-action": "delete-reply", "data-id": p.id, "data-reply": r.id, text: "削除" }));
    } else {
      actions.appendChild(el("button", { type: "button", className: "hb-act", "data-action": "report-reply", "data-id": p.id, "data-reply": r.id, text: "通報" }));
    }
    return el("li", { className: "hb-reply" }, [
      el("div", { className: "hb-post-head" }, [
        el("span", { className: "hb-handle", text: r.author }),
        mine ? el("span", { className: "hb-you", text: "あなた" }) : null,
        el("span", { className: "hb-to", text: "→ " + r.to }),
        el("time", { className: "hb-time", datetime: new Date(r.at).toISOString(), text: timeLabel(r.at) })
      ]),
      r.held ? el("p", { className: "hb-hold", text: "運営の確認待ち（あなたにだけ表示）：リンクを含む返信は、運営が確認してから公開されます。" }) : null,
      el("p", { className: "hb-body", text: r.body }),
      actions
    ]);
  }

  function renderReplyForm(p) {
    var wrap = el("form", { className: "hb-replyform", "data-reply-form": p.id, novalidate: true });

    if (!state.me) {
      wrap.appendChild(el("p", { className: "hb-limit", text: "返信するには参加登録が必要です。" }));
      wrap.appendChild(el("div", null, [el("button", { type: "button", className: "hb-chip", "data-open": "join", text: "基地に参加する" })]));
      return wrap;
    }

    var ps = postingState();
    var left = repliesLeft(p.authorId);
    var blocked = !ps.open || left === 0;
    var limitText;
    if (!ps.open) limitText = CLOSED_TEXT[ps.reason];
    else if (left === Infinity) limitText = "自分の投稿への返信です。";
    else if (left === 0) limitText = p.author + " さんとのやりとりが " + CONFIG.replyLimit + " 回に達しました。24時間たつと、また返信できます。";
    else limitText = p.author + " さんへの返信：あと " + left + " 回（同じ相手には24時間で" + CONFIG.replyLimit + "回まで）";

    var ta = el("textarea", { className: "hb-textarea", name: "reply", rows: 3, maxlength: 500, "aria-label": p.author + " さんへの返信", disabled: blocked });
    wrap.appendChild(ta);
    wrap.appendChild(el("p", { className: "hb-public", text: "この返信は誰でも見られます。" }));
    wrap.appendChild(el("div", { className: "hb-replyform-foot" }, [
      el("p", { className: "hb-limit" + (left === 0 ? " is-over" : ""), text: limitText }),
      el("button", { type: "submit", className: "btn btn-primary hb-btn", disabled: blocked, text: "返信する" })
    ]));
    wrap.appendChild(el("p", { className: "cf-status is-error", role: "status" }));
    return wrap;
  }

  function renderEditForm(p) {
    var f = el("form", { className: "hb-replyform", "data-edit-form": p.id, novalidate: true }, [
      el("label", { className: "sr-only", for: "edit-" + p.id, text: "投稿を編集" })
    ]);
    var ta = el("textarea", { className: "hb-textarea", id: "edit-" + p.id, name: "body", rows: 4, maxlength: 1000 });
    ta.value = p.body;
    f.appendChild(ta);
    f.appendChild(el("p", { className: "cf-status is-error", role: "status" }));
    f.appendChild(el("div", { className: "hb-replyform-foot" }, [
      el("button", { type: "button", className: "hb-chip", "data-action": "cancel-edit", "data-id": p.id, text: "やめる" }),
      el("button", { type: "submit", className: "btn btn-primary hb-btn", text: "保存する" })
    ]));
    return f;
  }

  function renderMenu() {
    menuEl.textContent = "";
    if (state.loading) {
      menuEl.appendChild(el("p", { className: "hb-menu-note", text: "読み込んでいます…" }));
      return;
    }
    if (!state.me) {
      menuEl.appendChild(el("p", { className: "hb-menu-note" }, ["参加すると、投稿・返信・", starMark(), "・ミュートができます。"]));
      menuEl.appendChild(el("div", { className: "hb-menu-buttons" }, [
        el("button", { type: "button", className: "hb-chip", "data-open": "join", text: "基地に参加する" })
      ]));
      return;
    }

    var list = el("ul", { className: "hb-menu-list" }, [
      el("li", null, [el("span", { className: "hb-menu-label", text: "表示名" }), el("div", { className: "hb-menu-name", text: state.me })]),
      mutedBlock("ミュート中", state.muted, "unmute"),
      mutedBlock("ブロック中", state.blocked, "unblock"),
      state.notices.length ? noticeBlock() : null
    ]);
    menuEl.appendChild(list);
    menuEl.appendChild(el("div", { className: "hb-menu-buttons" }, [
      el("button", { type: "button", className: "hb-chip", "data-action": "logout", text: "ログアウト" }),
      el("button", { type: "button", className: "hb-chip is-danger", "data-action": "leave", text: "退会する" })
    ]));
  }

  function mutedBlock(label, people, action) {
    var li = el("li", null, [el("span", { className: "hb-menu-label", text: label })]);
    if (!people.length) {
      li.appendChild(el("div", { className: "hb-menu-note", text: "なし" }));
      return li;
    }
    li.appendChild(el("ul", { className: "hb-muted" }, people.map(function (m) {
      return el("li", null, [
        el("span", { text: m.name }),
        el("button", { type: "button", className: "hb-chip", "data-action": action, "data-target": m.id, "data-key": action + ":" + m.id, text: "解除" })
      ]);
    })));
    return li;
  }

  var NOTICE_LABEL = { warn: "運営からの注意", hide: "投稿の非表示", suspend: "7日間の投稿停止", ban: "利用停止" };
  function dateLabel(t) {
    var j = new Date(t + JST_OFFSET);
    return (j.getUTCMonth() + 1) + "月" + j.getUTCDate() + "日";
  }
  function noticeBlock() {
    return el("li", null, [
      el("span", { className: "hb-menu-label", text: "あなたが受けた処置" }),
      el("ul", { className: "hb-muted" }, state.notices.map(function (n) {
        var text = dateLabel(n.at) + " " + (NOTICE_LABEL[n.action] || n.action) + (n.until ? "（" + dateLabel(n.until) + "まで）" : "") + (n.revoked ? "（取り消し）" : "");
        return el("li", null, [el("span", { text: text + (n.rule ? "：" + n.rule : "") })]);
      })),
      el("div", { className: "hb-menu-note", text: "詳しい理由と異議の申立て方は、登録したメールアドレスにお送りしています。" })
    ]);
  }

  function renderDemo() {
    setPressed('[data-demo="login"]', !!state.me, "ログインした状態にする", "ログアウトした状態にする");
    setPressed('[data-demo="night"]', state.demoNight);
    setPressed('[data-demo="absent"]', state.demoAbsent);
  }
  function setPressed(sel, on, offLabel, onLabel) {
    var b = $(sel);
    if (!b) return;
    b.setAttribute("aria-pressed", on ? "true" : "false");
    if (offLabel) b.textContent = on ? onLabel : offLabel;
  }

  /* ================================================ ダイアログ */
  var lastOpener = null;

  function openDialog(dlg) {
    lastOpener = document.activeElement;
    if (typeof dlg.showModal === "function") dlg.showModal();
    else dlg.setAttribute("open", "");
  }
  function closeDialog(dlg) {
    if (typeof dlg.close === "function") dlg.close();
    else dlg.removeAttribute("open");
  }
  document.querySelectorAll(".hb-dialog").forEach(function (dlg) {
    dlg.addEventListener("close", function () {
      if (lastOpener && document.contains(lastOpener)) lastOpener.focus();
      lastOpener = null;
    });
    dlg.addEventListener("click", function (e) {
      var c = e.target.closest("[data-close]");
      if (!c) return;
      if (c.tagName === "A") lastOpener = null;   // リンク先へ移動するので、元のボタンへ戻らない
      closeDialog(dlg);
    });
  });

  /* ---- 参加登録：ルール同意（16歳以上） → メールと表示名 */
  var joinDlg = $("#dlg-join");
  var joinForm = $("#join-form");
  var stepOne = $('[data-step="1"]', joinForm);
  var stepTwo = $('[data-step="2"]', joinForm);
  var nextBtn = $("[data-next]", joinForm);
  var joinMsg = $("#join-msg");

  var joinSubmit = $('button[type="submit"]', joinForm);

  // 本番で、ログイン済みだが表示名がまだのとき（別の端末でリンクを開いた・表示名が重なった）は、リンクを送らずに登録する
  function profileOnly() { return !!live && live.data.needsProfile; }

  function openJoin(message) {
    joinForm.reset();
    stepOne.hidden = false;
    stepTwo.hidden = true;
    nextBtn.disabled = true;
    joinMsg.textContent = message || "";
    joinForm.elements.email.readOnly = profileOnly();
    if (profileOnly()) joinForm.elements.email.value = live.email();
    joinSubmit.textContent = profileOnly() ? "参加する" : "ログイン用リンクを送る";
    openDialog(joinDlg);
  }

  joinForm.addEventListener("change", function () {
    nextBtn.disabled = !(joinForm.elements.age.checked && joinForm.elements.agree.checked);
  });
  nextBtn.addEventListener("click", function () {
    stepOne.hidden = true;
    stepTwo.hidden = false;
    joinForm.elements.email.focus();
  });
  $("[data-back]", joinForm).addEventListener("click", function () {
    stepTwo.hidden = true;
    stepOne.hidden = false;
    nextBtn.focus();
  });
  joinForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var email = joinForm.elements.email;
    var handle = joinForm.elements.handle.value.trim();
    if (!email.value || !email.checkValidity()) { joinMsg.textContent = "メールアドレスを正しく入力してください。"; email.focus(); return; }
    if (!handle) { joinMsg.textContent = "表示名を入力してください。"; joinForm.elements.handle.focus(); return; }
    if (detectPII(handle).length) { joinMsg.textContent = "表示名に連絡先や住所らしい文字列が含まれています。"; return; }

    if (live) {
      joinSubmit.disabled = true;
      joinMsg.textContent = "";
      var job = profileOnly()
        ? live.register(handle).then(reload).then(function () { closeDialog(joinDlg); toast("参加登録が済みました。ようこそ ★"); })
        : live.sendLink(email.value.trim(), handle).then(function () {
            closeDialog(joinDlg);
            toast("ログイン用のリンクを送りました。メールを開いてください");
          });
      job.catch(function (err) { joinMsg.textContent = err.message; })
        .then(function () { joinSubmit.disabled = false; });
      return;
    }

    if (handle === DEMO_HANDLE || state.posts.some(function (p) { return p.author === handle; })) {
      joinMsg.textContent = "その表示名はすでに使われています。";
      joinForm.elements.handle.focus();
      return;
    }
    state.me = handle;
    state.meId = handle;
    closeDialog(joinDlg);
    render();
    toast("（デモ）ログイン用リンクを送ったことにして、ログインしました");
  });

  /* ---- 通報 */
  var reportDlg = $("#dlg-report");
  var reportForm = $("#report-form");
  var reportMsg = $("#report-msg");

  var reportTarget = null;   // { postId, replyId }

  function openReport(text, target) {
    reportTarget = target;
    reportForm.reset();
    reportMsg.textContent = "";
    $("#report-quote").textContent = text.length > 120 ? text.slice(0, 120) + "…" : text;
    openDialog(reportDlg);
  }
  reportForm.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!reportForm.elements.reason.value) { reportMsg.textContent = "理由を選んでください。"; return; }
    if (live) {
      if (!state.me) { closeDialog(reportDlg); openJoin("通報するには参加登録が必要です。"); return; }
      var btn = $('button[type="submit"]', reportForm);
      btn.disabled = true;
      live.report(reportTarget.postId, reportTarget.replyId, reportForm.elements.reason.value, reportForm.elements.note.value.trim())
        .then(function () { closeDialog(reportDlg); toast("通報を受け付けました。ありがとうございます"); })
        .catch(function (err) { reportMsg.textContent = err.message; })
        .then(function () { btn.disabled = false; });
      return;
    }
    closeDialog(reportDlg);
    toast("通報を受け付けました。ありがとうございます");
  });

  /* ---- 確認（投稿の削除・退会） */
  var confirmDlg = $("#dlg-confirm");
  var confirmOk = $("#dlg-confirm-ok");
  var confirmAction = null;

  function askConfirm(title, text, okLabel, action) {
    $("#dlg-confirm-title").textContent = title;
    $("#dlg-confirm-text").textContent = text;
    confirmOk.textContent = okLabel;
    confirmAction = action;
    openDialog(confirmDlg);
  }
  confirmOk.addEventListener("click", function () {
    var action = confirmAction;
    confirmAction = null;
    closeDialog(confirmDlg);
    if (action) action();
  });

  /* ================================================ 操作 */
  function setFilter(tag) {
    state.filter = tag;
    document.querySelectorAll("[data-filter]").forEach(function (b) {
      b.setAttribute("aria-pressed", b.getAttribute("data-filter") === tag ? "true" : "false");
    });
    renderFeed();
  }

  function addPost() {
    var tag = form.elements.tag.value;
    var text = bodyEl.value.trim();
    var spoiler = form.elements.spoiler.checked;

    if (live) {
      var btn = $('button[type="submit"]', form);
      btn.disabled = true;
      live.createPost({ tag: tag, body: text, spoiler: spoiler, piiConfirmed: state.piiAccepted })
        .then(function (res) {
          clearComposer(tag);
          return reload().then(function () {
            toast(res.state === "held" ? "投稿しました。リンクを含むため、運営の確認後に公開されます" : "投稿しました ★");
          });
        })
        .catch(function (err) { piiBox.hidden = true; showFormError(err.message); })
        .then(function () { btn.disabled = false; });
      return;
    }

    var post = {
      id: nextId(), authorId: state.meId, author: state.me, tag: tag, body: text, at: Date.now(),
      stars: 0, spoiler: spoiler, held: hasLink(text), replies: []
    };
    state.posts.unshift(post);
    clearComposer(tag);
    render();
    toast(post.held ? "投稿しました。リンクを含むため、運営の確認後に公開されます" : "投稿しました ★");
  }

  function clearComposer(tag) {
    form.reset();
    state.piiAccepted = false;
    piiBox.hidden = true;
    countEl.textContent = "0 / 1000";
    if (state.filter !== "all" && state.filter !== tag) setFilter("all");
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    formMsg.textContent = "";
    formMsg.className = "cf-status";
    if (!postingState().open) return;
    if (!form.elements.tag.value) { showFormError("話題タグを一つ選んでください。"); return; }
    if (!bodyEl.value.trim()) { showFormError("投稿の内容を入力してください。"); bodyEl.focus(); return; }

    var found = detectPII(bodyEl.value);
    if (found.length && !state.piiAccepted) {
      piiText.textContent = found.join("・") + "らしい文字列が含まれています。この投稿は誰でも見られます。本当に公開しますか？";
      piiBox.hidden = false;
      $('[data-pii="fix"]').focus();
      return;
    }
    addPost();
  });

  function showFormError(message) {
    formMsg.textContent = message;
    formMsg.className = "cf-status is-error";
  }

  piiBox.addEventListener("click", function (e) {
    var b = e.target.closest("[data-pii]");
    if (!b) return;
    if (b.getAttribute("data-pii") === "fix") {
      piiBox.hidden = true;
      bodyEl.focus();
    } else {
      state.piiAccepted = true;
      addPost();
    }
  });

  bodyEl.addEventListener("input", function () {
    countEl.textContent = bodyEl.value.length + " / 1000";
    state.piiAccepted = false;
    piiBox.hidden = true;
  });

  document.querySelector(".hb-filter").addEventListener("click", function (e) {
    var b = e.target.closest("[data-filter]");
    if (b) setFilter(b.getAttribute("data-filter"));
  });

  // 返信・編集フォームの送信
  postsEl.addEventListener("submit", function (e) {
    e.preventDefault();
    var f = e.target;
    var msg = $(".cf-status", f);

    if (f.hasAttribute("data-reply-form")) {
      var p = findPost(f.getAttribute("data-reply-form"));
      var text = f.elements.reply.value.trim();
      if (!p || !postingState().open || repliesLeft(p.authorId) === 0) return;
      if (!text) { msg.textContent = "返信の内容を入力してください。"; return; }
      if (detectPII(text).length && !f.hasAttribute("data-warned")) {
        f.setAttribute("data-warned", "");
        msg.textContent = detectPII(text).join("・") + "らしい文字列が含まれています。もう一度押すと、そのまま返信します。";
        return;
      }
      if (live) {
        var rb = $('button[type="submit"]', f);
        rb.disabled = true;
        live.createReply(p.id, text, f.hasAttribute("data-warned"))
          .then(function (res) {
            state.replyingTo = null;
            return reload().then(function () {
              toast(res.state === "held" ? "返信しました。リンクを含むため、運営の確認後に公開されます" : "返信しました");
            });
          })
          .catch(function (err) { msg.textContent = err.message; rb.disabled = false; });
        return;
      }
      p.replies.push({ id: nextId(), authorId: state.meId, author: state.me, toId: p.authorId, to: p.author, body: text, at: Date.now() });
      if (!isMine(p.authorId)) state.replyLog.push({ to: p.authorId, at: Date.now() });
      state.replyingTo = null;
      render();
      toast("返信しました");
      return;
    }

    if (f.hasAttribute("data-edit-form")) {
      var post = findPost(f.getAttribute("data-edit-form"));
      var body = f.elements.body.value.trim();
      if (!post) return;
      if (!body) { msg.textContent = "内容を入力してください。"; return; }
      if (detectPII(body).length && !state.editWarned) {
        state.editWarned = true;
        msg.textContent = detectPII(body).join("・") + "らしい文字列が含まれています。この投稿は誰でも見られます。本当に公開しますか？";
        $('button[type="submit"]', f).textContent = "このまま保存する";
        return;
      }
      if (live) {
        var eb = $('button[type="submit"]', f);
        eb.disabled = true;
        live.editPost(post.id, body, state.editWarned)
          .then(function (res) {
            state.editing = null;
            state.editWarned = false;
            return reload().then(function () {
              toast(res.state === "held" ? "保存しました。運営の確認後に公開されます" : "保存しました");
            });
          })
          .catch(function (err) { msg.textContent = err.message; eb.disabled = false; });
        return;
      }
      post.body = body;
      post.held = post.held || hasLink(body);
      state.editing = null;
      state.editWarned = false;
      render();
      toast("保存しました");
    }
  });

  // ボタン類（投稿一覧・サイド・デモ操作）
  document.addEventListener("click", function (e) {
    // 開いている「…」メニューは、外側を押したら閉じる
    document.querySelectorAll(".hb-more[open]").forEach(function (d) {
      if (!d.contains(e.target)) d.removeAttribute("open");
    });

    if (state.loading) return;
    var opener = e.target.closest("[data-open]");
    if (opener) { openJoin(); return; }

    var demo = e.target.closest("[data-demo]");
    if (demo) { runDemo(demo.getAttribute("data-demo")); return; }

    var b = e.target.closest("[data-action]");
    if (!b) return;
    var action = b.getAttribute("data-action");
    var p = findPost(b.getAttribute("data-id"));

    switch (action) {
      case "star":
        if (!state.me) { openJoin(); return; }
        state.starred[p.id] = !state.starred[p.id];
        state.popStar = state.starred[p.id] ? p.id : null;   // 押した直後の1回だけ「オラ！」を弾ませる
        render();
        state.popStar = null;
        if (live) {
          live.toggleStar(p.id).catch(function (err) {
            state.starred[p.id] = !state.starred[p.id];
            render();
            toast(err.message);
          });
        }
        return;
      case "reply":
        state.replyingTo = state.replyingTo === p.id ? null : p.id;
        state.editing = null;
        render();
        var ta = $('[data-reply-form="' + p.id + '"] textarea');
        if (ta && !ta.disabled) ta.focus();
        return;
      case "report":
        var more = b.closest(".hb-more");
        if (more) { more.removeAttribute("open"); $("summary", more).focus(); }
        if (p) openReport(p.body, { postId: p.id, replyId: null });
        return;
      case "report-reply":
        var r = p && p.replies.filter(function (x) { return x.id === b.getAttribute("data-reply"); })[0];
        if (r) openReport(r.body, { postId: p.id, replyId: r.id });
        return;
      case "mute":
      case "block":
        if (!state.me) { openJoin(); return; }
        var list = action === "mute" ? state.muted : state.blocked;
        if (!listed(list, p.authorId)) list.push({ id: p.authorId, name: p.author });
        savePrefs();
        toast(p.author + " さんを" + (action === "mute" ? "ミュート" : "ブロック") + "しました（相手には知らされません）");
        break;
      case "unmute":
      case "unblock":
        var target = b.getAttribute("data-target");
        if (action === "unmute") state.muted = state.muted.filter(function (m) { return m.id !== target; });
        else state.blocked = state.blocked.filter(function (m) { return m.id !== target; });
        savePrefs();
        break;
      case "edit":
        state.editing = p.id;
        state.editWarned = false;
        state.replyingTo = null;
        render();
        var et = $('[data-edit-form="' + p.id + '"] textarea');
        if (et) et.focus();
        return;
      case "cancel-edit":
        state.editing = null;
        state.editWarned = false;
        break;
      case "delete":
        askConfirm("この投稿を削除しますか？", "削除した投稿は元に戻せません。", "削除する", function () {
          if (live) { liveRun(live.deletePost(p.id), "削除しました"); return; }
          state.posts = state.posts.filter(function (x) { return x.id !== p.id; });
          render();
          toast("削除しました");
        });
        return;
      case "delete-reply":
        var replyId = b.getAttribute("data-reply");
        askConfirm("この返信を削除しますか？", "削除した返信は元に戻せません。", "削除する", function () {
          if (live) { liveRun(live.deleteReply(p.id, replyId), "返信を削除しました"); return; }
          p.replies = p.replies.filter(function (x) { return x.id !== replyId; });
          render();
          toast("返信を削除しました");
        });
        return;
      case "logout":
        state.replyingTo = null;
        state.editing = null;
        if (live) { liveRun(live.logout(), "ログアウトしました"); return; }
        state.me = null;
        state.meId = null;
        break;
      case "leave":
        askConfirm("退会しますか？", "あなたの投稿・返信・メールアドレスをすべて削除します。元に戻せません。", "退会する", function () {
          state.replyingTo = null;
          state.editing = null;
          if (live) { liveRun(live.leave(), "退会しました。ご利用ありがとうございました"); return; }
          var me = state.meId;
          state.posts = state.posts.filter(function (x) { return x.authorId !== me; });
          state.posts.forEach(function (x) { x.replies = x.replies.filter(function (r) { return r.authorId !== me; }); });
          state.me = null;
          state.meId = null;
          state.muted = [];
          state.blocked = [];
          state.starred = {};
          state.replyLog = [];
          state.replyingTo = null;
          state.editing = null;
          render();
          toast("退会しました。ご利用ありがとうございました");
        });
        return;
      default:
        return;
    }
    render();
  });

  function runDemo(kind) {
    if (kind === "login") {
      if (state.me) { state.me = null; state.meId = null; state.replyingTo = null; state.editing = null; }
      else { state.me = DEMO_HANDLE; state.meId = DEMO_HANDLE; }
    }
    if (kind === "night") state.demoNight = !state.demoNight;
    if (kind === "absent") state.demoAbsent = !state.demoAbsent;
    render();
  }

  postsEl.addEventListener("toggle", function (e) {
    var d = e.target;
    if (d.classList && d.classList.contains("hb-spoiler")) state.openSpoilers[d.getAttribute("data-id")] = d.open;
  }, true);   // toggle は親へ伝わらないので、捕捉段階で受け取る

  /* ================================================ 本番（Firebase）とのやりとり */
  function sync() {
    var d = live.data;
    state.me = d.me ? d.me.handle : null;
    state.meId = d.me ? d.me.id : null;
    state.suspendedUntil = d.me ? d.me.suspendedUntil : 0;
    state.site = d.site;
    state.posts = d.posts;
    state.muted = d.muted;
    state.blocked = d.blocked;
    state.starred = d.starred;
    state.replyLog = d.replyLog;
    state.notices = d.notices;
  }
  function reload() {
    return live.refresh().then(function () { sync(); render(); renderNews(); });
  }
  function liveRun(job, okMessage) {
    return job.then(reload).then(function () { if (okMessage) toast(okMessage); })
      .catch(function (err) { toast(err.message); });
  }
  function savePrefs() {
    if (!live) return;
    live.savePrefs(state.muted, state.blocked).catch(function () { toast("設定を保存できませんでした。もう一度お試しください"); });
  }

  // お知らせ欄：運営者が kanri.html で書いたものと、毎日のお休みの案内
  function renderNews() {
    var list = $(".hb-news-list");
    if (!list || !live) return;
    list.textContent = "";
    state.site.news.forEach(function (n) { list.appendChild(el("li", { text: n })); });
    list.appendChild(el("li", { text: "毎日23:00〜6:00（日本時間）は新規投稿をお休みします。" }));
  }

  function boot() {
    var setup = window.HB_FIREBASE;
    if (!setup || typeof window.HBLive !== "function") { render(); return; }

    // 本番：デモの表示とサンプルを片づけてから読み込む
    document.querySelectorAll(".hb-demo").forEach(function (n) { n.hidden = true; });
    state.posts = [];
    state.loading = true;
    render();
    postsEl.textContent = "";
    postsEl.appendChild(el("p", { className: "hb-panel hb-empty", text: "読み込んでいます…" }));

    window.HBLive(setup).then(function (backend) {
      live = backend;
      state.loading = false;
      sync();
      render();
      renderNews();
      var signIn = live.signIn;
      if (signIn.error) {
        if (live.data.needsProfile) openJoin(signIn.error.message + " 別の表示名で登録してください。");
        else toast(signIn.error.message);
      } else if (signIn.result === "registered") {
        toast("参加登録が済みました。ようこそ ★");
      } else if (signIn.result === "signed-in") {
        toast("ログインしました");
      }
      if (!signIn.error && live.data.needsProfile) openJoin("表示名を決めて、参加登録を済ませてください。");
    }).catch(function () {
      postsEl.textContent = "";
      postsEl.appendChild(el("p", { className: "hb-panel hb-empty", text: "読み込めませんでした。時間をおいて、ページを開き直してください。" }));
    });
  }

  boot();
  // 受付状態と「○分前」の表示を1分ごとに更新する（投稿一覧は作り直さない）
  setInterval(function () {
    renderStatus();
    renderComposer();
    document.querySelectorAll("time.hb-time").forEach(function (t) {
      t.textContent = timeLabel(Date.parse(t.getAttribute("datetime")));
    });
  }, MIN);
})();
