<template>
  <el-form :model="form" label-width="auto" style="width: 600px">
    <el-form-item label="Agent名称">
      <el-input v-model="form.name" placeholder="前端工程师" />
    </el-form-item>
    <el-form-item label="模型选择">
      <el-select v-model="form.region" placeholder="选择大模型">
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
      <el-input v-model="form.desc" type="textarea" />
    </el-form-item>
    <el-form-item label="Agent描述">
      <el-input v-model="form.desc" type="textarea" />
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="onSubmit">Create</el-button>
      <el-button>Cancel</el-button>
    </el-form-item>
  </el-form>
</template>

<script lang="ts" setup>
import { reactive } from "vue";

const form = reactive({
  name: "",
  region: "",
  temperature: 1,
  delivery: false,
  type: [],
  resource: "",
  desc: "",
});

const formatTooltip = (val: number) => {
  return val / 100;
};

const onSubmit = () => {
  console.log("submit!");
};
</script>
