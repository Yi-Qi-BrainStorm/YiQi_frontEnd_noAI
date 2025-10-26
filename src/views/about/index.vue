<script setup lang="ts">
// About 页面逻辑（可根据需要扩展）
</script>

<template>
  <div class="about-container">
    <div class="about-card">
      <h1 class="about-title">关于意启平台</h1>
      <p class="about-description">
        这是一个基于 Vue3 + TypeScript + Vite 构建的现代化前端应用。
      </p>
      <div class="features">
        <el-card
          class="feature-card"
          v-for="feature in features"
          :key="feature.title"
        >
          <template #header>
            <div class="card-header">
              <span>{{ feature.title }}</span>
            </div>
          </template>
          <div class="card-content">
            {{ feature.description }}
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  setup() {
    const features = [
      {
        title: "Vue 3",
        description: "采用 Vue 3 Composition API，提供更好的开发体验和性能",
      },
      {
        title: "TypeScript",
        description: "强类型支持，提高代码质量和开发效率",
      },
      {
        title: "Element Plus",
        description: "基于 Vue 3 的桌面端组件库，界面美观且功能丰富",
      },
      {
        title: "Tailwind CSS",
        description: "实用优先的 CSS 框架，快速构建定制化设计",
      },
    ];

    return {
      features,
    };
  },
});
</script>

<style lang="scss" scoped>
.about-container {
  @apply min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4;

  .about-card {
    @apply max-w-4xl mx-auto mt-12 bg-white rounded-2xl shadow-lg p-8;

    .about-title {
      @apply text-3xl font-bold text-center text-gray-800 mb-6;
    }

    .about-description {
      @apply text-lg text-gray-600 text-center mb-10;
    }

    .features {
      @apply grid grid-cols-1 md:grid-cols-2 gap-6;

      .feature-card {
        @apply rounded-lg border border-gray-200;

        :deep(.el-card__header) {
          @apply bg-blue-50 font-semibold;
        }

        .card-content {
          @apply text-gray-600;
        }
      }
    }
  }
}
</style>
