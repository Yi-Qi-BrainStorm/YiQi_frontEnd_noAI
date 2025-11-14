<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { User } from "@element-plus/icons-vue";
import userCard from "@/components/usercard/index.vue";
import { useProfileStore } from "@/stores/profile";
import { useRouter } from "vue-router";
import { useNetworkStatus } from "@/composables/useNetworkStatus";

//取到路由器
const router = useRouter();

// 使用ProfileStore和网络状态
const profileStore = useProfileStore();
const { isOnline } = useNetworkStatus();

// 控制用户卡片显示状态
const showUserCard = ref(false);
const userIconRef = ref<HTMLElement>();

// 使用 Map 映射菜单 index 到路径
const menuMap = new Map([
  ["1", "/home/brainstorm"],
  ["2", "/home/agent-settings"],
  ["3", "/home/history"],
]);

// 显示/隐藏用户卡片 - 使用 Element Plus 的事件类型
function toggleUsercard() {
  // 如果是打开用户卡片，且在线时才刷新用户信息
  // 离线时，usercard 组件会自己从缓存加载
  if (!showUserCard.value && isOnline.value) {
    profileStore.refreshProfile();
  }

  showUserCard.value = !showUserCard.value;
}

// 点击外部区域关闭用户卡片 - 改进的DOM安全检查
function handleClickOutside(event: Event) {
  const target = event.target as Element;

  // 检查点击是否在用户菜单项内
  const isInMenuItem = Boolean(target.closest(".el-menu-item"));

  // 如果点击的是菜单项，不处理
  if (isInMenuItem) {
    return;
  }

  // 安全检查：确保ref存在且是HTMLElement
  if (!showUserCard.value) {
    return;
  }

  // 检查点击是否在用户卡片内
  const isInCard = Boolean(target.closest(".user-card-container"));

  // 如果不在卡片内，关闭
  if (!isInCard) {
    showUserCard.value = false;
  }
}

const handleMenuSelect = (index: string) => {
  const path = menuMap.get(index);
  if (path) {
    router.push(path);
  }
};

// 添加和移除点击事件监听器
onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>

<template>
  <div class="topnav-container">
    <el-menu
      class="el-menu"
      mode="horizontal"
      :ellipsis="false"
      @select="handleMenuSelect"
    >
      <div class="left-menu">
        <el-menu-item index="0">
          <img style="width: 50px" src="/logo.png" alt="logo" />
        </el-menu-item>
      </div>
      <div class="right-menu">
        <el-menu-item index="1">BrainStorm</el-menu-item>
        <el-menu-item index="2">Agent设置</el-menu-item>
        <el-menu-item index="3">历史记录</el-menu-item>
        <el-menu-item ref="userIconRef" @click="toggleUsercard">
          <el-icon>
            <User />
          </el-icon>
        </el-menu-item>
      </div>
    </el-menu>

    <!-- 用户卡片 -->
    <div v-if="showUserCard" class="user-card-container" @click.stop>
      <userCard />
    </div>
  </div>
</template>

<style scoped lang="scss">
.topnav-container {
  position: relative;

  .el-menu {
    display: flex;
    justify-content: space-between;

    .left-menu {
      display: flex;
    }

    .right-menu {
      display: flex;
    }
  }

  .user-card-container {
    position: absolute;
    top: 100%;
    right: 10px;
    z-index: 1000;
    margin-top: 10px;

    // 添加阴影和边框使其更突出
    :deep(.el-card) {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      border: 1px solid #e4e7ed;
      border-radius: 8px;
    }
  }
}
</style>
