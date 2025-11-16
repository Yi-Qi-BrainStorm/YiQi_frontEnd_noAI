<template>
  <el-menu
    :default-active="activeMenu"
    class="el-menu-vertical"
    :collapse="isCollapse"
    @select="handleMenuSelect"
  >
    <!-- 菜单切换按钮 -->
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
import { Menu as IconMenu } from "@element-plus/icons-vue";
import type { MenuItem } from "./types";

interface Props {
  menuItems: MenuItem[];
  defaultActive?: string;
}

const props = withDefaults(defineProps<Props>(), {
  defaultActive: "1",
});

const emit = defineEmits<{
  select: [index: string];
  "toggle-collapse": [];
}>();

const isCollapse = ref(false);

// 当前激活的菜单项
const activeMenu = computed(
  () =>
    props.menuItems.find((item) => !item.disabled)?.index ||
    props.defaultActive,
);

// 上方菜单项
const upperMenuItems = computed(() =>
  props.menuItems.filter((item) => !item.isLower),
);

// 下方菜单项
const lowerMenuItems = computed(() =>
  props.menuItems.filter((item) => item.isLower),
);

const handleMenuSelect = (index: string) => {
  emit("select", index);
};

const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value;
  emit("toggle-collapse");
};
</script>

<style scoped>
.el-menu-vertical:not(.el-menu--collapse) {
  width: 200px;
  min-height: 400px;
}

.el-menu-vertical {
  padding-top: 10px;
  display: flex;
  flex-direction: column;
  width: 64px;
  height: 100%;
  background: #ffffff;
  border-right: 1px solid #e4e7ed;
  overflow: hidden;
}

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

.toggle-button-collapsed .el-icon {
  transform: translateX(-8px) !important;
  margin: 0 !important;
  transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.menu-divider {
  margin: 0 8px;
  border-color: #e4e7ed;
}

.menu-upper {
  flex: 1;
  overflow: hidden;
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

.menu-lower .el-menu-item {
  border: 1px solid #e4e7ed;
  background: #ffffff;
}

.menu-lower .el-menu-item:hover {
  border-color: #409eff;
  background: #ecf5ff;
}

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
