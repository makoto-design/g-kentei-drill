/* オフラインキャッシュ。
 *
 * CACHE_VERSION は deploy_drill.js が書き出し時に打ち直すので、手で上げなくてよい。
 *
 * 取得方針を2つに分ける。
 *   - 画面と中身（HTML / data.js / lessons.js）… ネットワーク優先。
 *     オンラインなら必ず最新を出す。古いキャッシュに教材が出ない事故を防ぐため。
 *   - 見た目と部品（CSS / アイコン / manifest）… キャッシュ優先。
 *     変化が少なく、毎回取りに行く必要がない。
 * どちらもオフライン時はキャッシュから返すので、機内モードでも動く。
 */
const CACHE_VERSION = "gken-202608050338";

const PRECACHE = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/app.js",
  "./js/data.js",
  "./js/lessons.js",
  "./js/map.js",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

/* 中身が変わるファイル。ここに当たるものはネットワーク優先で取りに行く */
function isContent(request) {
  if (request.mode === "navigate") return true;
  const p = new URL(request.url).pathname;
  return p.endsWith(".html") || p.endsWith("/data.js") || p.endsWith("/lessons.js") || p.endsWith("/map.js") || p.endsWith("/app.js");
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
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;

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
          caches.match(e.request).then((hit) => hit || caches.match("./index.html"))
        )
    );
    return;
  }

  // キャッシュ優先
  e.respondWith(
    caches.match(e.request).then((hit) => {
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
