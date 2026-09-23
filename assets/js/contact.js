/*!
 * ryuu星軍 本部 — お問い合わせフォーム（EmailJS）
 */
(function () {
  "use strict";

  /*
   * EmailJS ダッシュボードで発行した値を入れてください（公開して問題ない値です）。
   *   publicKey  … Account → General → Public Key
   *   serviceId  … Email Services に追加したサービスの Service ID
   *   templateId … Email Templates で作ったテンプレートの Template ID
   * テンプレート本文ではフォームの name 属性と同じ変数が使えます：
   *   {{name}} {{email}} {{title}} {{message}}
   * （Reply To に {{email}} を指定しておくと、届いたメールからそのまま返信できます）
   */
  var EMAILJS = {
    publicKey:  "5X817nnLC3qenuVtC",
    serviceId:  "service_rwf3ey8",
    templateId: "template_w407ihr"
  };

  var form = document.getElementById("contact-form");
  if (!form) return;

  var submitBtn = form.querySelector(".cf-submit");
  var statusEl = form.querySelector(".cf-status");
  var ready = !!(window.emailjs && EMAILJS.publicKey && EMAILJS.serviceId && EMAILJS.templateId);

  function setStatus(message, type) {
    statusEl.textContent = message;
    statusEl.className = "cf-status" + (type ? " is-" + type : "");
  }

  if (ready) {
    window.emailjs.init({
      publicKey: EMAILJS.publicKey,
      blockHeadless: true,                           // ヘッドレスブラウザ（bot）からの送信を拒否
      limitRate: { id: "contact", throttle: 30000 }  // 同じ端末からの連投は 30 秒に 1 回まで
    });
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    if (!form.checkValidity()) {
      setStatus("メールアドレスと内容を正しく入力してください。", "error");
      form.reportValidity();
      return;
    }

    if (!ready) {
      setStatus("現在フォームから送信できません。時間をおいて再度お試しください。", "error");
      return;
    }

    submitBtn.disabled = true;
    setStatus("送信しています…");

    window.emailjs.sendForm(EMAILJS.serviceId, EMAILJS.templateId, form).then(function () {
      form.reset();
      setStatus("送信しました。ご連絡ありがとうございます★", "ok");
    }, function () {
      setStatus("送信に失敗しました。時間をおいて再度お試しください。", "error");
    }).then(function () {
      submitBtn.disabled = false;
    });
  });
})();
