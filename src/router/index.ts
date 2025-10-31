import { createRouter, createWebHistory } from "vue-router";
import { routes } from "./routes";
import { useAuth } from "@/composables";

// 2. 创建路由实例
const router = createRouter({
  // 使用 HTML5 History 模式 (推荐，地址栏无 #)
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  // 滚动行为：切换路由后回到顶部
  scrollBehavior: () => ({ top: 0 }),
});

router.beforeEach(async (to, _, next) => {
  // 延迟获取，避免在 Pinia 激活前访问 store
  const { check } = useAuth();
  const token = localStorage.getItem("auth_token");
  const requiresAuth = to.meta.requiresAuth as boolean | undefined;

  if (requiresAuth) {
    if (!token) {
      const redirect = encodeURIComponent(to.fullPath);
      return next({ path: "/login", query: { redirect } });
    }
    return next();
  }

  // 非受保护路由（如登录页）且已持有 token
  if (to.path === "/login" && token) {
    try {
      await check();
      const target = (to.query.redirect as string) || "/about";
      return next(target);
    } catch (error) {
      localStorage.removeItem("auth_token");
      return next();
    }
  }

  return next();
});

// 3. 导出路由实例
export default router;
