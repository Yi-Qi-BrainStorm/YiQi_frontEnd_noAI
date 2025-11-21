<template>
  <div class="agentForm">
    <el-form
      :model="form"
      :rules="rules"
      ref="formRef"
      label-width="auto"
      class="el-form"
    >
      <h1 class="form-title">{{ isEditMode ? "编辑 Agent" : "创建 Agent" }}</h1>
      <el-form-item label="Agent名称" prop="name">
        <el-input v-model="form.name" placeholder="前端工程师" />
      </el-form-item>
      <el-form-item label="模型选择" prop="model">
        <el-select v-model="form.model" placeholder="选择大模型">
          <el-option
            v-for="option in modelOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="temperature" prop="temperature">
        <el-slider v-model="form.temperature" :format-tooltip="formatTooltip" />
      </el-form-item>
      <el-form-item label="系统提示词" prop="systemPrompt">
        <el-input
          v-model="form.systemPrompt"
          type="textarea"
          :rows="4"
          placeholder="agent是什么职业，有什么性格，专精哪一方面知识"
        />
      </el-form-item>
      <el-form-item label="Agent描述" prop="description">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="3"
          placeholder="便于你区分记忆agent"
        />
      </el-form-item>
      <el-form-item class="el-button-container">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="onSubmit" :loading="submitting">
          {{ isEditMode ? "保存" : "创建" }}
        </el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref, onMounted, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { ElMessage, type FormInstance, type FormRules } from "element-plus";
import { useAgentStore } from "@/stores/agent/index.ts";
import type { AgentFormData } from "@/types/agent/form";
import { getModelOptions } from "@/constants/model";

const router = useRouter();
const route = useRoute();
const agentStore = useAgentStore();

const formRef = ref<FormInstance>();
const submitting = ref(false);
const editingAgentId = ref<string | null>(null);

const modelOptions = getModelOptions();

// 表单数据
const form = reactive<AgentFormData>({
  name: "",
  description: "",
  systemPrompt: "",
  model: "",
  temperature: 70,
});

// 表单验证规则
const rules: FormRules = {
  name: [
    { required: true, message: "请输入 Agent 名称", trigger: "blur" },
    { min: 2, max: 50, message: "长度在 2 到 50 个字符", trigger: "blur" },
  ],
  model: [{ required: true, message: "请选择模型", trigger: "change" }],
  systemPrompt: [
    { required: true, message: "请输入系统提示词", trigger: "blur" },
    { min: 10, message: "系统提示词至少 10 个字符", trigger: "blur" },
  ],
};

// 是否为编辑模式
const isEditMode = computed(() => !!editingAgentId.value);

// 格式化 tooltip
const formatTooltip = (val: number) => {
  return val / 50;
};

// 加载编辑数据
const loadEditData = () => {
  const agentId = route.query.id as string;
  if (agentId) {
    editingAgentId.value = agentId;
    const agent = agentStore.getAgentById(agentId);
    if (agent) {
      form.name = agent.name;
      form.description = agent.description;
      form.systemPrompt = agent.systemPrompt;
      form.model = agent.model;
      form.temperature = agent.temperature * 50; // 转换回滑块值
    } else {
      ElMessage.error("未找到该 Agent");
      router.push("/home/agent-settings/role-management");
    }
  }
};

// 提交表单
const onSubmit = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
    submitting.value = true;

    // 转换 temperature 值
    const formData: AgentFormData = {
      ...form,
      temperature: form.temperature / 50,
    };

    if (isEditMode.value && editingAgentId.value) {
      // 编辑模式
      agentStore.updateAgent(editingAgentId.value, formData);
      ElMessage.success("更新成功");
    } else {
      // 创建模式
      agentStore.createAgent(formData);
      ElMessage.success("创建成功");
    }

    // 跳转到角色管理页面
    router.push("/home/agent-settings/role-management");
  } catch (error) {
    console.error("表单验证失败:", error);
  } finally {
    submitting.value = false;
  }
};

// 取消操作
const handleCancel = () => {
  router.push("/home/agent-settings/role-management");
};

onMounted(() => {
  loadEditData();
});
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
