import { markRaw } from "vue";
import { Document, Menu as IconMenu, Setting } from "@element-plus/icons-vue";

export const sidebarMenuConfigs = {
  brainstorm: [
    {
      index: "1",
      icon: markRaw(IconMenu),
      title: "头脑风暴",
      disabled: false,
    },
    {
      index: "2",
      icon: markRaw(IconMenu),
      title: "方案生成",
      disabled: false,
    },
    {
      index: "3",
      icon: markRaw(Document),
      title: "模板库",
      disabled: true,
    },
    {
      index: "4",
      icon: markRaw(Setting),
      title: "设置",
      disabled: false,
      isLower: true,
    },
  ],
  agentSettings: [
    {
      index: "1",
      icon: markRaw(Setting),
      title: "智能体设置",
      disabled: false,
    },
    {
      index: "2",
      icon: markRaw(IconMenu),
      title: "角色管理",
      disabled: false,
    },
    {
      index: "3",
      icon: markRaw(Document),
      title: "模板管理",
      disabled: false,
    },
    {
      index: "4",
      icon: markRaw(Setting),
      title: "系统设置",
      disabled: false,
      isLower: true,
    },
  ],
  history: [
    {
      index: "1",
      icon: markRaw(Document),
      title: "历史记录",
      disabled: false,
    },
    {
      index: "2",
      icon: markRaw(IconMenu),
      title: "收藏",
      disabled: false,
    },
    {
      index: "3",
      icon: markRaw(Document),
      title: "导出记录",
      disabled: false,
    },
    {
      index: "4",
      icon: markRaw(Setting),
      title: "设置",
      disabled: false,
      isLower: true,
    },
  ],
};
