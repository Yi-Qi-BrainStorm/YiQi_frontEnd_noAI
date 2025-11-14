import { ref, onMounted, onUnmounted } from "vue";

export function useNetworkStatus() {
  const isOnline = ref(navigator.onLine);
  const lastCheck = ref(Date.now());
  const connectionType = ref<string>("unknown");

  const updateOnlineStatus = () => {
    const wasOnline = isOnline.value;
    const nowOnline = navigator.onLine;

    isOnline.value = nowOnline;
    lastCheck.value = Date.now();

    console.log(
      `网络状态变化: ${wasOnline ? "在线" : "离线"} → ${nowOnline ? "在线" : "离线"}`,
    );

    // 更新连接类型
    if (navigator.connection) {
      connectionType.value = navigator.connection.effectiveType || "unknown";
    }
  };

  // 添加事件监听器
  const addEventListeners = () => {
    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    // 监听连接变化
    if ("connection" in navigator) {
      navigator.connection?.addEventListener("change", updateOnlineStatus);
    }
  };

  // 移除事件监听器
  const removeEventListeners = () => {
    window.removeEventListener("online", updateOnlineStatus);
    window.removeEventListener("offline", updateOnlineStatus);

    if ("connection" in navigator) {
      navigator.connection?.removeEventListener("change", updateOnlineStatus);
    }
  };

  // 定期检查网络状态（可选）
  const startNetworkCheck = (interval: number = 30000) => {
    const checkInterval = setInterval(() => {
      if (navigator.onLine !== isOnline.value) {
        updateOnlineStatus();
      }
    }, interval);

    return checkInterval;
  };

  onMounted(() => {
    addEventListeners();
    // 可选：启动定期检查
    // const checkInterval = startNetworkCheck(30000) // 30秒检查一次
  });

  onUnmounted(() => {
    removeEventListeners();
  });

  return {
    isOnline,
    lastCheck,
    connectionType,
    updateOnlineStatus,
    addEventListeners,
    removeEventListeners,
    startNetworkCheck,
  };
}
