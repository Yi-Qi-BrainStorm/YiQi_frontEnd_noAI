import { defineStore } from "pinia";
import { ref } from "vue";
import { authService } from "@/services";
import type { LoginRequest, RegisterRequest, User } from "@/types/api/auth";

//认证状态管理
export const useAuthStore = defineStore("auth", () => {
  //状态
  const user = ref<User | null>(null);
  const token = ref<string | null>(localStorage.getItem("auth_token"));
  //const loading = ref<boolean>(false);
  //const error = ref<string | null>(null);

  //计算属性
  //const isAuthenticated = computed(() => token.value&&user.value);
  //const isLoading = computed(()=>loading.value);

  //用户登录
  const login = async (loginData: LoginRequest): Promise<any> => {
    try {
      const response = await authService.login(loginData);
      user.value = response.user;
      token.value = response.token;

      //持久化保存token
      localStorage.setItem("auth_token", token.value as string);

      return response;
    } catch (error) {
      // 清除本地存储的token
      localStorage.removeItem("auth_token");
      token.value = null;
      user.value = null;
      throw error;
    }
  };

  const register = async (registerData: RegisterRequest): Promise<any> => {
    const response = await authService.register(registerData);

    //Notification
    return response;
  };

  return {
    // 状态
    user,
    token,
    //loading,
    //error,

    // 计算属性
    //isAuthenticated,
    //isLoading,

    // 方法
    login,
    register,
    //logout,
    //checkAuth,
    //refreshToken,
    //clearError,
    //clearAuth,
    //initialize,
  };
});
