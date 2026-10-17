/*!
 * ryuu星軍 本部 — 星軍基地と Firebase をつなぐ部分
 * hiroba-config.js に接続先があるときだけ使う。読み取りは Firestore、書き込みはすべて Cloud Functions を通す
 * （ミュート・ブロックの設定だけは本人が直接保存する）。判定の本体は firebase/functions/index.js にある。
 */
(function () {
  "use strict";

  // ログイン用リンクを送ったメールアドレスと表示名。ログインし終えたら消す（プライバシーポリシー 8.）
  var PENDING_KEY = "hiroba.pendingSignIn";

  function readPending() {
    try { return JSON.parse(localStorage.getItem(PENDING_KEY) || "null"); } catch (e) { return null; }
  }
  function writePending(value) {
    try {
      if (value) localStorage.setItem(PENDING_KEY, JSON.stringify(value));
      else localStorage.removeItem(PENDING_KEY);
    } catch (e) { /* 保存できない環境では、リンクを開いたときにメールアドレスを聞く */ }
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = src;
      s.onload = resolve;
      s.onerror = function () { reject(new Error("load")); };
      document.head.appendChild(s);
    });
  }

  var AUTH_MESSAGES = {
    "auth/invalid-email": "メールアドレスを正しく入力してください。",
    "auth/invalid-action-code": "このリンクは使えません。期限切れか、すでに使われています。もう一度ログイン用リンクを送ってください。",
    "auth/expired-action-code": "このリンクは期限が切れています。もう一度ログイン用リンクを送ってください。",
    "auth/quota-exceeded": "ただいまログイン用のメールを送れません。時間をおいて、もう一度お試しください。",
    "auth/too-many-requests": "操作が続いたため、しばらくお待ちください。",
    "auth/network-request-failed": "通信できませんでした。電波のよいところで、もう一度お試しください。"
  };
  function friendly(e) {
    var err = new Error(AUTH_MESSAGES[e && e.code] || "うまくいきませんでした。時間をおいて、もう一度お試しください。");
    err.reason = e && e.code;
    return err;
  }

  // Firebase の部品を読み込み、接続する（星軍基地と運営者ページで共通）
  window.HBConnect = async function (setup) {
    await loadScript("assets/js/vendor/firebase-hiroba.js");
    var F = window.HBFirebase;
    var app = F.initializeApp(setup.config);
    var auth = F.initializeAuth(app, { persistence: [F.indexedDBLocalPersistence, F.browserLocalPersistence] });
    auth.languageCode = "ja";
    var db = F.getFirestore(app);
    var fns = F.getFunctions(app, setup.region || "asia-northeast1");
    if (setup.useEmulators) {
      F.connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
      F.connectFirestoreEmulator(db, "127.0.0.1", 8080);
      F.connectFunctionsEmulator(fns, "127.0.0.1", 5001);
    }

    async function call(name, payload) {
      try {
        return (await F.httpsCallable(fns, name)(payload || {})).data;
      } catch (e) {
        var internal = !e.message || e.code === "functions/internal" || e.code === "functions/unavailable";
        var err = new Error(internal ? "うまくいきませんでした。時間をおいて、もう一度お試しください。" : e.message);
        err.reason = e.details && e.details.reason;
        throw err;
      }
    }

    // メールのリンクから戻ってきたとき：ログインを済ませ、預けていた値（表示名など）を返す
    async function finishSignIn() {
      if (!F.isSignInWithEmailLink(auth, location.href)) return null;
      var clean = location.pathname + location.hash;
      var pending = readPending();
      var email = pending && pending.email;
      if (!email) email = window.prompt("確認のため、ログイン用リンクを受け取ったメールアドレスを入力してください。");
      if (!email) { history.replaceState(null, "", clean); return null; }
      try {
        await F.signInWithEmailLink(auth, email.trim(), location.href);
      } catch (e) {
        throw friendly(e);
      } finally {
        history.replaceState(null, "", clean);
      }
      writePending(null);
      return pending || {};
    }

    async function sendLink(email, extra) {
      try {
        await F.sendSignInLinkToEmail(auth, email, { url: location.origin + location.pathname, handleCodeInApp: true });
      } catch (e) {
        throw friendly(e);
      }
      writePending(Object.assign({ email: email }, extra || {}));
    }

    await auth.authStateReady();
    return { F: F, auth: auth, db: db, call: call, finishSignIn: finishSignIn, sendLink: sendLink };
  };

  window.HBLive = async function (setup) {
    var conn = await window.HBConnect(setup);
    var F = conn.F, auth = conn.auth, db = conn.db, call = conn.call;

    var data = {
      me: null,             // { id, handle, suspendedUntil, staff }
      needsProfile: false,  // ログインはしたが、表示名をまだ決めていない
      site: { absent: false, news: [] },
      posts: [], muted: [], blocked: [], starred: {}, replyLog: [], notices: [],
      hasMore: false        // 読み込んだ分より前の投稿がまだあるかもしれない
    };

    // 公開中の投稿は、新しい順に PAGE 件ずつ読む（Firestore のルールの上限が100件）。「もっと見る」を押すたびに1ページ増やし、
    // 読み直すとき（投稿したあとなど）も同じページ数だけ読む
    var PAGE = 100, REPLY_PAGE = 300, REPLY_PAGES_MAX = 10;
    var pages = 1;

    function ms(t) { return t && typeof t.toMillis === "function" ? t.toMillis() : 0; }

    async function loadMe() {
      var user = auth.currentUser;
      data.me = null;
      data.needsProfile = false;
      if (!user) return;
      var snap = await F.getDoc(F.doc(db, "users/" + user.uid));
      if (!snap.exists()) { data.needsProfile = true; return; }
      var u = snap.data();
      // 運営者かどうか（返信の上限の表示に使う。判定の本体はサーバー側）
      var claims = (await user.getIdTokenResult()).claims;
      data.me = { id: user.uid, handle: u.handle, suspendedUntil: ms(u.suspendedUntil), staff: claims.admin === true };
    }

    // 新しい順に読み、件数が上限に届いたら続きを読む。stop(最後の文書) が真なら、そこでやめる
    async function pagedDocs(base, size, maxPages, stop) {
      var docs = [], last = null;
      for (var i = 0; i < maxPages; i++) {
        var parts = base.slice();
        if (last) parts.push(F.startAfter(last));
        parts.push(F.limit(size));
        var snap = await F.getDocs(F.query.apply(null, parts));
        docs = docs.concat(snap.docs);
        if (snap.docs.length < size) return { docs: docs, more: false };
        last = snap.docs[snap.docs.length - 1];
        if (stop && stop(last)) break;
      }
      return { docs: docs, more: true };
    }

    async function loadAll() {
      var Q = F.query, W = F.where, O = F.orderBy, L = F.limit;
      var uid = data.me && data.me.id;
      var postPage = await pagedDocs([F.collection(db, "posts"), W("state", "==", "public"), O("createdAt", "desc")], PAGE, pages);
      // 返信は投稿より後に書かれるので、読んだ投稿のうち一番古いものより新しい返信を読めば足りる
      var oldest = postPage.docs.length ? ms(postPage.docs[postPage.docs.length - 1].data().createdAt) : 0;
      var jobs = [
        F.getDoc(F.doc(db, "config/site")),
        Promise.resolve(postPage),
        pagedDocs([F.collectionGroup(db, "replies"), W("state", "==", "public"), O("createdAt", "desc")], REPLY_PAGE, REPLY_PAGES_MAX,
          function (last) { return ms(last.data().createdAt) < oldest; })
      ];
      if (uid) {
        jobs.push(
          F.getDocs(Q(F.collection(db, "posts"), W("authorUid", "==", uid), W("state", "==", "held"), L(100))),
          F.getDocs(Q(F.collectionGroup(db, "replies"), W("authorUid", "==", uid), W("state", "==", "held"), L(300))),
          F.getDocs(Q(F.collection(db, "postStats"), W("authorUid", "==", uid), L(200))),
          F.getDocs(Q(F.collectionGroup(db, "stars"), W("uid", "==", uid), L(500))),
          F.getDoc(F.doc(db, "users/" + uid + "/private/prefs")),
          F.getDoc(F.doc(db, "users/" + uid + "/private/replyLog")),
          F.getDocs(Q(F.collection(db, "moderation"), W("targetUid", "==", uid), L(50)))
        );
      }
      var r = await Promise.all(jobs);

      var site = r[0].exists() ? r[0].data() : {};
      data.site = { absent: !!site.absent, news: Array.isArray(site.news) ? site.news : [] };

      var posts = {};
      function addPost(d) {
        var x = d.data();
        posts[d.id] = {
          id: d.id, authorId: x.authorUid, author: x.authorHandle, staff: x.byAdmin === true, tag: x.tag, body: x.body,
          at: ms(x.createdAt), spoiler: !!x.spoiler, held: x.state === "held", stars: 0, replies: []
        };
      }
      function addReply(d) {
        var x = d.data();
        var p = posts[x.postId];
        if (!p || p.replies.some(function (y) { return y.id === d.id; })) return;
        p.replies.push({
          id: d.id, authorId: x.authorUid, author: x.authorHandle, staff: x.byAdmin === true, toId: x.toUid, to: x.toHandle,
          body: x.body, at: ms(x.createdAt), held: x.state === "held"
        });
      }
      r[1].docs.forEach(addPost);
      if (uid) r[3].docs.forEach(addPost);
      r[2].docs.forEach(addReply);
      if (uid) r[4].docs.forEach(addReply);
      data.hasMore = postPage.more;

      data.starred = {};
      data.muted = [];
      data.blocked = [];
      data.replyLog = [];
      data.notices = [];
      if (uid) {
        r[5].docs.forEach(function (d) { if (posts[d.id]) posts[d.id].stars = d.data().stars || 0; });
        r[6].docs.forEach(function (d) { data.starred[d.data().postId] = true; });
        var prefs = r[7].exists() ? r[7].data() : {};
        function people(list) { return (list || []).map(function (m) { return { id: m.uid, name: m.handle }; }); }
        data.muted = people(prefs.muted);
        data.blocked = people(prefs.blocked);
        data.replyLog = r[8].exists() ? (r[8].data().entries || []) : [];
        data.notices = r[9].docs.map(function (d) {
          var x = d.data();
          return { action: x.action, rule: x.rule, until: ms(x.until), revoked: !!x.revoked, at: ms(x.createdAt) };
        }).sort(function (a, b) { return b.at - a.at; });
      }

      data.posts = Object.keys(posts).map(function (k) {
        posts[k].replies.sort(function (a, b) { return a.at - b.at; });
        return posts[k];
      }).sort(function (a, b) { return b.at - a.at; });
    }

    async function refresh() {
      await loadMe();
      await loadAll();
    }

    // メールのリンクから戻ってきたときの続き。表示名はリンクを送る前に預かっている
    async function finishSignIn() {
      var pending = await conn.finishSignIn();
      if (!pending) return null;
      if (pending.handle && pending.agreed) {
        await call("registerProfile", { handle: pending.handle, age16: true, agree: true });
        return "registered";
      }
      return "signed-in";
    }

    var signIn = { result: null, error: null };
    try { signIn.result = await finishSignIn(); } catch (e) { signIn.error = e; }
    await refresh();

    return {
      data: data,
      signIn: signIn,
      refresh: refresh,
      loadMore: function () { pages += 1; return loadAll(); },
      email: function () { return auth.currentUser ? auth.currentUser.email : ""; },

      sendLink: function (email, handle) { return conn.sendLink(email, { handle: handle, agreed: true }); },
      register: function (handle) { return call("registerProfile", { handle: handle, age16: true, agree: true }); },

      createPost: function (post) { return call("createPost", post); },
      createReply: function (postId, body, piiConfirmed) { return call("createReply", { postId: postId, body: body, piiConfirmed: piiConfirmed }); },
      editPost: function (postId, body, piiConfirmed) { return call("editPost", { postId: postId, body: body, piiConfirmed: piiConfirmed }); },
      deletePost: function (postId) { return call("deletePost", { postId: postId }); },
      deleteReply: function (postId, replyId) { return call("deleteReply", { postId: postId, replyId: replyId }); },
      toggleStar: function (postId) { return call("toggleStar", { postId: postId }); },
      report: function (postId, replyId, reason, note) {
        return call("submitReport", { postId: postId, replyId: replyId || null, reason: reason, note: note });
      },
      savePrefs: function (muted, blocked) {
        function plain(list) { return list.map(function (m) { return { uid: m.id, handle: m.name }; }); }
        return F.setDoc(F.doc(db, "users/" + data.me.id + "/private/prefs"), { muted: plain(muted), blocked: plain(blocked) });
      },
      logout: function () { return F.signOut(auth); },
      leave: async function () {
        await call("deleteAccount");
        await F.signOut(auth);
      }
    };
  };
})();
