import { defineStore } from "pinia";
import { ref } from "vue";
import { authService } from "@/services/authService";
import type { LoginRequest, RegisterRequest, User } from "@/types/api/auth";
import { CacheWorkerManager } from "@/composables/useWorker/cacheWorkerManager";
import { UserCacheService } from "@/services/userCacheService";

//认证状态管理
export const useAuthStore = defineStore(
  "auth",
  () => {
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

        // 立即缓存用户信息，以便离线时使用
        if (response.user?.id) {
          try {
            // 使用单例模式，确保使用同一个 Worker 实例
            const cacheWorkerManager = CacheWorkerManager.getInstance();
            const userCacheService = new UserCacheService(cacheWorkerManager);
            await userCacheService.cacheUserInfo(response.user.id, {
              ...response.user,
              lastUpdated: Date.now(),
            });
          } catch (cacheErr) {
            console.warn("登录后缓存用户信息失败:", cacheErr);
            // 缓存失败不影响登录流程
          }
        }

        return response;
      } catch (error) {
        // 清除本地存储的token
        localStorage.removeItem("auth_token");
        token.value = null;
        user.value = null;
        throw error;
      }
    };

    //用户注册
    const register = async (registerData: RegisterRequest): Promise<any> => {
      const response = await authService.register(registerData);

      //Notification
      return response;
    };

    //检测token是否过期
    const check = async (): Promise<any> => {
      const response = await authService.check();
      if (response) {
        // 如果后端返回了用户信息，更新 user
        if (response.user) {
          user.value = response.user;
        }
        return response;
      }
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
      check,
      //logout,
      //refreshToken,
      //clearError,
      //clearAuth,
      //initialize,
    };
  },
  {
    // 持久化配置
    persist: {
      key: "yiqi_auth",
      storage: localStorage,
    },
  },
);
