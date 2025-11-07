<script setup lang="ts">
import type { LoginForm } from "./types";
import type { LoginCardExpose } from "@/component/logincard/types";
import { ref, reactive } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuth } from "@/composables";
import { ElMessage } from "element-plus";
import type { LoginRequest, RegisterRequest } from "@/types/api/auth";
import LoginCard from "@/component/logincard/index.vue";

const { login, register } = useAuth();

// 路由
const router = useRouter();
const route = useRoute();

// 表单数据
const loginForm = reactive<LoginForm>({
  username: "",
  password: "",
  rememberMe: false,
});

// 表单引用
const loginCardRef = ref<LoginCardExpose>();

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
  if (!loginCardRef.value) return;

  try {
    await loginCardRef.value.validate();
    // 表单验证通过后执行登录，只传递需要的字段
    const loginData: LoginRequest = {
      username: loginForm.username,
      password: loginForm.password,
    };
    await login(loginData);
    ElMessage.success("登录成功");
    const redirectQuery = Array.isArray(route.query.redirect)
      ? route.query.redirect[0]
      : route.query.redirect;
    const target =
      typeof redirectQuery === "string" && redirectQuery
        ? decodeURIComponent(redirectQuery)
        : "/home";
    router.replace(target);
  } catch (err: any) {
    console.error("登录失败:", err);
    ElMessage.error(err.message || "登录失败");
  }
};

// 注册方法
const handleRegister = async () => {
  // 验证表单
  if (!loginCardRef.value) return;

  try {
    await loginCardRef.value.validate();
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
  if (loginCardRef.value) {
    loginCardRef.value.resetFields();
  }
};
</script>

<template>
  <div class="login-container">
    <div class="background-left"></div>
    <div class="background-right"></div>
    <LoginCard
      ref="loginCardRef"
      v-model="loginForm"
      :rules="rules"
      @login="handleLogin"
      @register="handleRegister"
      @reset="resetForm"
    />
  </div>
</template>

<style lang="scss" scoped>
.login-container {
  @apply min-h-screen flex items-center justify-center p-4 relative overflow-hidden;

  // 左侧背景 - 使用卡片右侧的米黄色调
  .background-left {
    position: absolute;
    top: 0;
    left: 0;
    width: 50%;
    height: 100%;
    background: linear-gradient(
      135deg,
      rgb(240, 235, 200) 0%,
      rgb(240, 235, 210) 25%,
      rgb(250, 248, 230) 50%,
      rgb(250, 248, 230) 75%,
      rgb(254, 255, 244) 100%
    );
    z-index: 0;

    // 添加装饰纹理
    &::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image:
        radial-gradient(
          circle at 30% 70%,
          rgba(180, 142, 95, 0.03) 0%,
          transparent 50%
        ),
        radial-gradient(
          circle at 70% 30%,
          rgba(160, 120, 70, 0.02) 0%,
          transparent 50%
        );
      pointer-events: none;
    }
  }

  // 右侧背景 - 使用卡片左侧的渐变色调
  .background-right {
    position: absolute;
    top: 0;
    right: 0;
    width: 50%;
    height: 100%;
    background: linear-gradient(
      135deg,
      rgb(254, 255, 244) 0%,
      rgb(250, 248, 230) 50%,
      rgb(245, 242, 215) 100%
    );
    z-index: 0;

    // 添加装饰纹理
    &::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image:
        radial-gradient(
          circle at 70% 80%,
          rgba(180, 142, 95, 0.03) 0%,
          transparent 50%
        ),
        radial-gradient(
          circle at 30% 20%,
          rgba(160, 120, 70, 0.03) 0%,
          transparent 50%
        ),
        radial-gradient(
          circle at 60% 40%,
          rgba(200, 170, 120, 0.02) 0%,
          transparent 50%
        );
      pointer-events: none;
    }
  }

  // 确保登录卡片在背景之上
  > * {
    position: relative;
    z-index: 10;
  }
}
</style>
