const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ROOT=path.resolve(__dirname,'..'),SCOPE='https://learning.example/g-kentei-drill/';
const source=fs.readFileSync(path.join(ROOT,'sw.js'),'utf8');
const currentVersion=source.match(/const CACHE_VERSION = "([^"]+)"/)[1];
function worker() {
  const events={},writes=[],deletes=[],lookups=[],stored=new Map();
  let network=async()=>({status:200,type:'basic',clone(){return this;}}),precache;
  const urlOf=request=>typeof request==='string'?new URL(request,SCOPE).href:request.url;
  const cache={addAll:async urls=>{precache=urls;for(const url of urls)stored.set(urlOf(url),{asset:url});},put:async(request,response)=>{writes.push([request,response]);stored.set(urlOf(request),response);}};
  const sandbox={URL,Promise,Response,fetch:r=>network(r),self:{registration:{scope:SCOPE},addEventListener:(name,fn)=>{events[name]=fn;},skipWaiting:async()=>{},clients:{claim:async()=>{}}},caches:{open:async()=>cache,keys:async()=>['gken-conversation-v1','gken-conversation-v6.2',currentVersion,'unrelated'],delete:async key=>{deletes.push(key);},match:async(request,options)=>{lookups.push([request,options]);const requested=new URL(urlOf(request));if(!options?.ignoreSearch)return stored.get(requested.href);return [...stored].find(([url])=>{const candidate=new URL(url);return candidate.origin===requested.origin&&candidate.pathname===requested.pathname;})?.[1];}}};
  vm.runInNewContext(source,sandbox);
  return {events,writes,deletes,lookups,setNetwork:fn=>{network=fn;},get precache(){return precache;},async lifecycle(type){let p;events[type]({waitUntil:value=>{p=value;}});await p;},async request(url,mode='cors',method='GET'){let p;events.fetch({request:{method,url:new URL(url,SCOPE).href,mode},respondWith:value=>{p=value;}});return p;}};
}
test('production worker precaches existing subpath resources, including all conversation dependencies and PWA icons',async()=>{
  const w=worker();await w.lifecycle('install');
  for(const url of w.precache){const resolved=new URL(url,SCOPE);assert.ok(resolved.pathname.startsWith('/g-kentei-drill/'),url);const file=resolved.pathname.slice('/g-kentei-drill/'.length)||'index.html';assert.ok(fs.existsSync(path.join(ROOT,file)),url);}
  assert.ok(w.precache.some(url=>new URL(url,SCOPE).pathname.endsWith('/js/conversation-course-data.js')));assert.ok(w.precache.includes('./icons/icon-maskable-512.png'));assert.ok(!w.precache.some(url=>url.includes('drill.html')));
  await w.lifecycle('activate');assert.deepEqual(w.deletes,['gken-conversation-v1','gken-conversation-v6.2']);
});
test('content uses network first and cold precache restores every lecture and ordinary/passport entry offline',async()=>{
  const w=worker();await w.lifecycle('install');await w.request('js/conversation-data.js?v=testing-current');assert.equal(w.writes.length,1);await w.lifecycle('install');
  w.setNetwork(async()=>{throw Error('offline');});
  for(const file of ['index.html?exam=passport','index.html?exam=g-kentei','conversation.html',...Array.from({length:32},(_,i)=>'conversation.html?lesson=M'+i)]){
    const hit=await w.request(file,'navigate');assert.ok(hit.asset,file);assert.ok(hit.asset.includes(file.startsWith('conversation')?'conversation.html':'index.html'));assert.equal(w.lookups.at(-1)[1].ignoreSearch,true);
  }
  for(const asset of w.precache.filter(url=>/\.(js|css)(\?|$)/.test(url)))assert.ok((await w.request(asset.split('?')[0]+'?v=testing-current')).asset,asset);
  const unknown=await w.request('js/missing.js');assert.equal(unknown.type,'error','missing JS never receives index HTML');
});
test('worker leaves other origins, other Pages apps and non-GET requests to the browser',async()=>{
  const w=worker();let calls=0;w.setNetwork(async()=>{calls++;});
  for(const url of ['https://chatgpt.com/','https://learning.example/another-app/index.html','https://learning.example/g-kentei-drill-elsewhere/index.html'])assert.equal(await w.request(url),undefined);
  assert.equal(await w.request('conversation.html','cors','POST'),undefined);assert.equal(calls,0);assert.equal(w.lookups.length,0);
});
