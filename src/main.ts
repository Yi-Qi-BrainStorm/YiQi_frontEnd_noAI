import { createApp } from "vue";
import "@assets/tailwind.css";
import App from "@/App.vue";
import { setupPinia } from "@/stores/index";
import router from "@/router";

// 导入 Element Plus
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";

const app = createApp(App);
setupPinia(app);

app.use(router);
app.use(ElementPlus);

app.mount("#app");
