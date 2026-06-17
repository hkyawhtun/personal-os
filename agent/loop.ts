/* ============================================================
   The agent loop — we own this.

   gather → act → verify, on our terms: we send the conversation +
   tool specs to Ollama (the model backend), execute whatever tools the
   model calls, feed the results back, and repeat until the model stops
   calling tools or we hit maxSteps. Permissions/logging hook in here.
   ============================================================ */
import { tools, toolsByName } from "./tools.ts";

const OLLAMA_URL = process.env.POS_OLLAMA_URL || "http://localhost:11434";
const MODEL = process.env.POS_AGENT_MODEL || process.env.POS_OLLAMA_MODEL || "gemma4:e4b";

const toolSpecs = tools.map((t) => ({
  type: "function",
  function: { name: t.name, description: t.description, parameters: t.parameters },
}));

interface ToolCall {
  function: { name: string; arguments: Record<string, unknown> };
}
interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_calls?: ToolCall[];
  tool_name?: string;
}

export interface AgentStep {
  tool: string;
  args: Record<string, unknown>;
  output: string;
}
export interface AgentResult {
  final: string;
  steps: AgentStep[];
}

const SYSTEM = (today: string): string =>
  `You operate the user's Personal OS (tasks).
Today is ${today}. Use the provided tools to fulfil the user's request — call
tools to look things up and to make changes; never answer about tasks from
memory.

Tool selection:
- Questions about tasks ("what do I have to do", "what's on my plate", "my
  tasks", "anything due") → call list_tasks. It returns ALL open tasks.
- To complete or delete a task you may pass its title; call list_tasks first if
  you need the exact item.

When done, reply with a short, plain confirmation. Do not invent tasks that the
tools didn't return.`;

async function chat(messages: ChatMessage[]): Promise<ChatMessage> {
  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, stream: false, tools: toolSpecs, messages, options: { temperature: 0.2 } }),
  });
  if (!res.ok) throw new Error(`ollama ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { message: ChatMessage };
  return data.message;
}

export interface RunOptions {
  maxSteps?: number;
  onStep?: (step: AgentStep) => void;
  today?: Date;
  /** Prior turns in this thread, for multi-turn memory. */
  history?: { role: "user" | "assistant"; content: string }[];
}

export async function runAgent(goal: string, opts: RunOptions = {}): Promise<AgentResult> {
  const { maxSteps = 8, onStep, today = new Date(), history = [] } = opts;
  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM(today.toISOString().slice(0, 10)) },
    ...history.map((h) => ({ role: h.role, content: h.content })),
    { role: "user", content: goal },
  ];
  const steps: AgentStep[] = [];

  for (let i = 0; i < maxSteps; i++) {
    const msg = await chat(messages);
    messages.push(msg);

    const calls = msg.tool_calls ?? [];
    if (calls.length === 0) {
      return { final: msg.content || "(done)", steps };
    }

    for (const call of calls) {
      const tool = toolsByName.get(call.function.name);
      const args = call.function.arguments || {};
      let output: string;
      if (!tool) output = `error: unknown tool "${call.function.name}"`;
      else {
        try {
          output = await tool.execute(args);
        } catch (err) {
          output = `error: ${err instanceof Error ? err.message : String(err)}`;
        }
      }
      const step: AgentStep = { tool: call.function.name, args, output };
      steps.push(step);
      onStep?.(step);
      messages.push({ role: "tool", content: output, tool_name: call.function.name });
    }
  }

  return { final: "(stopped: reached max steps)", steps };
}
