import { createRouter, createWebHistory } from "vue-router";
import { routes } from "./routes";
import { useAuth } from "@/composables";

const { check } = useAuth();

// 2. 创建路由实例
const router = createRouter({
  // 使用 HTML5 History 模式 (推荐，地址栏无 #)
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  // 滚动行为：切换路由后回到顶部
  scrollBehavior: () => ({ top: 0 }),
});

router.beforeEach(async (to, _, next) => {
  const token = localStorage.getItem("auth_token");
  const requireAuth = to.meta.requireAuth;

  if (requireAuth && !token) {
    //需要认证但是没token，去登陆页
    next("/login");
  } else if (!requireAuth && token) {
    // 目标页面是登录页，但用户有 token，需要验证 token 是否有效
    try {
      // 尝试调用一个快速的后端验证接口，如 /api/auth/check
      await check();
      // 验证成功，安全地跳转到首页
      next("/about");
    } catch (error) {
      // 验证失败（如 401 错误），说明 token 已过期
      localStorage.removeItem("token"); // 清除无效 token
      next(); // 允许停留在登录页
    }
  }
});

// 3. 导出路由实例
export default router;
