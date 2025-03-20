export type Model = {
  name: string;
  model: string;
  modified_at: number;
  size: number;
};

export type ChatResponse = {
  model: string;
  created_at: string;
  message: {
    role: "assistant";
    content: string;
  };
  done_reason: "stop";
  done: boolean;
  total_duration: number;
  load_duration: number;
  prompt_eval_count: number;
  prompt_eval_duration: number;
  eval_count: number;
  eval_duration: number;
};
