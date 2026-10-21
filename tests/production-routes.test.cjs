const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');
const ROOT=path.resolve(__dirname,'..'),BASE='https://learning.example/g-kentei-drill/';
const read=file=>fs.readFileSync(path.join(ROOT,file),'utf8');
function page(file,query='',storage={}){
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e));
 const dom=new JSDOM(read(file),{url:BASE+file+query,runScripts:'outside-only',virtualConsole:vc}),w=dom.window,d=w.document;
 w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.confirm=()=>true;
 for(const [key,value]of Object.entries(storage))w.localStorage.setItem(key,value);
 if(file==='index.html'){
  w.eval(read('js/exam.js'));
  const prefix=query.includes('passport')?'passport-':'';
  for(const name of [prefix+'data',prefix+'lessons',prefix+'map','app'])w.eval(read('js/'+name+'.js'));
 }else for(const script of d.querySelectorAll('script[src]'))w.eval(read(new URL(script.src).pathname.slice('/g-kentei-drill/'.length)));
 return {w,d,errors,close:()=>w.close()};
}
function assertLocalLink(anchor,file){const url=new URL(anchor.href);assert.equal(url.origin,new URL(BASE).origin);assert.equal(url.pathname,'/g-kentei-drill/'+file);return url;}
test('ordinary home and every G lecture enter the complete catalog and matching conversation lecture under GitHub Pages',()=>{
 const catalog=page('conversation.html'),ordinary=page('index.html');
 const cards=[...catalog.d.querySelectorAll('[data-lesson-card]')];assert.equal(cards.length,32);assert.equal(Object.values(catalog.w.CONVERSATION_LESSONS).reduce((n,l)=>n+l.units.length,0),192);
 assert.equal(ordinary.d.getElementById('view-home').hidden,false);assert.equal(ordinary.d.querySelector('#cv-screen'),null);
 const entry=ordinary.d.querySelector('.conversation-entry');assertLocalLink(entry,'conversation.html');assert.match(entry.textContent,/全32講・192単位/);assert.doesNotMatch(entry.textContent,/試作/);
 const buttons=[...ordinary.d.querySelectorAll('.lesson')];assert.equal(buttons.length,32);
 for(const card of cards){const id=card.dataset.lessonCard,href=assertLocalLink(card.querySelector('a'),'conversation.html');assert.equal(href.searchParams.get('lesson'),id);
  const button=buttons.find(button=>button.querySelector('.lesson__id').textContent===id);assert.ok(button,id);button.click();const link=ordinary.d.getElementById('btn-conversation-lesson');assert.equal(link.hidden,false,id);assert.equal(assertLocalLink(link,'conversation.html').searchParams.get('lesson'),id);
  const lecture=page('conversation.html',href.search);assert.equal(lecture.w.CONVERSATION_DATA.lesson,id);assertLocalLink(lecture.d.querySelector('.cv-back'),'conversation.html');assertLocalLink(lecture.d.querySelector('#cv-lesson-nav a'),'conversation.html');assert.deepEqual(lecture.errors,[],id);lecture.close();
 }
 assertLocalLink(catalog.d.querySelector('.cv-back'),'index.html');assert.deepEqual(ordinary.errors,[]);catalog.close();ordinary.close();
});
test('all static entry assets and PWA links resolve inside the production subpath',()=>{
 for(const file of ['index.html','conversation.html']){const dom=new JSDOM(read(file),{url:BASE+file});for(const element of dom.window.document.querySelectorAll('script[src],link[href]')){const url=new URL(element.src||element.href);assert.equal(url.origin,new URL(BASE).origin);assert.ok(url.pathname.startsWith('/g-kentei-drill/'));assert.ok(fs.existsSync(path.join(ROOT,url.pathname.slice('/g-kentei-drill/'.length))),url.href);}assert.equal(dom.window.document.querySelector('link[rel="manifest"]').href,BASE+'manifest.webmanifest');dom.window.close();}
 const manifest=JSON.parse(read('manifest.webmanifest'));assert.equal(new URL(manifest.scope,BASE).href,BASE);assert.equal(new URL(manifest.start_url,BASE).href,BASE);
});
test('G reset clears all32 conversation records and pointer while passport reset preserves G progress',()=>{
 const catalog=page('conversation.html'),keys=Object.values(catalog.w.CONVERSATION_LESSONS).map(lesson=>lesson.storageKey);catalog.close();
 const storage=Object.fromEntries(keys.map(key=>[key,'{"saved":true}']));storage.gken_conversation_last_lesson_v1='{"lesson":"M2-01"}';storage.unrelated='keep';storage.aipass_2027_store_v1=JSON.stringify({history:{},sessions:[],days:{},reads:{'P1-01':9}});
 const g=page('index.html','',storage);g.d.getElementById('btn-reset').click();for(const key of [...keys,'gken_conversation_last_lesson_v1'])assert.equal(g.w.localStorage.getItem(key),null,key);assert.equal(g.w.localStorage.getItem('unrelated'),'keep');assert.equal(g.w.localStorage.getItem('aipass_2027_store_v1'),storage.aipass_2027_store_v1);g.close();
 const p=page('index.html','?exam=passport',storage);assert.equal(p.d.documentElement.dataset.exam,'passport');p.d.querySelector('.lesson').click();assert.equal(p.d.getElementById('btn-conversation-lesson').hidden,true);p.d.getElementById('btn-reset').click();for(const key of [...keys,'gken_conversation_last_lesson_v1'])assert.equal(p.w.localStorage.getItem(key),storage[key],key);assert.equal(p.w.localStorage.getItem('unrelated'),'keep');assert.deepEqual(p.errors,[]);p.close();
});
