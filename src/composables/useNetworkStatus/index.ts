/**
 * 网络状态管理 Composable
 * 实现网络状态检测、数据源切换逻辑和 UI 指示
 * Requirements: 8.2, 8.4
 */
import { ref, computed, onMounted, onUnmounted, readonly } from "vue";

// 数据源类型
export type DataSource = "network" | "cache";

// 网络状态详情
export interface NetworkState {
  isOnline: boolean;
  connectionType: string;
  effectiveType: string;
  downlink: number; // Mbps
  rtt: number; // ms
  lastChecked: number;
}

// 网络状态变化回调
export interface NetworkStatusCallbacks {
  onOnline?: () => void;
  onOffline?: () => void;
  onDataSourceChange?: (source: DataSource) => void;
}

/**
 * 网络状态管理 Composable
 * @param callbacks 可选的回调函数
 * @returns 网络状态和相关方法
 */
export function useNetworkStatus(callbacks?: NetworkStatusCallbacks) {
  // 基础网络状态
  const isOnline = ref(navigator.onLine);
  const lastCheck = ref(Date.now());
  const connectionType = ref<string>("unknown");
  const effectiveType = ref<string>("unknown");
  const downlink = ref<number>(0);
  const rtt = ref<number>(0);

  // 数据源状态 (Requirements: 8.2)
  const dataSource = ref<DataSource>(navigator.onLine ? "network" : "cache");

  // 状态变化时间戳（用于检测 500ms 内的状态变更 - Requirements: 8.1）
  const lastStatusChangeTime = ref<number>(Date.now());

  // UI 指示状态 (Requirements: 8.4)
  const showStatusIndicator = ref(false);
  const statusMessage = ref<string>("");
  const statusType = ref<"success" | "warning" | "info">("info");

  // 计算属性：完整网络状态
  const networkState = computed<NetworkState>(() => ({
    isOnline: isOnline.value,
    connectionType: connectionType.value,
    effectiveType: effectiveType.value,
    downlink: downlink.value,
    rtt: rtt.value,
    lastChecked: lastCheck.value,
  }));

  // 计算属性：是否使用缓存数据
  const isUsingCache = computed(() => dataSource.value === "cache");

  // 计算属性：连接质量描述
  const connectionQuality = computed(() => {
    if (!isOnline.value) return "离线";

    const type = effectiveType.value;
    switch (type) {
      case "4g":
        return "良好";
      case "3g":
        return "一般";
      case "2g":
      case "slow-2g":
        return "较差";
      default:
        return "未知";
    }
  });

  /**
   * 更新连接信息
   */
  const updateConnectionInfo = () => {
    if ("connection" in navigator && navigator.connection) {
      const conn = navigator.connection;
      connectionType.value = conn.effectiveType || "unknown";
      effectiveType.value = conn.effectiveType || "unknown";
      downlink.value = conn.downlink || 0;
      rtt.value = conn.rtt || 0;
    }
  };

  /**
   * 切换数据源 (Requirements: 8.2)
   */
  const switchDataSource = (source: DataSource) => {
    if (dataSource.value !== source) {
      const previousSource = dataSource.value;
      dataSource.value = source;

      console.log(`数据源切换: ${previousSource} → ${source}`);

      // 触发回调
      callbacks?.onDataSourceChange?.(source);
    }
  };

  /**
   * 显示网络状态指示 (Requirements: 8.4)
   */
  const showNetworkIndicator = (
    message: string,
    type: "success" | "warning" | "info" = "info",
    duration: number = 3000,
  ) => {
    statusMessage.value = message;
    statusType.value = type;
    showStatusIndicator.value = true;

    // 自动隐藏
    if (duration > 0) {
      setTimeout(() => {
        showStatusIndicator.value = false;
      }, duration);
    }
  };

  /**
   * 隐藏网络状态指示
   */
  const hideNetworkIndicator = () => {
    showStatusIndicator.value = false;
  };

  /**
   * 更新在线状态
   */
  const updateOnlineStatus = () => {
    const wasOnline = isOnline.value;
    const nowOnline = navigator.onLine;
    const currentTime = Date.now();

    // 记录状态变化时间
    lastStatusChangeTime.value = currentTime;
    isOnline.value = nowOnline;
    lastCheck.value = currentTime;

    // 更新连接信息
    updateConnectionInfo();

    console.log(
      `网络状态变化: ${wasOnline ? "在线" : "离线"} → ${nowOnline ? "在线" : "离线"}`,
    );

    // 状态变化处理
    if (wasOnline !== nowOnline) {
      if (nowOnline) {
        // 从离线切换到在线 (Requirements: 8.3)
        switchDataSource("network");
        showNetworkIndicator("网络已恢复，正在同步数据...", "success");
        callbacks?.onOnline?.();
      } else {
        // 从在线切换到离线 (Requirements: 8.2)
        switchDataSource("cache");
        showNetworkIndicator("网络已断开，使用缓存数据", "warning", 5000);
        callbacks?.onOffline?.();
      }
    }
  };

  /**
   * 添加事件监听器
   */
  const addEventListeners = () => {
    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    // 监听连接变化
    if ("connection" in navigator && navigator.connection) {
      navigator.connection.addEventListener("change", updateConnectionInfo);
    }
  };

  /**
   * 移除事件监听器
   */
  const removeEventListeners = () => {
    window.removeEventListener("online", updateOnlineStatus);
    window.removeEventListener("offline", updateOnlineStatus);

    if ("connection" in navigator && navigator.connection) {
      navigator.connection.removeEventListener("change", updateConnectionInfo);
    }
  };

  /**
   * 定期检查网络状态（可选）
   */
  const startNetworkCheck = (interval: number = 30000) => {
    const checkInterval = setInterval(() => {
      if (navigator.onLine !== isOnline.value) {
        updateOnlineStatus();
      }
    }, interval);

    return checkInterval;
  };

  /**
   * 手动检查网络状态
   */
  const checkNetworkStatus = async (): Promise<boolean> => {
    try {
      // 尝试发送一个简单的请求来验证网络连接
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch("/favicon.ico", {
        method: "HEAD",
        cache: "no-store",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const isConnected = response.ok;
      if (isConnected !== isOnline.value) {
        updateOnlineStatus();
      }

      return isConnected;
    } catch {
      if (isOnline.value) {
        // 如果之前是在线状态，但请求失败，更新为离线
        isOnline.value = false;
        switchDataSource("cache");
        showNetworkIndicator("网络连接不稳定，使用缓存数据", "warning");
      }
      return false;
    }
  };

  /**
   * 获取状态变化响应时间（用于验证 500ms 要求）
   */
  const getStatusChangeLatency = (): number => {
    return Date.now() - lastStatusChangeTime.value;
  };

  // 初始化
  onMounted(() => {
    // 初始化连接信息
    updateConnectionInfo();

    // 设置初始数据源
    dataSource.value = navigator.onLine ? "network" : "cache";

    // 添加事件监听
    addEventListeners();
  });

  // 清理
  onUnmounted(() => {
    removeEventListeners();
  });

  return {
    // 基础状态（只读）
    isOnline: readonly(isOnline),
    lastCheck: readonly(lastCheck),
    connectionType: readonly(connectionType),
    effectiveType: readonly(effectiveType),
    downlink: readonly(downlink),
    rtt: readonly(rtt),

    // 数据源状态 (Requirements: 8.2)
    dataSource: readonly(dataSource),
    isUsingCache,

    // 计算属性
    networkState,
    connectionQuality,

    // UI 指示状态 (Requirements: 8.4)
    showStatusIndicator: readonly(showStatusIndicator),
    statusMessage: readonly(statusMessage),
    statusType: readonly(statusType),

    // 方法
    updateOnlineStatus,
    addEventListeners,
    removeEventListeners,
    startNetworkCheck,
    checkNetworkStatus,
    switchDataSource,
    showNetworkIndicator,
    hideNetworkIndicator,
    getStatusChangeLatency,
  };
}
