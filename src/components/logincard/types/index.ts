import type { LoginForm } from "@/views/login/types";
import type { FormRules } from "element-plus";

/**
 * 登录卡片组件的 Props
 */
export interface Props {
  /** 表单数据，使用 v-model 双向绑定 */
  modelValue: LoginForm;
  /** 表单验证规则 */
  rules?: FormRules;
}

/**
 * 登录卡片组件的 Emits 事件定义
 */
export interface Emits {
  /** 登录事件 */
  login: [];
  /** 注册事件 */
  register: [];
  /** 更新表单数据事件（用于 v-model） */
  "update:modelValue": [value: LoginForm];
  /** 重置表单事件 */
  reset: [];
}

/**
 * 登录卡片组件暴露的方法
 */
export interface LoginCardExpose {
  /** 验证表单 */
  validate: () => Promise<void>;
  /** 重置表单字段 */
  resetFields: () => void;
}
