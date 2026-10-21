/* M2-02 diagrams: exact authored values, locally rendered HTML/SVG. */
(function () {
  'use strict';
  if (window.CONVERSATION_DATA.lesson !== 'M2-02') return;
  var units = window.CONVERSATION_DATA.units;
  var prior = window.CV_FIGURE;
  function esc(value) { return String(value).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function box(label, value, active) { return '<div class="cv-vbox' + (active ? ' is-active' : '') + '"><small>' + esc(label) + '</small><strong>' + value + '</strong></div>'; }
  function arrow() { return '<div class="cv-varrow" aria-hidden="true">↓</div>'; }
  function text(x,y,value) { return '<text x="'+x+'" y="'+y+'">'+esc(value)+'</text>'; }
  function svg(label, body, height) { return '<svg viewBox="0 0 340 '+(height||240)+'" role="img" aria-label="'+esc(label)+'">'+body+'</svg>'; }
  function groups(items) { return '<div class="cv-vcolumns">' + items.map(function (group, i) { return box('グループ'+String.fromCharCode(65+i),group.map(esc).join('・')); }).join('')+'</div>'; }
  function figure(unit, mode) {
    var spec=unit.diagramSpec, selected=spec.modes && (spec.modes.find(function (item) { return item.id===mode; })||spec.modes[0]), body='';
    var controls=selected?spec.modes.map(function(item){return '<button type="button" data-visual="'+esc(item.id)+'" aria-pressed="'+(item.id===selected.id)+'">'+esc(item.label)+'</button>';}).join(''):'';
    if(spec.kind==='label-comparison') {
      body=box(selected.id==='without'?'入力 · 正解ラベルなし':'入力 · 正解ラベルあり',esc(selected.input))+arrow()+box('学習',esc(selected.operation))+arrow()+box('結果',esc(selected.result),true)+'<p class="cv-diagram-note">'+esc(selected.note)+'</p>';
    } else if(spec.kind==='kmeans-steps') {
      var plot='<path d="M25 112H325" class="cv-axis"/>';
      spec.points.forEach(function(point){var x=25+point*31,group=selected.groups[0].includes(point)?'A':'B';plot+=(group==='A'?'<circle cx="'+x+'" cy="100" r="7" class="cv-red"/>':'<rect x="'+(x-7)+'" y="93" width="14" height="14" class="cv-blue"/>')+text(x-6,133,point)+text(x-6,159,group);});
      selected.centers.forEach(function(center,i){var x=25+center*31;plot+='<path d="M'+x+' 52V115" class="cv-dash"/><path d="M'+(x-7)+' 52H'+(x+7)+' M'+x+' 45V59" class="cv-line"/>'+text(x-15,29,'中心'+String.fromCharCode(65+i));});
      body=svg('固定された5点と、段階ごとの2中心',plot,180)+groups(selected.groups)+'<div class="cv-vcolumns">'+selected.centers.map(function(center,i){return box('中心'+String.fromCharCode(65+i),esc(center));}).join('')+'</div><p class="cv-diagram-note">'+esc(selected.note)+'</p>';
    } else if(spec.kind==='dendrogram-cut') {
      var y=215-selected.cut*30;
      body=svg('同じ樹形図の切る高さを変える','<path d="M40 45V220" class="cv-axis"/><path d="M70 215V185H140V215 M220 215V155H290V215 M105 185V65H255V155" class="cv-line"/><path d="M45 '+y+'H320" class="cv-dash cv-cut-line"/>'+text(9,28,'高さ')+text(15,69,'5')+text(15,159,'2')+text(15,189,'1')+text(66,240,'A')+text(136,240,'B')+text(216,240,'C')+text(286,240,'D')+text(47,y-7,'切る高さ '+selected.cut),255)+box('切った結果',selected.groups.length+'クラスタ',true)+groups(selected.groups);
    } else if(spec.kind==='pca-projection') {
      var norm=Math.hypot(selected.axis[0],selected.axis[1]),ux=selected.axis[0]/norm,uy=selected.axis[1]/norm;
      function px(x){return 170+x*40;} function py(y){return 135-y*40;}
      var graph='<path d="M40 135H300 M170 30V240" class="cv-axis"/>'+text(285,154,'x')+text(179,35,'y')+text(12,20,'● 元の点　○ 射影')+'<path data-projection-axis="true" d="M'+px(-3.2*ux)+' '+py(-3.2*uy)+'L'+px(3.2*ux)+' '+py(3.2*uy)+'" class="cv-line"/>';
      spec.points.forEach(function(point,i){var dot=point[0]*ux+point[1]*uy,projected=[dot*ux,dot*uy];graph+='<path d="M'+px(point[0])+' '+py(point[1])+'L'+px(projected[0])+' '+py(projected[1])+'" class="cv-dash"/><circle data-projection="'+i+'" cx="'+px(projected[0])+'" cy="'+py(projected[1])+'" r="11" class="cv-projection"/><circle data-point="'+i+'" cx="'+px(point[0])+'" cy="'+py(point[1])+'" r="5" class="cv-red"/>'+text(px(point[0])+10,py(point[1])-10,String.fromCharCode(65+i));});
      if(selected.variance===0)graph+=text(181,153,'4点が重なる');
      body=svg('固定された元の4点を、単位方向ベクトルの軸へ垂直に射影',graph,270)+'<table><caption>選んだ軸での射影値</caption><thead><tr><th scope="col">元の点</th><th scope="col">射影値</th></tr></thead><tbody>'+spec.points.map(function(point,i){return '<tr><th scope="row">'+String.fromCharCode(65+i)+' ('+point.map(esc).join(', ')+')</th><td>'+esc(selected.projectionLabels[i])+'</td></tr>';}).join('')+'</tbody></table>'+box('この軸での分散',esc(selected.variance),true)+'<p class="cv-diagram-note">'+esc(selected.note)+'</p>';
    } else if(spec.kind==='svd-stages') {
      var reduced=selected.id==='reduced',factors=reduced?['Uₖ','Σₖ','Vₖᵀ']:['U','Σ','Vᵀ'];
      body=box('元の表・行列','A')+arrow()+'<div class="cv-feature-list">'+factors.map(function(factor,i){return box('材料'+(i+1),esc(factor));}).join('')+'</div>'+arrow()+box(reduced?'主要なk成分から近似する':'3つの材料の積から再構成する','<span class="cv-formula">'+esc(selected.formula)+'</span>',true)+'<p class="cv-diagram-note">'+esc(selected.note)+'</p>';
    } else if(spec.kind==='mds-map') {
      var vertical=selected.id==='vertical',positions=selected.positions.map(function(point){return [vertical?170:80+point[0]*32,vertical?215-point[1]*32:140];});
      var map='<path d="M'+positions[0].join(' ')+'L'+positions[2].join(' ')+'" class="cv-line"/>';
      positions.forEach(function(point,i){map+='<circle data-map-point="'+String.fromCharCode(65+i)+'" cx="'+point[0]+'" cy="'+point[1]+'" r="6" class="cv-red"/>'+text(point[0]+(vertical?16:-6),point[1]+(vertical?6:27),String.fromCharCode(65+i));});
      for(var j=0;j<2;j++){var left=positions[j],right=positions[j+1];map+=text((left[0]+right[0])/2+(vertical?-32:-4),(left[1]+right[1])/2+(vertical?6:-18),j===0?'1':'4');}
      map+=vertical?'<path d="M120 55V215" class="cv-dash"/>'+text(47,138,'全体5'):'<path d="M80 190H240" class="cv-dash"/>'+text(135,218,'全体5');
      body=svg('距離1、4、5を保った3点の配置',map,250)+'<table><caption>元の距離関係</caption><thead><tr><th scope="col">点の組</th><th scope="col">距離</th></tr></thead><tbody>'+spec.distances.map(function(row){return '<tr><th scope="row">'+esc(row[0])+'</th><td>'+esc(row[1])+'</td></tr>';}).join('')+'</tbody></table><p class="cv-diagram-note">向きが変わっても距離は同じ。軸に売上などの意味を付けません。</p>';
    } else if(spec.kind==='tsne-neighbors') {
      var local=[[40,80],[60,90],[50,110]],cloud='';
      ['A','B'].forEach(function(group,groupIndex){var offset=groupIndex?selected.offset:0;cloud+='<path d="M'+(40+offset)+' 80L'+(60+offset)+' 90L'+(50+offset)+' 110Z" class="cv-dash"/>';
        local.forEach(function(point,i){var x=point[0]+offset,dx=i===1?7:-18,dy=i===0?-12:i===1?0:25;cloud+='<circle data-neighbor="'+group+(i+1)+'" cx="'+x+'" cy="'+point[1]+'" r="5" class="'+(groupIndex?'cv-blue':'cv-red')+'"/>'+text(x+dx,point[1]+dy,group+(i+1));});
      });
      body=svg('群内の配置は固定し、群間の見た目だけを変えた模式図',cloud,170)+box('群内の近い関係は同じ','A1〜3 ／ B1〜3')+'<p class="cv-diagram-note">群間の間隔から違いの倍率は決められません。切替は模式図の比較で、アルゴリズムの再計算ではありません。</p>';
    } else if(spec.kind==='topic-mixture') {
      body='<div class="cv-topic-bar" role="img" aria-label="1文書のトピック混合：'+spec.topics.map(function(topic){return esc(topic.label)+' '+topic.percent+'%';}).join('、')+'">'+spec.topics.map(function(topic,i){return '<span class="cv-topic-segment cv-topic-'+i+'" style="flex-basis:'+topic.percent+'%">'+String.fromCharCode(65+i)+' '+topic.percent+'%</span>';}).join('')+'</div><div class="cv-diagram-stack">'+spec.topics.map(function(topic){return box(topic.label+' '+topic.percent+'%',topic.words.map(esc).join('・')+'<br><span class="cv-topic-interpretation">人の解釈：'+esc(topic.interpretation)+'</span>');}).join('')+'</div><p class="cv-diagram-note">1つの文書に複数話題が混ざります。70%や30%は、正しさの確率ではありません。</p>';
    } else if(spec.kind==='recommendation-source') {
      body='<table><caption>'+(selected.id==='collaborative'?'購入行動の表':'商品の属性の表')+'</caption><thead><tr><th scope="col">'+(selected.id==='collaborative'?'利用者':'商品')+'</th><th scope="col">'+(selected.id==='collaborative'?'商品A':'ジャンル')+'</th><th scope="col">'+(selected.id==='collaborative'?'商品B':'著者')+'</th></tr></thead><tbody>'+selected.rows.map(function(row){return '<tr><th scope="row">'+esc(row[0])+'</th><td>'+esc(row[1])+'</td><td>'+esc(row[2])+'</td></tr>';}).join('')+'</tbody></table>'+arrow()+box('推薦の候補',esc(selected.result),true)+'<p class="cv-diagram-note">'+esc(selected.reason)+(selected.id==='collaborative'?'。未購入は、不満評価という意味ではありません。':'。属性の共通点を使う架空の例です。')+'</p>';
    } else if(spec.kind==='cold-start-table') {
      body='<div class="cv-diagram-stack">'+spec.rows.map(function(row){return '<section class="cv-vbox cv-cold-card"><h3>'+esc(row[0])+'</h3><dl><dt>足りない情報</dt><dd>'+esc(row[1])+'</dd><dt>使えることがある情報</dt><dd>'+esc(row[2])+'</dd><dt>補い方</dt><dd>'+esc(row[3])+'</dd></dl></section>';}).join('')+'</div><p class="cv-diagram-note">商品属性だけで、新利用者の好みまで決まるわけではありません。</p>';
    } else if(spec.kind==='unsupervised-summary') {
      var categories=[['クラスタリング',0,3],['次元削減',3,7],['文書と推薦',7,9]];
      body=categories.map(function(category){return '<table class="cv-summary-table"><caption>'+category[0]+'</caption><thead><tr><th scope="col">手法</th><th scope="col">基準</th><th scope="col">要点</th></tr></thead><tbody>'+spec.rows.slice(category[1],category[2]).map(function(row){return '<tr><th scope="row">'+esc(row[0])+'</th><td>'+esc(row[1])+'</td><td>'+esc(row[2])+'</td></tr>';}).join('')+'</tbody></table>';}).join('');
    } else if(spec.kind==='ward-increase') {
      var minimum=Math.min.apply(null,spec.rows.map(function(row){return row[3];}));
      body='<table><caption>併合によるばらつきの増加</caption><thead><tr><th scope="col">組</th><th scope="col">平均</th><th scope="col">二乗和の増加</th></tr></thead><tbody>'+spec.rows.map(function(row){return '<tr'+(row[3]===minimum?' class="cv-selected-row"':'')+'><th scope="row">'+esc(row[0])+'</th><td>'+esc(row[1])+'</td><td>'+esc(row[2])+(row[3]===minimum?'<br><strong>最小・この組を併合</strong>':'')+'</td></tr>';}).join('')+'</tbody></table><p class="cv-diagram-note">各1点なので、併合前の二乗和は0です。複数点のクラスタでは、前後の差を比べます。</p>';
    }
    return '<figure class="cv-visual cv-m202-visual" data-diagram="'+esc(unit.id)+'"><div class="cv-vcontrols" aria-label="図の切り替え">'+controls+'</div>'+body+'<figcaption aria-live="polite">'+esc(spec.caption)+'</figcaption></figure>';
  }
  window.CV_FIGURE=function(id,mode){var unit=units.find(function(item){return item.id===id;});return unit?figure(unit,mode):prior(id,mode);};
})();
