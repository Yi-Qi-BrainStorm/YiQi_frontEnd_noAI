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
    <!-- 悬浮 Logo -->
    <div class="floating-logo">
      <img src="/logo.png" alt="logo" class="logo-image" />
    </div>

    <!-- 左侧图片区域 -->
    <div class="login-image-section">
      <img :src="yogaImg" alt="yoga" class="login-image" />
    </div>

    <!-- 右侧表单区域 -->
    <div class="login-form-section">
      <div class="login-card">
        <div class="login-header">
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
              class="custom-input"
            />
          </el-form-item>

          <el-form-item label="密码" prop="password">
            <el-input
              v-model="formData.password"
              type="password"
              placeholder="请输入密码"
              :prefix-icon="Lock"
              show-password
              class="custom-input"
            />
          </el-form-item>

          <el-form-item>
            <el-checkbox v-model="formData.rememberMe" class="custom-checkbox">
              记住我
            </el-checkbox>
          </el-form-item>

          <el-form-item class="buttons">
            <el-button @click="emit('login')" class="login-button">
              登录
            </el-button>
            <el-button @click="emit('register')" class="register-button">
              注册
            </el-button>
          </el-form-item>
        </el-form>

        <div class="login-footer">
          <el-link type="primary" @click="emit('reset')" class="custom-link"
            >重置表单</el-link
          >
          <el-link type="info" class="forgot-password custom-link"
            >忘记密码？</el-link
          >
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.login-card-wrapper {
  @apply flex w-full max-w-5xl bg-white rounded-2xl shadow-xl overflow-visible relative;

  // 悬浮 Logo
  .floating-logo {
    @apply absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 z-20 hidden lg:block;

    .logo-image {
      @apply w-24 h-24 object-contain p-1 rounded-full shadow-2xl border-4 border-white transition-all duration-300 hover:scale-110;
      background-color: rgb(254, 255, 244);
      box-shadow:
        0 15px 35px rgba(0, 0, 0, 0.2),
        0 5px 15px rgba(0, 0, 0, 0.1);
    }
  }

  // 左侧图片区域 - 调整为米黄色调渐变
  .login-image-section {
    @apply flex-1 hidden lg:flex items-center justify-center p-8;
    background: linear-gradient(
      135deg,
      rgb(254, 255, 244) 0%,
      rgb(250, 248, 230) 50%,
      rgb(245, 242, 215) 100%
    );

    .login-image {
      @apply w-full h-full max-w-md object-contain;
    }
  }

  // 右侧表单区域
  .login-form-section {
    @apply flex-1 flex items-center justify-center p-4 lg:p-8;
    background-color: rgb(254, 255, 244);

    .login-card {
      @apply w-full max-w-md;

      .login-header {
        @apply p-6 lg:p-8 text-center;
        background-color: rgb(254, 255, 244);

        .login-title {
          @apply text-2xl font-bold text-amber-900 mb-2;
        }
      }

      .login-form {
        @apply p-6 lg:p-8;

        :deep(.el-form-item) {
          @apply mb-6;

          .el-form-item__label {
            @apply text-amber-800 font-medium;
          }
        }

        .buttons {
          @apply w-full flex justify-between items-center gap-4;

          .login-button {
            @apply flex-1 py-3 text-base font-semibold rounded-lg transition-all duration-300;
            background: linear-gradient(
              135deg,
              rgb(180, 142, 95) 0%,
              rgb(160, 120, 70) 100%
            );
            color: white;
            border: none;
          }

          .login-button:hover {
            background: linear-gradient(
              135deg,
              rgb(160, 120, 70) 0%,
              rgb(140, 100, 50) 100%
            );
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(160, 120, 70, 0.3);
          }

          .register-button {
            @apply flex-1 py-3 text-base font-semibold rounded-lg transition-all duration-300;
            background: linear-gradient(
              135deg,
              rgb(142, 110, 75) 0%,
              rgb(120, 90, 55) 100%
            );
            color: white;
            border: none;
          }

          .register-button:hover {
            background: linear-gradient(
              135deg,
              rgb(120, 90, 55) 0%,
              rgb(100, 70, 35) 100%
            );
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(120, 90, 55, 0.3);
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

  // 自定义输入框样式
  .custom-input {
    :deep(.el-input__wrapper) {
      background-color: rgb(255, 253, 240);
      border: 1px solid rgb(220, 200, 170);
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(180, 142, 95, 0.1);
      transition: all 0.3s ease;
    }

    :deep(.el-input__wrapper:hover) {
      border-color: rgb(180, 142, 95);
      box-shadow: 0 1px 3px rgba(180, 142, 95, 0.2);
    }

    :deep(.el-input__wrapper.is-focus) {
      border-color: rgb(160, 120, 70);
      box-shadow: 0 0 0 2px rgba(160, 120, 70, 0.2);
    }

    :deep(.el-input__inner) {
      color: rgb(100, 70, 40);
      background-color: transparent;
    }

    :deep(.el-input__inner::placeholder) {
      color: rgb(180, 150, 120);
    }

    :deep(.el-input__prefix) {
      color: rgb(180, 142, 95);
    }
  }

  // 自定义复选框样式
  .custom-checkbox {
    :deep(.el-checkbox__label) {
      color: rgb(100, 70, 40);
    }

    :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
      background-color: rgb(180, 142, 95);
      border-color: rgb(180, 142, 95);
    }

    :deep(.el-checkbox__inner:hover) {
      border-color: rgb(180, 142, 95);
    }
  }

  // 自定义链接样式
  .custom-link {
    color: rgb(160, 120, 70) !important;
    text-decoration: none;
    transition: all 0.3s ease;
  }

  .custom-link:hover {
    color: rgb(140, 100, 50) !important;
    text-decoration: underline;
  }

  // 响应式设计
  @media (max-width: 1023px) {
    .login-image-section {
      @apply hidden;
    }

    .login-form-section {
      @apply w-full;
    }

    .floating-logo {
      @apply hidden;
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
