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
      imports: [
        "vue",
        "vue-router", // 强烈建议添加路由 Hooks
        "pinia", // 如果使用 Pinia

        // 💡 优化点：使用 Element Plus 官方或社区提供的预设字符串
        {
          "element-plus": [
            "ElMessage",
            "ElNotification",
            "ElMessageBox",
            "ElLoading",
            // 您可以根据需要添加其他函数，如 ElMessageBox
          ],
        },
      ],
      dts: "src/types/auto-imports.d.ts",
    }),

    // 2. 自动导入 Vue 组件和 Element Plus 组件
    Components({
      resolvers: [
        ElementPlusResolver({
          // 确保按需导入样式
          importStyle: "sass",
        }),
      ],
      // 可选：你可以在这里配置要自动导入的自定义组件目录
      dirs: ["src/components"],
      dts: "src/types/components.d.ts",
    }),
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      "@assets": resolve(__dirname, "src/assets"),
    },
  },
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
});
