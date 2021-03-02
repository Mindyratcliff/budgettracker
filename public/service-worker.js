
//Set up cache


const FILES_TO_CACHE = [
  "/",
  "/index.html",
  "/index.js",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/styles.css",
  "/dist/bundle.js",
  "https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css",
];

const PRECACHE = "precache";
const RUNTIME = "runtime";

//install
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PRECACHE)
      .then((cache) => cache.addAll(FILES_TO_CACHE))
      .then(self.skipWaiting())
  );
});

//clean old caches

self.addEventListener("activate", (event) => {
  const currentCaches = [PRECACHE, RUNTIME];
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return cacheNames.filter(
          (cacheName) => !currentCaches.includes(cacheName)
        );
      })
      .then((cachesToDelete) => {
        return Promise.all(
          cachesToDelete.map((cacheToDelete) => {
            return caches.delete(cacheToDelete);
          })
        );
      })
      .then(() => self.clients.claim())
  );
});


//Any req other than Get is not cached

self.addEventListener("fetch", (event) => {
  if (
    event.request.method !== "GET" ||
    !event.request.url.startsWith(self.location.origin)
  ) {
    event.respondWith(fetch(event.request)
    .catch(() => savePostRequest(event.request)));
    return;
  }

  //Get requests during run time

    // use Cache for get requests when offline
    event.respondWith(
      caches.open(RUNTIME).then((cache) => {
        return fetch(event.request)
          .then((response) => {
            cache.put(event.request, response.clone());
            return response;
          })
          .catch(() => caches.match(event.request));
      })
    );
    return;
  }
);

//Offline transactions - Post and Put requests

//Create the IndexedDB db

async function dbActions() {
  const db = await openDB("Transactions", 1, {
    upgrade(db, oldVersion, newVersion, transaction) {
      db.createObjectStore("expenses");
    },
  }); 
  return db;
}
self.addEventListener("fetch", (event) => {
  if (event.request.method == "POST" || event.request.method == "PUT") {
    event.respondWith(
      fetch(event.request).catch(function (err) {
        console.log("meow");
      })
    );
    return;
  }
});

function savePostRequest(request) {
const db = dbActions();
const transaction = db.transaction(["expenses"], "readwrite");
const store = transaction.objectStore('expenses');
store.add(request.url);
}