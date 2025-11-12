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
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // 将 Element Plus 相关的模块放入 main chunk，确保先初始化
          if (id.includes("element-plus") || id.includes("@element-plus")) {
            return "element-ui";
          }

          // 将 services 目录下的所有模块打包到同一个 chunk
          if (id.includes("src/services/")) {
            return "services";
          }

          // 将 composables 目录下的所有模块打包到同一个 chunk
          if (id.includes("src/composables/")) {
            return "composables";
          }

          // 其他第三方库
          if (id.includes("node_modules/")) {
            return "vendor";
          }
        },
      },
    },
    // 调整 chunk 大小警告阈值到 1000KB
    chunkSizeWarningLimit: 1000,
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
