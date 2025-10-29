import axios from "axios";

//基础API配置
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
export const API_VERSION = "v1";
export const API_TIMEOUT = 30000;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
});

//请求拦截器
api.interceptors.request.use();
//响应拦截器
api.interceptors.response.use();

export class ApiService {
  //get
  static async get<T = any>(url: string, config?: any): Promise<T> {
    const response = await api.get<T>(url, config);
    return response.data;
  }

  //post
  static async post<T = any>(
    url: string,
    data?: any,
    config?: any,
  ): Promise<T> {
    const response = await api.post<T>(url, data, config);
    return response.data;
  }
  //批量请求
  static async batch<T = any>(
    requests: Array<() => Promise<any>>,
  ): Promise<T[]> {
    const results = await Promise.allSettled(requests.map((req) => req()));
    return results.map((result, index) => {
      if (result.status === "fulfilled") {
        return result.value;
      } else {
        console.error(`批量请求第${index + 1}个失败:`, result.reason);
        throw result.reason;
      }
    });
  }

  //重试请求
  static async retry<T = any>(
    requestFn: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000,
  ): Promise<T> {
    let lastError;

    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error;

        // 如果是最后一次重试，抛出错误
        if (i === maxRetries) {
          throw lastError;
        }

        // 等待后重试
        await new Promise((resolve) =>
          setTimeout(resolve, delay * Math.pow(2, i)),
        );
      }
    }
    throw lastError;
  }
}
