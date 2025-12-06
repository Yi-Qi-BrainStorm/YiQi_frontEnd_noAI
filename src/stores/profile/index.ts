import { profileService } from "@/services/profileService";
import { defineStore } from "pinia";
import { ref } from "vue";
import { CacheWorkerManager } from "@/composables/useWorker/cacheWorkerManager";
import { UserCacheService } from "@/services/userCacheService";

//用户信息管理
import type { User } from "@/types/api/auth";

export const useProfileStore = defineStore("profile", () => {
  // 状态
  const user = ref<User | null>(null);
  const loading = ref<boolean>(false);
  const error = ref<string | null>(null);

  // 获取用户信息
  const fetchProfile = async (): Promise<void> => {
    try {
      loading.value = true;
      error.value = null;

      const response = await profileService.getProfile();
      user.value = response.user;

      // 自动缓存用户信息
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
          console.warn("缓存用户信息失败:", cacheErr);
          // 缓存失败不影响主流程
        }
      }
    } catch (err: any) {
      error.value = err.message || "获取用户信息失败";
      console.error("获取用户信息失败:", err);
    } finally {
      loading.value = false;
    }
  };

  // 刷新用户信息
  const refreshProfile = async (): Promise<void> => {
    await fetchProfile();
  };

  // 清除用户信息
  const clearProfile = (): void => {
    user.value = null;
    error.value = null;
    loading.value = false;
  };

  return {
    // 状态
    user,
    loading,
    error,

    // 方法
    fetchProfile,
    refreshProfile,
    clearProfile,
  };
});
