import { createPinia } from "pinia";
import type { App } from "vue";

// 导出创建 Pinia 实例的函数
export function setupPinia(app: App) {
  const pinia = createPinia();
  // 可以在这里添加 pinia 插件，例如 pinia-plugin-persistedstate
  // pinia.use(piniaPluginPersistedstate);

  app.use(pinia);
}

// ... 导出其他 store

export { useAuthStore } from "@/stores/auth";
