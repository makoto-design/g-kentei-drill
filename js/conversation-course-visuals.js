/* Authored course diagrams; text is escaped, never treated as executable HTML. */
(function(){
  'use strict';
  var previous=window.CV_FIGURE,units=window.CONVERSATION_DATA.units;
  function esc(value){return String(value).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  window.CV_FIGURE=function(id,mode){var unit=units.find(function(item){return item.id===id;}),spec=unit&&unit.diagramSpec;if(!spec||spec.kind!=='table')return previous(id,mode);var body;
    if(spec.headers.length>3){body='<div class="cv-diagram-stack">'+spec.rows.map(function(row){return '<dl class="cv-vbox cv-course-record">'+row.map(function(value,i){return '<dt>'+esc(spec.headers[i])+'</dt><dd>'+esc(value)+'</dd>';}).join('')+'</dl>';}).join('')+'</div>';}
    else body='<table><caption>'+esc(unit.topic)+'</caption><thead><tr>'+spec.headers.map(function(header){return '<th scope="col">'+esc(header)+'</th>';}).join('')+'</tr></thead><tbody>'+spec.rows.map(function(row){return '<tr>'+row.map(function(value,i){return i===0?'<th scope="row">'+esc(value)+'</th>':'<td>'+esc(value)+'</td>';}).join('')+'</tr>';}).join('')+'</tbody></table>';
    return '<figure class="cv-visual cv-course-visual" data-diagram="'+esc(id)+'">'+body+'<figcaption>'+esc(spec.caption)+'</figcaption></figure>';
  };
})();
