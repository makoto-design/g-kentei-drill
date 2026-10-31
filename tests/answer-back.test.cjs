const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM, VirtualConsole } = require('jsdom');
const ROOT = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');

function app(lesson = 'M2-01', storage = {}) {
  const errors = [], vc = new VirtualConsole();
  vc.on('jsdomError', error => errors.push(error));
  const dom = new JSDOM(read('conversation.html'), {
    url: 'https://learning.example/g-kentei-drill/conversation.html?lesson=' + lesson + '&resume=1',
    runScripts: 'outside-only', virtualConsole: vc
  });
  const w = dom.window, d = w.document;
  w.scrollTo = () => {};
  w.HTMLElement.prototype.scrollIntoView = () => {};
  for (const [key, value] of Object.entries(storage)) w.localStorage.setItem(key, value);
  for (const script of d.querySelectorAll('script[src]')) {
    w.eval(read(new URL(script.src).pathname.replace('/g-kentei-drill/', '')));
  }
  return {
    w, d, errors, lesson: w.CONVERSATION_DATA,
    click(selector) { const button = d.querySelector(selector); assert.ok(button, 'Missing ' + selector); button.click(); },
    saved() { return JSON.parse(w.localStorage.getItem(w.CONVERSATION_DATA.storageKey)); },
    storage() { return Object.fromEntries(Object.keys(w.localStorage).map(key => [key, w.localStorage.getItem(key)])); },
    close() { assert.deepEqual(errors, []); w.close(); }
  };
}
function openQuiz(a) {
  while (a.d.querySelector('[data-action="read-next"]')) a.click('[data-action="read-next"]');
  a.click('[data-action="quiz"]');
}
function assertUnanswered(a, unit, count) {
  assert.equal(a.saved().stage, 'quiz');
  assert.equal(a.saved().answers[unit.id], undefined);
  assert.equal(a.d.querySelector('h1').textContent, unit.question);
  assert.equal(a.d.querySelectorAll('[data-choice]:enabled').length, 4);
  assert.deepEqual([...a.d.querySelectorAll('[data-choice] > span:last-child')].map(n => n.textContent), [...unit.options]);
  assert.equal(a.d.querySelector('.cv-result'), null);
  assert.equal(a.d.querySelector('[data-action="next"]'), null);
  assert.equal(a.d.getElementById('cv-progress').value, count);
  assert.equal(a.d.activeElement, a.d.querySelector('h1'));
}

test('全32講・192単位で確認タイムから未回答へ戻り、別の選択肢で再回答できる', () => {
  const initial = app(), ids = Object.keys(initial.w.CONVERSATION_LESSONS);
  initial.close();
  for (const id of ids) {
    const a = app(id);
    a.click('[data-action="start"]');
    for (const [index, unit] of a.lesson.units.entries()) {
      openQuiz(a);
      const previousAnswers = a.saved().answers;
      a.click('[data-choice="' + ((unit.answer + 1) % 4) + '"]');
      assert.equal(a.saved().answers[unit.id].correct, false);
      assert.equal(a.d.getElementById('cv-progress').value, index + 1);
      assert.match(a.d.querySelector('[data-action="retry"]').textContent, /戻る/);
      a.click('[data-action="retry"]');
      assertUnanswered(a, unit, index);
      assert.deepEqual(a.saved().answers, previousAnswers);
      a.click('[data-choice="' + unit.answer + '"]');
      assert.equal(a.saved().answers[unit.id].correct, true);
      assert.equal(Object.keys(a.saved().answers).length, index + 1);
      a.click('[data-action="next"]');
    }
    assert.equal(a.saved().stage, 'done');
    assert.equal(a.d.querySelector('.cv-score').textContent.trim(), a.lesson.units.length + ' / ' + a.lesson.units.length + '問 正解');
    a.close();
  }
});

test('未回答への復元を保存・再開し、他の単位・講・通常ドリル・パスポートの記録を保持する', () => {
  const untouched = {
    gken_store_v1: '{"normal":"keep"}', aipass_2027_store_v1: '{"passport":"keep"}',
    gken_conversation_m2_02_v1: '{"otherLesson":"keep"}'
  };
  const a = app('M2-01', untouched);
  a.click('[data-action="start"]'); openQuiz(a); a.click('[data-choice="0"]'); a.click('[data-action="next"]');
  openQuiz(a); a.click('[data-choice="1"]');
  const previous = a.saved().answers[a.lesson.units[0].id];
  a.click('[data-action="retry"]');
  const saved = a.storage(); a.close();
  const b = app('M2-01', saved), unit = b.lesson.units[1];
  assertUnanswered(b, unit, 1);
  assert.equal(b.saved().index, 1);
  assert.deepEqual(b.saved().answers[b.lesson.units[0].id], previous);
  for (let selected = 0; selected < 4; selected++) {
    b.click('[data-choice="' + selected + '"]');
    assert.equal(b.saved().answers[unit.id].selected, selected);
    assert.equal(b.saved().answers[unit.id].correct, selected === unit.answer);
    b.click('[data-action="retry"]'); assertUnanswered(b, unit, 1);
  }
  for (const [key, value] of Object.entries(untouched)) assert.equal(b.storage()[key], value);
  b.close();
});

test('補足・読み返しから戻ると回答を保持し、問題へ戻った後の説明・補足では未回答を保持する', () => {
  const a = app('M1-03');
  a.click('[data-action="start"]'); openQuiz(a); a.click('[data-choice="0"]');
  const before = a.storage()[a.lesson.storageKey];
  a.click('[data-action="again"]'); a.click('[data-action="close-help"]');
  assert.equal(a.storage()[a.lesson.storageKey], before);
  a.click('[data-action="revisit"]');
  a.click('[data-action="more"]'); a.click('[data-action="close-help"]');
  while (a.d.querySelector('[data-action="read-next"]')) a.click('[data-action="read-next"]');
  a.click('[data-action="return-review"]');
  assert.equal(a.storage()[a.lesson.storageKey], before);
  a.click('[data-action="retry"]'); assertUnanswered(a, a.lesson.units[0], 0);
  a.click('[data-action="read"]');
  a.click('[data-action="more"]'); a.click('[data-action="close-help"]');
  assert.deepEqual(a.saved().answers, {});
  openQuiz(a); assertUnanswered(a, a.lesson.units[0], 0);
  a.click('[data-choice="0"]'); assert.equal(Object.keys(a.saved().answers).length, 1);
  a.close();
});

test('保存失敗時も戻る・再回答が動作し、保存エラーを表示する', () => {
  const a = app(); a.click('[data-action="start"]'); openQuiz(a); a.click('[data-choice="0"]');
  a.w.Storage.prototype.setItem = () => { throw Error('quota'); };
  a.click('[data-action="retry"]');
  assert.equal(a.d.querySelectorAll('[data-choice]:enabled').length, 4);
  assert.equal(a.d.getElementById('cv-progress').value, 0);
  assert.equal(a.d.getElementById('cv-storage').hidden, false);
  a.click('[data-choice="' + a.lesson.units[0].answer + '"]');
  assert.ok(a.d.querySelector('.cv-result.is-correct'));
  assert.equal(a.d.getElementById('cv-progress').value, 1);
  a.close();
});
