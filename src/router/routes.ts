import type { RouteRecordRaw } from "vue-router";

export const routes: RouteRecordRaw[] = [
  {
    path: "/",
    redirect: "/login",
  },
  {
    path: "/login",
    name: "Login",
    meta: { requiresAuth: false },
    component: () => import("@/views/login/index.vue"),
  },
  {
    path: "/about",
    name: "About",
    meta: { requiresAuth: true },
    component: () => import("@/views/about/index.vue"),
  },
];
