import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
} from "vue-router";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "Home",
    component: () => import("@/views/home/index.vue"),
  },
  {
    path: "/about",
    name: "About",
    component: () => import("@/views/about/index.vue"),
  },
];

// 2. 创建路由实例
const router = createRouter({
  // 使用 HTML5 History 模式 (推荐，地址栏无 #)
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  // 滚动行为：切换路由后回到顶部
  scrollBehavior: () => ({ top: 0 }),
});

// 3. 导出路由实例
export default router;
