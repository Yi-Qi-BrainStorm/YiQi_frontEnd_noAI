import { createPinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
import type { App } from "vue";

// 导出创建 Pinia 实例的函数
export function setupPinia(app: App) {
  const pinia = createPinia();
  // 添加持久化插件
  pinia.use(piniaPluginPersistedstate);

  app.use(pinia);
}
