<script lang="ts" setup>
import {
  User,
  Setting,
  SwitchButton,
  Loading,
  Warning,
} from "@element-plus/icons-vue";
import { markRaw } from "vue";
import { onMounted, computed, ref } from "vue";
import { useProfileStore } from "@/stores/profile";

// 使用ProfileStore
const profileStore = useProfileStore();

// 计算属性：处理用户信息，提供默认值
const userInfo = computed(() => {
  if (!profileStore.user) {
    return {
      name: "加载中...",
      email: "请稍候",
      role: "用户",
      avatar: "/logo.png",
    };
  }

  return {
    name: profileStore.user.username || "未知用户",
    email: profileStore.user.email || "未设置邮箱",
    role: profileStore.user.role || "普通用户",
    avatar: profileStore.user.avatar || "/logo.png",
  };
});

// 组件挂载时获取用户信I
onMounted(() => {
  if (!profileStore.user) {
    profileStore.fetchProfile();
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
</script>

<template>
  <!-- 加载状态 -->
  <el-card v-if="profileStore.loading" class="user-card">
    <div class="loading-container">
      <el-icon class="loading-icon">
        <Loading />
      </el-icon>
      <span>加载用户信息中...</span>
    </div>
  </el-card>

  <!-- 错误状态 -->
  <el-card v-else-if="profileStore.error" class="user-card">
    <div class="error-container">
      <el-icon class="error-icon">
        <Warning />
      </el-icon>
      <span>{{ profileStore.error }}</span>
      <el-button type="text" @click="profileStore.fetchProfile()"
        >重试</el-button
      >
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

  :deep(.el-card__body) {
    padding: 0;
  }

  :deep(.el-card__header) {
    padding: 16px;
    border-bottom: 1px solid #f0f0f0;
  }
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
