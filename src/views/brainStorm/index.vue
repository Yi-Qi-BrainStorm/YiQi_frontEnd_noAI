<template>
  <div class="agent-settings-container">
    <SidebarMenu
      :menu-items="sidebarMenuConfigs.brainstorm"
      @select="handleMenuSelect"
      @toggle-collapse="handleToggleCollapse"
      class="sidebar"
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
  const nextPath = sidebarMenuConfigs.brainstorm
    .filter((item) => !item.isLower)
    .find((item) => item.index === index)?.path;
  if (nextPath) router.push(nextPath);
};

const handleToggleCollapse = () => {
  console.log("切换折叠状态");
};

//默认打开第一级子路由
onMounted(() => {
  handleMenuSelect("1");
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
