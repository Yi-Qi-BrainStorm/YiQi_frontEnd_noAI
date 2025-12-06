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
          // 1. Element Plus 独立打包（UI 框架，更新频率低）
          if (id.includes("element-plus") || id.includes("@element-plus")) {
            return "element-ui";
          }

          // 2. Vue 核心库独立打包（框架核心，极少更新）
          if (
            id.includes("node_modules/vue") ||
            id.includes("node_modules/@vue") ||
            id.includes("node_modules/pinia") ||
            id.includes("node_modules/vue-router")
          ) {
            return "vue-vendor";
          }

          // 3. 其他第三方库
          if (id.includes("node_modules/")) {
            return "vendor";
          }

          // 4. 业务代码不手动分块，让 Rollup 自动按路由分割
          // services 和 composables 不再手动分块（已解决循环依赖）
        },
      },
    },
    // 设置 chunk 大小警告阈值为 500KB
    chunkSizeWarningLimit: 500,
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
