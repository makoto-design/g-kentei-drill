/* オフラインキャッシュ。
 *
 * 教材と画面を更新したときは CACHE_VERSION も更新する。
 * 相対URLはこのService Workerの設置場所（GitHub Pagesのサブパス）を基準にする。
 *
 * 取得方針を2つに分ける。
 *   - 画面と中身（HTML / data.js / lessons.js）… ネットワーク優先。
 *     オンラインなら必ず最新を出す。古いキャッシュに教材が出ない事故を防ぐため。
 *   - 見た目と部品（CSS / アイコン / manifest）… キャッシュ優先。
 *     変化が少なく、毎回取りに行く必要がない。
 * どちらもオフライン時はキャッシュから返すので、機内モードでも動く。
 */
const CACHE_VERSION = "gken-conversation-v6.2-d470fc5a79";

const PRECACHE = [
  "./",
  "./index.html",
  "./conversation.html",
  "./css/conversation.css?v=152f3c6813",
  "./js/conversation-data.js?v=4df57b1e76",
  "./js/conversation-m202-data.js?v=ae39257e93",
  "./js/conversation-lessons.js?v=6a64486ecc",
  "./js/conversation-course-data.js?v=afd772e183",
  "./js/conversation-catalog.js?v=fbb56874c1",
  "./js/conversation-course-visuals.js?v=8cd99ee758",
  "./js/conversation-m202-visuals.js?v=35876d621f",
  "./js/conversation.js?v=d81c7f0620",
  "./js/conversation-handoff.js?v=66c6656740",
  "./js/conversation-visuals.js?v=aae450f44e",
  "./css/style.css?v=22c03164d5",
  "./js/app.js?v=4eb6c0f164",
  "./js/exam.js?v=c2e1755f6a",
  "./js/passport-data.js?v=b65b2bba37",
  "./js/passport-lessons.js?v=c8019e1fc2",
  "./js/passport-map.js?v=3e50a3af21",
  "./js/data.js?v=1e9d3f3050",
  "./js/lessons.js?v=fe4c4e256d",
  "./js/map.js?v=ae79c106fa",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
];

/* 中身が変わるファイル。ここに当たるものはネットワーク優先で取りに行く */
function isContent(request) {
  if (request.mode === "navigate") return true;
  const p = new URL(request.url).pathname;
  return p.endsWith(".html") || p.endsWith(".js");
}

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_VERSION).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("gken-") && k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  const scope = new URL(self.registration.scope);
  if (url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname)) return;

  if (isContent(e.request)) {
    // ネットワーク優先。取れたら保存し、落ちたらキャッシュで代替する
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE_VERSION).then((c) => c.put(e.request, copy));
          }
          return res;
        })
        .catch(() =>
          /* クエリ付きの教材・講URLも初回プリキャッシュから復元する。
             JSや未キャッシュのURLへHTMLを返すと画面を壊すため、別画面で代替しない。 */
          caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || Response.error())
        )
    );
    return;
  }

  // キャッシュ優先
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((hit) => {
      if (hit) return hit;
      return fetch(e.request).then((res) => {
        if (res && res.status === 200 && res.type === "basic") {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((c) => c.put(e.request, copy));
        }
        return res;
      });
    })
  );
});
