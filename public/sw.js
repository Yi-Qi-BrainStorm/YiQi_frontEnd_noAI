// Service Worker for YiQi - 离线优化
const CACHE_NAME = "yiqi-cache-v1";
const STATIC_CACHE_NAME = "yiqi-static-v1";
const API_CACHE_NAME = "yiqi-api-v1";
const USER_DATA_CACHE_NAME = "yiqi-user-data-v1";

// 核心静态资源 - 首次安装时缓存
const STATIC_ASSETS = ["/", "/index.html"];

// 用户数据 API 路径 - 使用 Stale While Revalidate 策略
const USER_DATA_PATHS = ["/api/profile", "/api/user", "/api/agents"];

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

  const cacheWhitelist = [
    CACHE_NAME,
    STATIC_CACHE_NAME,
    API_CACHE_NAME,
    USER_DATA_CACHE_NAME,
  ];

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
    // 静态资源: Cache First 策略 (Requirements 4.2)
    event.respondWith(cacheFirst(request, STATIC_CACHE_NAME));
  } else if (isUserDataRequest(request)) {
    // 用户数据: Stale While Revalidate 策略 (Requirements 5.3)
    event.respondWith(staleWhileRevalidate(request, USER_DATA_CACHE_NAME));
  } else if (isApiRequest(request)) {
    // API 请求: Network First 策略 (Requirements 4.3)
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
    ".ico",
    ".webp",
  ];
  return staticExtensions.some((ext) => url.pathname.endsWith(ext));
}

// 判断是否为用户数据请求
function isUserDataRequest(request) {
  const url = new URL(request.url);
  return USER_DATA_PATHS.some((path) => url.pathname.startsWith(path));
}

// 判断是否为 API 请求
function isApiRequest(request) {
  const url = new URL(request.url);
  return url.pathname.startsWith("/api/");
}

/**
 * Cache First 策略 - 用于静态资源（JS、CSS、图片）
 * 优先从缓存读取，缓存未命中时请求网络
 * Requirements: 4.2
 *
 * @param {Request} request - 请求对象
 * @param {string} cacheName - 缓存名称
 * @returns {Promise<Response>} 响应对象
 */
async function cacheFirst(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      console.log("[SW] Cache First - Cache hit:", request.url);
      return cachedResponse;
    }

    console.log("[SW] Cache First - Cache miss, fetching:", request.url);
    const networkResponse = await fetch(request);

    // 只缓存成功的响应
    if (networkResponse.ok) {
      // 克隆响应，因为响应体只能读取一次
      cache.put(request, networkResponse.clone());
      console.log("[SW] Cache First - Cached new response:", request.url);
    }

    return networkResponse;
  } catch (error) {
    console.error("[SW] Cache First - Failed:", error);

    // 尝试从缓存获取（即使网络失败）
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      console.log("[SW] Cache First - Returning stale cache:", request.url);
      return cachedResponse;
    }

    // 返回离线响应
    return createOfflineResponse("static");
  }
}

/**
 * Network First 策略 - 用于 API 请求
 * 优先请求网络，失败时返回缓存
 * Requirements: 4.3
 *
 * @param {Request} request - 请求对象
 * @param {string} cacheName - 缓存名称
 * @returns {Promise<Response>} 响应对象
 */
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);

  try {
    console.log("[SW] Network First - Fetching:", request.url);
    const networkResponse = await fetch(request);

    // 缓存成功的 GET 请求
    if (request.method === "GET" && networkResponse.ok) {
      cache.put(request, networkResponse.clone());
      console.log("[SW] Network First - Cached response:", request.url);
    }

    return networkResponse;
  } catch (error) {
    console.log(
      "[SW] Network First - Network failed, trying cache:",
      request.url,
    );

    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      console.log(
        "[SW] Network First - Returning cached response:",
        request.url,
      );
      // 添加自定义头标识这是缓存的响应
      const headers = new Headers(cachedResponse.headers);
      headers.set("X-SW-Cache", "true");
      headers.set(
        "X-SW-Cache-Date",
        cachedResponse.headers.get("date") || "unknown",
      );

      return new Response(cachedResponse.body, {
        status: cachedResponse.status,
        statusText: cachedResponse.statusText,
        headers: headers,
      });
    }

    console.log("[SW] Network First - No cache available:", request.url);
    // 返回离线响应
    return createOfflineResponse("api");
  }
}

/**
 * Stale While Revalidate 策略 - 用于用户数据
 * 返回缓存同时后台更新
 * Requirements: 5.3
 *
 * @param {Request} request - 请求对象
 * @param {string} cacheName - 缓存名称
 * @returns {Promise<Response>} 响应对象
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  // 后台更新缓存的 Promise（不等待）
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
        console.log(
          "[SW] Stale While Revalidate - Updated cache:",
          request.url,
        );
      }
      return networkResponse;
    })
    .catch((error) => {
      console.log(
        "[SW] Stale While Revalidate - Background fetch failed:",
        error,
      );
      return null;
    });

  if (cachedResponse) {
    console.log(
      "[SW] Stale While Revalidate - Returning stale cache:",
      request.url,
    );
    // 添加自定义头标识这是缓存的响应，正在后台更新
    const headers = new Headers(cachedResponse.headers);
    headers.set("X-SW-Cache", "stale");
    headers.set("X-SW-Revalidating", "true");

    // 返回缓存响应，后台继续更新
    return new Response(cachedResponse.body, {
      status: cachedResponse.status,
      statusText: cachedResponse.statusText,
      headers: headers,
    });
  }

  console.log(
    "[SW] Stale While Revalidate - No cache, waiting for network:",
    request.url,
  );
  // 没有缓存，等待网络响应
  const networkResponse = await fetchPromise;

  if (networkResponse) {
    return networkResponse;
  }

  // 网络也失败了，返回离线响应
  return createOfflineResponse("user-data");
}

/**
 * 创建离线响应
 * @param {string} type - 响应类型 (static, api, user-data)
 * @returns {Response} 离线响应
 */
function createOfflineResponse(type = "general") {
  const messages = {
    static: "静态资源不可用，请检查网络连接",
    api: "API 请求失败，当前处于离线状态",
    "user-data": "用户数据不可用，请检查网络连接",
    general: "当前处于离线状态，请检查网络连接",
  };

  return new Response(
    JSON.stringify({
      error: "offline",
      type: type,
      message: messages[type] || messages.general,
      timestamp: Date.now(),
    }),
    {
      status: 503,
      statusText: "Service Unavailable",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "X-SW-Offline": "true",
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
    case "CLEAR_USER_DATA_CACHE":
      clearCache(USER_DATA_CACHE_NAME).then(() => {
        event.ports[0]?.postMessage({ success: true });
      });
      break;
    default:
      console.log("[SW] Unknown message type:", type);
  }
});

/**
 * 清理所有缓存
 * @returns {Promise<void>}
 */
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map((name) => caches.delete(name)));
  console.log("[SW] All caches cleared");
}

/**
 * 清理指定缓存
 * @param {string} cacheName - 缓存名称
 * @returns {Promise<void>}
 */
async function clearCache(cacheName) {
  await caches.delete(cacheName);
  console.log("[SW] Cache cleared:", cacheName);
}

/**
 * 获取缓存状态
 * @returns {Promise<Object>} 缓存状态对象
 */
async function getCacheStatus() {
  const cacheNames = await caches.keys();
  const status = {};

  for (const name of cacheNames) {
    const cache = await caches.open(name);
    const keys = await cache.keys();
    status[name] = {
      count: keys.length,
      urls: keys.map((req) => req.url),
    };
  }

  return status;
}
