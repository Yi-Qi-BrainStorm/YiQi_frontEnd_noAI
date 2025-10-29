<script setup lang="ts">
import type { LoginForm } from "./types";
import { ref, reactive } from "vue";
import { User, Lock } from "@element-plus/icons-vue";
// 表单数据
const loginForm = reactive<LoginForm>({
  username: "",
  password: "",
  rememberMe: false,
});

// 表单引用
const loginFormRef = ref();

// 表单验证规则
const rules = {
  username: [
    { required: true, message: "请输入用户名", trigger: "blur" },
    { min: 3, max: 20, message: "长度在 3 到 20 个字符", trigger: "blur" },
  ],
  password: [
    { required: true, message: "请输入密码", trigger: "blur" },
    { min: 6, max: 20, message: "长度在 6 到 20 个字符", trigger: "blur" },
  ],
};

// 登录方法（框架已搭好，具体逻辑需手写完成）
const handleLogin = () => {
  // TODO: 实现登录逻辑
  console.log("登录表单数据:", loginForm);
};

// 注册方法
const handleRegister = () => {
  // TODO: 实现注册逻辑
  console.log("跳转到注册页面");
};

// 重置表单
const resetForm = () => {
  loginForm.username = "";
  loginForm.password = "";
  loginForm.rememberMe = false;
};
</script>

<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h2 class="login-title">欢迎登录</h2>
        <p class="login-subtitle">请输入您的账号和密码</p>
      </div>

      <el-form
        :model="loginForm"
        :rules="rules"
        ref="loginFormRef"
        class="login-form"
        label-position="top"
      >
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            :prefix-icon="User"
            :clearable="true"
          />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>

        <el-form-item>
          <el-checkbox v-model="loginForm.rememberMe"> 记住我 </el-checkbox>
        </el-form-item>

        <el-form-item class="buttons">
          <el-button
            type="primary"
            @click="handleLogin"
            class="login-button"
            :loading="false"
          >
            登录
          </el-button>
          <el-button
            type="success"
            @click="handleRegister"
            class="register-button"
          >
            注册
          </el-button>
        </el-form-item>
      </el-form>

      <div class="login-footer">
        <el-link type="primary" @click="resetForm">重置表单</el-link>
        <el-link type="info" class="forgot-password">忘记密码？</el-link>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.login-container {
  @apply min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4;

  .login-card {
    @apply w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden;

    .login-header {
      @apply bg-gradient-to-r from-blue-500 to-indigo-600 p-8 text-center;

      .login-title {
        @apply text-3xl font-bold text-white mb-2;
      }

      .login-subtitle {
        @apply text-blue-100;
      }
    }

    .login-form {
      @apply p-8;

      :deep(.el-form-item) {
        @apply mb-6;

        .el-form-item__label {
          @apply text-gray-700 font-medium;
        }
      }
      .buttons {
        @apply w-full flex justify-between items-center gap-4;

        .login-button {
          @apply flex-1 py-3 text-lg font-semibold rounded-lg transition-all duration-300;
        }

        .register-button {
          @apply flex-1 py-3 text-lg font-semibold rounded-lg transition-all duration-300;
        }
      }
    }

    .login-footer {
      @apply flex justify-between px-8 pb-6;

      .forgot-password {
        @apply ml-auto;
      }
    }
  }

  // 响应式设计
  @media (max-width: 640px) {
    .login-card {
      @apply rounded-xl;

      .login-header {
        @apply p-6;

        .login-title {
          @apply text-2xl;
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
</style>
