<template>
  <div class="agentForm">
    <el-form :model="form" label-width="auto" style="" class="el-form">
      <h1 class="form-title">创建Agent</h1>
      <el-form-item label="Agent名称">
        <el-input v-model="form.name" placeholder="前端工程师" />
      </el-form-item>
      <el-form-item label="模型选择">
        <el-select v-model="form.model" placeholder="选择大模型">
          <el-option
            v-for="option in modelOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="temperature">
        <el-slider v-model="form.temperature" :format-tooltip="formatTooltip" />
      </el-form-item>
      <el-form-item label="系统提示词">
        <el-input
          v-model="form.systemPrompt"
          type="textarea"
          placeholder="agent是什么职业，有什么性格，专精哪一方面知识"
        />
      </el-form-item>
      <el-form-item label="Agent描述">
        <el-input
          v-model="form.description"
          type="textarea"
          placeholder="便于你区分记忆agent"
        />
      </el-form-item>
      <el-form-item class="el-button-container">
        <el-button type="primary" @click="onSubmit">创建</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script lang="ts" setup>
import { reactive } from "vue";
import { useAgentStore } from "@/stores/agent/index.ts";
import type { AgentFormData } from "@/types/agent/form";
import { getModelOptions } from "@/constants/model";

const { createAgent } = useAgentStore();
const modelOptions = getModelOptions();

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

<style lang="scss" scoped>
.agentForm {
  @apply flex;
  .form-title {
    padding-bottom: 20px;
    display: flex;
    justify-content: center;
  }
  .el-form {
    width: 550px;
    .el-button-container {
      :deep(.el-form-item__content) {
        @apply flex justify-center;

        .el-button {
          @apply w-32; // 或者 w-40, w-48 等更宽的尺寸
        }
      }
    }
  }
}
</style>
