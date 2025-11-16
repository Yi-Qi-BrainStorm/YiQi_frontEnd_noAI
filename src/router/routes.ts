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
    path: "/home",
    name: "Home",
    meta: { requiresAuth: true },
    component: () => import("@/views/home/index.vue"),
    children: [
      {
        path: "brainstorm",
        component: () => import("@/views/brainstorm/index.vue"),
      },
      {
        path: "agent-settings",
        component: () => import("@/views/agentSettings/index.vue"),
        children: [
          {
            path: "agent-settings",
            component: () =>
              import("@/views/agentSettings/components/agentSetting.vue"),
          },
          {
            path: "role-management",
            component: () =>
              import("@/views/agentSettings/components/roleManagement.vue"),
          },
        ],
      },
      { path: "history", component: () => import("@/views/history/index.vue") },
    ],
  },
];
