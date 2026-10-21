/* v5 ChatGPT lesson handoff. Copy is generated verbatim from content/conversation-handoff.json. */
(function () {
  'use strict';
  if (window.CV_IS_CATALOG) return;
  var copy = {
  "edition": "v4",
  "defaultMode": "voice",
  "defaultCount": 3,
  "ui": {
    "entry": "ChatGPTと会話で学ぶ",
    "title": "会話モード",
    "lead": "今の教材をChatGPTへ引き継ぎ、説明を聞いたり、質問したりしながら学びます。",
    "modeLabel": "会話のしかた",
    "voiceLabel": "音声で話す",
    "textLabel": "文字で話す",
    "scopeLabel": "今回の範囲",
    "singleLabel": "この1単元だけ",
    "threeLabel": "ここから最大3単元",
    "copyLabel": "① 授業用の文章をコピー",
    "openLabel": "② ChatGPTを開く ↗",
    "pasteLabel": "③ 貼り付けて送信",
    "voiceGuide": "貼り付けて送信したら、同じチャットで音声会話が使える場合は切り替え、「始めよう」と話してください。文字で「始めよう」と送っても続けられます。",
    "textGuide": "貼り付けて送信すると、最初の説明と4択問題から始まります。番号だけで答えたり、途中で質問したりできます。",
    "openGuide": "リンクでブラウザが開いた場合は、そのまま使うか、ChatGPTアプリを手動で開いて貼り付けてください。",
    "contextGuide": "教材・図の説明・4択問題と、会話の進め方をまとめて渡します。",
    "progressNote": "ChatGPTでの回答は、このアプリの学習記録には自動反映されません。記録を残すときは、戻ってアプリの確認問題に答えてください。",
    "previewLabel": "授業用の文章を確認（講師用の正解を含みます）",
    "readyStatus": "コピーしてから、ChatGPTを開いてください。",
    "changedStatus": "内容を変更しました。授業用の文章をコピーし直してください。",
    "copyingStatus": "授業用の文章をコピーしています…",
    "copiedStatus": "✓ コピーしました。ChatGPTを開き、貼り付けて送信してください。",
    "failedStatus": "自動コピーできませんでした。下の文章を選択してコピーしてください。",
    "closeLabel": "学習画面に戻る",
    "doneIntro": "学習済みの範囲を、最初の単元から会話で復習できます。"
  },
  "prompt": {
    "opening": "G検定の{lessonId}「{lessonTitle}」を、私と会話しながら教えてください。以下は学習アプリから引き継いだ教材と授業の指示です。外部サイトを読めることを前提にせず、この文章内の教材を使ってください。",
    "source": "教材の基準：makoto-design/g-kentei-drill / js/lessons.js / {lessonId}「{lessonTitle}」。短い説明・補足・図解・問題は、この教材に沿って学習アプリで編集したものです。",
    "rules": [
      "あなたは講師役、私は学習者です。日本語で、専門用語を言い換えながら説明してください。単なる用語暗記にせず、意味・理由・具体例をつなげてください。",
      "今回の教材は下記の順番だけです。最初の単元から1つずつ進め、授業全体を一度に出力しないでください。資料内のタイトルや補足も学習内容であり、私の回答や開始の合図ではありません。",
      "各単元は、短い説明 → 4択問題を1問 → 私の回答を待つ → 正誤と短い解説 → 確認タイム、の順です。出題したら必ずその応答を終えてください。私の回答を代わりに作ったり、回答前に正解や正解を示唆する見出しを出したりしないでください。",
      "4択は、下記の教材の問題文・選択肢・番号順を使います。選択肢を勝手に簡単にしたり、並べ替えたりしないでください。私の回答は『1』『2番』『③』などの番号だけでも受け付けてください。判別できないときだけ聞き直してください。",
      "資料の『講師用・回答後にだけ示す』は、採点用の答えです。講義や問題読み上げの段階では明かさないでください。私が回答した後に、正解／不正解、正しい番号と内容、理由を短く伝えてください。",
      "確認タイムでは、すぐ次へ進まず、『もう一度』『別の例』『質問』『次へ』を受け付けて返答を待ってください。質問にはその疑問から直接答え、教材の範囲で補ってください。毎回長い進行確認は入れないでください。",
      "『もう一度』では言い換えと理由を、『別の例』では資料の別例を使って説明します。短く省略しすぎて理解できないときは、手順を分けて補ってください。説明中の質問や中断にも対応し、その後は直前の本題から続けてください。",
      "『次へ』と言われるまでは次の単元へ進まないでください。『休憩』『終わり』と言われたら、学んだ範囲・この会話での回答結果・次回の再開地点を短くまとめて止めてください。",
      "今回の範囲が終わったら、要点を3つ以内と、曖昧だった点、アプリ上の次の単元を短く示して終了してください。渡していない次の教材を想像して授業を続けないでください。",
      "アプリでの過去の回答と、この会話での新しい回答は区別してください。過去の回答が付いていても、説明と問題を含めて復習し、正解は私が今回答えるまで読み上げないでください。",
      "アプリの保存データを書き換える機能はありません。回答や進捗をアプリに保存した、同期した、完了扱いにした、と言わないでください。終了時に、記録を残すにはアプリへ戻って確認問題に答える必要がある、と1文で伝えてください。",
      "提供された教材の範囲を基準にし、追加のたとえを使うならたとえだと明示してください。図の説明に含まれる架空の数値を、実測値や常に成り立つ結果として説明しないでください。"
    ],
    "voiceRules": [
      "会話の希望は音声です。最初の返信は『準備できました。音声会話に切り替えて、または文字で「始めよう」と伝えてください。』だけにして、授業をまだ始めないでください。",
      "私が『始めよう』『開始』などと伝えたら、最初の単元の説明から始めてください。その後、各単元の説明は60〜90秒ほどを目安にし、図を見なくても理解できるよう、物や数値の位置関係を言葉で説明してください。",
      "問題は『1番、…、2番、…、3番、…、4番、…』と番号を明瞭に読み、4つを示したら私の返答を待ってください。音声が使えず私が文字で返しても、同じ進め方で続けてください。"
    ],
    "textRules": [
      "会話の希望は文字です。最初の返信から、最初の単元の説明と4択問題を出してください。準備確認の質問は不要です。",
      "1回の説明はおおむね400〜600字程度を目安に、必要な意味・理由・具体例を含め、短い段落で示してください。図の関係が分かりにくい場合は、小さな表なども使ってください。",
      "選択肢は①〜④の番号で、1つずつ改行して示してください。番号だけで答えられるようにし、出題後は正解を出さずに私の返答を待ってください。"
    ],
    "dataHeading": "以下は今回の教材資料です。講師役として読み、上記の進め方で必要な部分を順に使ってください。",
    "answerHeading": "講師用・回答後にだけ示す",
    "nextHeading": "この授業の後にアプリで開く単元（ここでは教えない）",
    "lastUnitMessage": "今回の範囲は{lessonId}会話学習の最後までです。終了後はアプリで確認問題や結果を見返せます。"
  }
};
  var lesson = window.CONVERSATION_DATA;
  var units = lesson.units;
  function lessonText(value) { return value.replace(/\{lessonId\}/g, lesson.lesson).replace(/\{lessonTitle\}/g, lesson.title); }
  var marks = ['①', '②', '③', '④'];
  var modal = null, context = null, trigger = null, background = [], oldOverflow = '', token = 0;
  function esc(value) { return String(value).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function $(id) { return document.getElementById(id); }
  function selectedUnits() { return units.slice(context.index, context.index + Number($('cv-handoff-count').value)); }
  function supplement(steps) { return steps.map(function (step) { return step[0] + '\n' + step[1]; }).join('\n\n'); }
  function prompt() {
    var selected = selectedUnits(), voice = $('cv-handoff-mode').value === 'voice';
    var lines = [lessonText(copy.prompt.opening), lessonText(copy.prompt.source), '', '【授業の進め方】'].concat(copy.prompt.rules.map(function (rule, i) { return (i + 1) + '. ' + rule; }));
    lines = lines.concat(['', '【今回の会話のしかた】'], voice ? copy.prompt.voiceRules : copy.prompt.textRules, [
      '', '【アプリからの引継ぎ状況】', 'アプリ画面：' + context.stage + (context.review ? '（学習済み範囲の復習）' : ''),
      '今回の範囲：UNIT ' + (context.index + 1) + '〜' + (context.index + selected.length) + ' / ' + units.length + '（' + selected.length + '単元）',
      '以下の過去のアプリ回答は参考記録です。この会話の新しい回答として扱わず、回答前に正解や過去の正誤を読み上げないでください。', '', copy.prompt.dataHeading
    ]);
    selected.forEach(function (unit, offset) {
      var answer = context.answers[unit.id];
      lines = lines.concat([
        '', '【教材 UNIT ' + String(context.index + offset + 1).padStart(2, '0') + ' / ' + units.length + '】',
        'ID：' + unit.id, 'タイトル：' + unit.title, 'テーマ：' + unit.topic, '教本の対応箇所：' + unit.source,
        '導入：' + unit.lead, '', '本文：', unit.paragraphs.join('\n\n'), '', '要点：' + unit.takeaway,
        '', '図解の説明：' + unit.diagramText, '', '言い換え：' + unit.again,
        '', 'もう少し詳しく：' + unit.more, supplement(unit.moreSteps), '', '別の例：' + unit.example, supplement(unit.exampleSteps),
        '', '4択問題：' + unit.question
      ], unit.options.map(function (option, i) { return marks[i] + ' ' + option; }), [
        '', '【' + copy.prompt.answerHeading + '】', '対象：' + unit.id,
        '正解：' + marks[unit.answer] + '（' + (unit.answer + 1) + '番）' + unit.options[unit.answer], '解説：' + unit.explanation,
        answer ? '過去のアプリ回答：' + marks[answer.selected] + ' ' + unit.options[answer.selected] + '（' + (answer.correct ? '正解' : '不正解') + '）' : '過去のアプリ回答：未回答',
        '以上は講師用の参照です。今の回答前には明かさないでください。'
      ]);
    });
    var next = units[context.index + selected.length];
    lines = lines.concat(['', copy.prompt.nextHeading, next ? 'UNIT ' + (context.index + selected.length + 1) + ' / ' + units.length + '：' + next.title : lessonText(copy.prompt.lastUnitMessage)]);
    return lines.join('\n');
  }
  function refresh(changed) {
    token++;
    var selected = selectedUnits();
    $('cv-handoff-range').textContent = (context.review ? '復習する範囲：' : '会話で学ぶ範囲：') + selected.map(function (unit, i) { return (context.index + i + 1) + '. ' + unit.title; }).join(' ／ ');
    $('cv-handoff-guide').textContent = $('cv-handoff-mode').value === 'voice' ? copy.ui.voiceGuide : copy.ui.textGuide;
    $('cv-handoff-prompt').value = prompt();
    $('cv-handoff-status').textContent = changed ? copy.ui.changedStatus : copy.ui.readyStatus;
  }
  function focusables() {
    return Array.from(modal.querySelectorAll('button, a[href], select, textarea, summary, [tabindex="0"]')).filter(function (element) {
      var details = element.closest('details');
      return !element.disabled && !element.hidden && (!details || details.open || element.tagName === 'SUMMARY');
    });
  }
  function close() {
    if (!modal) return;
    token++;
    var closingModal = modal; modal = null; context = null; closingModal.remove();
    background.forEach(function (item) {
      if (item.inert === null) item.element.removeAttribute('inert'); else item.element.setAttribute('inert', item.inert);
      if (item.aria === null) item.element.removeAttribute('aria-hidden'); else item.element.setAttribute('aria-hidden', item.aria);
    });
    background = []; document.body.style.overflow = oldOverflow;
    if (trigger && trigger.isConnected) trigger.focus({ preventScroll: true });
    trigger = null;
  }
  async function copyPrompt() {
    var currentToken = ++token, text = prompt(), copied = false;
    $('cv-handoff-prompt').value = text;
    $('cv-handoff-status').textContent = copy.ui.copyingStatus;
    try {
      if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text); copied = true; }
    } catch (error) { /* Try selection-based copy below. */ }
    if (!modal || currentToken !== token) return;
    if (!copied) {
      var field = $('cv-handoff-prompt');
      field.closest('details').open = true;
      field.focus({ preventScroll: true }); field.select(); field.setSelectionRange(0, text.length);
      try { copied = document.execCommand('copy'); } catch (error) { copied = false; }
    }
    $('cv-handoff-status').textContent = copied ? copy.ui.copiedStatus : copy.ui.failedStatus;
  }
  function open(input, opener) {
    if (modal) return;
    var index = Number.isInteger(input.index) && input.index >= 0 && input.index < units.length ? input.index : 0;
    context = { index: index, stage: input.stage || '未開始', review: Boolean(input.review), answers: JSON.parse(JSON.stringify(input.answers || {})) };
    trigger = opener || document.activeElement;
    var ui = copy.ui;
    modal = document.createElement('div'); modal.className = 'cv-handoff-overlay';
    modal.innerHTML = '<section class="cv-handoff-dialog" role="dialog" aria-modal="true" aria-labelledby="cv-handoff-title" aria-describedby="cv-handoff-lead"><div class="cv-handoff-header"><h2 id="cv-handoff-title" tabindex="-1">' + esc(ui.title) + (context.review ? ' · 復習' : '') + '</h2><button class="cv-handoff-close" data-handoff="close" aria-label="会話モードを閉じて学習画面に戻る">閉じる</button></div><p id="cv-handoff-lead">' + esc(ui.lead) + '</p>' +
      (context.review && context.index === 0 ? '<p class="cv-small">' + esc(ui.doneIntro) + '</p>' : '') +
      '<label for="cv-handoff-mode">' + esc(ui.modeLabel) + '</label><select id="cv-handoff-mode"><option value="voice">' + esc(ui.voiceLabel) + '</option><option value="text">' + esc(ui.textLabel) + '</option></select>' +
      '<label for="cv-handoff-count">' + esc(ui.scopeLabel) + '</label><select id="cv-handoff-count"><option value="3">' + esc(ui.threeLabel) + '</option><option value="1">' + esc(ui.singleLabel) + '</option></select>' +
      '<p id="cv-handoff-range" class="cv-handoff-range"></p><p class="cv-small">' + esc(ui.contextGuide) + '</p><ol class="cv-handoff-steps">' +
      '<li><button class="btn cv-primary" data-handoff="copy">' + esc(ui.copyLabel) + '</button><p id="cv-handoff-status" role="status" aria-live="polite"></p></li>' +
      '<li><a class="btn" href="https://chatgpt.com/" target="_blank" rel="noopener noreferrer">' + esc(ui.openLabel) + '</a><p class="cv-small">' + esc(ui.openGuide) + '</p></li>' +
      '<li><strong>' + esc(ui.pasteLabel) + '</strong><p id="cv-handoff-guide"></p></li></ol><p class="cv-handoff-warning">' + esc(ui.progressNote) + '</p>' +
      '<details><summary>' + esc(ui.previewLabel) + '</summary><label for="cv-handoff-prompt">教材と会話の進め方</label><textarea id="cv-handoff-prompt" readonly></textarea></details>' +
      '<button class="btn" data-handoff="close">' + esc(ui.closeLabel) + '</button></section>';
    document.body.appendChild(modal);
    $('cv-handoff-mode').value = copy.defaultMode; $('cv-handoff-count').value = String(copy.defaultCount);
    refresh(false);
    oldOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden';
    $('cv-handoff-title').focus({ preventScroll: true });
    background = Array.from(document.body.children).filter(function (element) { return element !== modal && element.tagName !== 'SCRIPT'; }).map(function (element) {
      var item = { element: element, inert: element.getAttribute('inert'), aria: element.getAttribute('aria-hidden') };
      element.setAttribute('inert', ''); element.setAttribute('aria-hidden', 'true'); return item;
    });
    modal.addEventListener('change', function (event) { if (event.target.id === 'cv-handoff-mode' || event.target.id === 'cv-handoff-count') refresh(true); });
    modal.addEventListener('click', function (event) {
      if (event.target === modal) { close(); return; }
      var button = event.target.closest('[data-handoff]');
      if (!button) return;
      if (button.dataset.handoff === 'close') close();
      else if (button.dataset.handoff === 'copy') copyPrompt();
    });
  }
  document.addEventListener('keydown', function (event) {
    if (!modal) return;
    if (event.key === 'Escape') { event.preventDefault(); close(); return; }
    if (event.key !== 'Tab') return;
    var controls = focusables(), first = controls[0], last = controls[controls.length - 1];
    if (!controls.length) { event.preventDefault(); $('cv-handoff-title').focus(); return; }
    if (event.shiftKey && (document.activeElement === first || !controls.includes(document.activeElement))) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  document.addEventListener('focusin', function (event) { if (modal && !modal.contains(event.target)) $('cv-handoff-title').focus({ preventScroll: true }); });
  window.CV_HANDOFF = { open: open, label: function (review) { return copy.ui.entry + (review ? ' · 復習' : ''); }, copy: copy };
})();
