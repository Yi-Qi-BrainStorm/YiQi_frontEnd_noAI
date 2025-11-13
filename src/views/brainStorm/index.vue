<template>
  <el-menu
    :default-active="activeMenu"
    class="el-menu-vertical"
    :collapse="isCollapse"
    @select="handleMenuSelect"
  >
    <!-- 汉堡菜单切换按钮 -->
    <el-menu-item
      index="toggle"
      class="toggle-button"
      :class="{ 'toggle-button-collapsed': isCollapse }"
      @click="toggleCollapse"
    >
      <el-icon>
        <IconMenu />
      </el-icon>
      <template #title>{{ isCollapse ? "展开菜单" : "收起菜单" }}</template>
    </el-menu-item>

    <!-- 分隔线 - 只在展开时显示 -->
    <el-divider v-if="!isCollapse" class="menu-divider" />

    <!-- 上方菜单区域 - 条件显示 -->
    <div v-if="!isCollapse" class="menu-upper">
      <el-menu-item
        v-for="item in upperMenuItems"
        :key="item.index"
        :index="item.index"
        :disabled="item.disabled"
      >
        <el-icon>
          <component :is="item.icon" />
        </el-icon>
        <template #title>{{ item.title }}</template>
      </el-menu-item>
    </div>

    <!-- 下方设置区域 - 条件显示 -->
    <div v-if="!isCollapse" class="menu-lower">
      <el-menu-item
        v-for="item in lowerMenuItems"
        :key="item.index"
        :index="item.index"
      >
        <el-icon>
          <component :is="item.icon" />
        </el-icon>
        <template #title>{{ item.title }}</template>
      </el-menu-item>
    </div>
  </el-menu>
</template>

<script lang="ts" setup>
import { ref, computed } from "vue";
import { markRaw } from "vue";
import { Document, Menu as IconMenu, Setting } from "@element-plus/icons-vue";

const isCollapse = ref(true);

// 当前激活的菜单项,这个函数的作用是什么？
const activeMenu = computed(
  () => menuItems.value.find((item) => !item.disabled)?.index || "1",
);

// 菜单数据配置
const menuItems = computed(() => [
  {
    index: "1",
    icon: markRaw(IconMenu),
    title: "Navigator One",
    disabled: false,
  },
  {
    index: "2",
    icon: markRaw(IconMenu),
    title: "Navigator Two",
    disabled: false,
  },
  {
    index: "3",
    icon: markRaw(Document),
    title: "Navigator Three",
    disabled: true,
  },
  {
    index: "4",
    icon: markRaw(Setting),
    title: "Navigator Four",
    disabled: false,
    isLower: true, // 标识底部菜单项
  },
]);

// 上方菜单项
const upperMenuItems = computed(() =>
  menuItems.value.filter((item) => !item.isLower),
);

// 下方菜单项
const lowerMenuItems = computed(() =>
  menuItems.value.filter((item) => item.isLower),
);

const handleMenuSelect = (index: string) => {
  console.log("选择菜单:", index);
  const menuItem = menuItems.value.find((item) => item.index === index);
  if (menuItem) {
    console.log("选中:", menuItem.title);
  }
};

const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value;
};
</script>

<style scoped>
.el-menu-vertical {
  padding-top: 10px;
  display: flex;
  flex-direction: column;
  width: 200px;
  height: 100%;
  background: #ffffff;
  border-right: 1px solid #e4e7ed;
  overflow: hidden; /* 关键：禁止滚动条 */
}

/* 按钮特殊样式 */
.toggle-button {
  flex-shrink: 0;
  border-bottom: 1px solid #f0f0f0;
  margin: 0;
  border-radius: 0;
  position: relative;
}

.toggle-button:hover {
  background: #f0f0f0 !important;
  transform: none !important;
  box-shadow: none !important;
}

.el-icon {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
/* 折叠状态下按钮居中 - 使用transform */
.toggle-button-collapsed .el-icon {
  transform: translateX(-8px) !important;
  margin: 0 !important;
  transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

/* 分隔线样式 */
.menu-divider {
  margin: 0 8px;
  border-color: #e4e7ed;
}

.menu-upper {
  flex: 1;
  overflow: hidden; /* 移除滚动条 */
  padding: 8px 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.menu-lower {
  flex-shrink: 0;
  padding: 8px 0;
  margin-top: auto;
  background: #fafafa;
}

/* 菜单项通用样式 */
.el-menu-item {
  border-radius: 6px;
  transition: all 0.3s ease;
  margin: 0 8px;
  padding: 0 12px;
  height: 44px;
  line-height: 44px;
  margin-bottom: 2px;
}

.el-menu-item:is-active {
  transform: translateX(2px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 设置按钮特殊样式 */
.menu-lower .el-menu-item {
  border: 1px solid #e4e7ed;
  background: #ffffff;
}

.menu-lower .el-menu-item:hover {
  border-color: #409eff;
  background: #ecf5ff;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .el-menu-vertical {
    width: 180px;
  }

  .el-menu-item {
    margin: 0 6px 2px 6px;
    height: 40px;
    line-height: 40px;
  }
}
</style>
