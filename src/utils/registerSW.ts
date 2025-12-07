/**
 * Service Worker 注册工具
 * 实现 Service Worker 的注册、更新检测和降级处理
 */

export interface SWRegistrationOptions {
  /** SW 文件路径 */
  swPath?: string;
  /** 注册成功回调 */
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  /** 注册失败回调 */
  onError?: (error: Error) => void;
  /** 发现更新回调 */
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  /** 离线就绪回调 */
  onOfflineReady?: () => void;
}

export interface SWController {
  /** 检查更新 */
  checkForUpdate: () => Promise<void>;
  /** 跳过等待，立即激活新版本 */
  skipWaiting: () => void;
  /** 清理缓存 */
  clearCache: () => Promise<boolean>;
  /** 获取缓存状态 */
  getCacheStatus: () => Promise<Record<string, number>>;
  /** 注销 Service Worker */
  unregister: () => Promise<boolean>;
}

/**
 * 检查浏览器是否支持 Service Worker
 */
export function isServiceWorkerSupported(): boolean {
  return "serviceWorker" in navigator;
}

/**
 * 注册 Service Worker
 */
export async function registerServiceWorker(
  options: SWRegistrationOptions = {},
): Promise<SWController | null> {
  const {
    swPath = "/sw.js",
    onSuccess,
    onError,
    onUpdate,
    onOfflineReady,
  } = options;

  // 检查浏览器支持
  if (!isServiceWorkerSupported()) {
    console.warn(
      "[SW Register] Service Worker is not supported in this browser",
    );
    fallbackToOnlineMode();
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register(swPath, {
      scope: "/",
    });

    console.log("[SW Register] Service Worker registered successfully");

    // 监听更新
    registration.addEventListener("updatefound", () => {
      const newWorker = registration.installing;

      if (newWorker) {
        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed") {
            if (navigator.serviceWorker.controller) {
              // 有新版本可用
              console.log("[SW Register] New version available");
              onUpdate?.(registration);
              notifyUserAboutUpdate();
            } else {
              // 首次安装完成，离线就绪
              console.log("[SW Register] Content cached for offline use");
              onOfflineReady?.();
            }
          }
        });
      }
    });

    // 注册成功回调
    onSuccess?.(registration);

    // 返回控制器
    return createSWController(registration);
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("[SW Register] Service Worker registration failed:", err);
    onError?.(err);
    fallbackToOnlineMode();
    return null;
  }
}

/**
 * 创建 Service Worker 控制器
 */
function createSWController(
  registration: ServiceWorkerRegistration,
): SWController {
  return {
    async checkForUpdate() {
      try {
        await registration.update();
        console.log("[SW Controller] Update check completed");
      } catch (error) {
        console.error("[SW Controller] Update check failed:", error);
      }
    },

    skipWaiting() {
      const waiting = registration.waiting;
      if (waiting) {
        waiting.postMessage({ type: "SKIP_WAITING" });
      }
    },

    async clearCache(): Promise<boolean> {
      return new Promise((resolve) => {
        const messageChannel = new MessageChannel();
        messageChannel.port1.onmessage = (event) => {
          resolve(event.data?.success ?? false);
        };

        const activeWorker = registration.active;
        if (activeWorker) {
          activeWorker.postMessage({ type: "CLEAR_CACHE" }, [
            messageChannel.port2,
          ]);
        } else {
          resolve(false);
        }
      });
    },

    async getCacheStatus(): Promise<Record<string, number>> {
      return new Promise((resolve) => {
        const messageChannel = new MessageChannel();
        messageChannel.port1.onmessage = (event) => {
          resolve(event.data ?? {});
        };

        const activeWorker = registration.active;
        if (activeWorker) {
          activeWorker.postMessage({ type: "GET_CACHE_STATUS" }, [
            messageChannel.port2,
          ]);
        } else {
          resolve({});
        }
      });
    },

    async unregister(): Promise<boolean> {
      try {
        const success = await registration.unregister();
        console.log("[SW Controller] Service Worker unregistered:", success);
        return success;
      } catch (error) {
        console.error("[SW Controller] Unregister failed:", error);
        return false;
      }
    },
  };
}

/**
 * 降级到纯在线模式
 */
function fallbackToOnlineMode(): void {
  console.log("[SW Register] Falling back to online-only mode");
  // 在纯在线模式下，应用仍然可以正常工作
  // 只是没有离线缓存功能
}

/**
 * 通知用户有新版本可用
 */
function notifyUserAboutUpdate(): void {
  // 可以通过事件或全局状态通知 UI 层
  // 这里使用自定义事件
  const event = new CustomEvent("sw-update-available", {
    detail: { message: "发现新版本，刷新页面以更新" },
  });
  window.dispatchEvent(event);
}

/**
 * 监听 Service Worker 控制器变化（用于页面刷新后的处理）
 */
export function onControllerChange(callback: () => void): void {
  if (isServiceWorkerSupported()) {
    navigator.serviceWorker.addEventListener("controllerchange", callback);
  }
}
