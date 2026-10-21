/* Home for all available lessons; only reads per-lesson answers. */
(function () {
  'use strict';
  if (!window.CV_IS_CATALOG) return;
  var lessons=window.CONVERSATION_LESSONS, ids=Object.keys(lessons).sort(), screen=document.getElementById('cv-screen');
  var titles={M1:'人工知能の基礎と歴史',M2:'機械学習',M3:'ディープラーニングの基礎',M4:'ディープラーニングの要素技術',M5:'応用技術',M6:'AIの社会実装と数理',M7:'法律と契約',M8:'倫理とガバナンス'};
  function esc(value){return String(value).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function progress(lesson){
    try {var saved=JSON.parse(localStorage.getItem(lesson.storageKey));if(!saved||saved.version!==lesson.version||!Number.isInteger(saved.index)||saved.index<0||saved.index>=lesson.units.length||!['read','quiz','review','done'].includes(saved.stage)||!saved.answers||typeof saved.answers!=='object'||Array.isArray(saved.answers))return {count:0,saved:false};
      var count=lesson.units.filter(function(unit){var answer=saved.answers[unit.id];return answer&&Number.isInteger(answer.selected)&&answer.selected>=0&&answer.selected<unit.options.length;}).length;
      return {count:count,saved:true,index:Number.isInteger(saved.index)&&saved.index>=0&&saved.index<lesson.units.length?saved.index:0,done:saved.stage==='done'&&count===lesson.units.length,updatedAt:Number.isFinite(saved.updatedAt)?saved.updatedAt:0};
    }catch(error){return {count:0,saved:false};}
  }
  var records={},answered=0,total=0,last=null;
  ids.forEach(function(id){records[id]=progress(lessons[id]);answered+=records[id].count;total+=lessons[id].units.length;});
  try {var stored=JSON.parse(localStorage.getItem(window.CV_LAST_LESSON_KEY));if(stored&&Object.prototype.hasOwnProperty.call(lessons,stored.lesson))last=stored.lesson;}catch(error){}
  if(!last){var prior=ids.filter(function(id){return records[id].saved;}).sort(function(a,b){return records[b].updatedAt-records[a].updatedAt;});if(prior.length)last=prior[0];}
  document.getElementById('cv-progress').max=total||1;document.getElementById('cv-progress').value=answered;
  document.getElementById('cv-position').textContent=answered+' / '+total+' 単位に回答済み';document.getElementById('cv-percent').textContent='全体 '+Math.round(answered/(total||1)*100)+'%';
  screen.innerHTML='<section class="cv-catalog-intro"><p class="cv-kicker">説明を読み、問いに答え、会話で深める</p><h1 class="cv-title" tabindex="-1">G検定を、ひとつずつ。</h1><p class="cv-lead">'+ids.length+'講から学ぶところを選べます。各単位に、説明・図解・確認問題と、質問や言い換えのための確認タイムがあります。</p>'+
    (last?'<a class="btn cv-primary cv-catalog-resume" href="conversation.html?lesson='+esc(last)+'&resume=1">'+(records[last].done?'前回の結果を見返す':records[last].saved?'前回の続きから':'前回開いた講へ')+' · '+esc(last+' '+lessons[last].title)+'</a>':'')+'</section>'+
    Object.keys(titles).filter(function(module){return ids.some(function(id){return lessons[id].module===module;});}).map(function(module){return '<section class="cv-module" aria-labelledby="module-'+module+'"><h2 id="module-'+module+'">'+module+' · '+titles[module]+'</h2><div class="cv-lesson-grid">'+ids.filter(function(id){return lessons[id].module===module;}).map(function(id){var lesson=lessons[id],record=records[id],percent=Math.round(record.count/lesson.units.length*100);return '<article class="cv-lesson-card" data-lesson-card="'+esc(id)+'"><p class="cv-kicker">'+esc(id)+'</p><h3>'+esc(lesson.title)+'</h3><p>'+esc(lesson.introSummary)+'</p><div class="cv-card-progress"><span>'+record.count+' / '+lesson.units.length+' 単位</span><span>'+percent+'%</span></div><progress max="'+lesson.units.length+'" value="'+record.count+'" aria-label="'+esc(id)+'の回答済み単位"></progress><a class="btn '+(record.done?'':'cv-primary')+'" href="conversation.html?lesson='+esc(id)+(record.saved?'&resume=1':'')+'">'+(record.done?'結果と説明を見返す':record.saved?'続きから学ぶ':'この講を学ぶ')+'</a></article>';}).join('')+'</div></section>';}).join('')+'<a class="btn" href="index.html?exam=g-kentei">通常のドリルへ</a>';
  if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(function(){});
})();
