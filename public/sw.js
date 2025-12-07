// Service Worker for YiQi - 离线优化
const CACHE_NAME = "yiqi-cache-v1";
const STATIC_CACHE_NAME = "yiqi-static-v1";
const API_CACHE_NAME = "yiqi-api-v1";

// 核心静态资源 - 首次安装时缓存
const STATIC_ASSETS = ["/", "/index.html"];

// Install 事件 - 缓存核心静态资源
self.addEventListener("install", (event) => {
  console.log("[SW] Installing Service Worker...");

  event.waitUntil(
    caches
      .open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log("[SW] Caching static assets");
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log("[SW] Static assets cached successfully");
        // 跳过等待，立即激活
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error("[SW] Failed to cache static assets:", error);
      }),
  );
});

// Activate 事件 - 清理旧缓存
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating Service Worker...");

  const cacheWhitelist = [CACHE_NAME, STATIC_CACHE_NAME, API_CACHE_NAME];

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!cacheWhitelist.includes(cacheName)) {
              console.log("[SW] Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          }),
        );
      })
      .then(() => {
        console.log("[SW] Service Worker activated");
        // 立即控制所有客户端
        return self.clients.claim();
      }),
  );
});

// Fetch 事件 - 实现缓存策略
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 只处理同源请求和 GET 请求
  if (url.origin !== location.origin) {
    return;
  }

  // 根据请求类型选择缓存策略
  if (isStaticAsset(request)) {
    // 静态资源: Cache First 策略
    event.respondWith(cacheFirst(request, STATIC_CACHE_NAME));
  } else if (isApiRequest(request)) {
    // API 请求: Network First 策略
    event.respondWith(networkFirst(request, API_CACHE_NAME));
  } else {
    // 其他请求: Network First with fallback
    event.respondWith(networkFirst(request, CACHE_NAME));
  }
});

// 判断是否为静态资源
function isStaticAsset(request) {
  const url = new URL(request.url);
  const staticExtensions = [
    ".js",
    ".css",
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".svg",
    ".woff",
    ".woff2",
    ".ttf",
  ];
  return staticExtensions.some((ext) => url.pathname.endsWith(ext));
}

// 判断是否为 API 请求
function isApiRequest(request) {
  const url = new URL(request.url);
  return url.pathname.startsWith("/api/");
}

// Cache First 策略 - 优先从缓存读取，缓存未命中时请求网络
async function cacheFirst(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      console.log("[SW] Cache hit:", request.url);
      return cachedResponse;
    }

    console.log("[SW] Cache miss, fetching:", request.url);
    const networkResponse = await fetch(request);

    // 只缓存成功的响应
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error("[SW] Cache first failed:", error);
    // 返回离线响应
    return createOfflineResponse();
  }
}

// Network First 策略 - 优先请求网络，失败时返回缓存
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);

    // 缓存成功的 GET 请求
    if (request.method === "GET" && networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log("[SW] Network failed, trying cache:", request.url);

    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      console.log("[SW] Returning cached response for:", request.url);
      return cachedResponse;
    }

    // 返回离线响应
    return createOfflineResponse();
  }
}

// 创建离线响应
function createOfflineResponse() {
  return new Response(
    JSON.stringify({
      error: "offline",
      message: "当前处于离线状态，请检查网络连接",
    }),
    {
      status: 503,
      statusText: "Service Unavailable",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
    },
  );
}

// 监听来自主线程的消息
self.addEventListener("message", (event) => {
  const { type } = event.data || {};

  switch (type) {
    case "SKIP_WAITING":
      self.skipWaiting();
      break;
    case "CLEAR_CACHE":
      clearAllCaches().then(() => {
        event.ports[0]?.postMessage({ success: true });
      });
      break;
    case "GET_CACHE_STATUS":
      getCacheStatus().then((status) => {
        event.ports[0]?.postMessage(status);
      });
      break;
    default:
      console.log("[SW] Unknown message type:", type);
  }
});

// 清理所有缓存
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map((name) => caches.delete(name)));
  console.log("[SW] All caches cleared");
}

// 获取缓存状态
async function getCacheStatus() {
  const cacheNames = await caches.keys();
  const status = {};

  for (const name of cacheNames) {
    const cache = await caches.open(name);
    const keys = await cache.keys();
    status[name] = keys.length;
  }

  return status;
}
