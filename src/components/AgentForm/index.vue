<template>
  <el-form :model="form" label-width="auto" style="width: 600px">
    <el-form-item label="Agent名称">
      <el-input v-model="form.name" placeholder="前端工程师" />
    </el-form-item>
    <el-form-item label="模型选择">
      <el-select v-model="form.model" placeholder="选择大模型">
        <el-option label="deepseek" value="shanghai" />
        <el-option label="kimi" value="beijing" />
        <el-option label="Qwen" value="beijing" />
        <el-option label="GLM" value="beijing" />
      </el-select>
    </el-form-item>
    <el-form-item label="temperature">
      <el-slider v-model="form.temperature" :format-tooltip="formatTooltip" />
    </el-form-item>
    <el-form-item label="系统提示词">
      <el-input v-model="form.systemPrompt" type="textarea" />
    </el-form-item>
    <el-form-item label="Agent描述">
      <el-input v-model="form.description" type="textarea" />
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="onSubmit">Create</el-button>
      <el-button>Cancel</el-button>
    </el-form-item>
  </el-form>
</template>

<script lang="ts" setup>
import { reactive } from "vue";
import { useAgentStore } from "@/stores/agent/index.ts";
import type { AgentFormData } from "@/types/agent/form";

const { createAgent } = useAgentStore();

const form = reactive<AgentFormData>({
  name: "",
  description: "",
  systemPrompt: "",
  model: "",
  temperature: 70,
});

const formatTooltip = (val: number) => {
  return val / 50;
};

const onSubmit = () => {
  createAgent(form);
};
</script>
