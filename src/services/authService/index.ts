import { ApiService } from "@/services";
import type { LoginRequest, RegisterRequest } from "@/types/api/auth";

//认证相关API服务
export class authService {
  static async login(loginData: LoginRequest): Promise<any> {
    return await ApiService.post<LoginRequest>("auth/login", loginData);
  }

  static async register(registerData: RegisterRequest): Promise<any> {
    return await ApiService.post<RegisterRequest>(
      "auth/register",
      registerData,
    );
  }
}
