import { createApp } from "vue";
import "@assets/tailwind.css";
import App from "@/App.vue";
import { setupPinia } from "@/stores/index";
import router from "@/router";
import { registerServiceWorker } from "@/utils/registerSW";

// Element Plus 样式 - 组件通过 unplugin-vue-components 按需导入
import "element-plus/dist/index.css";

const app = createApp(App);
setupPinia(app);

app.use(router);

app.mount("#app");

// 注册 Service Worker（仅在生产环境）
if (import.meta.env.PROD) {
  registerServiceWorker({
    onSuccess: (registration) => {
      console.log("[App] Service Worker 注册成功", registration.scope);
    },
    onError: (error) => {
      console.warn(
        "[App] Service Worker 注册失败，应用将以在线模式运行",
        error.message,
      );
    },
    onUpdate: () => {
      console.log("[App] 发现新版本，请刷新页面");
    },
    onOfflineReady: () => {
      console.log("[App] 应用已准备好离线使用");
    },
  });
}
