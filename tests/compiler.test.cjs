const test=require('node:test'),assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const b=require('../scripts/build-conversation-course.cjs');
const source=b.readSource('lessons','LESSON_DATA'),quiz=b.readSource('data','QUIZ_DATA');
function fixture(){const original=source.lessons[0],blocks=b.extractBlocks(original);return {version:1,lessons:[{lesson:original.id,units:[{id:'test-source',title:'検証用の単位',blocks:blocks.map((_,i)=>i),questionId:quiz.questions.find(q=>q.lesson===original.id).id,focus:'検証用の要点',detail:'検証用の詳説',example:'検証用の具体例',diagram:{headers:['項目','説明'],rows:[['元の教材','原文を保つ']],caption:'検証用の図'}}]}]};}
test('compiler preserves source blocks/plain text and exact four-choice mapping deterministically',()=>{const plan=fixture(),first=b.compile(plan,source,quiz,false),second=b.compile(plan,source,quiz,false);assert.deepEqual(first,second);const unit=first[0].units[0],question=quiz.questions.find(q=>q.id===unit.sourceQuestionId);assert.deepEqual(unit.options,[...question.options]);assert.equal(unit.answer,question.answer);assert.equal(unit.question,question.text);for(const block of b.extractBlocks(source.lessons[0]))for(const text of b.plainParagraphs(block.html))assert.ok(unit.paragraphs.includes(text));assert.ok(unit.bodyPages.length>1);const bodyText=b.plainParagraphs(unit.bodyHtml).join('').replace(/\s/g,''),pagesText=b.plainParagraphs(unit.bodyPages.join('')).join('').replace(/表を開いて確認する/g,'').replace(/\s/g,'');assert.equal(pagesText,bodyText);assert.ok(first[0].referenceSections.some(s=>s.heading==='用語の整理'));});
test('compiler has exact M7-02 exception and retains heading-only parent blocks',()=>{assert.deepEqual(b.extractBlocks(source.lessons.find(l=>l.id==='M7-02')).map(b=>b.heading),['導入','何が著作物になるのか','生成AIと著作権——2つの段階に分けて考える','AI生成物に著作権はあるか','利用規約という別の縛り','何が特許になるのか','誰が発明者か','不正競争防止法','営業秘密','限定提供データ','独占禁止法','通して読むと']);assert.ok(b.extractBlocks(source.lessons.find(l=>l.id==='M5-04')).some(b=>b.heading==='前半：深層強化学習'));});
test('all original HTML/SVG survives strict sanitation; executable tags/URLs/attributes are rejected',()=>{for(const lesson of source.lessons)for(const section of lesson.sections)assert.doesNotThrow(()=>b.sanitize(section.html));for(const html of ['<script>alert(1)</script>','<p onclick="alert(1)">x</p>','<a href="javascript:alert(1)">x</a>','<svg><foreignObject>x</foreignObject></svg>'])assert.throws(()=>b.sanitize(html));const safe=b.sanitize('<svg viewBox="0 0 10 10" role="img" aria-label="図"><circle cx="5" cy="5" r="2"></circle></svg>');assert.match(safe,/viewBox/);});
test('compiler rejects incomplete coverage, invalid question mapping and missing editorial content',()=>{assert.throws(()=>b.compile(fixture(),source,quiz),/all30/);let plan=fixture();plan.lessons[0].units[0].blocks=[0];assert.throws(()=>b.compile(plan,source,quiz,false),/uncovered/);plan=fixture();plan.lessons[0].units[0].questionId='M2-03-1';assert.throws(()=>b.compile(plan,source,quiz,false),/mapped question/);plan=fixture();plan.lessons[0].units[0].example='';assert.throws(()=>b.compile(plan,source,quiz,false),/authored example/);});
test('oversized paragraphs are paged and large source tables remain accessible as one expandable element',()=>{const html='<h4>説明</h4><p>'+('説明の文です。'.repeat(120))+'</p><div class="tablewrap"><table><tbody>'+Array.from({length:70},(_,i)=>'<tr><td>項目'+i+'</td><td>詳細の内容です</td></tr>').join('')+'</tbody></table></div>';const pages=b.readingPages(html);assert.ok(pages.length>2);assert.ok(pages.some(p=>p.includes('<details')));for(const page of pages){const d=new JSDOM(page).window.document;for(const p of d.querySelectorAll('p'))assert.ok(p.textContent.length<=550);assert.ok(!d.querySelector('script'));}});
test('unassigned concluding blocks move into references while uncovered teaching blocks still fail',()=>{const plan=fixture(),blocks=b.extractBlocks(source.lessons[0]),summary=blocks.findIndex(block=>block.heading==='通して読むと');assert.ok(summary>=0);plan.lessons[0].units[0].blocks=plan.lessons[0].units[0].blocks.filter(i=>i!==summary);const compiled=b.compile(plan,source,quiz,false)[0],reference=compiled.referenceSections.find(section=>section.heading==='通して読むと');assert.ok(reference);assert.deepEqual(reference.paragraphs,b.plainParagraphs(blocks[summary].html));assert.ok(!compiled.units[0].sourceBlocks.includes(summary));});
test('authored topic stays concise while source headings and neutral comparison reasons remain complete',()=>{
 const plan=fixture(),unit=b.compile(plan,source,quiz,false)[0].units[0];
 assert.equal(unit.topic,plan.lessons[0].units[0].title);
 for(const block of b.extractBlocks(source.lessons[0]))assert.ok(unit.source.includes(block.heading));
 const negative=quiz.questions.find(q=>q.lesson===plan.lessons[0].lesson&&/誤|不適切|適切でない/.test(q.text)&&Object.keys(q.why||{}).length);
 assert.ok(negative,'original negative-polarity confirmation question');
 plan.lessons[0].units[0].questionId=negative.id;
 const steps=b.compile(plan,source,quiz,false)[0].units[0].moreSteps.slice(1);
 const reasons=Object.entries(negative.why).filter(([index])=>Number(index)!==negative.answer);
 assert.equal(steps.length,reasons.length);
 reasons.forEach(([index,reason],i)=>{
   assert.equal(steps[i][0],'混同しやすい点'+(i+1));
   assert.ok(steps[i][1].includes(negative.options[Number(index)].replace(/\*\*/g,'').replace(/\s+/g,' ').trim()));
   assert.ok(steps[i][1].endsWith(String(reason).replace(/\*\*/g,'').replace(/\s+/g,' ').trim()));
   assert.match(steps[i][1],/^比べて理解する説明「/);
 });
});
test('appendix references include original sections and all placeholder links become reference text',()=>{
 const editorial=JSON.parse(require('node:fs').readFileSync(require('node:path').join(__dirname,'../content/course-editorial.json'),'utf8'));
 const compiled=b.compile(editorial,source,quiz),legacy=b.legacyReferences(source);
 for(const id of ['M2-01','M2-02'])for(const section of source.lessons.find(l=>l.id===id).sections){
   const reference=legacy[id].find(s=>s.heading===section.heading);
   assert.ok(reference,id+' '+section.heading);assert.deepEqual(reference.paragraphs,b.plainParagraphs(section.html));
 }
 for(const appendix of source.appendices){
   const references=legacy[appendix.lesson]||compiled.find(l=>l.lesson===appendix.lesson).referenceSections;
   const reference=references.find(s=>s.heading===appendix.title);assert.ok(reference,appendix.id);
   for(const section of appendix.sections){assert.ok(reference.paragraphs.includes(section.heading));for(const text of b.plainParagraphs(section.html))assert.ok(reference.paragraphs.includes(text));}
 }
 for(const lesson of compiled){for(const html of [...lesson.units.map(u=>u.bodyHtml),...lesson.referenceSections.map(s=>s.bodyHtml)])assert.doesNotMatch(html,/<a\b[^>]*href="#/);}
 for(const references of Object.values(legacy))for(const reference of references)assert.doesNotMatch(reference.bodyHtml,/<a\b[^>]*href="#/);
 assert.match(b.sanitize('<a href="#" data-appendix="x">付録の説明</a>'),/<span class="cv-reference-note">付録の説明<\/span>/);
});
