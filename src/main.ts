import { createApp } from "vue";
import "@assets/tailwind.css";
import App from "@/App.vue";
import { setupPinia } from "@/stores/index";
import router from "@/router";

const app = createApp(App);
setupPinia(app);

app.use(router);

app.mount("#app");
