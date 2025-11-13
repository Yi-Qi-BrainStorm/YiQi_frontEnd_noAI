<template>
  <SidebarMenu
    :menu-items="sidebarMenuConfigs.agentSettings"
    @select="handleMenuSelect"
    @toggle-collapse="handleToggleCollapse"
  />
</template>

<script lang="ts" setup>
import { sidebarMenuConfigs } from "@/constants/sidebarMenuConfig";
import SidebarMenu from "@/components/sidebarMenu/index.vue";

const handleMenuSelect = (index: string) => {
  console.log("选择菜单:", index);
};

const handleToggleCollapse = () => {
  console.log("切换折叠状态");
};
</script>
