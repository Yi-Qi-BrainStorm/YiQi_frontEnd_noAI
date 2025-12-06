import { createApp } from "vue";
import "@assets/tailwind.css";
import App from "@/App.vue";
import { setupPinia } from "@/stores/index";
import router from "@/router";

// Element Plus 样式 - 组件通过 unplugin-vue-components 按需导入
import "element-plus/dist/index.css";

const app = createApp(App);
setupPinia(app);

app.use(router);

app.mount("#app");
