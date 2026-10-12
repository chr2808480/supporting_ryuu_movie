/*!
 * ryuu星軍 本部 — 星軍基地 運営者ページ（kanri.html）
 * 確認待ちの公開・通報への対応・処置（注意／非表示／7日間の投稿停止／利用停止）・お知らせの編集。
 * 処置そのものはサーバー側（firebase/functions/index.js の adminAct）が記録し、本人への通知は運営者のメールから送る。
 */
(function () {
  "use strict";

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === "text") node.textContent = v;
      else if (k === "className") node.className = v;
      else node.setAttribute(k, v === true ? "" : String(v));
    });
    (children || []).forEach(function (c) {
      if (c) node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return node;
  }
  var toastEl = $("#toast"), toastTimer;
  function toast(message) {
    toastEl.textContent = message;
    toastEl.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("is-visible"); }, 3000);
  }

  var JST = 9 * 3600 * 1000;
  function jst(ms) {
    var d = new Date(ms + JST);
    return (d.getUTCMonth() + 1) + "月" + d.getUTCDate() + "日 " + d.getUTCHours() + ":" + String(d.getUTCMinutes()).padStart(2, "0");
  }
  function ms(t) { return t && typeof t.toMillis === "function" ? t.toMillis() : 0; }

  // 基地のルール（hiroba.html #rules）の禁止事項。処置の記録と通知にそのまま書く
  var RULES = [
    "禁止事項1：個人情報の投稿", "禁止事項2：「中の人」や私生活の詮索", "禁止事項3：誹謗中傷・差別・脅迫・つきまとい",
    "禁止事項4：他の配信者・コミュニティへの攻撃", "禁止事項5：無断転載", "禁止事項6：なりすまし",
    "禁止事項7：宣伝・勧誘・金銭のやりとり", "禁止事項8：自作自演・処分の回避", "禁止事項9：無関係の投稿",
    "ネタバレの折りたたみ忘れ（お願い）", "利用規約 第7条"
  ];
  var LABEL = {
    warn: "運営からの注意", hide: "投稿の非表示", suspend: "7日間の投稿停止", ban: "利用停止",
    lift: "投稿停止の解除", restore: "投稿の再公開"
  };

  var statusEl = $("#kn-status");
  var loginForm = $("#kn-login");
  var claimBox = $("#kn-claim");
  var app = $("#kn-app");
  var conn = null;
  var picked = null;   // 処置の対象 { uid, postId, replyId, excerpt, info }

  if (!window.HB_FIREBASE || typeof window.HBConnect !== "function") {
    statusEl.textContent = "assets/js/hiroba-config.js に Firebase の接続先が設定されていません（firebase/README.md を参照）。";
    return;
  }

  window.HBConnect(window.HB_FIREBASE).then(function (c) {
    conn = c;
    return conn.finishSignIn().catch(function (e) { toast(e.message); });
  }).then(show).catch(function () {
    statusEl.textContent = "読み込めませんでした。時間をおいて、ページを開き直してください。";
  });

  /* ------------------------------------------------ ログインと権限 */
  async function show() {
    var user = conn.auth.currentUser;
    loginForm.hidden = !!user;
    claimBox.hidden = true;
    app.hidden = true;
    statusEl.textContent = "";
    if (!user) { statusEl.textContent = "運営者のメールアドレスでログインしてください。"; return; }

    var token = await user.getIdTokenResult(true);
    statusEl.appendChild(el("span", { text: user.email + " でログイン中" }));
    statusEl.appendChild(el("button", { type: "button", className: "hb-chip", id: "kn-logout", text: "ログアウト" }));
    if (token.claims.admin !== true) { claimBox.hidden = false; return; }
    app.hidden = false;
    await loadAll();
  }

  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var email = $("#kn-email").value.trim();
    if (!email) return;
    conn.sendLink(email).then(function () { toast("ログイン用のリンクを送りました。メールを開いてください"); })
      .catch(function (err) { toast(err.message); });
  });
  $("#kn-claim-btn").addEventListener("click", function () {
    conn.call("claimAdmin").then(show).catch(function (err) { toast(err.message); });
  });
  statusEl.addEventListener("click", function (e) {
    if (e.target.id === "kn-logout") conn.F.signOut(conn.auth).then(show);
  });

  /* ------------------------------------------------ 一覧 */
  async function loadAll() {
    var F = conn.F, db = conn.db, Q = F.query, W = F.where, O = F.orderBy, L = F.limit;
    var r = await Promise.all([
      F.getDoc(F.doc(db, "config/site")),
      F.getDocs(Q(F.collection(db, "posts"), W("state", "==", "held"), O("createdAt", "desc"), L(50))),
      F.getDocs(Q(F.collectionGroup(db, "replies"), W("state", "==", "held"), O("createdAt", "desc"), L(50))),
      F.getDocs(Q(F.collection(db, "reports"), W("status", "==", "open"), O("createdAt", "desc"), L(50))),
      F.getDocs(Q(F.collection(db, "posts"), W("state", "==", "hidden"), O("createdAt", "desc"), L(50))),
      F.getDocs(Q(F.collectionGroup(db, "replies"), W("state", "==", "hidden"), O("createdAt", "desc"), L(50)))
    ]);

    var site = r[0].exists() ? r[0].data() : {};
    var siteForm = $("#kn-site");
    siteForm.elements.absent.checked = !!site.absent;
    siteForm.elements.news.value = (site.news || []).join("\n");

    function asItem(d, isReply) {
      var x = d.data();
      return { postId: isReply ? x.postId : d.id, replyId: isReply ? d.id : null, uid: x.authorUid, handle: x.authorHandle, body: x.body, at: ms(x.createdAt), isReply: isReply };
    }
    renderList($("#kn-held"), r[1].docs.map(function (d) { return asItem(d, false); }).concat(r[2].docs.map(function (d) { return asItem(d, true); })), "確認待ちはありません。", function (it) {
      return [
        el("button", { type: "button", className: "btn btn-primary hb-btn", "data-do": "approve", text: "公開する" }),
        el("button", { type: "button", className: "hb-chip is-danger", "data-do": "pick", text: "非表示・処置へ" })
      ];
    });
    renderList($("#kn-hidden"), r[4].docs.map(function (d) { return asItem(d, false); }).concat(r[5].docs.map(function (d) { return asItem(d, true); })), "非表示にした投稿はありません。", function () {
      return [el("button", { type: "button", className: "hb-chip", "data-do": "restore", text: "公開に戻す（異議が通った）" })];
    });

    var reports = r[3].docs.map(function (d) {
      var x = d.data();
      return { reportId: d.id, postId: x.postId, replyId: x.replyId, uid: x.targetUid, body: x.excerpt, at: ms(x.createdAt), reason: x.reason, note: x.note, isReply: !!x.replyId };
    });
    renderList($("#kn-reports"), reports, "未対応の通報はありません。", function () {
      return [
        el("button", { type: "button", className: "hb-chip is-danger", "data-do": "pick", text: "投稿者への処置へ" }),
        el("button", { type: "button", className: "hb-chip", "data-do": "resolve", text: "対応済みにする" })
      ];
    });
  }

  function renderList(box, items, emptyText, buttons) {
    box.textContent = "";
    if (!items.length) { box.appendChild(el("p", { className: "hb-menu-note", text: emptyText })); return; }
    items.sort(function (a, b) { return b.at - a.at; }).forEach(function (it) {
      var meta = (it.handle ? it.handle + " さん・" : "") + (it.isReply ? "返信・" : "投稿・") + jst(it.at) + (it.reason ? "・通報の理由：" + it.reason : "");
      var card = el("article", { className: "hb-panel kn-item" }, [
        el("p", { className: "kn-meta", text: meta }),
        el("p", { className: "hb-body", text: it.body || "（投稿は削除済み）" }),
        it.note ? el("p", { className: "kn-meta", text: "補足：" + it.note }) : null,
        el("div", { className: "kn-buttons" }, buttons(it))
      ]);
      card._item = it;
      box.appendChild(card);
    });
  }

  app.addEventListener("click", function (e) {
    var b = e.target.closest("[data-do]");
    if (!b) return;
    var card = b.closest(".kn-item");
    var it = card && card._item;
    var what = b.getAttribute("data-do");
    if (what === "approve") run(conn.call("adminAct", { action: "approve", postId: it.postId, replyId: it.replyId }), "公開しました");
    if (what === "restore") run(conn.call("adminAct", { action: "restore", postId: it.postId, replyId: it.replyId }), "公開に戻しました。本人に知らせてください");
    if (what === "resolve") run(conn.call("adminResolveReport", { reportId: it.reportId }), "対応済みにしました");
    if (what === "pick") pick(it);
  });

  function run(job, message) {
    return job.then(loadAll).then(function () { toast(message); }).catch(function (err) { toast(err.message); });
  }

  $("#kn-site").addEventListener("submit", function (e) {
    e.preventDefault();
    var f = e.target;
    run(conn.call("adminSetSite", { absent: f.elements.absent.checked, news: f.elements.news.value.split("\n") }), "保存しました");
  });

  /* ------------------------------------------------ 利用者への処置 */
  async function pick(it) {
    if (!it.uid) { toast("投稿者が分かりません（退会済みの可能性があります）"); return; }
    try {
      var info = await conn.call("adminUserInfo", { uid: it.uid });
      picked = { uid: it.uid, postId: it.postId, replyId: it.replyId, excerpt: it.body, info: info };
      renderUser();
      $("#kn-user-block").hidden = false;
      $("#kn-user-block").scrollIntoView({ behavior: "smooth" });
    } catch (err) {
      toast(err.message);
    }
  }

  function renderUser(done) {
    var box = $("#kn-user");
    var info = picked.info;
    box.textContent = "";
    box.appendChild(el("p", { className: "hb-menu-name", text: info.handle + " さん" }));
    box.appendChild(el("p", { className: "kn-meta", text:
      "違反の回数：" + info.violations + "（3回で利用停止の目安）" +
      (info.suspendedUntil && info.suspendedUntil > Date.now() ? "・投稿停止中（" + jst(info.suspendedUntil) + "まで）" : "") +
      (info.status === "banned" ? "・利用停止済み" : "") }));
    if (info.history.length) {
      box.appendChild(el("ul", { className: "kn-history" }, info.history.map(function (h) {
        return el("li", { text: jst(h.createdAt) + " " + (LABEL[h.action] || h.action) + "：" + (h.rule || "") + (h.revoked ? "（取り消し）" : "") });
      })));
    }
    if (picked.excerpt) box.appendChild(el("p", { className: "hb-body", text: "対象：" + picked.excerpt }));

    if (done) {
      box.appendChild(el("p", { className: "hb-menu-note", text: "記録しました。本人に通知してください。" }));
      if (!info.email) {
        box.appendChild(el("p", { className: "hb-menu-note", text: "メールアドレスが残っていないため、通知できません。" }));
        return;
      }
      // メールアプリを開くリンクは、日本語の本文だと数千文字になり、アプリによっては途中で切れる。
      // 異議の申立て方は本文の最後にあるので、同じ本文をここにも出し、コピーして貼り付けられるようにする
      picked.notice = notice(info, done);
      box.appendChild(el("a", { className: "btn btn-primary hb-btn", href: mailto(picked.notice), text: "通知メールを作る" }));
      box.appendChild(el("p", { className: "hb-menu-note", text:
        "メールアプリで、本文が最後の「" + SIGNATURE + "」まで入っているか確かめてから送ってください。切れていたり、メールアプリが開かなかったりしたときは、下の宛先・件名・本文をコピーして、運営用のメールから送ってください。" }));
      var body = el("textarea", { className: "hb-textarea", id: "kn-notice-body", rows: 12, readonly: true, "aria-label": "通知メールの本文" });
      body.value = picked.notice.body;
      box.appendChild(el("dl", { className: "kn-notice" }, [
        el("dt", { text: "宛先" }), el("dd", { text: picked.notice.to }),
        el("dt", { text: "件名" }), el("dd", { text: picked.notice.subject })
      ]));
      box.appendChild(body);
      box.appendChild(el("div", { className: "kn-buttons" }, [
        el("button", { type: "button", className: "hb-chip", "data-copy": "to", text: "宛先をコピー" }),
        el("button", { type: "button", className: "hb-chip", "data-copy": "subject", text: "件名をコピー" }),
        el("button", { type: "button", className: "hb-chip", "data-copy": "body", text: "本文をコピー" })
      ]));
      return;
    }

    var form = el("form", { className: "kn-form", id: "kn-act" }, [
      el("label", { className: "cf-field" }, [
        el("span", { text: "処置" }),
        el("select", { className: "hb-input", name: "action" }, [
          el("option", { value: "warn", text: LABEL.warn + "（初回・悪意のない違反）" }),
          picked.postId ? el("option", { value: "hide", text: LABEL.hide + "（禁止事項に当たる）" }) : null,
          el("option", { value: "suspend", text: LABEL.suspend + "（同じ違反の2回目）" }),
          el("option", { value: "ban", text: LABEL.ban + "（違反が計3回・晒し・脅迫など）" }),
          el("option", { value: "lift", text: LABEL.lift + "（異議が通った）" })
        ])
      ]),
      el("label", { className: "cf-field" }, [
        el("span", { text: "当たるルール" }),
        el("input", { className: "hb-input", name: "rule", list: "kn-rules", autocomplete: "off" })
      ]),
      el("datalist", { id: "kn-rules" }, RULES.map(function (r) { return el("option", { value: r }); })),
      el("label", { className: "cf-field" }, [
        el("span", { text: "理由（本人への通知に書く）" }),
        el("textarea", { className: "hb-textarea", name: "reason", rows: 3 })
      ]),
      el("p", { className: "hb-menu-note", text: "利用停止にすると、ログイン情報と、その人の投稿・返信がすべて削除されます（元に戻せません）。" }),
      el("div", { className: "kn-buttons" }, [
        el("button", { type: "submit", className: "btn btn-primary hb-btn", text: "記録する" }),
        el("button", { type: "button", className: "hb-chip", "data-close-user": "", text: "閉じる" })
      ])
    ]);
    box.appendChild(form);
  }

  $("#kn-user").addEventListener("click", function (e) {
    if (e.target.closest("[data-close-user]")) { $("#kn-user-block").hidden = true; picked = null; return; }
    var copy = e.target.closest("[data-copy]");
    if (copy && picked && picked.notice) copyText(picked.notice[copy.getAttribute("data-copy")]);
  });

  function copyText(text) {
    function fallback() {
      var area = $("#kn-notice-body");
      var keep = area.value;
      area.value = text;
      area.select();
      var ok = false;
      try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
      area.value = keep;
      toast(ok ? "コピーしました" : "コピーできませんでした。本文の欄を長押し（右クリック）してコピーしてください");
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { toast("コピーしました"); }, fallback);
    } else {
      fallback();
    }
  }
  $("#kn-user").addEventListener("submit", function (e) {
    e.preventDefault();
    var f = e.target;
    var act = {
      action: f.elements.action.value, rule: f.elements.rule.value.trim(), reason: f.elements.reason.value.trim(),
      uid: picked.uid, postId: f.elements.action.value === "hide" ? picked.postId : null,
      replyId: f.elements.action.value === "hide" ? picked.replyId : null
    };
    if (act.action !== "lift" && !act.rule) { toast("当たるルールを書いてください"); return; }
    if (act.action === "ban" && !window.confirm(picked.info.handle + " さんを利用停止にします。ログイン情報と、投稿・返信がすべて削除され、元に戻せません。")) return;
    f.querySelector('button[type="submit"]').disabled = true;
    conn.call("adminAct", act).then(function (res) {
      act.until = res && res.until;
      act.excerpt = act.postId ? picked.excerpt : null;
      renderUser(act);
      return loadAll();
    }).catch(function (err) {
      toast(err.message);
      f.querySelector('button[type="submit"]').disabled = false;
    });
  });

  // 利用規約 第8条：どの投稿がどのルールに当たるか・処置の内容と期間・異議の申立て方を知らせる
  var SIGNATURE = "ryuu星軍 本部 運営";
  function notice(info, act) {
    var base = location.href.replace(/kanri\.html.*$/, "");
    var undo = act.action === "lift" || act.action === "restore";
    var lines = [
      info.handle + " さん", "",
      "星軍基地の運営です。" + (undo ? "異議の申立てを確認し、次のとおり処置を取り消しました。" : "基地のルールに沿って、次の処置をしました。"), "",
      "■ 対象の投稿：" + (act.excerpt || "（アカウント全体）"),
      "■ 当たるルール：" + (act.rule || "—"),
      "■ 処置の内容：" + LABEL[act.action] + (act.until ? "（" + jst(act.until) + "まで）" : ""),
      "■ 理由：" + (act.reason || "—"), ""
    ];
    if (!undo) {
      lines.push(
        "この処置に納得できない場合は、この通知を受け取った日から14日以内に、お問い合わせフォーム（" + base + "contact.html）で「星軍基地の投稿の削除依頼・処置への異議」を選び、異議を申し立ててください。異議の申立ては、1つの処置につき1回です。",
        ""
      );
    }
    lines.push(SIGNATURE);
    return { to: info.email, subject: "【星軍基地】運営からのお知らせ", body: lines.join("\n") };
  }
  function mailto(n) {
    return "mailto:" + encodeURIComponent(n.to) + "?subject=" + encodeURIComponent(n.subject) + "&body=" + encodeURIComponent(n.body);
  }
})();
