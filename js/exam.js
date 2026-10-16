/* 資格の選択と教材読込。URLを共有すると同じ資格が開く。 */
(function () {
  "use strict";
  var passport = new URLSearchParams(location.search).get("exam") === "passport";
  var config = window.EXAM_CONFIG = passport ? {
    id: "passport", title: "生成AIパスポート学習室", storeKey: "aipass_2027_store_v1",
    testSize: 60, testSeconds: 60 * 60, testLabel: "60問・60分・終了後に解説",
    coverage: "2027年版の5章を学ぶ基礎教材。詳細キーワードの完全網羅は未確認です。"
  } : {
    id: "g-kentei", title: "G検定ドリル", storeKey: "gken_store_v1",
    testSize: 20, testSeconds: 14 * 60, testLabel: "20問・14分・終了後に解説"
  };
  document.title = config.title;
  document.getElementById("topbar-title").textContent = config.title;
  document.querySelector('meta[name="description"]').content = config.title + "。教科書・四択演習・苦手復習。学習記録は資格ごとに端末内へ保存。";
  document.documentElement.dataset.exam = config.id;
  document.querySelectorAll("[data-exam]").forEach(function (a) {
    if (a.dataset.exam === config.id) a.setAttribute("aria-current", "page");
  });
  document.querySelector('[data-mode="test"] .mode__desc').textContent = config.testLabel;
  var note = document.getElementById("exam-note");
  if (passport) {
    note.innerHTML = '2027年2月以降の試験向け · 自作教材<br>' +
      '<a href="https://guga.or.jp/assets/syllabus.pdf" target="_blank" rel="noopener">公式シラバス</a> / ' +
      '<a href="https://guga.or.jp/generativeaiexam/" target="_blank" rel="noopener">試験概要</a>（確認：2026-10-16）';
  } else {
    note.textContent = "教科書を読み、四択で確かめる。記録は資格ごとに保存されます。";
  }
  var prefix = passport ? "passport-" : "";
  var files = [prefix + "data", prefix + "lessons", prefix + "map", "app"];
  function read(i) {
    if (i === files.length) {
      document.getElementById("load-status").hidden = true;
      return;
    }
    var script = document.createElement("script");
    script.src = "js/" + files[i] + ".js?v=" + {"data":"fe2f6fc5b8","lessons":"fe4c4e256d","map":"5ba3809f52","app":"508ee064e4","exam":"793f30f7f4","passport-data":"b65b2bba37","passport-lessons":"c8019e1fc2","passport-map":"3e50a3af21"}[files[i]];
    script.onload = function () { read(i + 1); };
    script.onerror = function () {
      document.getElementById("load-status").textContent = "教材を読み込めませんでした。接続を確認して再読み込みしてください。";
    };
    document.head.appendChild(script);
  }
  read(0);
})();
