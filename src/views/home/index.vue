<script setup lang="ts">
import TopNav from "@/components/topnav/index.vue";
</script>

<template>
  <div class="home-container">
    <!-- 顶部导航栏 -->
    <header class="topnav">
      <top-nav />
    </header>

    <!-- 主要内容区域 -->
    <main class="main-content">
      <RouterView />
    </main>
  </div>
</template>

<script lang="ts"></script>

<style lang="scss" scoped>
// 使用 SCSS 和 Tailwind CSS 混合实现
.home-container {
  @apply flex flex-col;
  height: 100vh;
  @apply w-screen overflow-hidden;
  background: #f0f2f5;
}

.topnav {
  @apply flex-shrink-0;
  z-index: 1000;
  @apply bg-white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  // 确保 topnav 不会被压缩
  min-height: fit-content;
}

.main-content {
  @apply flex flex-1 overflow-hidden relative;
  min-height: 0;
}

// 响应式设计
@media (max-width: 768px) {
  .home-container {
    // 移动端确保不出现滚动条问题
    height: 100vh;
    @apply overflow-hidden;
  }
}

// 深度选择器处理 Element Plus 组件样式
:deep(.el-menu-item) {
  @apply transition-all duration-300;
}

:deep(.el-menu-item:hover) {
  @apply transform translate-x-0.5;
}

// 移除可能的默认边距和内边距
.home-container * {
  box-sizing: border-box;
}
</style>
