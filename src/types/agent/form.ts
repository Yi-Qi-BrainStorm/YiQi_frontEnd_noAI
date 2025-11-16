// types/agent/form.ts
export interface AgentFormData {
  name: string;
  description: string;
  systemPrompt: string;
  model: string;
  temperature: number;
}

export interface AgentFormRule {
  [key: string]: Array<{
    required?: boolean;
    message: string;
    trigger?: string;
    min?: number;
    max?: number;
  }>;
}
