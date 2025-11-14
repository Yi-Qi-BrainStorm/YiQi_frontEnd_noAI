<script lang="ts" setup>
import {
  User,
  Setting,
  SwitchButton,
  Loading,
  Warning,
  Collection,
  Close,
} from "@element-plus/icons-vue";
import { markRaw } from "vue";
import { onMounted, computed, ref } from "vue";
import { useProfileStore } from "@/stores/profile";
import { useAuthStore } from "@/stores/auth";
import { useUserCache } from "@/composables/useUserCache";

// 使用ProfileStore、AuthStore和UserCache
const profileStore = useProfileStore();
const authStore = useAuthStore();
const {
  userInfo: cachedUserInfo,
  isLoading: cacheLoading,
  error: cacheError,
  isFromCache,
  isOnline,
  loadUserInfo,
} = useUserCache();

// 统一的用户信息计算属性
const userInfo = computed(() => {
  // 定义默认用户信息
  const defaultUser = {
    name: "未知用户",
    email: "未设置邮箱",
    role: "普通用户",
    avatar: "/logo.png",
  };

  // 优先使用缓存数据，回退到profileStore，最后回退到authStore
  const dataSource =
    cachedUserInfo.value || profileStore.user || authStore.user;

  if (!dataSource || typeof dataSource !== "object") {
    return defaultUser;
  }

  // 类型安全访问
  const userData = dataSource as any;

  return {
    name: userData.username ?? defaultUser.name,
    email: userData.email ?? defaultUser.email,
    role: userData.role ?? defaultUser.role,
    avatar: userData.avatar ?? defaultUser.avatar,
  };
});

// 统一加载状态
const isLoading = computed(() => cacheLoading.value || profileStore.loading);
const error = computed(() => cacheError.value || profileStore.error);

// 组件挂载时获取用户信息
onMounted(async () => {
  console.log("[usercard] onMounted 开始加载用户信息");
  console.log("[usercard] cachedUserInfo:", cachedUserInfo.value);
  console.log("[usercard] profileStore.user:", profileStore.user);
  console.log("[usercard] authStore.user:", authStore.user);
  console.log("[usercard] isOnline:", isOnline.value);

  // 优先从缓存获取用户ID
  const cachedUserId = cachedUserInfo.value?.id;

  if (cachedUserId) {
    // 如果有缓存，直接加载缓存数据
    console.log("[usercard] 使用缓存的用户ID:", cachedUserId);
    await loadUserInfo(cachedUserId);
  } else {
    // 尝试从各个 store 获取用户ID
    const userId = profileStore.user?.id || authStore.user?.id;
    console.log("[usercard] 从store获取用户ID:", userId);

    if (userId) {
      // 有用户ID，加载缓存（离线时也能从缓存加载）
      await loadUserInfo(userId);
    } else if (isOnline.value) {
      // 在线且没有用户ID：从 API 获取
      try {
        await profileStore.fetchProfile();
        if (profileStore.user?.id) {
          await loadUserInfo(profileStore.user.id);
        }
      } catch (err) {
        // API 失败时，尝试从缓存获取（可能之前有缓存但 userId 不匹配）
        console.warn("[usercard] 从 API 获取用户信息失败，尝试从缓存获取");
      }
    } else {
      // 离线且没有用户ID和缓存：显示错误
      console.warn("[usercard] 离线且没有用户ID和缓存");
      cacheError.value = "离线状态且无缓存数据";
    }
  }
});

// 菜单项 - 使用markRaw避免响应式化
const menuItems = ref([
  { icon: markRaw(User), label: "个人资料", action: "profile" },
  { icon: markRaw(Setting), label: "设置", action: "settings" },
  { icon: markRaw(SwitchButton), label: "退出登录", action: "logout" },
]);

// 处理菜单项点击
const handleMenuClick = (action: string) => {
  console.log("Menu action:", action);
  // 这里可以添加具体的处理逻辑
  switch (action) {
    case "profile":
      // 跳转到个人资料页面
      break;
    case "settings":
      // 跳转到设置页面
      break;
    case "logout":
      // 执行退出登录逻辑
      break;
  }
};

