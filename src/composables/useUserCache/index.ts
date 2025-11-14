import { ref, watch } from "vue";
import { CacheWorkerManager } from "@/composables/useWorker/cacheWorkerManager";
import { useNetworkStatus } from "../useNetworkStatus";
import { UserCacheService } from "@/services/userCacheService";
import { profileService } from "@/services/profileService";
import type { User } from "@/types/api/auth";

export function useUserCache() {
  const userInfo = ref<(User & { isFromCache: boolean }) | null>(null);
  const isLoading = ref(false);
  const isFromCache = ref(false);
  const error = ref<string | null>(null);

  const { isOnline } = useNetworkStatus();
  // 使用单例模式，确保整个应用只有一个 Worker 实例
  const cacheWorkerManager = CacheWorkerManager.getInstance();
  const userCacheService = new UserCacheService(cacheWorkerManager);

  // 智能加载用户信息
  const loadUserInfo = async (userId: string) => {
    isLoading.value = true;
    error.value = null;
    isFromCache.value = false;

    try {
      let data;

      // 优先从缓存获取（无论在线还是离线）
      console.log(`[useUserCache] 尝试从缓存加载用户信息，userId: ${userId}`);
      const cachedData = await userCacheService.getCachedUserInfo(userId);
      console.log(
        `[useUserCache] 缓存读取结果:`,
        cachedData ? "有缓存" : "无缓存",
        cachedData,
      );

      if (cachedData) {
        // 有缓存：直接使用缓存数据
        data = cachedData;
        data.isFromCache = true;
        isFromCache.value = true;
        userInfo.value = data;
        console.log(`[useUserCache] 使用缓存数据成功`);
      } else if (isOnline.value) {
        // 在线且无缓存：从API获取
        try {
          console.log(`[useUserCache] 在线且无缓存，从API获取`);
          const profileResponse = await profileService.getProfile();
          data = profileResponse.user;

          if (data) {
            data.isFromCache = false;
            isFromCache.value = false;

            // 保存到缓存（包含userId）
            console.log(`[useUserCache] 保存到缓存，userId: ${userId}`);
            await userCacheService.cacheUserInfo(userId, {
              ...data,
              id: userId, // 确保缓存包含userId
              lastUpdated: Date.now(),
            });
            console.log(`[useUserCache] 缓存保存成功`);
            userInfo.value = data;
          } else {
            userInfo.value = null;
            error.value = "未获取到用户信息";
          }
        } catch (apiErr) {
          // API 请求失败，但可能已经有缓存数据了
          console.error(`[useUserCache] API请求失败:`, apiErr);
          if (!cachedData) {
            const errorMessage =
              apiErr instanceof Error ? apiErr.message : String(apiErr);
            error.value = errorMessage;
            userInfo.value = null;
          }
        }
      } else {
        // 离线且无缓存：显示友好提示
        console.warn(`[useUserCache] 离线且无缓存数据，userId: ${userId}`);
        userInfo.value = null;
        error.value = "离线状态且无缓存数据";
        isFromCache.value = false;
      }
    } catch (err) {
      console.error(`[useUserCache] loadUserInfo 异常:`, err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      error.value = errorMessage;
      userInfo.value = null;
      isFromCache.value = false;
    } finally {
      isLoading.value = false;
    }
  };

  // 更新用户信息（网络恢复时调用）
  const updateUserInfo = async (profileData: any) => {
    if (profileData?.id) {
      try {
        // 更新缓存
        await userCacheService.cacheUserInfo(profileData.id, {
          ...profileData,
          lastUpdated: Date.now(),
        });

        // 更新当前显示
        userInfo.value = {
          ...profileData,
          isFromCache: false,
        };

        isFromCache.value = false;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        error.value = errorMessage;
      }
    }
  };

  // 网络状态变化时重新加载
  watch(isOnline, (newStatus) => {
    if (newStatus && userInfo.value) {
      loadUserInfo(userInfo.value.id);
    }
  });

  return {
    userInfo,
    isLoading,
    error,
    isFromCache,
    isOnline,
    loadUserInfo,
    updateUserInfo,
  };
}
