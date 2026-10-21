const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');
const ROOT=path.resolve(__dirname,'..'),K1='gken_conversation_m2_01_v1',K2='gken_conversation_m2_02_v1';
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
function app(query='?lesson=M2-02',storage={}){
 const errors=[],copies=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e));
 const dom=new JSDOM(read('conversation.html'),{url:'https://learning.example/g-kentei-drill/conversation.html'+query,runScripts:'outside-only',virtualConsole:vc}),w=dom.window,d=w.document;
 w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.confirm=()=>true;Object.defineProperty(w,'isSecureContext',{value:true});Object.defineProperty(w.navigator,'clipboard',{value:{writeText:async text=>copies.push(text)}});
 for(const [key,value] of Object.entries(storage))w.localStorage.setItem(key,typeof value==='string'?value:JSON.stringify(value));
 for(const e of d.querySelectorAll('script[src]'))w.eval(read(new URL(e.src).pathname.replace('/g-kentei-drill/','')));
 return {w,d,errors,copies,units:w.CONVERSATION_DATA.units,click(s){const e=d.querySelector(s);assert.ok(e,s);e.click();},change(s,v){const e=d.querySelector(s);e.value=v;e.dispatchEvent(new w.Event('change',{bubbles:true}));},storage(){return Object.fromEntries(Object.keys(w.localStorage).map(k=>[k,w.localStorage.getItem(k)]));},close(){w.close();}};
}
const tick=()=>new Promise(r=>setImmediate(r));
function seed(a,index,stage='read',count=0){return {version:1,index,stage,updatedAt:123,answers:Object.fromEntries(a.units.slice(0,count).map(u=>[u.id,{selected:u.answer,correct:true,answeredAt:456}]))};}
test('M2-02 runtime exactly matches approved12-unit source',()=>{
 const a=app();assert.deepEqual(JSON.parse(JSON.stringify(a.w.CONVERSATION_M202)),JSON.parse(read('content/m2-02.json')));
 assert.equal(a.units.length,12);assert.equal(new Set(a.units.map(u=>u.id)).size,12);assert.deepEqual([0,1,2,3].map(i=>a.units.filter(u=>u.answer===i).length),[3,3,3,3]);
 for(const u of a.units){for(const field of ['id','title','topic','source','lead','takeaway','more','again','example','question','explanation','diagramText'])assert.ok(typeof u[field]==='string'&&u[field].trim(),u.id+' '+field);assert.equal(u.paragraphs.length,4);assert.equal(u.options.length,4);assert.equal(new Set(u.options).size,4);assert.ok(u.answer>=0&&u.answer<4);assert.equal(u.moreSteps.length,3);assert.equal(u.exampleSteps.length,3);}
 assert.deepEqual(a.errors,[]);a.close();
});
for(const query of ['?lesson=M2-01','?lesson=unknown','?lesson=__proto__'])test('safe lesson routing '+(query||'default')+' selects M2-01',()=>{
 const a=app(query);assert.equal(a.w.CONVERSATION_DATA.lesson,'M2-01');assert.equal(a.units.length,16);assert.match(a.d.title,/M2-01 教師あり学習/);assert.equal(a.d.querySelector('.cv-current-lesson').textContent,'M2-01 教師あり学習');a.close();
});
test('lesson navigation, title, description and count identify the active lesson',()=>{
 const a=app();assert.match(a.d.title,/M2-02 教師なし学習/);assert.equal(a.d.querySelector('.cv-eyebrow').textContent,'M2-02 教師なし学習');assert.match(a.d.querySelector('.cv-current-lesson').textContent,/M2-02 教師なし学習/);assert.match(a.d.querySelector('meta[name="description"]').content,/M2-02 教師なし学習/);assert.match(a.d.getElementById('cv-screen').textContent,/全12単位/);assert.ok(a.d.getElementById('cv-screen').textContent.includes(a.w.CONVERSATION_DATA.introSummary));assert.equal(a.d.getElementById('cv-progress').max,12);
 const links=[...a.d.querySelectorAll('#cv-lesson-nav a')];assert.equal(links.length,1);assert.equal(new URL(links[0].href).search,'');assert.equal(links[0].textContent,'全講のホーム');a.close();
});
for(const correct of [true,false])test('all12 M2-02 units complete with '+(correct?'correct':'incorrect')+' answers, diagrams, supplements and review return',()=>{
 const a=app();a.click('[data-action="start"]');
 for(let i=0;i<12;i++){
  const u=a.units[i];assert.equal(a.d.querySelector('h1').textContent,u.title);assert.match(a.d.getElementById('cv-screen').textContent,new RegExp('UNIT '+String(i+1).padStart(2,'0')+' / 12'));
  assert.deepEqual([...a.d.querySelectorAll('.cv-prose > p')].map(e=>e.textContent),[...u.paragraphs]);
  const figure=a.d.querySelector('.cv-visual');assert.equal(figure.dataset.diagram,u.id);assert.ok(figure.querySelector('.cv-vbox,svg,table'),u.id+' diagram');
  for(const mode of u.diagramSpec.modes||[]){a.click('[data-visual="'+mode.id+'"]');assert.equal(a.d.querySelector('[aria-pressed="true"]').dataset.visual,mode.id);assert.equal(a.d.activeElement.dataset.visual,mode.id);}
  for(const [action,field] of [['more','moreSteps'],['example','exampleSteps']]){a.click('[data-action="'+action+'"]');assert.deepEqual([...a.d.querySelectorAll('.cv-help-step')].map(e=>[e.querySelector('h4').textContent,e.querySelector('p').textContent]),JSON.parse(JSON.stringify(u[field])));}
  a.click('[data-action="quiz"]');a.click('[data-choice="'+(correct?u.answer:(u.answer+1)%4)+'"]');assert.equal(a.d.querySelector('.cv-result').classList.contains('is-correct'),correct);
  const stored=a.storage()[K2];a.click('[data-action="revisit"]');a.click('[data-action="return-review"]');assert.equal(a.storage()[K2],stored);a.click('[data-action="next"]');
 }
 assert.equal(a.d.querySelector('.cv-score').textContent.trim(),(correct?12:0)+' / 12問 正解');assert.match(a.d.getElementById('cv-screen').textContent,/M2-02の主な内容を学びました/);assert.ok(a.d.getElementById('cv-screen').textContent.includes(a.w.CONVERSATION_DATA.completionSummary));assert.equal(a.storage()[K1],undefined);assert.equal(JSON.parse(a.storage()[K2]).stage,'done');assert.deepEqual(a.errors,[]);a.close();
});
test('each lesson keeps independent resume/answers through routing and restarting M2-02',()=>{
 const m1=app('?lesson=M2-01');m1.click('[data-action="start"]');m1.click('[data-action="quiz"]');m1.click('[data-choice="1"]');const storage=m1.storage(),old=storage[K1];m1.close();
 const m2=app('?lesson=M2-02',storage);assert.ok(m2.d.querySelector('[data-action="start"]'));m2.click('[data-action="start"]');m2.click('[data-action="quiz"]');m2.click('[data-choice="2"]');m2.click('[data-action="next"]');assert.equal(m2.storage()[K1],old);const both=m2.storage(),second=both[K2];m2.close();
 const restored=app('?lesson=M2-01',both);restored.click('[data-action="resume"]');assert.ok(restored.d.querySelector('.cv-result'));assert.equal(restored.storage()[K2],second);restored.close();
 const restart=app('?lesson=M2-02',both);restart.click('[data-action="restart"]');assert.deepEqual(JSON.parse(restart.storage()[K2]).answers,{});assert.equal(restart.storage()[K1],old);restart.close();
});
for(const stage of ['read','quiz','review'])test('M2-02 partial '+stage+' stage resumes independently',()=>{
 const initial=app(),saved=seed(initial,4,stage,stage==='review'?5:4);initial.close();const a=app('?lesson=M2-02',{[K2]:saved});a.click('[data-action="resume"]');assert.ok(a.d.querySelector(stage==='read'?'article':stage==='quiz'?'.cv-choices':'.cv-result'));assert.equal(a.storage()[K1],undefined);assert.equal(JSON.parse(a.storage()[K2]).index,4);a.close();
});
test('M2-01 completed summary offers a correctly scoped next-lecture link',()=>{
 const initial=app('?lesson=M2-01'),saved=seed(initial,15,'done',16);initial.close();const a=app('?lesson=M2-01',{[K1]:saved});a.click('[data-action="resume"]');assert.ok([...a.d.querySelectorAll('a')].some(e=>new URL(e.href).search==='?lesson=M2-02'&&e.textContent.includes('次の講へ')));a.close();
});
for(const index of [0,5,10,11])test('M2-02 handoff from unit'+(index+1)+' stays in the selected lecture and exposes only scoped content',()=>{
 const initial=app(),saved=seed(initial,index);initial.close();const a=app('?lesson=M2-02',{[K2]:saved}),before=a.storage()[K2];a.click('[data-action="handoff"]');
 const field=a.d.getElementById('cv-handoff-prompt'),prompt=field.value;assert.match(prompt,/G検定のM2-02「教師なし学習」/);assert.match(prompt,/lessons\.js \/ M2-02「教師なし学習」/);assert.ok(!prompt.includes('{lessonId}'));assert.ok(!prompt.includes('{lessonTitle}'));assert.ok(!prompt.includes('G検定のM2-01'));const numbers=[...prompt.matchAll(/【教材 UNIT (\d+) \/ 12】/g)].map(m=>Number(m[1]));assert.deepEqual(numbers,Array.from({length:Math.min(3,12-index)},(_,i)=>index+i+1));
 for(const unit of a.units.slice(index,index+3))for(const text of [unit.lead,...unit.paragraphs,unit.diagramText,...unit.options,unit.explanation])assert.ok(prompt.includes(text),unit.id);
 if(index>=10)assert.match(prompt,/今回の範囲はM2-02会話学習の最後まで/);a.change('#cv-handoff-count','1');assert.equal([...field.value.matchAll(/【教材 UNIT /g)].length,1);a.change('#cv-handoff-mode','text');assert.match(field.value,/会話の希望は文字/);a.click('[data-handoff="close"]');assert.equal(a.storage()[K2],before);a.close();
});
test('M2-02 AI doubt prompt includes current topic/diagram/question, with no M2-01 identity',async()=>{
 const a=app();a.click('[data-action="start"]');a.click('[data-action="quiz"]');a.click('[data-choice="2"]');a.click('[data-action="ai"]');await tick();const prompt=a.d.getElementById('cv-prompt').value;assert.match(prompt,/G検定のM2-02「教師なし学習」/);assert.ok(prompt.includes(a.units[0].diagramText));assert.ok(prompt.includes(a.units[0].question));assert.equal(a.copies.at(-1),prompt);a.close();
});
test('M2-02 diagrams implement exact authored modes, fixed points, groups and PCA projections',()=>{
 const a=app();function diagram(id,mode){const unit=a.units.find(u=>u.id===id),box=a.d.createElement('div');box.innerHTML=a.w.CV_FIGURE(id,mode);assert.ok(box.querySelector('figcaption').textContent.includes(unit.diagramSpec.caption));return box;}
 const label=a.units[0];for(const mode of label.diagramSpec.modes){const box=diagram(label.id,mode.id);for(const value of [mode.input,mode.operation,mode.result,mode.note])assert.ok(box.textContent.includes(value));}
 const km=a.units.find(u=>u.id==='kmeans');for(const mode of km.diagramSpec.modes){const box=diagram(km.id,mode.id),values=[...box.querySelectorAll('.cv-vcolumns .cv-vbox strong')].map(e=>e.textContent);assert.deepEqual(values,[...mode.groups.map(g=>g.join('・')),...mode.centers.map(String)]);assert.ok(box.textContent.includes(mode.note));}
 const hierarchy=a.units.find(u=>u.id==='hierarchical'),low=diagram(hierarchy.id,'low'),high=diagram(hierarchy.id,'high');assert.equal(low.querySelector('path.cv-line').getAttribute('d'),high.querySelector('path.cv-line').getAttribute('d'));assert.notEqual(low.querySelector('.cv-cut-line').getAttribute('d'),high.querySelector('.cv-cut-line').getAttribute('d'));assert.match(low.textContent,/3クラスタ/);assert.match(high.textContent,/2クラスタ/);
 const ward=diagram('ward');assert.match(ward.querySelector('.cv-selected-row').textContent,/0と2.*1＋1＝2.*最小・この組を併合/);assert.equal(ward.querySelectorAll('tbody tr').length,3);
 const pca=a.units.find(u=>u.id==='pca'),fixed=[];for(const mode of pca.diagramSpec.modes){const box=diagram(pca.id,mode.id),points=[...box.querySelectorAll('[data-point]')].map(e=>[Number(e.getAttribute('cx')),Number(e.getAttribute('cy'))]);if(fixed.length)assert.deepEqual(points,fixed);else fixed.push(...points);
  const norm=Math.hypot(...mode.axis),u=mode.axis.map(v=>v/norm);[...box.querySelectorAll('[data-projection]')].forEach((e,i)=>{const p=pca.diagramSpec.points[i],dot=p[0]*u[0]+p[1]*u[1];assert.ok(Math.abs(Number(e.getAttribute('cx'))-(170+dot*u[0]*40))<1e-8);assert.ok(Math.abs(Number(e.getAttribute('cy'))-(135-dot*u[1]*40))<1e-8);});
  for(const value of mode.projectionLabels)assert.ok(box.textContent.includes(value));assert.ok(box.textContent.includes('この軸での分散'+mode.variance));if(mode.variance===0)assert.match(box.textContent,/4点が重なる/);
 }
 const svd=a.units.find(u=>u.id==='svd');for(const mode of svd.diagramSpec.modes){const box=diagram(svd.id,mode.id);assert.ok(box.textContent.includes(mode.formula));assert.ok(box.textContent.includes(mode.note));}
 assert.deepEqual(a.errors,[]);a.close();
});
test('MDS preserves every distance under rotation, t-SNE preserves within-group neighbors, and LDA/recommendation show exact data',()=>{
 const a=app();function diagram(id,mode){const box=a.d.createElement('div');box.innerHTML=a.w.CV_FIGURE(id,mode);return box;}
 const mds=a.units.find(u=>u.id==='mds');let pairDistances;
 for(const mode of mds.diagramSpec.modes){const box=diagram(mds.id,mode.id),points=[...box.querySelectorAll('[data-map-point]')].map(e=>[+e.getAttribute('cx'),+e.getAttribute('cy')]),distance=(i,j)=>Math.hypot(points[i][0]-points[j][0],points[i][1]-points[j][1]),values=[distance(0,1),distance(1,2),distance(0,2)];assert.deepEqual(values,[32,128,160]);if(pairDistances)assert.deepEqual(values,pairDistances);else pairDistances=values;assert.match(box.textContent,/向きが変わっても距離は同じ/);}
 const tsne=a.units.find(u=>u.id==='tsne');for(const mode of tsne.diagramSpec.modes){const box=diagram(tsne.id,mode.id),point=id=>{const e=box.querySelector('[data-neighbor="'+id+'"]');return [+e.getAttribute('cx'),+e.getAttribute('cy')];};for(let i=1;i<=3;i++){const left=point('A'+i),right=point('B'+i);assert.equal(right[0]-left[0],mode.offset);assert.equal(right[1],left[1]);}assert.match(box.textContent,/実際のt-SNEの計算結果ではありません/);assert.match(box.textContent,/倍率は決められません/);}
 const lda=a.units.find(u=>u.id==='lda'),box=diagram(lda.id);assert.deepEqual([...box.querySelectorAll('.cv-topic-segment')].map(e=>e.style.flexBasis),['70%','30%']);for(const topic of lda.diagramSpec.topics){assert.ok(box.textContent.includes(topic.label+' '+topic.percent+'%'));assert.ok(box.textContent.includes(topic.interpretation));for(const word of topic.words)assert.ok(box.textContent.includes(word));}assert.match(box.textContent,/正しさの確率ではありません/);
 const recommendation=a.units.find(u=>u.id==='recommendation');for(const mode of recommendation.diagramSpec.modes){const box=diagram(recommendation.id,mode.id);assert.deepEqual([...box.querySelectorAll('tbody tr')].map(e=>[...e.children].map(e=>e.textContent)),JSON.parse(JSON.stringify(mode.rows)));assert.ok(box.textContent.includes(mode.result));assert.ok(box.textContent.includes(mode.reason));if(mode.id==='collaborative')assert.match(box.textContent,/未購入は、不満評価という意味ではありません/);}
 a.close();
});
test('cold-start cards distinguish missing data and the final map preserves every comparison row',()=>{
 const a=app();function diagram(id){const box=a.d.createElement('div');box.innerHTML=a.w.CV_FIGURE(id);return box;}
 const cold=a.units.find(u=>u.id==='cold-start'),cards=diagram(cold.id);assert.equal(cards.querySelectorAll('.cv-cold-card').length,2);assert.equal(cards.querySelector('table'),null);assert.deepEqual([...cards.querySelectorAll('.cv-cold-card')].map(e=>[e.querySelector('h3').textContent,...[...e.querySelectorAll('dd')].map(e=>e.textContent)]),JSON.parse(JSON.stringify(cold.diagramSpec.rows)));assert.match(cards.textContent,/商品属性だけで、新利用者の好みまで決まるわけではありません/);
 const map=a.units.find(u=>u.id==='unsupervised-map'),summary=diagram(map.id);assert.equal(summary.querySelectorAll('table').length,3);assert.deepEqual([...summary.querySelectorAll('caption')].map(e=>e.textContent),['クラスタリング','次元削減','文書と推薦']);assert.deepEqual([...summary.querySelectorAll('tbody tr')].map(e=>[...e.children].map(e=>e.textContent)),JSON.parse(JSON.stringify(map.diagramSpec.rows)));a.close();
});
