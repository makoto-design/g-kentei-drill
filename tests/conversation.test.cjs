const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM, VirtualConsole } = require('jsdom');
const ROOT = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');
const KEY = 'gken_conversation_m2_01_v1';
function create(options = {}) {
  const errors = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', error => errors.push(error));
  const dom = new JSDOM(read('conversation.html'), { url: 'https://learning.example/g-kentei-drill/conversation.html?lesson=M2-01', runScripts: 'outside-only', virtualConsole: vc });
  const w = dom.window;
  w.scrollTo = () => {};
  w.HTMLElement.prototype.scrollIntoView = () => {};
  w.confirm = () => options.confirm !== false;
  w.document.execCommand = () => options.fallback === true;
  Object.defineProperty(w, 'isSecureContext', {value: true});
  const copies = [];
  if (options.clipboard !== false) Object.defineProperty(w.navigator, 'clipboard', {value: {writeText: async text => { if (options.clipboardReject) throw Error('denied'); copies.push(text); }}});
  if (options.saved !== undefined) w.localStorage.setItem(KEY, typeof options.saved === 'string' ? options.saved : JSON.stringify(options.saved));
  w.localStorage.setItem('gken_store_v1', '{"normal":"keep"}');
  if (options.storageFailure) w.Storage.prototype.setItem = () => {throw Error('quota');};
  for (const file of ['conversation-data.js', 'conversation-m202-data.js', 'conversation-course-data.js', 'conversation-lessons.js', 'conversation-catalog.js', 'conversation-visuals.js', 'conversation-m202-visuals.js', 'conversation-course-visuals.js', 'conversation-handoff.js', 'conversation.js']) w.eval(read('js/' + file));
  const d = w.document;
  return {w, d, dom, errors, copies, units:w.CONVERSATION_DATA.units, click(selector) { const e=d.querySelector(selector); assert.ok(e, 'Missing '+selector); e.click(); }, text() {return d.getElementById('cv-screen').textContent;}, saved() {return JSON.parse(w.localStorage.getItem(KEY));}};
}
function answer(app, index, selected = app.units[index].answer) {
  app.click('[data-action="quiz"]');
  app.click(`[data-choice="${selected}"]`);
}
function seed(units, count = units.length, stage = 'done', index = count - 1) {
  return {version:1,index,stage,updatedAt:123,answers:Object.fromEntries(units.slice(0,count).map(u => [u.id,{selected:u.answer,correct:true,answeredAt:456}]))};
}
const tick = () => new Promise(resolve => setImmediate(resolve));
test('16 complete units have valid content, questions, supplements and native diagrams', () => {
  const a=create();
  assert.equal(a.units.length,16); assert.equal(a.w.CONVERSATION_DATA.version,1);
  assert.equal(new Set(a.units.map(u=>u.id)).size,16);
  assert.equal(a.d.getElementById('cv-progress').max,16);
  assert.match(a.d.querySelector('.cv-brand').textContent,/v6/);
  for(const u of a.units) {
    for(const field of ['id','title','topic','source','lead','takeaway','more','again','example','question','explanation','diagramText']) assert.ok(typeof u[field] === 'string' && u[field].trim(),u.id+' '+field);
    assert.ok(u.paragraphs.length >= 3,u.id+' main text');
    assert.equal(u.options.length,4); assert.equal(new Set(u.options).size,4);
    assert.ok(Number.isInteger(u.answer) && u.answer >= 0 && u.answer < 4);
    for(const field of ['moreSteps','exampleSteps']) assert.ok(u[field].length >= 3 && u[field].every(s=>s.length===2 && s.every(x=>typeof x==='string'&&x)),u.id+' '+field);
    const figure=a.w.CV_FIGURE(u.id); const container=a.d.createElement('div'); container.innerHTML=figure;
    assert.ok(container.querySelector('figure figcaption')?.textContent.trim(),u.id+' figure');
    assert.ok(container.querySelector('.cv-vbox, svg, table'),u.id+' diagram content');
    for(const control of container.querySelectorAll('[data-visual]')) {
      const variant=a.d.createElement('div');variant.innerHTML=a.w.CV_FIGURE(u.id,control.dataset.visual);
      assert.equal(variant.querySelectorAll('[aria-pressed="true"]').length,1,u.id+' selected toggle');
      assert.equal(variant.querySelector('[aria-pressed="true"]').dataset.visual,control.dataset.visual);
    }
  }
  assert.deepEqual(a.errors,[]);a.dom.window.close();
});
test('full learning flow handles correct/wrong answers, supplements and review return', () => {
  const a=create(); a.click('[data-action="start"]');
  for(let i=0;i<a.units.length;i++) {
    assert.match(a.text(),new RegExp('UNIT '+String(i+1).padStart(2,'0')+' / 16'));
    assert.equal(a.d.querySelector('h1').textContent,a.units[i].title);
    for(const control of [...a.d.querySelectorAll('[data-visual]')]) {
      a.click(`[data-visual="${control.dataset.visual}"]`);
      assert.equal(a.d.activeElement.dataset.visual,control.dataset.visual);
    }
    a.click('[data-action="more"]'); assert.equal(a.d.querySelectorAll('.cv-help-step').length,a.units[i].moreSteps.length);
    a.click('[data-action="example"]'); assert.equal(a.d.querySelectorAll('.cv-help-step').length,a.units[i].exampleSteps.length);
    answer(a,i,i%2 ? (a.units[i].answer+1)%4 : a.units[i].answer);
    assert.match(a.text(),i%2 ? /不正解/ : /正解です/);
    const before=JSON.stringify(a.saved());
    a.click('[data-action="revisit"]'); assert.match(a.text(),/確認タイムに戻る/);
    assert.equal(a.d.querySelector('[data-action="quiz"]'),null);
    assert.equal(JSON.stringify(a.saved()),before);
    a.click('[data-action="example"]');a.click('[data-action="return-review"]');
    assert.equal(JSON.stringify(a.saved()),before);
    a.click('[data-action="next"]');
  }
  assert.match(a.d.querySelector('.cv-score').textContent,/8.*\/ 16問 正解/);
  assert.equal(a.saved().stage,'done');assert.equal(Object.keys(a.saved().answers).length,16);
  assert.equal(a.d.getElementById('cv-progress').value,16);
  const before=JSON.stringify(a.saved());
  a.click('[data-unit="3"]');assert.equal(a.d.querySelector('h1').textContent,a.units[3].title);
  a.click('[data-action="more"]');assert.equal(JSON.stringify(a.saved()),before);
  a.click('[data-action="return-review"]');assert.equal(JSON.stringify(a.saved()),before);assert.ok(a.d.querySelector('.cv-score'));
  assert.equal(a.w.localStorage.getItem('gken_store_v1'),'{"normal":"keep"}');
  assert.deepEqual(a.errors,[]);a.dom.window.close();
});
test('v1 completion with nine answers resumes at first new unanswered unit without loss', () => {
  const initial=create();const old=seed(initial.units,9);initial.dom.window.close();
  const a=create({saved:old});
  assert.equal(a.saved().index,9);assert.equal(a.saved().stage,'read');
  assert.deepEqual(a.saved().answers,old.answers);
  a.click('[data-action="resume"]');assert.equal(a.d.querySelector('h1').textContent,a.units[9].title);
  assert.equal(a.d.getElementById('cv-progress').value,9);a.dom.window.close();
});
test('migration finds holes and partial quiz/review progress remains stable', () => {
  const initial=create();const hole=seed(initial.units,9);delete hole.answers[initial.units[2].id];initial.dom.window.close();
  const migrated=create({saved:hole});assert.equal(migrated.saved().index,2);migrated.dom.window.close();
  for(const stage of ['read','quiz','review']) {
    const a=create();a.click('[data-action="start"]');answer(a,0);a.click('[data-action="next"]');
    if(stage!=='read')a.click('[data-action="quiz"]');
    if(stage==='review')a.click('[data-choice="0"]');
    const saved=a.saved();a.dom.window.close();
    const b=create({saved});b.click('[data-action="resume"]');assert.deepEqual(b.saved(),saved);
    assert.ok(b.d.querySelector(stage==='quiz'?'.cv-choices':stage==='review'?'.cv-result':'article'));
    b.dom.window.close();
  }
});
test('reloading during a temporary reread preserves confirmation or complete resume', () => {
  const a=create();a.click('[data-action="start"]');answer(a,0);a.click('[data-action="revisit"]');const saved=a.saved();a.dom.window.close();
  const b=create({saved});b.click('[data-action="resume"]');assert.ok(b.d.querySelector('.cv-result'));b.dom.window.close();
  const c=create();const done=seed(c.units);c.dom.window.close();
  const d=create({saved:done});d.click('[data-action="resume"]');d.click('[data-unit="0"]');const savedDone=d.saved();d.dom.window.close();
  const e=create({saved:savedDone});e.click('[data-action="resume"]');assert.ok(e.d.querySelector('.cv-score'));e.dom.window.close();
});
test('storage errors are recoverable and restart confirmation preserves normal drill store', () => {
  const invalid=create({saved:'{broken'});assert.equal(invalid.d.getElementById('cv-storage').hidden,false);invalid.click('[data-action="start"]');answer(invalid,0);invalid.dom.window.close();
  const quota=create({storageFailure:true});quota.click('[data-action="start"]');answer(quota,0);assert.equal(quota.d.getElementById('cv-storage').hidden,false);quota.click('[data-action="next"]');assert.equal(quota.d.querySelector('h1').textContent,quota.units[1].title);quota.dom.window.close();
  const a=create({confirm:false});a.click('[data-action="start"]');answer(a,0);const saved=a.saved();
  // Restart is available on the resume page.
  const b=create({saved,confirm:false});b.click('[data-action="restart"]');assert.deepEqual(b.saved(),saved);b.w.confirm=()=>true;b.click('[data-action="restart"]');assert.deepEqual(b.saved().answers,{});assert.equal(b.w.localStorage.getItem('gken_store_v1'),'{"normal":"keep"}');a.dom.window.close();b.dom.window.close();
});
test('custom AI question and style copy current context without sending, with clipboard fallbacks', async () => {
  for(const config of [{},{clipboard:false,fallback:true},{clipboardReject:true,fallback:false}]) {
    const a=create(config);a.click('[data-action="start"]');answer(a,0);a.click('[data-action="ai"]');await tick();
    const input=a.d.getElementById('cv-inquiry');input.value='特徴量と正解の違いは？';input.dispatchEvent(new a.w.Event('input',{bubbles:true}));
    const style=a.d.getElementById('cv-question-style');style.value='図や表を使って説明';style.dispatchEvent(new a.w.Event('change',{bubbles:true}));
    a.click('[data-action="copy"]');await tick();
    const prompt=a.d.getElementById('cv-prompt').value;
    assert.match(prompt,/特徴量と正解の違いは？/);assert.match(prompt,/希望する説明：図や表を使って説明/);assert.match(prompt,/画面の図解の内容：.+/);
    assert.match(prompt,/私が選んだ回答/);assert.match(prompt,/正解：/);
    const link=a.d.querySelector('#cv-ai a');assert.equal(link.href,'https://chatgpt.com/');assert.match(link.rel,/noopener/);
    assert.match(a.d.getElementById('cv-copy-status').textContent,config.clipboardReject?/自動コピーできませんでした/:/コピーしました/);
    if(config.clipboardReject)assert.equal(a.d.getElementById('cv-prompt').closest('details').open,true);
    if(!config.clipboardReject&&config.clipboard!==false)assert.equal(a.copies.at(-1),prompt);
    assert.deepEqual(a.errors,[]);a.dom.window.close();
  }
});
test('production conversation entry and service worker use the same v6.2 asset URLs', () => {
  const html=read('conversation.html'),sw=read('sw.js');
  for(const asset of ['css/conversation.css','js/conversation-data.js','js/conversation-visuals.js','js/conversation-handoff.js','js/conversation-m202-data.js','js/conversation-lessons.js','js/conversation-catalog.js','js/conversation-course-data.js','js/conversation-course-visuals.js','js/conversation-m202-visuals.js','js/conversation.js']) {
    assert.ok(html.includes(asset+'?v='),asset+' uses a versioned entry URL');assert.ok(sw.includes(asset),asset+' is precached');
  }
  assert.ok(sw.includes('gken-conversation-v6.2'));
});

