import { CacheWorkerManager } from "@/composables/useWorker/cacheWorkerManager";
import type { User } from "@/types/api/auth.ts";

export class UserCacheService {
  constructor(private cacheWorker: CacheWorkerManager) {}

  // 缓存用户信息（24小时过期）
  async cacheUserInfo(userId: string, userInfo: User): Promise<boolean> {
    try {
      const cacheKey = `user-${userId}`;
      console.log(
        `[UserCacheService] 缓存用户信息，key: ${cacheKey}`,
        userInfo,
      );
      const result = await this.cacheWorker.set(cacheKey, userInfo, 86400);
      console.log(`[UserCacheService] 缓存保存结果:`, result);
      return result;
    } catch (error) {
      console.error("[UserCacheService] 缓存用户信息失败:", error);
      throw error;
    }
  }

  // 获取用户信息
  async getCachedUserInfo(userId: string): Promise<any | null> {
    try {
      const cacheKey = `user-${userId}`;
      console.log(`[UserCacheService] 获取缓存，key: ${cacheKey}`);
      const cached = await this.cacheWorker.get(cacheKey);
      console.log(`[UserCacheService] 缓存获取结果:`, cached);
      if (cached) {
        return {
          ...cached,
          isFromCache: true,
        };
      }
      return null;
    } catch (error) {
      console.error("[UserCacheService] 获取缓存用户信息失败:", error);
      return null;
    }
  }

  // 检查用户信息是否存在
  async userInfoExists(userId: string): Promise<boolean> {
    try {
      return await this.cacheWorker.exists(`user-${userId}`);
    } catch (error) {
      console.error("检查用户缓存失败:", error);
      return false;
    }
  }
}
