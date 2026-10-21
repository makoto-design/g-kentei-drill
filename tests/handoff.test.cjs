const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');
const ROOT=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const KEY='gken_conversation_m2_01_v1';
function create(options={}){
  const errors=[],copies=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e));
  const dom=new JSDOM(read('conversation.html'),{url:'https://learning.example/g-kentei-drill/conversation.html?lesson=M2-01',runScripts:'outside-only',virtualConsole:vc});
  const w=dom.window,d=w.document;w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.confirm=()=>true;
  Object.defineProperty(w,'isSecureContext',{value:true});
  if(options.clipboard!==false)Object.defineProperty(w.navigator,'clipboard',{value:{writeText:options.writeText||(async text=>{if(options.reject)throw Error('denied');copies.push(text);})}});
  d.execCommand=()=>options.fallback===true;
  if(options.saved)w.localStorage.setItem(KEY,JSON.stringify(options.saved));
  for(const name of ['conversation-data','conversation-m202-data','conversation-course-data','conversation-lessons','conversation-catalog','conversation-visuals','conversation-m202-visuals','conversation-course-visuals','conversation-handoff','conversation'])w.eval(read('js/'+name+'.js'));
  const a={w,d,dom,errors,copies,units:w.CONVERSATION_DATA.units,click(s){const e=d.querySelector(s);assert.ok(e,s);e.click();},change(s,value){const e=d.querySelector(s);assert.ok(e,s);e.value=value;e.dispatchEvent(new w.Event('change',{bubbles:true}));},prompt(){return d.getElementById('cv-handoff-prompt').value;},stored(){return w.localStorage.getItem(KEY);}};
  return a;
}
function savedAt(index,stage='read',units){return {version:1,index,stage,updatedAt:123,answers:stage==='done'?Object.fromEntries(units.map(u=>[u.id,{selected:u.answer,correct:true,answeredAt:456}])):stage==='review'?{[units[index].id]:{selected:(units[index].answer+1)%4,correct:false,answeredAt:456}}:{}};}
const tick=()=>new Promise(r=>setImmediate(r));
function open(a){a.click('[data-action="handoff"]');assert.ok(a.d.querySelector('[role="dialog"]'));}
function close(a){a.click('[data-handoff="close"]');}
function make(index=0,stage='read',options={}){const initial=create();const saved=savedAt(index,stage,initial.units);initial.w.close();return create({...options,saved});}
function headers(a){return [...a.prompt().matchAll(/【教材 UNIT (\d+) \/ 16】/g)].map(m=>Number(m[1]));}
function assertScope(a,index,count){
  const picked=a.units.slice(index,index+count);assert.deepEqual(headers(a),[...picked].map((_,i)=>index+i+1));
  for(const unit of picked){
    for(const text of [unit.id,unit.title,unit.topic,unit.source,unit.lead,unit.takeaway,unit.diagramText,unit.again,unit.more,unit.example,unit.question,unit.explanation,...unit.paragraphs,...unit.options,...unit.moreSteps.flat(),...unit.exampleSteps.flat()])assert.ok(a.prompt().includes(text),unit.id+' missing source material');
    assert.ok(a.prompt().includes('正解：'+['①','②','③','④'][unit.answer]+'（'+(unit.answer+1)+'番）'+unit.options[unit.answer]));
    assert.ok(a.d.getElementById('cv-handoff-range').textContent.includes(unit.title));
  }
  const next=a.units[index+picked.length];
  if(next){assert.ok(a.prompt().endsWith('UNIT '+(index+picked.length+1)+' / 16：'+next.title));assert.ok(!a.prompt().includes(next.paragraphs[0]));}
  else assert.ok(a.prompt().endsWith(a.w.CV_HANDOFF.copy.prompt.lastUnitMessage.replace('{lessonId}','M2-01').replace('{lessonTitle}','教師あり学習')));
}
test('handoff copy matches authored JSON; voice default and closed answer-key preview are honest',()=>{
  const a=create();open(a);const authored=JSON.parse(read('content/conversation-handoff.json'));
  assert.deepEqual(JSON.parse(JSON.stringify(a.w.CV_HANDOFF.copy)),authored);
  assert.equal(a.d.getElementById('cv-handoff-mode').value,'voice');assert.equal(a.d.getElementById('cv-handoff-count').value,'3');
  const preview=a.d.getElementById('cv-handoff-prompt').closest('details');assert.equal(preview.open,false);assert.match(preview.querySelector('summary').textContent,/講師用の正解を含みます/);
  assert.equal(a.d.getElementById('cv-handoff-guide').textContent,authored.ui.voiceGuide);
  const link=a.d.querySelector('[role="dialog"] a');assert.equal(link.href,'https://chatgpt.com/');assert.match(link.rel,/noopener/);assert.equal(link.target,'_blank');
  assert.ok(a.d.querySelector('[role="dialog"]').textContent.includes(authored.ui.progressNote));assertScope(a,0,3);assert.equal(a.stored(),null);assert.equal(a.copies.length,0);a.w.close();
});
for(const index of [0,7,14,15])test('saved position '+(index+1)+' hands off bounded three or single units without changing local progress',async()=>{
  const a=make(index),before=a.stored();open(a);assertScope(a,index,3);
  a.change('#cv-handoff-count','1');assertScope(a,index,1);assert.equal(a.d.getElementById('cv-handoff-status').textContent,a.w.CV_HANDOFF.copy.ui.changedStatus);
  a.click('[data-handoff="copy"]');await tick();assert.equal(a.copies.at(-1),a.prompt());close(a);assert.equal(a.stored(),before);assert.deepEqual(a.errors,[]);a.w.close();
});
test('voice and text prompts include response-wait, feedback, confirmation and bounded advance rules',()=>{
  const a=create();open(a);const copy=a.w.CV_HANDOFF.copy;
  for(const rule of [...copy.prompt.rules,...copy.prompt.voiceRules])assert.ok(a.prompt().includes(rule));
  for(const rule of copy.prompt.textRules)assert.ok(!a.prompt().includes(rule));
  assert.match(a.prompt(),/最初の返信は『準備できました/);assert.match(a.prompt(),/『次へ』と言われるまでは次の単元へ進まない/);
  a.change('#cv-handoff-mode','text');
  for(const rule of [...copy.prompt.rules,...copy.prompt.textRules])assert.ok(a.prompt().includes(rule));
  for(const rule of copy.prompt.voiceRules)assert.ok(!a.prompt().includes(rule));
  assert.equal(a.d.getElementById('cv-handoff-guide').textContent,copy.ui.textGuide);assert.match(a.prompt(),/出題したら必ずその応答を終えて/);assert.match(a.prompt(),/前に正解や正解を示唆する見出しを出したりしない/);a.w.close();
});
test('review context identifies past answers, leaves result/AI draft intact and never records a new answer',async()=>{
  const a=make(9,'review');a.click('[data-action="resume"]');a.click('[data-action="ai"]');await tick();
  const inquiry=a.d.getElementById('cv-inquiry');inquiry.value='分岐の意味を質問したい';inquiry.dispatchEvent(new a.w.Event('input',{bubbles:true}));
  const ai=a.d.getElementById('cv-ai'),aiPrompt=a.d.getElementById('cv-prompt').value,stored=a.stored(),screen=a.d.getElementById('cv-screen').innerHTML;
  const opener=a.d.querySelector('[data-action="handoff"]');open(a);
  const unit=a.units[9],selected=(unit.answer+1)%4;
  assert.ok(a.prompt().includes('アプリ画面：確認タイム'));assert.ok(a.prompt().includes('過去のアプリ回答：'+['①','②','③','④'][selected]+' '+unit.options[selected]+'（不正解）'));
  assert.ok(a.prompt().includes('過去のアプリ回答：未回答'));
  a.click('[data-handoff="copy"]');await tick();close(a);
  assert.equal(a.stored(),stored);assert.equal(a.d.getElementById('cv-screen').innerHTML,screen);assert.equal(a.d.getElementById('cv-ai'),ai);assert.equal(a.d.getElementById('cv-prompt').value,aiPrompt);assert.equal(a.d.getElementById('cv-inquiry').value,inquiry.value);assert.equal(a.d.activeElement,opener);a.w.close();
});
test('completed intro/summary starts review at first unit; summary reread starts displayed unit',()=>{
  const a=make(15,'done'),before=a.stored();
  assert.match(a.d.querySelector('[data-action="handoff"]').textContent,/復習/);open(a);assertScope(a,0,3);assert.match(a.d.querySelector('[role="dialog"]').textContent,/学習済みの範囲を、最初の単元から/);close(a);
  a.click('[data-action="resume"]');open(a);assertScope(a,0,3);close(a);
  a.click('[data-unit="12"]');open(a);assertScope(a,12,3);assert.match(a.d.getElementById('cv-handoff-title').textContent,/復習/);close(a);
  assert.equal(a.stored(),before);a.click('[data-action="return-review"]');assert.ok(a.d.querySelector('.cv-score'));a.w.close();
});
test('ordinary read screen handoff does not advance, answer or replace the original flow',()=>{
  const a=create();a.click('[data-action="start"]');const before=a.stored(),screen=a.d.getElementById('cv-screen').innerHTML;open(a);close(a);assert.equal(a.stored(),before);assert.equal(a.d.getElementById('cv-screen').innerHTML,screen);a.click('[data-action="quiz"]');assert.equal(a.d.querySelector('[data-action="handoff"]'),null);assert.ok(a.d.querySelector('.cv-choices'));a.w.close();
});
for(const config of [{},{clipboard:false,fallback:true},{reject:true,fallback:false}])test('handoff clipboard '+JSON.stringify(config)+' reports actual result and offers manual fallback',async()=>{
  const a=create(config);open(a);a.click('[data-handoff="copy"]');await tick();
  const copy=a.w.CV_HANDOFF.copy.ui,expected=config.reject?copy.failedStatus:copy.copiedStatus;
  assert.equal(a.d.getElementById('cv-handoff-status').textContent,expected);
  if(config.clipboard===false||config.reject){const field=a.d.getElementById('cv-handoff-prompt');assert.equal(field.closest('details').open,true);assert.equal(field.selectionStart,0);assert.equal(field.selectionEnd,field.value.length);}
  else assert.equal(a.copies[0],a.prompt());
  assert.equal(a.stored(),null);assert.deepEqual(a.errors,[]);a.w.close();
});
test('closing/reopening or changing settings invalidates delayed clipboard UI results',async()=>{
  const resolvers=[],a=create({writeText:()=>new Promise(resolve=>resolvers.push(resolve))});open(a);a.click('[data-handoff="copy"]');close(a);open(a);resolvers.shift()();await tick();assert.equal(a.d.getElementById('cv-handoff-status').textContent,a.w.CV_HANDOFF.copy.ui.readyStatus);
  a.click('[data-handoff="copy"]');a.change('#cv-handoff-count','1');resolvers.shift()();await tick();assert.equal(a.d.getElementById('cv-handoff-status').textContent,a.w.CV_HANDOFF.copy.ui.changedStatus);assertScope(a,0,1);assert.deepEqual(a.errors,[]);a.w.close();
});
test('dialog traps keyboard focus, closes on Escape and restores background/focus/scroll lock',()=>{
  const a=create(),main=a.d.querySelector('main');main.setAttribute('aria-hidden','false');a.d.body.style.overflow='auto';const opener=a.d.querySelector('[data-action="handoff"]');open(a);
  assert.equal(a.d.activeElement.id,'cv-handoff-title');assert.equal(main.hasAttribute('inert'),true);assert.equal(main.getAttribute('aria-hidden'),'true');assert.equal(a.d.body.style.overflow,'hidden');
  const first=a.d.querySelector('[data-handoff="close"]'),last=[...a.d.querySelectorAll('[data-handoff="close"]')].at(-1);last.focus();a.d.dispatchEvent(new a.w.KeyboardEvent('keydown',{key:'Tab',bubbles:true,cancelable:true}));assert.equal(a.d.activeElement,first);
  first.focus();a.d.dispatchEvent(new a.w.KeyboardEvent('keydown',{key:'Tab',shiftKey:true,bubbles:true,cancelable:true}));assert.equal(a.d.activeElement,last);
  opener.focus();assert.equal(a.d.activeElement.id,'cv-handoff-title');
  const esc=new a.w.KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true});a.d.dispatchEvent(esc);assert.equal(esc.defaultPrevented,true);assert.equal(a.d.querySelector('[role="dialog"]'),null);assert.equal(a.d.activeElement,opener);assert.equal(main.hasAttribute('inert'),false);assert.equal(main.getAttribute('aria-hidden'),'false');assert.equal(a.d.body.style.overflow,'auto');a.w.close();
});
