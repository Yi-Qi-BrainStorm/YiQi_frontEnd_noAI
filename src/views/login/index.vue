<script setup lang="ts">
import type { LoginForm } from "./types";
import { ref, reactive } from "vue";
import { useRouter } from "vue-router";
import { User, Lock } from "@element-plus/icons-vue";
import { useAuth } from "@/composables";
import { ElMessage } from "element-plus";
import type { LoginRequest, RegisterRequest } from "@/types/api/auth";

const { login, register } = useAuth();

// 路由
const router = useRouter();

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

// 登录方法
const handleLogin = async () => {
  // 验证表单
  if (!loginFormRef.value) return;

  try {
    await loginFormRef.value.validate();
    // 表单验证通过后执行登录，只传递需要的字段
    const loginData: LoginRequest = {
      username: loginForm.username,
      password: loginForm.password,
    };
    await login(loginData);
    ElMessage.success("登录成功");
    router.push("/about");
  } catch (err: any) {
    console.error("登录失败:", err);
    ElMessage.error(err.message || "登录失败");
  }
};

// 注册方法
const handleRegister = async () => {
  // 验证表单
  if (!loginFormRef.value) return;

  try {
    await loginFormRef.value.validate();
    // 表单验证通过后执行注册，只传递需要的字段
    const registerData: RegisterRequest = {
      username: loginForm.username,
      password: loginForm.password,
    };
    await register(registerData);
    ElMessage.success("注册成功");
  } catch (err: any) {
    console.error("注册失败:", err);
    ElMessage.error(err.message || "注册失败");
  }
};

// 重置表单
const resetForm = () => {
  if (loginFormRef.value) {
    loginFormRef.value.resetFields();
  }
};
</script>

<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <div class="logo-container">
          <img src="/logo.png" alt="logo" class="logo" />
        </div>
        <h2 class="login-title">欢迎登录</h2>
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
      @apply bg-white p-8 text-center border-b border-gray-100;

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
          @apply flex-1 py-3 text-base font-semibold rounded-lg transition-all duration-300 bg-blue-500 hover:bg-blue-600;
        }

        .register-button {
          @apply flex-1 py-3 text-base font-semibold rounded-lg transition-all duration-300 bg-green-500 hover:bg-green-600;
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
</style>
