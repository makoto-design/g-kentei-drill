const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {JSDOM,VirtualConsole} = require('jsdom');
const ROOT=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
// Publisher metadata changes on regeneration; curriculum text and exam behavior must not.
const normalize=source=>source.replace(/"generatedAt": "[^"]+"/g,'"generatedAt": "<build-date>"').replace(/"([a-z-]+)":"[a-f0-9]{10}"/g,'"$1":"<content-hash>"');
test('authoritative textbook, quiz data, exam selection and passport assets match baseline apart from generated metadata',()=>{
  const {createHash}=require('node:crypto');
  const hashes=JSON.parse(read('tests/fixtures/ordinary-assets.sha256.json'));
  for(const [file,expected] of Object.entries(hashes))assert.equal(createHash('sha256').update(normalize(read(file))).digest('hex'),expected,file);
});
for(const exam of ['g-kentei','passport'])test('original '+exam+' drill loads textbook and completes practice independently',()=>{
  const errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e));
  const dom=new JSDOM(read('index.html'),{url:'https://learning.example/g-kentei-drill/index.html?exam='+exam,runScripts:'outside-only',virtualConsole:vc});
  const w=dom.window,d=w.document;w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};
  w.localStorage.setItem('gken_conversation_m2_01_v1','{"progress":"keep"}');
  w.eval(read('js/exam.js'));
  const prefix=exam==='passport'?'passport-':'';
  for(const file of [prefix+'data',prefix+'lessons',prefix+'map','app'])w.eval(read('js/'+file+'.js'));
  const lesson=[...d.querySelectorAll('.lesson')].find(e=>e.querySelector('.lesson__id').textContent===(exam==='passport'?'P1-01':'M2-01')) || [...d.querySelectorAll('.lesson')].find(e=>!e.disabled);
  assert.ok(lesson);lesson.click();assert.equal(d.getElementById('view-lesson').hidden,false);
  d.getElementById('btn-read').click();assert.ok(d.getElementById('read-body').textContent.length>100);
  d.getElementById('btn-read-drill').click();
  let count=0;
  while(!d.getElementById('view-quiz').hidden) {
    assert.ok(count++<100,'practice must terminate');
    assert.equal(d.querySelectorAll('#q-options button').length,4);
    d.querySelector('#q-options button').click();assert.equal(d.getElementById('q-feedback').hidden,false);
    d.getElementById('btn-next').click();
  }
  assert.ok(count>0);assert.equal(d.getElementById('view-result').hidden,false);
  const key=exam==='passport'?'aipass_2027_store_v1':'gken_store_v1';
  const saved=JSON.parse(w.localStorage.getItem(key));assert.ok(Object.keys(saved.history).length>0);assert.ok(saved.sessions.length>0);
  assert.equal(w.localStorage.getItem('gken_conversation_m2_01_v1'),'{"progress":"keep"}');
  assert.deepEqual(errors,[]);w.close();
});
