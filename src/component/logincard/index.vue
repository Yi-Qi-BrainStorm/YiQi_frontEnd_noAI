<script setup lang="ts">
import type { Props, Emits, LoginCardExpose } from "./types/index";
import { ref, computed } from "vue";
import { User, Lock } from "@element-plus/icons-vue";
import yogaImg from "@/assets/images/yoga.png";
import type { FormInstance } from "element-plus";

const props = withDefaults(defineProps<Props>(), {
  rules: () => ({}),
});

// Emits
const emit = defineEmits<Emits>();

// 表单引用
const loginFormRef = ref<FormInstance>();

// 表单数据（双向绑定）
const formData = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

// 暴露表单验证方法
defineExpose<LoginCardExpose>({
  validate: async () => {
    if (!loginFormRef.value) return;
    await loginFormRef.value.validate();
  },
  resetFields: () => {
    if (!loginFormRef.value) return;
    loginFormRef.value.resetFields();
  },
});
</script>

<template>
  <div class="login-card-wrapper">
    <!-- 左侧图片区域 -->
    <div class="login-image-section">
      <img :src="yogaImg" alt="yoga" class="login-image" />
    </div>

    <!-- 右侧表单区域 -->
    <div class="login-form-section">
      <div class="login-card">
        <div class="login-header">
          <div class="logo-container">
            <img src="/logo.png" alt="logo" class="logo" />
          </div>
          <h2 class="login-title">欢迎登录</h2>
        </div>

        <el-form
          :model="formData"
          :rules="rules"
          ref="loginFormRef"
          class="login-form"
          label-position="top"
        >
          <el-form-item label="用户名" prop="username">
            <el-input
              v-model="formData.username"
              placeholder="请输入用户名"
              :prefix-icon="User"
              :clearable="true"
            />
          </el-form-item>

          <el-form-item label="密码" prop="password">
            <el-input
              v-model="formData.password"
              type="password"
              placeholder="请输入密码"
              :prefix-icon="Lock"
              show-password
            />
          </el-form-item>

          <el-form-item>
            <el-checkbox v-model="formData.rememberMe"> 记住我 </el-checkbox>
          </el-form-item>

          <el-form-item class="buttons">
            <el-button
              type="primary"
              @click="emit('login')"
              class="login-button"
            >
              登录
            </el-button>
            <el-button
              type="success"
              @click="emit('register')"
              class="register-button"
            >
              注册
            </el-button>
          </el-form-item>
        </el-form>

        <div class="login-footer">
          <el-link type="primary" @click="emit('reset')">重置表单</el-link>
          <el-link type="info" class="forgot-password">忘记密码？</el-link>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.login-card-wrapper {
  @apply flex w-full max-w-5xl bg-white rounded-2xl shadow-xl overflow-hidden;

  // 左侧图片区域
  .login-image-section {
    @apply flex-1 hidden lg:flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-8;

    .login-image {
      @apply w-full h-full max-w-md object-contain;
    }
  }

  // 右侧表单区域
  .login-form-section {
    @apply flex-1 flex items-center justify-center p-4 lg:p-8;

    .login-card {
      @apply w-full max-w-md;

      .login-header {
        @apply bg-white p-6 lg:p-8 text-center border-b border-gray-100;

        .logo-container {
          @apply flex justify-center mb-4;

          .logo {
            @apply h-16 w-16 object-contain p-2 rounded-lg border border-gray-200 bg-white shadow-sm;
          }
        }

        .login-title {
          @apply text-2xl font-bold text-gray-800 mb-2;
        }
      }

      .login-form {
        @apply p-6 lg:p-8;

        :deep(.el-form-item) {
          @apply mb-6;

          .el-form-item__label {
            @apply text-gray-700 font-medium;
          }
        }

        .buttons {
          @apply w-full flex justify-between items-center gap-4;

          .login-button {
            @apply flex-1 py-3 text-base font-semibold rounded-lg transition-all duration-300 bg-blue-500 hover:bg-blue-600;
          }

          .register-button {
            @apply flex-1 py-3 text-base font-semibold rounded-lg transition-all duration-300 bg-green-500 hover:bg-green-600;
          }
        }
      }

      .login-footer {
        @apply flex justify-between px-6 lg:px-8 pb-6;

        .forgot-password {
          @apply ml-auto;
        }
      }
    }
  }

  // 响应式设计
  @media (max-width: 1023px) {
    .login-image-section {
      @apply hidden;
    }

    .login-form-section {
      @apply w-full;
    }
  }

  @media (max-width: 640px) {
    @apply rounded-xl;

    .login-form-section {
      .login-card {
        .login-header {
          @apply p-6;

          .login-title {
            @apply text-xl;
          }
        }

        .login-form {
          @apply p-6;

          .buttons {
            @apply flex-col gap-2;
          }
        }
      }
    }
  }
}
</style>
