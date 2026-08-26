/* G検定ドリル — アプリ本体
 *
 * 学習記録は localStorage にのみ保存する。外部送信はしない。
 * 問題データは js/data.js（g-kentei-study の quiz/*.js から生成）。
 */

(function () {
  "use strict";

  var DATA = window.QUIZ_DATA || { lessons: [], questions: [] };
  var TEXT = window.LESSON_DATA || { lessons: [] };
  var MAP = window.MAP_DATA || { areas: [], lessons: [], totalItems: 0 };
  var STORE_KEY = "gken_store_v1";
  var KEYS = ["ア", "イ", "ウ", "エ"];
  var TEST_SIZE = 20;
  var TEST_SECONDS = 14 * 60; // 本番は約41秒/問。20問なら約14分
  var WEAK_THRESHOLD = 0.7;

  var $ = function (id) { return document.getElementById(id); };

  // ---- 保存 ----------------------------------------------------------------

  var store = load();

  function load() {
    /* reads は教本をどこまで読んだか（講ID → スクロール位置）。
       古い保存にはこの項目がないので、無ければ空で補う。 */
    var empty = { history: {}, sessions: [], days: {}, reads: {} };
    try {
      var s = JSON.parse(localStorage.getItem(STORE_KEY));
      if (!s || typeof s !== "object") return empty;
      return {
        history: s.history || {},
        sessions: s.sessions || [],
        days: s.days || {},
        reads: s.reads || {}
      };
    } catch (e) {
      return empty;
    }
  }

  function save() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(store));
    } catch (e) {
      /* 容量超過などは黙って諦める。学習は続けられる */
    }
  }

  function todayKey() {
    var d = new Date();
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }

  function pad(n) { return n < 10 ? "0" + n : "" + n; }

  function record(qid, correct) {
    var h = store.history[qid] || { a: 0, c: 0, last: false };
    h.a += 1;
    if (correct) h.c += 1;
    h.last = correct;
    store.history[qid] = h;

    var k = todayKey();
    store.days[k] = (store.days[k] || 0) + 1;
  }

  function streak() {
    var n = 0;
    var d = new Date();
    // 今日まだ解いていなければ、昨日までの連続を数える
    if (!store.days[todayKey()]) d.setDate(d.getDate() - 1);
    for (;;) {
      var k = d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
      if (!store.days[k]) break;
      n += 1;
      d.setDate(d.getDate() - 1);
    }
    return n;
  }

  function totals() {
    var a = 0, c = 0;
    for (var id in store.history) {
      a += store.history[id].a;
      c += store.history[id].c;
    }
    return { a: a, c: c };
  }

  // ---- 出題対象の選び方 -----------------------------------------------------

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function weakQuestions() {
    return DATA.questions.filter(function (q) {
      var h = store.history[q.id];
      if (!h) return false;             // 未挑戦は苦手ではない
      if (h.last === false) return true; // 直近で間違えた
      return h.c / h.a < WEAK_THRESHOLD; // 正答率が低い
    });
  }

  /* 同じ知識を別の形で問う問題（正しいもの／誤っているものを選ぶ等）は
     同じ group にまとめてある。1回の演習では各グループから1問だけ出す。
     毎回どの形が出るか変わるので、同じ問題の繰り返しになりにくい */
  function onePerGroup(qs) {
    var byGroup = {};
    qs.forEach(function (q) {
      var g = q.group || q.id;
      (byGroup[g] = byGroup[g] || []).push(q);
    });
    return Object.keys(byGroup).map(function (g) {
      var v = byGroup[g];
      return v[Math.floor(Math.random() * v.length)];
    });
  }

  function pick(mode, lessonId) {
    if (mode === "lesson") {
      return shuffle(onePerGroup(
        DATA.questions.filter(function (q) { return q.lesson === lessonId; })
      ));
    }
    // 苦手復習は「間違えた問題そのもの」を出したいので、グループでまとめない
    if (mode === "weak") {
      return shuffle(weakQuestions());
    }
    return shuffle(onePerGroup(DATA.questions)).slice(0, TEST_SIZE);
  }

  // ---- 画面遷移 ------------------------------------------------------------

  var VIEWS = ["home", "lesson", "read", "appendix", "quiz", "result", "stats"];

  /* scrollY を渡すとその位置で表示する。既定は先頭。
     付録から本文へ戻るときだけ、読んでいた場所へ返すために使う。 */
  function show(name, title, scrollY) {
    /* 教本から離れる直前に、読みかけ位置を確定して書き出す。
       スクロール中の保存は間引いているので、
       直後に戻るを押されると最後の移動を取り逃がすため。 */
    if (name !== "read" && !$("view-read").hidden) {
      rememberReadPos();
      /* 戻ってきたとき同じ位置に返すため、いま居る履歴にも位置を記録する。
         pushView は画面を開いた時点の位置しか持っていないため。 */
      if (history.state && history.state.v === "read") {
        history.replaceState({ v: "read", l: currentLesson, y: window.scrollY }, "");
      }
    }

    VIEWS.forEach(function (v) { $("view-" + v).hidden = v !== name; });
    $("topbar-title").textContent = title || "G検定ドリル";
    $("btn-back").hidden = name === "home";
    $("btn-stats").hidden = name !== "home";
    window.scrollTo(0, scrollY || 0);
    pushView(name, scrollY);
  }

  /* ---- 端末の戻る操作 ------------------------------------------------------

     画面を切り替えても履歴を積んでいなかったため、
     スマホの戻るボタンでアプリごと閉じてしまっていた。
     画面ごとに履歴を1件積み、popstate で対応する画面へ戻す。

     URLは変えない（pushState の第2引数を省く）。
     GitHub Pages は静的配信なので、URLを変えると再読み込みで404になるため。 */
  /* 戻ったときの位置は自分で決める。
     既定の "auto" のままだと、こちらが scrollTo したあとに
     ブラウザが元の位置を復元し直して上書きしてしまう。 */
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";

  var popping = false;

  function pushView(name, scrollY) {
    if (popping) return;
    var st = { v: name, l: currentLesson, y: scrollY || 0 };
    // 最初の1件だけは積まずに置き換える。ホームで戻ればアプリを閉じてよい
    if (history.state) history.pushState(st, "");
    else history.replaceState(st, "");
  }

  function restoreView(st) {
    switch (st.v) {
      case "lesson": openLesson(st.l); return;
      case "read": openRead(st.l, st.y); return;
      case "appendix": openAppendix(st.l); return;
      case "stats": renderStats(); show("stats", "成績"); return;
      /* 演習と結果は履歴で復元しない。
         中断した出題の途中に戻しても続きが無く、記録もすでに残っているため。
         講のメニューへ逃がす。 */
      case "quiz":
      case "result":
        if (st.l) { openLesson(st.l); return; }
        break;
    }
    renderHome();
    show("home");
  }

  window.addEventListener("popstate", function (e) {
    // 演習の途中なら確認する。続ける場合は履歴を積み直して現状を保つ
    /* i は「次へ」で進むので、1問目に答えただけではまだ 0。
       answered も見ないと、1問答えた直後の戻るが素通りしてしまう。 */
    if (!$("view-quiz").hidden && session && (session.i > 0 || session.answered) &&
        !confirm("演習を中断しますか。ここまでの解答は記録されています。")) {
      history.pushState({ v: "quiz", l: currentLesson, y: 0 }, "");
      return;
    }
    stopTimer();
    if (!$("view-quiz").hidden) session = null;

    popping = true;
    try { restoreView(e.state || { v: "home" }); }
    finally { popping = false; }
  });

  // ---- ホーム --------------------------------------------------------------

  function renderHome() {
    var t = totals();
    $("stat-streak").textContent = streak();
    $("stat-today").textContent = store.days[todayKey()] || 0;
    $("stat-rate").textContent = t.a ? Math.round((t.c / t.a) * 100) + "%" : "—";

    var weak = weakQuestions().length;
    $("weak-count").textContent = weak
      ? weak + "問たまっています"
      : "まだありません（間違えると溜まります）";
    document.querySelector('[data-mode="weak"]').disabled = weak === 0;

    renderAreas();

    var ready = MAP.lessons.filter(function (l) { return l.hasText; }).length;
    $("build-note").textContent =
      "公式シラバス 大項目" + MAP.areas.length + "・中項目" + MAP.totalItems +
      " に対応した全" + MAP.lessons.length + "講。教本" + ready + "講 / 演習" +
      DATA.questions.length + "問" +
      (MAP.generatedAt ? "（更新 " + MAP.generatedAt + "）" : "");
  }

  /* 試験範囲を大項目ごとに並べ、講の状態を出す。
     教材が未作成の講も「準備中」として出す。全体像が見えないと今どこにいるか分からないため */
  function renderAreas() {
    var box = $("area-list");
    box.innerHTML = "";

    MAP.areas.forEach(function (area) {
      var wrap = document.createElement("section");
      wrap.className = "area";

      var lessons = area.lessons.map(lessonMeta).filter(Boolean);
      var agg = lessons.reduce(
        function (a, l) {
          var p = lessonProgress(l.id);
          a.done += p.done;
          a.total += p.total;
          return a;
        },
        { done: 0, total: 0 }
      );
      var pct = agg.total ? Math.round((agg.done / agg.total) * 100) : 0;

      var head = document.createElement("div");
      head.className = "area__head";
      head.innerHTML =
        '<span class="area__part"></span>' +
        '<span class="area__name"></span>' +
        '<span class="area__pct"></span>';
      head.querySelector(".area__part").textContent = area.part;
      head.querySelector(".area__name").textContent = area.name;
      head.querySelector(".area__pct").textContent = agg.total ? pct + "%" : "—";
      wrap.appendChild(head);

      lessons.forEach(function (l) {
        wrap.appendChild(lessonRow(l));
      });

      box.appendChild(wrap);
    });
  }

  function lessonMeta(id) {
    for (var i = 0; i < MAP.lessons.length; i++) {
      if (MAP.lessons[i].id === id) return MAP.lessons[i];
    }
    return null;
  }

  function lessonRow(meta) {
    var p = lessonProgress(meta.id);
    var b = document.createElement("button");
    b.className = "lesson";

    var state, cls;
    if (p.total > 0 && p.attempted > 0) {
      state = p.pct + "% (" + p.done + "/" + p.total + ")";
      cls = p.pct >= 70 ? "lesson__state--ok" : "lesson__state--warn";
    } else if (meta.hasText || p.total > 0) {
      state = "未着手";
      cls = "";
    } else {
      state = "準備中";
      cls = "lesson__state--none";
      b.disabled = true;
    }

    b.innerHTML =
      '<span class="lesson__id"></span>' +
      '<span class="lesson__title"></span>' +
      '<span class="lesson__state ' + cls + '"></span>';
    b.querySelector(".lesson__id").textContent = meta.id;
    b.querySelector(".lesson__title").textContent = meta.title;
    b.querySelector(".lesson__state").textContent = state;

    if (!b.disabled) {
      b.addEventListener("click", function () { openLesson(meta.id); });
    }
    return b;
  }

  // ---- 講のメニューと教本 ---------------------------------------------------

  var currentLesson = null;

  /* 習得度はグループ単位で数える。
     同じ知識の別形式を全部解かないと100%にならないのは実態に合わないため、
     グループ内のどれか1問に直近正解していれば「その知識は取れている」と見る */
  function lessonProgress(id) {
    var qs = DATA.questions.filter(function (q) { return q.lesson === id; });
    var groups = {};
    qs.forEach(function (q) {
      var g = q.group || q.id;
      var h = store.history[q.id];
      var cur = groups[g] || { done: false, attempted: false };
      if (h) {
        cur.attempted = true;
        if (h.last) cur.done = true;
      }
      groups[g] = cur;
    });
    var keys = Object.keys(groups);
    var done = 0, attempted = 0;
    keys.forEach(function (g) {
      if (groups[g].done) done += 1;
      if (groups[g].attempted) attempted += 1;
    });
    return {
      done: done,
      attempted: attempted,
      total: keys.length,
      pool: qs.length,
      pct: keys.length ? Math.round((done / keys.length) * 100) : 0
    };
  }

  function textOf(id) {
    for (var i = 0; i < TEXT.lessons.length; i++) {
      if (TEXT.lessons[i].id === id) return TEXT.lessons[i];
    }
    return null;
  }

  function openLesson(id) {
    currentLesson = id;
    var meta = lessonMeta(id);
    var t = textOf(id);
    var p = lessonProgress(id);

    $("l-meta").textContent =
      id + (meta ? "・" + meta.area : "") + (t ? "・約" + t.minutes + "分" : "");
    $("l-title").textContent = meta ? meta.title : t ? t.title : id;
    $("l-fill").style.width = p.pct + "%";
    $("l-fill").className = "bar__fill" + (p.pct < 70 ? " bar__fill--warn" : "");
    $("l-val").textContent = p.pct + "%";
    $("l-detail").textContent = p.total
      ? "直近で正解 " + p.done + " / 全" + p.total + "項目" +
        (p.attempted < p.total ? "（未挑戦 " + (p.total - p.attempted) + "項目）" : "") +
        (p.pool > p.total ? "　問題は全" + p.pool + "問から毎回選ばれます" : "")
      : "";

    $("btn-read").disabled = !t;
    $("btn-read").textContent = t ? "教本を読む" : "教本はまだありません";
    $("btn-drill").disabled = p.total === 0;
    $("btn-drill").textContent = p.total ? "演習する（" + p.total + "問）" : "演習はまだありません";

    show("lesson", id);
  }

  /* 講にひも付く付録を返す。無ければ null */
  function appendixOf(id) {
    var list = TEXT.appendices || [];
    for (var i = 0; i < list.length; i++) if (list[i].lesson === id) return list[i];
    return null;
  }

  /* 節を prose として流し込む。教本と付録で共通 */
  function renderProse(el, title, sections) {
    el.innerHTML = "";
    var h = document.createElement("h2");
    h.className = "prose__title";
    h.textContent = title;
    el.appendChild(h);

    sections.forEach(function (s) {
      var sec = document.createElement("section");
      var sh = document.createElement("h3");
      sh.textContent = s.heading;
      sec.appendChild(sh);
      var div = document.createElement("div");
      div.innerHTML = s.html; // 生成元は自分たちの lessons/*.md と appendix/*.md
      sec.appendChild(div);
      el.appendChild(sec);
    });
  }

  /* 付録IDで引く。本文中のショートカットリンクはこちらを使う */
  function appendixById(apxId) {
    var list = TEXT.appendices || [];
    for (var i = 0; i < list.length; i++) if (list[i].id === apxId) return list[i];
    return null;
  }

  function showAppendix(a) {
    if (!a) return;
    /* 本文のどこから来たかは show() が履歴に焼き付けるので、ここでは覚えなくてよい */
    currentLesson = a.lesson;
    renderProse($("appendix-body"), a.title, a.sections);
    show("appendix", a.title);
  }

  function openAppendix(id) {
    var a = appendixOf(id);
    if (!a) return;
    showAppendix(a);
  }

  /* 教本の読みかけ位置。
     戻るを押さずにアプリを閉じても残るよう、スクロール中に随時保存する。
     最後まで読み切った講は消して、次に開いたとき先頭から始まるようにする。 */
  var readSaveTimer = null;

  function rememberReadPos() {
    if ($("view-read").hidden) return;
    var y = window.scrollY;
    var bottom = document.documentElement.scrollHeight - window.innerHeight - 80;
    if (y < 200 || y >= bottom) delete store.reads[currentLesson];
    else store.reads[currentLesson] = y;
    save();
  }

  window.addEventListener("scroll", function () {
    if ($("view-read").hidden) return;
    clearTimeout(readSaveTimer);
    readSaveTimer = setTimeout(rememberReadPos, 300);
  });

  function openRead(id, scrollY) {
    var t = textOf(id);
    if (!t) return;
    /* 明示的な指定（付録から戻る）がなければ、前回の続きから開く */
    if (scrollY === undefined) scrollY = store.reads[id] || 0;
    currentLesson = id;

    renderProse($("read-body"), t.title, t.sections);

    var apx = appendixOf(id);
    $("btn-read-appendix").hidden = !apx;
    if (apx) $("btn-read-appendix").textContent = apx.title;

    var p = lessonProgress(id);
    $("btn-read-drill").hidden = p.total === 0;
    $("btn-read-drill").textContent = "この講の演習へ（" + p.total + "問）";

    var nx = nextLessonId(id);
    $("btn-read-next").hidden = !nx;
    if (nx) $("btn-read-next").textContent = "次の講を読む（" + nx + "）";

    show("read", id, scrollY);
  }

  function nextLessonId(id) {
    var ids = TEXT.lessons.map(function (l) { return l.id; });
    var i = ids.indexOf(id);
    return i >= 0 && i + 1 < ids.length ? ids[i + 1] : null;
  }

  // ---- 出題 ----------------------------------------------------------------

  var session = null;
  var timerId = null;

  /* 出題のたびに選択肢を混ぜる。
     元データは正解が2番目に偏っていたため、位置で覚えられてしまっていた。
     answer と why の添字も並べ替えに合わせて振り直す。 */
  function shuffleOptions(q) {
    var order = shuffle([0, 1, 2, 3]);
    var opts = [];
    var why = {};
    var answer = 0;
    order.forEach(function (from, to) {
      opts.push(q.options[from]);
      if (from === q.answer) answer = to;
      else if (q.why && q.why[from] !== undefined) why[to] = q.why[from];
    });
    return {
      id: q.id, lesson: q.lesson, module: q.module, topic: q.topic,
      text: q.text, explanation: q.explanation,
      options: opts, answer: answer, why: why
    };
  }

  function start(mode, lessonId) {
    var qs = pick(mode, lessonId).map(shuffleOptions);
    if (qs.length === 0) return;

    session = {
      mode: mode,
      lessonId: lessonId || null,
      queue: qs,
      i: 0,
      correct: 0,
      wrong: [],
      answered: false,
      endsAt: mode === "test" ? Date.now() + TEST_SECONDS * 1000 : null
    };

    show("quiz", mode === "test" ? "本番形式テスト" : mode === "weak" ? "苦手復習" : lessonId || "ランダム20問");
    if (session.endsAt) startTimer(); else $("q-timer").textContent = "";
    renderQuestion();
  }

  function startTimer() {
    stopTimer();
    timerId = setInterval(tick, 250);
    tick();
  }

  function stopTimer() {
    if (timerId) { clearInterval(timerId); timerId = null; }
  }

  function tick() {
    if (!session || !session.endsAt) return;
    var left = Math.max(0, Math.round((session.endsAt - Date.now()) / 1000));
    var el = $("q-timer");
    el.textContent = "残り " + Math.floor(left / 60) + ":" + pad(left % 60);
    el.className = left <= 60 ? "timer timer--warn" : "timer";
    if (left === 0) finish();
  }

  function renderQuestion() {
    var q = session.queue[session.i];
    session.answered = false;

    $("q-count").textContent = (session.i + 1) + " / " + session.queue.length;
    $("q-progress").style.width = ((session.i / session.queue.length) * 100) + "%";
    $("q-topic").textContent = q.topic || "";
    $("q-text").textContent = q.text;
    $("q-feedback").hidden = true;

    var box = $("q-options");
    box.innerHTML = "";
    q.options.forEach(function (opt, idx) {
      var b = document.createElement("button");
      b.className = "option";
      b.innerHTML = '<span class="option__key"></span><span class="option__body"></span>';
      b.querySelector(".option__key").textContent = KEYS[idx];
      b.querySelector(".option__body").textContent = opt;
      b.addEventListener("click", function () { answer(idx); });
      box.appendChild(b);
    });
  }

  function answer(idx) {
    if (session.answered) return;
    session.answered = true;

    var q = session.queue[session.i];
    var ok = idx === q.answer;

    record(q.id, ok);
    if (ok) session.correct += 1;
    else session.wrong.push({ q: q, chose: idx });
    save();

    var buttons = $("q-options").children;
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].disabled = true;
      if (i === q.answer) buttons[i].classList.add("option--ok");
      else if (i === idx) buttons[i].classList.add("option--ng");
    }

    // テストモードは解説を出さずテンポよく進む
    if (session.mode === "test") {
      setTimeout(next, 350);
      return;
    }

    var verdict = $("q-verdict");
    verdict.textContent = ok ? "正解" : "不正解";
    verdict.className = "feedback__verdict " + (ok ? "feedback__verdict--ok" : "feedback__verdict--ng");
    $("q-explanation").textContent = strip(q.explanation);

    var why = $("q-why");
    why.innerHTML = "";
    Object.keys(q.why || {}).forEach(function (k) {
      var li = document.createElement("li");
      li.textContent = KEYS[Number(k)] + "：" + strip(q.why[k]);
      why.appendChild(li);
    });

    $("q-feedback").hidden = false;
    $("btn-next").textContent = session.i + 1 >= session.queue.length ? "結果を見る" : "次へ";
  }

  /* 解説の ** は markdown の名残。画面では素のテキストにする */
  function strip(s) { return String(s).replace(/\*\*/g, ""); }

  function next() {
    session.i += 1;
    if (session.i >= session.queue.length) finish();
    else renderQuestion();
  }

  function finish() {
    stopTimer();
    var total = session.i + (session.answered ? 1 : 0);
    if (total > session.queue.length) total = session.queue.length;

    store.sessions.push({
      ts: Date.now(),
      mode: session.mode,
      lesson: session.lessonId,
      score: session.correct,
      total: total
    });
    if (store.sessions.length > 300) store.sessions = store.sessions.slice(-300);
    save();

    var pct = total ? Math.round((session.correct / total) * 100) : 0;
    $("r-score").textContent = session.correct + " / " + total;
    $("r-label").textContent = "正答率 " + pct + "%" +
      (session.mode === "test" && pct < 75 ? "（合格ラインの目安は75%）" : "");

    var box = $("r-review");
    box.innerHTML = "";
    if (session.wrong.length === 0) {
      var p = document.createElement("p");
      p.className = "empty";
      p.textContent = "全問正解。";
      box.appendChild(p);
    } else {
      session.wrong.forEach(function (w) {
        var d = document.createElement("div");
        d.className = "review";
        d.innerHTML =
          '<p class="review__q"></p>' +
          '<p class="review__a">あなた：<span class="chose"></span> ／ 正解：<b class="ans"></b></p>' +
          '<p class="review__e"></p>';
        d.querySelector(".review__q").textContent = w.q.text;
        d.querySelector(".chose").textContent = KEYS[w.chose] + " " + w.q.options[w.chose];
        d.querySelector(".ans").textContent = KEYS[w.q.answer] + " " + w.q.options[w.q.answer];
        d.querySelector(".review__e").textContent = strip(w.q.explanation);
        box.appendChild(d);
      });
    }

    show("result", "結果");
  }

  // ---- 成績 ----------------------------------------------------------------

  function bar(label, done, total) {
    var pct = total ? Math.round((done / total) * 100) : 0;
    var row = document.createElement("div");
    row.className = "bar";
    row.innerHTML =
      '<span class="bar__label"></span>' +
      '<span class="bar__track"><i class="bar__fill' + (pct < 70 ? " bar__fill--warn" : "") +
      '" style="width:' + pct + '%"></i></span>' +
      '<span class="bar__val">' + pct + "%</span>";
    row.querySelector(".bar__label").textContent = label;
    return row;
  }

  function renderStats() {
    // 大項目ごと。試験範囲のどこが弱いかは、講より大項目の粒度で見たい
    var abox = $("s-areas");
    abox.innerHTML = "";
    MAP.areas.forEach(function (area) {
      var agg = area.lessons.reduce(
        function (a, id) {
          var p = lessonProgress(id);
          a.done += p.done;
          a.total += p.total;
          return a;
        },
        { done: 0, total: 0 }
      );
      if (agg.total === 0) return; // 演習が1問もない大項目は出さない
      abox.appendChild(bar(area.name, agg.done, agg.total));
    });
    if (!abox.children.length) {
      abox.innerHTML = '<p class="empty">まだ演習がありません。</p>';
    }

    var box = $("s-lessons");
    box.innerHTML = "";
    DATA.lessons.forEach(function (les) {
      var p = lessonProgress(les.id);
      box.appendChild(bar(les.id + " " + les.title, p.done, p.total));
    });
    if (!DATA.lessons.length) box.innerHTML = '<p class="empty">問題がまだありません。</p>';

    var byTopic = {};
    DATA.questions.forEach(function (q) {
      var h = store.history[q.id];
      if (!h) return;
      var t = q.topic || "その他";
      if (!byTopic[t]) byTopic[t] = { a: 0, c: 0 };
      byTopic[t].a += h.a;
      byTopic[t].c += h.c;
    });

    var tbox = $("s-topics");
    tbox.innerHTML = "";
    var names = Object.keys(byTopic).sort(function (x, y) {
      return byTopic[x].c / byTopic[x].a - byTopic[y].c / byTopic[y].a;
    });
    var weak = names.filter(function (n) { return byTopic[n].c / byTopic[n].a < WEAK_THRESHOLD; });
    if (weak.length === 0) {
      tbox.innerHTML = '<p class="empty">' +
        (names.length ? "正答率70%を下回る分野はありません。" : "まだ集計できるデータがありません。") + "</p>";
    } else {
      weak.forEach(function (n) { tbox.appendChild(bar(n, byTopic[n].c, byTopic[n].a)); });
    }
  }

  /* 学習記録を Claude Code に貼れる形で書き出す。/review がこれを読んで弱点演習を作る */
  function exportText() {
    var t = totals();
    var lines = [];
    lines.push("# G検定ドリル 学習記録 " + todayKey());
    lines.push("");
    lines.push("- 累計 " + t.a + "回答 / 正答 " + t.c + "（" + (t.a ? Math.round((t.c / t.a) * 100) : 0) + "%）");
    lines.push("- 連続学習日数 " + streak());
    lines.push("");
    lines.push("## 未定着の問題（直近で誤答、または正答率70%未満）");
    lines.push("");

    var weak = weakQuestions();
    if (!weak.length) {
      lines.push("なし");
    } else {
      weak.forEach(function (q) {
        var h = store.history[q.id];
        lines.push("- " + q.id + "（" + (q.topic || "分類なし") + "）" +
          h.c + "/" + h.a + " 直近" + (h.last ? "正解" : "誤答") + "：" + q.text);
      });
    }
    lines.push("");
    lines.push("この記録をもとに弱点演習を作ってください。");
    return lines.join("\n");
  }

  function copy(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      // 権限が下りない環境（http、古いブラウザ）では reject するので拾い直す
      return navigator.clipboard.writeText(text).catch(function () { return legacyCopy(text); });
    }
    return legacyCopy(text);
  }

  function legacyCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); } catch (e) { /* 失敗時は下で通知 */ }
    document.body.removeChild(ta);
    return Promise.resolve();
  }

  // ---- 配線 ----------------------------------------------------------------

  document.querySelectorAll("[data-mode]").forEach(function (b) {
    b.addEventListener("click", function () { start(b.dataset.mode); });
  });

  $("btn-next").addEventListener("click", next);

  $("btn-home").addEventListener("click", function () {
    renderHome();
    show("home");
  });

  $("btn-stats").addEventListener("click", function () {
    renderStats();
    show("stats", "成績");
  });

  $("btn-read").addEventListener("click", function () { openRead(currentLesson); });
  $("btn-drill").addEventListener("click", function () { start("lesson", currentLesson); });
  $("btn-read-drill").addEventListener("click", function () { start("lesson", currentLesson); });
  $("btn-read-appendix").addEventListener("click", function () { openAppendix(currentLesson); });

  /* 本文中の「付録を見る」リンク。
     本文は差し替わるので、個々のリンクではなく入れ物側で受ける。 */
  $("read-body").addEventListener("click", function (e) {
    var a = e.target.closest ? e.target.closest("[data-appendix]") : null;
    if (!a) return;
    e.preventDefault();
    showAppendix(appendixById(a.getAttribute("data-appendix")));
  });
  $("btn-appendix-back").addEventListener("click", function () { history.back(); });
  $("btn-read-next").addEventListener("click", function () {
    var nx = nextLessonId(currentLesson);
    if (nx) openRead(nx);
  });

  /* 画面内の戻るも履歴を1つ戻すだけにする。
     直接画面を切り替えると履歴がもう1件積まれ、
     端末の戻る操作と噛み合わなくなるため。行き先の判定は popstate 側にある。 */
  $("btn-back").addEventListener("click", function () { history.back(); });

  $("btn-export").addEventListener("click", function () {
    var btn = $("btn-export");
    copy(exportText()).then(function () {
      btn.textContent = "コピーしました";
      setTimeout(function () { btn.textContent = "記録をコピー（Claude Code に貼る用）"; }, 2000);
    });
  });

  $("btn-reset").addEventListener("click", function () {
    if (!confirm("学習記録をすべて消します。取り消せません。よろしいですか。")) return;
    store = { history: {}, sessions: [], days: {}, reads: {} };
    save();
    renderStats();
    renderHome();
  });

  renderHome();
  show("home");

  if ("serviceWorker" in navigator) {
    /* 開いた時点ですでに制御されているか。
       初回訪問（未登録）では null になる。下のリロード判定に使う。 */
    var hadController = !!navigator.serviceWorker.controller;
    var reloaded = false;

    window.addEventListener("load", function () {
      navigator.serviceWorker
        .register("sw.js")
        .then(function (reg) {
          reg.update();  // 開くたびに更新を確認する
        })
        .catch(function () { /* オフライン化は諦める */ });
    });

    /* 新しい Service Worker が制御を取ったら、1度だけ画面を作り直す。
       これがないと、教材を直してデプロイしても、
       すでに開いたことのある利用者には古い内容が出続ける。
       index.html ごとブラウザに残り、古いスクリプトを読み続けるため。

       初回インストール時は hadController が false になるので何もしない。
       そこでリロードすると、初めて開いた人が無駄に再読み込みされる。 */
    navigator.serviceWorker.addEventListener("controllerchange", function () {
      if (!hadController || reloaded) return;
      reloaded = true;
      window.location.reload();
    });
  }
})();