// 安全的重试函数
const handleRetry = async () => {
  // 尝试从各个来源获取用户ID
  const userId =
    cachedUserInfo.value?.id || profileStore.user?.id || authStore.user?.id;

  if (!userId) {
    // 如果没有用户ID，尝试从 API 获取（仅在线时）
    if (isOnline.value) {
      try {
        await profileStore.fetchProfile();
        if (profileStore.user?.id) {
          await loadUserInfo(profileStore.user.id);
        }
      } catch (err) {
        console.error("重试获取用户信息失败:", err);
      }
    } else {
      // 离线时，提示用户
      cacheError.value = "离线状态，无法获取用户信息";
    }
    return;
  }

  // 有用户ID，直接重试加载
  await loadUserInfo(userId);
};
</script>

<template>
  <!-- 状态指示器 -->
  <div class="status-indicators">
    <div v-if="!isOnline" class="offline-indicator">
      <el-icon><Close /></el-icon>
      <span>离线</span>
    </div>

    <div v-if="isFromCache && isOnline" class="cache-indicator">
      <el-icon><Collection /></el-icon>
      <span>缓存数据</span>
    </div>
  </div>

  <!-- 加载状态 -->
  <el-card v-if="isLoading" class="user-card">
    <div class="loading-container">
      <el-icon class="loading-icon">
        <Loading />
      </el-icon>
      <span>加载用户信息中...</span>
    </div>
  </el-card>

  <!-- 错误状态 -->
  <el-card v-else-if="error" class="user-card">
    <div class="error-container">
      <el-icon class="error-icon">
        <Warning />
      </el-icon>
      <span>{{ error }}</span>
      <el-button type="text" @click="handleRetry">重试</el-button>
    </div>
  </el-card>

  <!-- 正常显示用户信息 -->
  <el-card v-else class="user-card">
    <template #header>
      <div class="user-header">
        <div class="user-avatar">
          <img :src="userInfo.avatar" :alt="userInfo.name" />
        </div>
        <div class="user-info">
          <div class="user-name">{{ userInfo.name }}</div>
          <div class="user-email">{{ userInfo.email }}</div>
          <div class="user-role">{{ userInfo.role }}</div>
        </div>
      </div>
    </template>

    <div class="menu-list">
      <div
        v-for="item in menuItems"
        :key="item.action"
        class="menu-item"
        @click="handleMenuClick(item.action)"
      >
        <el-icon class="menu-icon">
          <component :is="item.icon" />
        </el-icon>
        <span class="menu-label">{{ item.label }}</span>
      </div>
    </div>
  </el-card>
</template>

<style lang="scss" scoped>
.user-card {
  width: 35vw;
  position: relative; // 为状态指示器定位

  :deep(.el-card__body) {
    padding: 0;
  }

  :deep(.el-card__header) {
    padding: 16px;
    border-bottom: 1px solid #f0f0f0;
  }
}

// 状态指示器样式
.status-indicators {
  position: absolute;
  top: -10px;
  right: -10px;
  z-index: 10;
  display: flex;
  gap: 8px;
}

.offline-indicator {
  background: #f56c6c;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.cache-indicator {
  background: #67c23a;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.user-header {
  display: flex;
  align-items: center;
  gap: 20px;
}

.user-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.user-info {
  flex: 1;
}

.user-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.user-email {
  font-size: 13px;
  color: #909399;
  margin-bottom: 2px;
}

.user-role {
  font-size: 12px;
  color: #409eff;
  background: #ecf5ff;
  padding: 2px 8px;
  border-radius: 12px;
  display: inline-block;
}

.menu-list {
  padding: 8px 0;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f5f7fa;
  }

  &:last-child {
    border-top: 1px solid #f0f0f0;

    &:hover {
      background-color: #fef0f0;
      color: #f56c6c;
    }
  }
}

.menu-icon {
  font-size: 16px;
  color: #909399;
}

.menu-item:last-child .menu-icon {
  color: #f56c6c;
}

.menu-label {
  font-size: 14px;
  color: #606266;
}

.menu-item:hover .menu-label {
  color: #409eff;
}

.menu-item:last-child:hover .menu-label {
  color: #f56c6c;
}

// 加载状态样式
.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 40px 20px;
  color: #909399;

  .loading-icon {
    animation: rotate 2s linear infinite;
  }
}

// 错误状态样式
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 30px 20px;
  color: #f56c6c;

  .error-icon {
    font-size: 24px;
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
