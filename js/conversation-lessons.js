/* Lesson registry: independent progress keys, URL selection and shared page labels. */
(function () {
  'use strict';
  var supervised = Object.assign({}, window.CONVERSATION_DATA, {
    title: '教師あり学習',
    introSummary: '教師あり学習の主な内容を、短い説明と図で学びます。',
    completionSummary: '教師あり学習・回帰と分類から、決定木・アンサンブル学習まで進みました。用語の役割と、手法同士のつながりを見返せます。',
    storageKey: 'gken_conversation_m2_01_v1'
  });
  var lessons = { 'M2-01': supervised };
  if (window.CONVERSATION_M202) lessons['M2-02'] = Object.assign({}, window.CONVERSATION_M202, { storageKey: 'gken_conversation_m2_02_v1' });
  (window.CONVERSATION_COURSE || []).forEach(function (lesson) { lessons[lesson.lesson] = Object.assign({}, lesson, { storageKey: 'gken_conversation_' + lesson.lesson.toLowerCase().replace('-', '_') + '_v1' }); });
  Object.keys(window.CONVERSATION_LEGACY_REFERENCES || {}).forEach(function(id) { if (lessons[id]) lessons[id].referenceSections = window.CONVERSATION_LEGACY_REFERENCES[id]; });
  var ordered = Object.keys(lessons).sort();
  ordered.forEach(function (id,i) { lessons[id].module = id.split('-')[0]; if (ordered[i+1]) lessons[id].nextLesson = ordered[i+1]; });
  var params = new URLSearchParams(window.location.search), requested = params.get('lesson');
  var active = Object.prototype.hasOwnProperty.call(lessons, requested) ? lessons[requested] : supervised;
  window.CONVERSATION_LESSONS = lessons;
  window.CONVERSATION_DATA = active;
  window.CV_IS_CATALOG = !params.has('lesson');
  window.CV_LAST_LESSON_KEY = 'gken_conversation_last_lesson_v1';
  var label = active.lesson + ' ' + active.title;
  document.title = window.CV_IS_CATALOG ? 'G検定 · 会話で学習' : '会話で学習 · ' + label;
  document.querySelector('.cv-eyebrow').textContent = window.CV_IS_CATALOG ? 'G検定 · 会話で学習' : label;
  document.querySelector('meta[name="description"]').content = window.CV_IS_CATALOG ? 'G検定の教本を、説明・図解・4択・ChatGPTとの会話でひとつずつ学びます。' : label + 'を、短い説明・図解・4択・会話で学ぶモード。';
  document.getElementById('cv-position').textContent = active.lesson + 'の主な内容';
  document.querySelector('.cv-footer').textContent = '進捗はこの端末・このブラウザに講ごとに保存されます。';
  var back = document.querySelector('.cv-back');
  back.href = window.CV_IS_CATALOG ? 'index.html?exam=g-kentei' : 'conversation.html';
  back.textContent = window.CV_IS_CATALOG ? '通常のドリル' : '← 全講のホーム';
  back.setAttribute('aria-label', window.CV_IS_CATALOG ? '通常のドリルを開く' : '会話学習の全講ホームへ');
  var nav = document.getElementById('cv-lesson-nav');
  var home = document.createElement('a'); home.href = 'conversation.html'; home.textContent = '全講のホーム'; if(window.CV_IS_CATALOG) home.setAttribute('aria-current','page'); nav.appendChild(home);
  if (!window.CV_IS_CATALOG) {
    var labelElement = document.createElement('span'); labelElement.className = 'cv-current-lesson'; labelElement.textContent = label; nav.appendChild(labelElement);
    try { localStorage.setItem(window.CV_LAST_LESSON_KEY, JSON.stringify({ lesson:active.lesson, updatedAt:Date.now() })); } catch (error) {}
  }
})();
