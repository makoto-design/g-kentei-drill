/* 独立した学習モード。通常ドリルのストアや出題ロジックには触らない。 */
(function () {
  'use strict';
  var data = window.CONVERSATION_DATA;
  var screen = document.getElementById('cv-screen');
  if (!data || !data.units.length) {
    screen.textContent = '教材を読み込めませんでした。接続を確認し、再読み込みしてください。';
    return;
  }
  var units = data.units;
  var KEY = 'gken_conversation_m2_01_v1';
  var marks = ['①', '②', '③', '④'];
  var stageNames = { read: '説明', quiz: '確認問題', review: '確認タイム', done: '完了' };
  var state = null;
  var copyToken = 0;
  var $ = function (id) { return document.getElementById(id); };
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function button(action, label, cls) { return '<button class="btn ' + (cls || '') + '" data-action="' + action + '">' + label + '</button>'; }
  function warning(text) { $('cv-storage').hidden = false; $('cv-storage').textContent = text; }
  function fresh() { return { version: data.version, index: 0, stage: 'read', answers: {}, updatedAt: Date.now() }; }
  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return null;
      var s = JSON.parse(raw);
      if (!s || s.version !== data.version || !Number.isInteger(s.index) || s.index < 0 || s.index >= units.length || !stageNames[s.stage] || !s.answers || typeof s.answers !== 'object' || Array.isArray(s.answers)) throw new Error('invalid');
      var answers = {};
      units.forEach(function (u) {
        var a = s.answers[u.id];
        if (a && Number.isInteger(a.selected) && a.selected >= 0 && a.selected < 4) {
          answers[u.id] = { selected: a.selected, correct: a.selected === u.answer, answeredAt: a.answeredAt || null };
        }
      });
      s.answers = answers;
      if (s.stage === 'review' && !s.answers[units[s.index].id]) s.stage = 'quiz';
      if (s.stage === 'done' && Object.keys(answers).length !== units.length) s.stage = 'read';
      return s;
    } catch (e) {
      warning('保存した進捗を読み込めませんでした。このモードは最初から始められます。通常ドリルの記録はそのままです。');
      return null;
    }
  }
  function save() {
    state.updatedAt = Date.now();
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch (e) { warning('このブラウザには進捗を保存できません。学習は続けられますが、ページを閉じると再開できない場合があります。'); }
  }
  function progress() {
    var n = state ? Object.keys(state.answers).length : 0;
    $('cv-progress').value = n;
    $('cv-percent').textContent = '進捗 ' + Math.round(n / units.length * 100) + '%';
    $('cv-position').textContent = n + ' / ' + units.length + ' 単位に回答済み';
  }
  function focusHeading() {
    window.scrollTo(0, 0);
    var h = screen.querySelector('[tabindex="-1"]');
    if (h) h.focus({ preventScroll: true });
  }
  function intro() {
    progress();
    screen.innerHTML = '<section class="cv-card"><p class="cv-kicker">短く学んで、ひと息つく</p><h1 class="cv-title" tabindex="-1">教本を、ひとつずつ。</h1>' +
      '<p class="cv-lead">説明 → 4択 → 確認タイム。分からないところは、聞き直してから進めます。</p><p>まずはM2-01の冒頭だけ。全9単位、1単位の説明は約1〜3分です。今日は1つだけでも大丈夫。</p>' +
      (state ? '<div class="cv-resume">前回：' + (state.index + 1) + ' / 9「' + esc(units[state.index].title) + '」<br><strong>' + stageNames[state.stage] + '</strong>から再開できます。</div>' + button('resume', state.stage === 'done' ? '前回の結果を見る' : '前回の続きから', 'cv-primary') + button('restart', '最初からやり直す') : button('start', '学習を始める', 'cv-primary')) +
      '<details><summary>今回学ぶ9つのテーマ</summary><ol class="cv-units">' + units.map(function (u) { return '<li>' + esc(u.topic) + '</li>'; }).join('') + '</ol></details>' +
      '<p class="cv-small">説明・言い換え・別の例は、この教本に沿って用意した内容です。「AIに聞く」は質問文をコピーします。ここからAIへの自動送信は行いません。</p></section>';
  }
  function steps() {
    return '<ol class="cv-steps" aria-label="学習の流れ">' + ['read', 'quiz', 'review'].map(function (s, i) { return '<li' + (state.stage === s ? ' aria-current="step"' : '') + '>' + (i + 1) + ' ' + stageNames[s] + '</li>'; }).join('') + '</ol>';
  }
  function render() {
    copyToken++;
    progress();
    var u = units[state.index];
    if (state.stage === 'done') { complete(); focusHeading(); return; }
    var top = steps() + '<p class="cv-kicker">UNIT ' + String(state.index + 1).padStart(2, '0') + ' / 09 · ' + esc(u.topic) + '</p>';
    if (state.stage === 'read') {
      screen.innerHTML = top + '<article class="cv-card"><p class="cv-kicker">今日の説明 · 約1〜3分</p><h1 class="cv-title" tabindex="-1">' + esc(u.title) + '</h1><p class="cv-lead">' + esc(u.lead) + '</p><div class="cv-prose">' + u.paragraphs.map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') + '</div><p class="cv-takeaway">' + esc(u.takeaway) + '</p><div class="cv-actions">' + button('more', 'もう少し詳しく') + button('example', '例で説明') + '</div><div id="cv-help" aria-live="polite"></div><p class="cv-source">教本の対応箇所：' + esc(u.source) + '</p></article>' + button('quiz', '次へ · 理解を1問で確認', 'cv-primary');
    } else if (state.stage === 'quiz') {
      screen.innerHTML = top + '<section class="cv-card"><p class="cv-kicker">理解を確かめる · 1問</p><h1 class="cv-title" tabindex="-1">' + esc(u.question) + '</h1><p class="cv-small">1つ選ぶと、その場で答え合わせします。</p><div class="cv-choices">' + u.options.map(function (o, i) { return '<button class="cv-choice" data-choice="' + i + '"><span>' + marks[i] + '</span><span>' + esc(o) + '</span></button>'; }).join('') + '</div></section>' + button('read', '説明を読み直す');
    } else {
      var a = state.answers[u.id];
      screen.innerHTML = top + '<section class="cv-card cv-result ' + (a.correct ? 'is-correct' : '') + '" tabindex="-1" aria-label="回答結果"><h2>' + (a.correct ? '✓ 正解です' : '↺ 不正解 · ここで確認しましょう') + '</h2><p class="cv-small">あなたの回答：' + marks[a.selected] + ' ' + esc(u.options[a.selected]) + '</p><p class="cv-answer">正解：' + marks[u.answer] + ' ' + esc(u.options[u.answer]) + '</p><p>' + esc(u.explanation) + '</p><details><summary>問題を見返す</summary><p>' + esc(u.question) + '</p></details></section>' +
        '<section class="cv-card"><p class="cv-kicker">分かったら、次へ。</p><h2 class="cv-check-title">確認タイム</h2><p class="cv-lead">まだ曖昧なところはありますか？</p><div class="cv-actions">' + button('again', 'もう一度説明') + button('example', '別の例で説明') + button('ai', 'AIに聞く · 質問文をコピー', 'cv-wide') + '</div><div id="cv-help" aria-live="polite"></div><div id="cv-ai"></div><div class="cv-actions">' + button('next', state.index === units.length - 1 ? '次へ · 今回のまとめ' : '次へ', 'cv-wide cv-primary') + '</div></section>';
    }
    focusHeading();
  }
  function complete() {
    var correct = units.filter(function (u) { return state.answers[u.id] && state.answers[u.id].correct; }).length;
    screen.innerHTML = '<section class="cv-card"><p class="cv-kicker">今回の試作範囲は、ここまで</p><h1 class="cv-title" tabindex="-1">ひと区切り、おつかれさまでした。</h1><p class="cv-score">' + correct + ' <small>/ 9問 正解</small></p><p>教師あり学習からカーネルトリックまで進みました。M2-01全体の完了ではありません。続く決定木・アンサンブル学習は通常の教本で読めます。</p><p class="cv-takeaway">疲れずに続けられそうでしたか？ 説明の長さと、確認タイムの使いやすさを試してみてください。</p>' + units.map(function (u) {
      var a = state.answers[u.id];
      return '<details class="cv-review-item"><summary>' + (a.correct ? '✓ 正解' : '↺ 要確認') + ' · ' + esc(u.topic) + '</summary><p>' + esc(u.question) + '</p><p>あなたの回答：' + marks[a.selected] + ' ' + esc(u.options[a.selected]) + '</p><p>正解：' + marks[u.answer] + ' ' + esc(u.options[u.answer]) + '</p><p>' + esc(u.explanation) + '</p></details>';
    }).join('') + '</section><a class="btn cv-primary" href="index.html?exam=g-kentei">通常のドリルへ戻る</a>' + button('restart', 'この9単位を最初からやり直す');
  }
  function showHelp(kind) {
    var u = units[state.index];
    var labels = { more: 'もう少し詳しく', again: '言い換えると', example: '別の例で考えると' };
    $('cv-help').innerHTML = '<aside class="cv-help"><h3>' + labels[kind] + '</h3><p>' + esc(u[kind]) + '</p></aside>';
    $('cv-help').scrollIntoView({ block: 'nearest' });
  }
  function promptText() {
    var u = units[state.index], a = state.answers[u.id];
    return ['G検定のM2-01「教師あり学習」を学習中です。', '教材：g-kentei-drill / js/lessons.js', '今のテーマ：' + u.topic, '', '問題文：' + u.question, '選択肢：'].concat(u.options.map(function (o, i) { return marks[i] + ' ' + o; })).concat([
      '', '私が選んだ回答：' + marks[a.selected] + ' ' + u.options[a.selected], '正解：' + marks[u.answer] + ' ' + u.options[u.answer], '回答結果：' + (a.correct ? '正解' : '不正解'), '教材側の短い解説：' + u.explanation,
      '', 'この部分がよく理解できないので、分かりやすく説明してください。', 'まず具体例で説明し、今のテーマの範囲で理解を助けてください。'
    ]).join('\n');
  }
  async function copyPrompt() {
    var token = ++copyToken;
    var text = promptText();
    $('cv-ai').innerHTML = '<section class="cv-ai"><p id="cv-copy-status" role="status">質問文をコピーしています…</p><label for="cv-prompt">ChatGPTに貼り付ける質問文</label><textarea id="cv-prompt" readonly></textarea><div class="cv-actions">' + button('copy', 'もう一度コピー') + '<a class="btn" href="https://chatgpt.com/" target="_blank" rel="noopener noreferrer">ChatGPTを開く ↗</a></div><p class="cv-small">開いたら入力欄を長押し → 貼り付け → 自分で送信。Androidでは端末の設定によりアプリまたはブラウザで開きます。アプリが開かない場合は、手動でChatGPTアプリに切り替えて貼り付けてください。</p></section>';
    $('cv-prompt').value = text;
    var copied = false;
    try {
      if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text); copied = true; }
    } catch (e) { /* 次のコピー手段へ */ }
    if (token !== copyToken || !$('cv-prompt')) return;
    if (!copied) {
      var field = $('cv-prompt');
      field.focus({ preventScroll: true }); field.select(); field.setSelectionRange(0, text.length);
      try { copied = document.execCommand('copy'); } catch (e) { copied = false; }
    }
    $('cv-copy-status').textContent = copied ? '✓ 質問文をコピーしました。次にChatGPTを開いて貼り付けてください。' : '自動コピーできませんでした。下の文章を長押しして選択・コピーしてください。';
    $('cv-ai').scrollIntoView({ block: 'nearest' });
  }
  screen.addEventListener('click', function (event) {
    var choice = event.target.closest('[data-choice]');
    if (choice && state && state.stage === 'quiz') {
      var selected = Number(choice.dataset.choice);
      var u = units[state.index];
      state.answers[u.id] = { selected: selected, correct: selected === u.answer, answeredAt: Date.now() };
      state.stage = 'review'; save(); render(); return;
    }
    var target = event.target.closest('[data-action]');
    if (!target) return;
    var action = target.dataset.action;
    if (action === 'start' || action === 'restart') {
      if (state && !confirm('この会話型学習の進捗と回答を消して、最初からやり直しますか？ 通常ドリルの記録は消えません。')) return;
      state = fresh(); save(); render(); return;
    }
    if (!state) return;
    if (action === 'resume') { render(); return; }
    if (action === 'more' || action === 'again' || action === 'example') { showHelp(action); return; }
    if (action === 'ai' || action === 'copy') { copyPrompt(); return; }
    if (action === 'next' && state.stage === 'review') {
      if (state.index === units.length - 1) state.stage = 'done';
      else { state.index++; state.stage = 'read'; }
    } else if (action === 'quiz' || action === 'read') state.stage = action;
    else return;
    save(); render();
  });
  state = load();
  intro();
  // 直接URLから訪れた場合も、次回以降はオフラインで再開できるようにする。
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(function () {});
})();
