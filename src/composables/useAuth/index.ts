import { computed } from "vue";
//import { useRouter } from 'vue-router';
import { useAuthStore } from "@/stores/auth";
import type {
  //User,
  LoginRequest,
  RegisterRequest,
} from "@/types/api/auth.ts";

export function useAuth() {
  const authStore = useAuthStore();
  //const router = useRouter();

  //响应式状态
  const user = computed(() => authStore.user);
  const token = computed(() => authStore.token);

  //用户登录
  const login = async (loginData: LoginRequest): Promise<any> => {
    const response = await authStore.login(loginData);
    return response;
  };

  //用户注册
  const register = async (registerData: RegisterRequest): Promise<any> => {
    const response = await authStore.register(registerData);
    return response;
  };

  //检测token是否过期
  const check = async (): Promise<any> => {
    const response = await authStore.check();
    return response;
  };

  return {
    // 响应式状态
    user,
    token,
    // loading,
    // error,
    // isAuthenticated,
    // isLoading,

    // 认证操作
    login,
    register,
    check,
    // logout,
    // refreshToken,
    // clearError,
    // initialize,

    // 路由守卫辅助函数
    // requireAuth,
    // requireGuest,
  };
}