for(const correct of [true,false])test('every unit accepts '+(correct?'correct':'incorrect')+' answer and computes its final score',()=>{
  const a=create();a.click('[data-action="start"]');
  for(let i=0;i<a.units.length;i++){answer(a,i,correct?a.units[i].answer:(a.units[i].answer+1)%4);assert.equal(a.saved().answers[a.units[i].id].correct,correct);a.click('[data-action="next"]');}
  assert.equal(a.saved().stage,'done');assert.equal(a.d.querySelector('.cv-score').textContent.trim(),(correct?16:0)+' / 16問 正解');a.dom.window.close();
});
test('an interrupted final confirmation with missing answers goes to the first unanswered instead of completing',()=>{
  const initial=create();const saved=seed(initial.units,initial.units.length,'review');delete saved.answers[initial.units[3].id];initial.dom.window.close();
  const a=create({saved});a.click('[data-action="resume"]');a.click('[data-action="next"]');assert.equal(a.saved().index,3);assert.equal(a.saved().stage,'read');a.dom.window.close();
});
test('leaving a question panel cancels a pending clipboard result safely',async()=>{
  const a=create();let finish;Object.defineProperty(a.w.navigator.clipboard,'writeText',{value:()=>new Promise(resolve=>{finish=resolve;})});a.click('[data-action="start"]');answer(a,0);a.click('[data-action="ai"]');a.click('[data-action="next"]');finish();await tick();assert.equal(a.d.querySelector('h1').textContent,a.units[1].title);assert.deepEqual(a.errors,[]);a.dom.window.close();
});
test('published expansion matches the approved manuscript verbatim and answer positions balance',()=>{
  const manuscript=JSON.parse(read('content/m2-01-expansion.json'));const a=create();
  assert.deepEqual(JSON.parse(JSON.stringify(a.units.slice(9))),manuscript.units);
  assert.deepEqual([0,1,2,3].map(i=>a.units.filter(u=>u.answer===i).length),[4,4,4,4]);
  a.dom.window.close();
});
test('new diagram toggles show the specified prediction, path, candidates and signed arithmetic',()=>{
  const a=create();
  function diagram(id,mode){const box=a.d.createElement('div');box.innerHTML=a.w.CV_FIGURE(id,mode);return box;}
  const near=diagram('decision-tree','near'),far=diagram('decision-tree','far');
  assert.match(near.textContent,/物件A：60㎡・駅8分の最終予測10万円/);assert.match(far.textContent,/物件B：60㎡・駅15分の最終予測8万円/);
  assert.ok([...near.querySelectorAll('.cv-vbox.is-active')].some(n=>n.textContent==='予測家賃10万円'));
  assert.ok(![...near.querySelectorAll('.cv-vbox.is-active')].some(n=>n.textContent==='予測家賃8万円'));
  assert.ok([...far.querySelectorAll('.cv-vbox.is-active')].some(n=>n.textContent==='予測家賃8万円'));
  assert.match(diagram('ensemble','classification').textContent,/スパム（2票 \/ 3票）/);assert.match(diagram('ensemble','regression').textContent,/\(8 \+ 9 \+ 10\) ÷ 3 = 9万円/);
  for(const mode of a.units.find(u=>u.id==='random-forest').diagramSpec.modes){
    const box=diagram('random-forest',mode.id),candidates=[...box.querySelectorAll('.cv-feature-list .is-active strong')].map(n=>n.textContent);
    assert.deepEqual(candidates,[...mode.selected]);assert.match(box.textContent,/各分岐で候補を選ぶ。木全体で固定ではありません。/);
  }
  for(const mode of a.units.find(u=>u.id==='gradient-boosting').diagramSpec.modes){
    const box=diagram('gradient-boosting',mode.id),text=box.textContent,signed=n=>(n>=0?'+':'−')+Math.abs(n);
    assert.match(text,/訓練例・二乗誤差の回帰/);
    assert.ok(text.includes(mode.actual+' − '+mode.prediction+' ＝ '+signed(mode.residual)+'万円'));
    assert.ok(text.includes('追加モデルの補正予測'+signed(mode.correction)+'万円'));
    assert.ok(text.includes(mode.prediction+' ＋（'+signed(mode.correction)+'）＝ '+mode.updated+'万円'));
    assert.ok(text.includes(mode.actual+' − '+mode.updated+' ＝ '+signed(mode.remaining)+'万円'));
    assert.equal(mode.actual-mode.prediction,mode.residual);assert.equal(mode.prediction+mode.correction,mode.updated);assert.equal(mode.actual-mode.updated,mode.remaining);
  }
  const bootstrap=diagram('bagging-bootstrap');
  const rows=[...bootstrap.querySelectorAll('.cv-bootstrap-row')];assert.equal(rows.length,3);
  rows.forEach((row,i)=>assert.deepEqual([...row.querySelectorAll('.cv-chip')].map(n=>n.firstChild.textContent),[...a.units.find(u=>u.id==='bagging-bootstrap').diagramSpec.samples[i]]));
  assert.equal(rows[0].querySelectorAll('.is-repeat').length,2);assert.equal(rows[1].querySelectorAll('.is-repeat').length,4);assert.equal(rows[2].querySelectorAll('.is-repeat').length,4);
  const map=diagram('methods-map');assert.deepEqual([...map.querySelectorAll('tbody tr')].map(tr=>[...tr.children].map(td=>td.textContent)),JSON.parse(JSON.stringify(a.units.find(u=>u.id==='methods-map').diagramSpec.rows)));
  assert.match(map.textContent,/決定木 → 複数の木を組み合わせる/);assert.match(diagram('boosting').textContent,/モデル1 ＋ モデル2 ＋ モデル3/);
  a.dom.window.close();
});
