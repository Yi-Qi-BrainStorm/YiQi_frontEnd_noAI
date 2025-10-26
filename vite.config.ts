import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";
import { resolve } from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    // 1. 自动导入 Vue Hooks, 路由Hooks, Element Plus Hooks等
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),

    // 2. 自动导入 Vue 组件和 Element Plus 组件
    Components({
      resolvers: [ElementPlusResolver()],
      // 可选：你可以在这里配置要自动导入的自定义组件目录
      dirs: ["src/components"],
    }),
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      "@assets": resolve(__dirname, "src/assets"),
    },
  },
});
