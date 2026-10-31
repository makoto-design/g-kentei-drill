/* 独立した学習モード。通常ドリルのストアや出題ロジックには触らない。 */
(function () {
  'use strict';
  if (window.CV_IS_CATALOG) return;
  var data = window.CONVERSATION_DATA;
  var screen = document.getElementById('cv-screen');
  if (!data || !data.units.length) {
    screen.textContent = '教材を読み込めませんでした。接続を確認し、再読み込みしてください。';
    return;
  }
  var units = data.units;
  var KEY = data.storageKey || 'gken_conversation_m2_01_v1';
  var marks = ['①', '②', '③', '④'];
  var stageNames = { read: '説明', quiz: '確認問題', review: '確認タイム', done: '完了' };
  var state = null;
  // Reading a past explanation is a temporary view; persisted progress stays at the return point.
  var reviewReturn = null;
  var migrated = false;
  var readingPage = 0;
  var copyToken = 0;
  var helpKind = '';
  var helpReturn = null;
  var inquiry = '';
  var questionStyle = '具体例で順に説明';
  var $ = function (id) { return document.getElementById(id); };
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function button(action, label, cls) { return '<button class="btn ' + (cls || '') + '" data-action="' + action + '">' + label + '</button>'; }
  function lessonBody(u) {
    var pages = u.bodyPages || (u.bodyHtml ? [u.bodyHtml] : null);
    var finalPage = !pages || readingPage === pages.length - 1;
    var figure = window.CV_FIGURE && !u.hasSourceVisual && finalPage ? '<div id="cv-figure">' + window.CV_FIGURE(u.id) + '</div>' : '';
    if (pages) return (pages.length > 1 ? '<p class="cv-reading-page" role="status">説明 ' + (readingPage + 1) + ' / ' + pages.length + '</p>' : '') + '<div class="cv-source-body prose">' + pages[readingPage] + '</div>' + figure;
    return u.paragraphs.map(function (p,i) { return '<p>' + esc(p) + '</p>' + (i === 0 ? figure : ''); }).join('');
  }
  function readingActions(u) {
    var pages = u.bodyPages || [];
    var previous = readingPage > 0 ? button('read-previous', '前の説明に戻る') : '';
    if (pages.length && readingPage < pages.length - 1) return previous + button('read-next', '続きを読む · ' + (readingPage + 2) + ' / ' + pages.length, 'cv-primary');
    return previous + (reviewReturn ? button('return-review', reviewReturn.stage === 'done' ? '今回のまとめに戻る' : '確認タイムに戻る', 'cv-primary') : button('quiz', '次へ · 理解を1問で確認', 'cv-primary'));
  }
  function handoffButton() {
    if (!window.CV_HANDOFF) return '';
    var review = state && (state.stage === 'done' || (reviewReturn && reviewReturn.stage === 'done'));
    return button('handoff', window.CV_HANDOFF.label(Boolean(review)), 'cv-wide cv-conversation-entry');
  }
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
        if (a && Number.isInteger(a.selected) && a.selected >= 0 && a.selected < u.options.length) {
          answers[u.id] = { selected: a.selected, correct: a.selected === u.answer, answeredAt: a.answeredAt || null };
        }
      });
      s.answers = answers;
      if (Object.prototype.hasOwnProperty.call(s, 'readingPage')) {
        var pageCount = (units[s.index].bodyPages || []).length || 1;
        s.readingPage = s.stage === 'read' && Number.isInteger(s.readingPage) && s.readingPage >= 0 && s.readingPage < pageCount ? s.readingPage : 0;
      }
      if (s.stage === 'review' && !s.answers[units[s.index].id]) s.stage = 'quiz';
      if (s.stage === 'done' && Object.keys(answers).length !== units.length) {
        s.index = units.findIndex(function (u) { return !answers[u.id]; });
        s.stage = 'read';
        migrated = true;
      }
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
    try { localStorage.setItem(window.CV_LAST_LESSON_KEY, JSON.stringify({ lesson:data.lesson, updatedAt:Date.now() })); } catch (e) {}
  }
  function progress() {
    var n = state ? Object.keys(state.answers).length : 0;
    $('cv-progress').max = units.length;
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
      '<p class="cv-lead">説明 → 4択 → 確認タイム。分からないところは、聞き直してから進めます。</p><p>' + esc(data.introSummary || '') + '</p><p>' + esc(data.lesson) + 'の主な内容を全' + units.length + '単位で学びます。' + (units.some(function(unit) { return unit.bodyPages; }) ? '長い説明はページを分けて読めます。' : '1単位の説明は約1〜3分です。') + '今日は1つだけでも大丈夫。</p>' +
      (migrated ? '<p class="cv-small">新しい単位を追加しました。続きから学べます。</p>' : '') +
      (state ? '<div class="cv-resume">再開位置：' + (state.index + 1) + ' / ' + units.length + '「' + esc(units[state.index].title) + '」<br><strong>' + stageNames[state.stage] + '</strong>から再開できます。</div>' + button('resume', state.stage === 'done' ? '前回の結果を見る' : '前回の続きから', 'cv-primary') + button('restart', '最初からやり直す') : button('start', '学習を始める', 'cv-primary')) +
      handoffButton() + '<details><summary>今回学ぶ' + units.length + 'のテーマ</summary><ol class="cv-units">' + units.map(function (u) { return '<li>' + esc(u.topic) + '</li>'; }).join('') + '</ol></details>' +
      '<p class="cv-small">説明・言い換え・別の例は、この教本に沿って用意した内容です。「AIに聞く」は質問文をコピーします。ここからAIへの自動送信は行いません。</p></section>';
  }
  function steps() {
    return '<ol class="cv-steps" aria-label="学習の流れ">' + ['read', 'quiz', 'review'].map(function (s, i) { return '<li' + (state.stage === s ? ' aria-current="step"' : '') + '>' + (i + 1) + ' ' + stageNames[s] + '</li>'; }).join('') + '</ol>';
  }
  function render() {
    copyToken++;
    helpKind = '';
    helpReturn = null;
    inquiry = '';
    questionStyle = '具体例で順に説明';
    progress();
    var u = units[state.index];
    if (state.stage === 'done') { complete(); focusHeading(); return; }
    var top = steps() + '<p class="cv-kicker">UNIT ' + String(state.index + 1).padStart(2, '0') + ' / ' + String(units.length).padStart(2, '0') + ' · ' + esc(u.topic) + '</p>';
    if (state.stage === 'read') {
      screen.innerHTML = top + '<article class="cv-card"><p class="cv-kicker">' + (u.bodyPages ? '説明を小さく区切って読む' : '今日の説明 · 約1〜3分') + '</p><h1 class="cv-title" tabindex="-1">' + esc(u.title) + '</h1>' + handoffButton() + '<p class="cv-lead">' + esc(u.lead) + '</p><div class="cv-prose">' + lessonBody(u) + '</div><p class="cv-takeaway">' + '要点：' + esc(u.takeaway) + '</p><div class="cv-actions">' + button('more', 'もう少し詳しく') + button('example', '例で説明') + '</div><div id="cv-help" aria-live="polite"></div><p class="cv-source">教本の対応箇所：' + esc(u.source) + '</p></article>' + readingActions(u);
    } else if (state.stage === 'quiz') {
      screen.innerHTML = top + '<section class="cv-card"><p class="cv-kicker">理解を確かめる · 1問</p><h1 class="cv-title" tabindex="-1">' + esc(u.question) + '</h1><p class="cv-small">1つ選ぶと、その場で答え合わせします。</p><div class="cv-choices">' + u.options.map(function (o, i) { return '<button class="cv-choice" data-choice="' + i + '"><span>' + marks[i] + '</span><span>' + esc(o) + '</span></button>'; }).join('') + '</div></section>' + button('read', '説明を読み直す');
    } else {
      var a = state.answers[u.id];
      screen.innerHTML = top + '<section class="cv-card cv-result ' + (a.correct ? 'is-correct' : '') + '" tabindex="-1" aria-label="回答結果"><h2>' + (a.correct ? '✓ 正解です' : '↺ 不正解 · ここで確認しましょう') + '</h2><p class="cv-small">あなたの回答：' + marks[a.selected] + ' ' + esc(u.options[a.selected]) + '</p><p class="cv-answer">正解：' + marks[u.answer] + ' ' + esc(u.options[u.answer]) + '</p><p>' + esc(u.explanation) + '</p><details><summary>問題を見返す</summary><p>' + esc(u.question) + '</p></details></section>' +
        '<section class="cv-card"><p class="cv-kicker">分かったら、次へ。</p><h2 class="cv-check-title">確認タイム</h2><p class="cv-lead">まだ曖昧なところはありますか？</p><div class="cv-actions">' + handoffButton() + button('revisit', '説明と図を見返す', 'cv-wide') + button('again', 'もう一度説明') + button('example', '別の例で説明') + button('ai', 'AIに聞く · 質問文をコピー', 'cv-wide') + '</div><div id="cv-help" aria-live="polite"></div><div id="cv-ai"></div><div class="cv-actions">' + button('retry', '戻る · 問題を解き直す', 'cv-wide') + button('next', state.index === units.length - 1 ? '次へ · 今回のまとめ' : '次へ', 'cv-wide cv-primary') + '</div></section>';
    }
    focusHeading();
  }
  function complete() {
    var correct = units.filter(function (u) { return state.answers[u.id] && state.answers[u.id].correct; }).length;
    screen.innerHTML = '<section class="cv-card"><p class="cv-kicker">' + esc(data.lesson) + 'の主な内容を学びました</p><h1 class="cv-title" tabindex="-1">ひと区切り、おつかれさまでした。</h1><p class="cv-score">' + correct + ' <small>/ ' + units.length + '問 正解</small></p><p>' + esc(data.completionSummary || '') + '</p><p class="cv-takeaway">気になる単位の説明や図解を見返し、確認タイムで理解を深めましょう。</p>' + handoffButton() + (data.nextLesson && window.CONVERSATION_LESSONS[data.nextLesson] ? '<a class="btn cv-primary" href="conversation.html?lesson=' + esc(data.nextLesson) + '">次の講へ · ' + esc(data.nextLesson + ' ' + window.CONVERSATION_LESSONS[data.nextLesson].title) + '</a>' : '') + units.map(function (u) {
      var a = state.answers[u.id];
      return '<details class="cv-review-item"><summary>' + (a.correct ? '✓ 正解' : '↺ 要確認') + ' · ' + esc(u.topic) + '</summary><p>' + esc(u.question) + '</p><p>あなたの回答：' + marks[a.selected] + ' ' + esc(u.options[a.selected]) + '</p><p>正解：' + marks[u.answer] + ' ' + esc(u.options[u.answer]) + '</p><p>' + esc(u.explanation) + '</p><button class="btn" data-unit="' + units.indexOf(u) + '">説明と図を見返す</button></details>';
    }).join('') + (data.referenceSections ? '<h2>教本の資料を見返す</h2>' + data.referenceSections.map(function(section) { return '<details class="cv-reference"><summary>' + esc(section.heading) + '</summary><div class="prose cv-source-body">' + section.bodyHtml + '</div></details>'; }).join('') : '') + '</section><a class="btn cv-primary" href="index.html?exam=g-kentei">通常のドリルへ戻る</a>' + button('restart', 'この' + units.length + '単位を最初からやり直す');
  }
  function closeHelp() {
    if (!helpReturn) return;
    var returnPoint = helpReturn;
    helpReturn = null;
    $('cv-help').innerHTML = '';
    if (returnPoint.trigger && returnPoint.trigger.isConnected) returnPoint.trigger.focus({ preventScroll: true });
    window.scrollTo(returnPoint.x, returnPoint.y);
  }
  function showHelp(kind, trigger) {
    var u = units[state.index];
    // Keep the original reading position even when switching between supplements.
    if (!helpReturn) helpReturn = { x: window.scrollX, y: window.scrollY, trigger: trigger };
    helpKind = kind;
    var labels = { more: '補足説明 · もう少し詳しく', again: '補足説明 · 言い換えると', example: '補足説明 · 別の例で考えると' };
    var steps = kind === 'example' ? u.exampleSteps : u.moreSteps;
    var body = kind === 'again' ? '<p>' + esc(u.again) + '</p>' : '';
    if (steps) body += steps.map(function (step) { return '<section class="cv-help-step"><h4>' + esc(step[0]) + '</h4><p>' + esc(step[1]) + '</p></section>'; }).join('');
    else body += '<p>' + esc(u[kind]) + '</p>';
    var returnButton = button('close-help', state.stage === 'read' ? '元の説明に戻る' : '確認タイムに戻る', 'cv-wide');
    $('cv-help').innerHTML = '<aside class="cv-help">' + returnButton + '<h3 tabindex="-1">' + labels[kind] + '</h3>' + body + '<p class="cv-help-end">ここを押さえる：' + esc(u.takeaway) + '</p>' + returnButton + '</aside>';
    $('cv-help').querySelector('h3').focus({ preventScroll: true });
    $('cv-help').scrollIntoView({ block: 'start' });
    if ($('cv-prompt')) refreshPrompt();
  }
  function promptText() {
    var u = units[state.index], a = state.answers[u.id];
    return ['G検定の' + data.lesson + '「' + data.title + '」を学習中です。', '教材：g-kentei-drill / js/lessons.js', '今のテーマ：' + u.topic, '', '問題文：' + u.question, '選択肢：'].concat(u.options.map(function (o, i) { return marks[i] + ' ' + o; })).concat([
      '', '私が選んだ回答：' + marks[a.selected] + ' ' + u.options[a.selected], '正解：' + marks[u.answer] + ' ' + u.options[u.answer], '回答結果：' + (a.correct ? '正解' : '不正解'), '教材側の短い解説：' + u.explanation,
      '', '読んだ説明：', u.paragraphs.join('\n'), '画面の図解の内容：' + (u.diagramText || ''),
      helpKind ? '確認した補足：' + JSON.stringify(helpKind === 'example' ? u.exampleSteps : u.moreSteps) : '',
      '', '特に聞きたいこと：' + (inquiry.trim() || 'この内容を理解するための考え方を知りたいです。'),
      '希望する説明：' + questionStyle,
      'この部分がよく理解できないので、分かりやすく説明してください。',
      '上の教材を前提に、質問に直接答えてください。最初は3段階ほどに分けて説明し、図解を求めた場合は表示できる図や表を使ってください。先の単元へ勝手に進めず、最後に理解を確かめる短い問いを1つだけ出してください。'
    ]).join('\n');
  }
  function refreshPrompt() {
    copyToken++;
    $('cv-prompt').value = promptText();
    $('cv-copy-status').textContent = '質問文を変更しました。「この内容でコピー」を押してください。';
  }
  function openQuestionPanel() {
    if ($('cv-prompt')) return;
    $('cv-ai').innerHTML = '<section class="cv-ai"><h3>どこが分からない？</h3><p class="cv-small">まず標準の質問文をコピーします。疑問を書き足した場合は、下のボタンでコピーし直してください。</p><label for="cv-question-style">説明してほしい形</label><select id="cv-question-style"><option>具体例で順に説明</option><option>図や表を使って説明</option><option>似た用語との違いを比較</option><option>自分の回答が違う理由を説明</option><option>計算を一段ずつ説明</option></select><label for="cv-inquiry">自分の疑問（任意）</label><textarea id="cv-inquiry" maxlength="1500" placeholder="例：入力を増やすことと、次元を上げることは同じ？"></textarea><p id="cv-copy-status" role="status"></p><div class="cv-actions">' + button('copy', 'この内容でコピー') + '<a class="btn" href="https://chatgpt.com/" target="_blank" rel="noopener noreferrer">ChatGPTを開く ↗</a></div><details><summary>コピーする質問文を確認</summary><label for="cv-prompt">教材・問題・自分の疑問をまとめた文章</label><textarea id="cv-prompt" readonly></textarea></details><p class="cv-small">ChatGPTで貼り付けて送信します。質問や図解の説明はコピーするだけで、自動送信しません。アプリが開かない場合は手動でChatGPTへ切り替えられます。</p></section>';
    $('cv-question-style').value = questionStyle;
    $('cv-inquiry').value = inquiry;
    $('cv-prompt').value = promptText();
  }
  async function copyPrompt() {
    openQuestionPanel();
    var token = ++copyToken;
    var text = promptText();
    $('cv-prompt').value = text;
    $('cv-copy-status').textContent = '質問文をコピーしています…';
    var copied = false;
    try {
      if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text); copied = true; }
    } catch (e) { /* 次のコピー手段へ */ }
    if (token !== copyToken || !$('cv-prompt')) return;
    if (!copied) {
      $('cv-prompt').closest('details').open = true;
      var field = $('cv-prompt');
      field.focus({ preventScroll: true }); field.select(); field.setSelectionRange(0, text.length);
      try { copied = document.execCommand('copy'); } catch (e) { copied = false; }
    }
    $('cv-copy-status').textContent = copied ? '✓ 質問文をコピーしました。次にChatGPTを開いて貼り付けてください。' : '自動コピーできませんでした。下の文章を長押しして選択・コピーしてください。';
    $('cv-ai').scrollIntoView({ block: 'nearest' });
  }
  screen.addEventListener('input', function (event) {
    if (event.target.id === 'cv-inquiry') { inquiry = event.target.value; refreshPrompt(); }
  });
  screen.addEventListener('change', function (event) {
    if (event.target.id === 'cv-question-style') { questionStyle = event.target.value; refreshPrompt(); }
  });
  screen.addEventListener('click', function (event) {
    var visual = event.target.closest('[data-visual]');
    if (visual && state && $('cv-figure')) {
      var visualMode = visual.dataset.visual;
      $('cv-figure').innerHTML = window.CV_FIGURE(units[state.index].id, visualMode);
      var activeControl = Array.from($('cv-figure').querySelectorAll('[data-visual]')).find(function (control) { return control.dataset.visual === visualMode; });
      if (activeControl) activeControl.focus({ preventScroll: true });
      return;
    }
    var revisit = event.target.closest('[data-unit]');
    if (revisit && state && state.stage === 'done') {
      var unitIndex = Number(revisit.dataset.unit);
      if (!Number.isInteger(unitIndex) || unitIndex < 0 || unitIndex >= units.length) return;
      reviewReturn = { index: state.index, stage: state.stage };
      readingPage = 0; state.index = unitIndex; state.stage = 'read'; render(); return;
    }

    var choice = event.target.closest('[data-choice]');
    if (choice && state && state.stage === 'quiz') {
      var selected = Number(choice.dataset.choice);
      var u = units[state.index];
      if (!Number.isInteger(selected) || selected < 0 || selected >= u.options.length) return;
      state.answers[u.id] = { selected: selected, correct: selected === u.answer, answeredAt: Date.now() };
      state.stage = 'review'; save(); render(); return;
    }
    var target = event.target.closest('[data-action]');
    if (!target) return;
    var action = target.dataset.action;
    if (action === 'handoff' && window.CV_HANDOFF) {
      window.CV_HANDOFF.open({
        index: state && state.stage !== 'done' ? state.index : 0,
        stage: state ? stageNames[state.stage] : '未開始',
        answers: state ? state.answers : {},
        review: Boolean(state && (state.stage === 'done' || (reviewReturn && reviewReturn.stage === 'done')))
      }, target);
      return;
    }
    if (action === 'start' || action === 'restart') {
      if (state && !confirm('この会話型学習の進捗と回答を消して、最初からやり直しますか？ 通常ドリルの記録は消えません。')) return;
      readingPage = 0; reviewReturn = null; state = fresh(); save(); render(); return;
    }
    if (!state) return;
    if (action === 'retry' && state.stage === 'review') {
      // 解き直す単位だけを未回答に戻す。補足・読み返しの「戻る」は回答を保持する。
      delete state.answers[units[state.index].id];
      reviewReturn = null;
      readingPage = 0;
      if (Object.prototype.hasOwnProperty.call(state, 'readingPage')) state.readingPage = 0;
      state.stage = 'quiz';
      save(); render(); return;
    }
    if (action === 'read-next' || action === 'read-previous') {
      var pages = units[state.index].bodyPages || [];
      if (state.stage !== 'read') return;
      readingPage = Math.max(0, Math.min(pages.length - 1, readingPage + (action === 'read-next' ? 1 : -1)));
      if (!reviewReturn) { state.readingPage = readingPage; save(); }
      render(); return;
    }
    if (['read', 'quiz', 'next', 'revisit', 'return-review'].includes(action)) {
      readingPage = 0;
      if (Object.prototype.hasOwnProperty.call(state, 'readingPage')) state.readingPage = 0;
    }
    if (action === 'resume') { render(); return; }
    if (action === 'revisit' && state.stage === 'review') {
      reviewReturn = { index: state.index, stage: state.stage };
      state.stage = 'read'; render(); return;
    }
    if (action === 'return-review' && reviewReturn) {
      state.index = reviewReturn.index; state.stage = reviewReturn.stage;
      reviewReturn = null; render(); return;
    }
    if (action === 'close-help') { closeHelp(); return; }
    if (action === 'more' || action === 'again' || action === 'example') { showHelp(action, target); return; }
    if (action === 'ai' || action === 'copy') { copyPrompt(); return; }
    if (action === 'next' && state.stage === 'review') {
      if (state.index === units.length - 1) {
        var unanswered = units.findIndex(function (unit) { return !state.answers[unit.id]; });
        if (unanswered === -1) state.stage = 'done';
        else { state.index = unanswered; state.stage = 'read'; }
      } else { state.index++; state.stage = 'read'; }
    } else if (action === 'quiz' || action === 'read') state.stage = action;
    else return;
    save(); render();
  });
  state = load();
  readingPage = state && Number.isInteger(state.readingPage) ? state.readingPage : 0;
  if (migrated) save();
  if (new URLSearchParams(window.location.search).get('resume') === '1' && state) render();
  else intro();
  // 直接URLから訪れた場合も、次回以降はオフラインで再開できるようにする。
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(function () {});
})();
