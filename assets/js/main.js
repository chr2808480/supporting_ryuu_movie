/*!
 * ryuu星軍 本部 — RyuU 非公式ファンクラブ
 * 軽量な進行支援スクリプト（JS が無効でも本文は全て読めます）
 */
(function () {
  "use strict";

  /* ------------------------------------------------ ハンバーガーメニュー */
  var nav = document.querySelector(".site-nav");
  var toggle = nav && nav.querySelector(".nav-toggle");

  if (nav && toggle) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
    });

    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });

    document.addEventListener("click", function (e) {
      if (!nav.contains(e.target)) {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ------------------------------------------------ トースト */
  var toastEl = document.getElementById("toast");
  var toastTimer;

  function toast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.classList.remove("is-visible");
    }, 2200);
  }

  /* ------------------------------------------------ タグのコピー */
  document.querySelectorAll(".tag-copy").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var tag = btn.dataset.tag || "#ryuu星軍";

      var done = function () {
        btn.classList.add("is-copied");
        toast(tag + " をコピーしました ★");
        setTimeout(function () { btn.classList.remove("is-copied"); }, 1800);
      };

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(tag).then(done).catch(function () {
          toast("コピーできませんでした。手動でどうぞ： " + tag);
        });
      } else {
        toast("手動でコピーしてください： " + tag);
      }
    });
  });

  /* ------------------------------------------------ 年表記 */
  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  /* ------------------------------------------------ スクロール表示演出 */
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!reduceMotion && "IntersectionObserver" in window) {
    var targets = document.querySelectorAll(
      ".card, .step, .rule, .notice, .profile-block, .faq details"
    );

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

    targets.forEach(function (el, i) {
      el.classList.add("reveal");
      el.style.transitionDelay = (i % 4) * 60 + "ms";
      io.observe(el);
    });
  }
})();
