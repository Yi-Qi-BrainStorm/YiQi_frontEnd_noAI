<template>
  <div class="agent-settings-container">
    <SidebarMenu
      :menu-items="sidebarMenuConfigs.agentSettings"
      @select="handleMenuSelect"
      @toggle-collapse="handleToggleCollapse"
    />
    <div class="content-area">
      <RouterView></RouterView>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { sidebarMenuConfigs } from "@/constants/sidebarMenuConfig";
import SidebarMenu from "@/components/sidebarMenu/index.vue";
import { useRouter } from "vue-router";
import { onMounted } from "vue";

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

//默认打开第一级子路由
onMounted(() => {
  const currentPath = router.currentRoute.value.path;
  if (currentPath === "/home/agent-settings") {
    handleMenuSelect("1");
  }
});
</script>

<style lang="scss" scoped>
.agent-settings-container {
  @apply flex h-full;

  .content-area {
    @apply flex-1 overflow-auto;
    padding: 20px;
  }
}
</style>
