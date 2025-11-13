<script setup lang="ts">
import TopNav from "@/component/topnav/index.vue";
</script>

<template>
  <div class="home-container">
    <!-- 顶部导航栏 -->
    <header class="topnav">
      <top-nav />
    </header>

    <!-- 主要内容区域 -->
    <main class="main-content">
      <div class="sidebar-wrapper">
        <RouterView />
      </div>
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

  .sidebar-wrapper {
    @apply flex-shrink-0 overflow-y-auto;
    width: 200px;
    @apply bg-white border-r border-gray-200;
    transition: width 0.3s ease;

    // 确保内部菜单正确显示
    :deep(.el-menu-vertical) {
      @apply h-full;
      border-right: none;
    }

    // 处理折叠状态
    &:has(.el-menu--collapse) {
      width: 64px;
    }

    // 确保子页面内容正确显示
    :deep(.el-radio-group) {
      @apply p-3 border-b border-gray-200;
      background: #fafafa;
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .home-container {
    // 移动端确保不出现滚动条问题
    height: 100vh;
    @apply overflow-hidden;
  }

  .sidebar-wrapper {
    width: 180px;

    &.mobile-collapsed {
      width: 0;
      @apply overflow-hidden;
    }
  }

  .content-area {
    @apply p-4;
  }
}

// 当侧边栏折叠时的样式调整
.sidebar-wrapper :deep(.el-menu--collapse) {
  width: 64px;
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

// 添加平滑滚动
.sidebar-wrapper {
  scroll-behavior: smooth;
}
</style>
