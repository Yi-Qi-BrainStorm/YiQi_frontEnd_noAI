<template>
  <SidebarMenu
    :menu-items="sidebarMenuConfigs.agentSettings"
    @select="handleMenuSelect"
    @toggle-collapse="handleToggleCollapse"
    class="sidebar"
  />
</template>

<script lang="ts" setup>
import { sidebarMenuConfigs } from "@/constants/sidebarMenuConfig";
import SidebarMenu from "@/components/sidebarMenu/index.vue";
import { useRouter } from "vue-router";

const router = useRouter();

const handleMenuSelect = (index: string) => {
  const nextPath = sidebarMenuConfigs.agentSettings
    .filter((item) => !item.isLower)
    .find((item) => item.index === index)?.path;
  if (nextPath) router.push(nextPath);
};

const handleToggleCollapse = () => {
  console.log("切换折叠状态");
};
</script>

<style lang="scss" scoped></style>
