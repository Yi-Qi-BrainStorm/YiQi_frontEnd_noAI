import { ApiService } from "@/services";
import type { ProfileResponse } from "@/types/api/auth";

//认证相关API服务
export class profileService {
  static async getProfile(): Promise<any> {
    return await ApiService.get<ProfileResponse>("profile");
  }
}
