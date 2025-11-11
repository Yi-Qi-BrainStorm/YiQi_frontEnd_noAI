//用户API类型
export interface User {
  id: string;
  username: string;
  email?: string;
  role?: string;
  avatar?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
}

export interface ProfileResponse {
  message: string;
  user: User;
}
