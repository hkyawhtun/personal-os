/* ============================================================
   Personal OS — HTTP API
   Thin Express layer over the shared core (../../core/db.ts).
   The web app talks to this; the CLI talks to the same DB directly.
   ============================================================ */
import express from "express";
import type { Request, Response, NextFunction } from "express";
import cors from "cors";
import { pinoHttp } from "pino-http";
import { logger } from "./logger.ts";
import {
  listTasks, addTask, toggleTask, setTaskDone, deleteTask,
  seedIfEmpty,
  listChats, createChat, getChat, deleteChat, listMessages, addMessage,
  onChange, withSource,
} from "../../core/db.ts";
import { runAgent } from "../../agent/loop.ts";

seedIfEmpty();

const app = express();
app.use(cors());
app.use(express.json());
// concise request logging: method, url, status, response time (level by status)
app.use(
  pinoHttp({
    logger,
    customLogLevel: (_req, res, err) => (err || res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info"),
    customSuccessMessage: (req, res) => `${req.method} ${req.url} ${res.statusCode}`,
    customErrorMessage: (req, res) => `${req.method} ${req.url} ${res.statusCode}`,
    serializers: {
      req: (req) => ({ method: req.method, url: req.url }),
      res: (res) => ({ status: res.statusCode }),
    },
  }),
);

const ok = (res: Response, data: unknown): Response => res.json({ ok: true, data });
const fail = (res: Response, code: number, msg: string): Response => res.status(code).json({ ok: false, error: msg });

app.get("/api/health", (_req: Request, res: Response) => ok(res, { status: "up" }));

/* ---- tasks ---- */
app.get("/api/tasks", (req: Request, res: Response) => ok(res, listTasks(req.query.list as string | undefined)));
app.post("/api/tasks", (req: Request, res: Response) => {
  const { title } = req.body || {};
  if (!title) return fail(res, 400, "title required");
  return ok(res, addTask(req.body));
});
app.patch("/api/tasks/:id", (req: Request, res: Response) => {
  const { done } = req.body || {};
  const t = done === undefined ? toggleTask(req.params.id) : setTaskDone(req.params.id, done);
  return t ? ok(res, t) : fail(res, 404, "not found");
});
app.delete("/api/tasks/:id", (req: Request, res: Response) => {
  return deleteTask(req.params.id) ? ok(res, { id: req.params.id }) : fail(res, 404, "not found");
});

/* ---- agent ---- */
app.post("/api/agent", async (req: Request, res: Response) => {
  const goal = (req.body || {}).goal;
  if (!goal || typeof goal !== "string") return fail(res, 400, "goal required");
  logger.info({ goal }, "agent run started");
  const startedAt = performance.now();
  try {
    // observe every tool the loop runs; tag changes as agent-sourced
    const result = await withSource("agent", () =>
      runAgent(goal, { onStep: (s) => logger.debug({ tool: s.tool, args: s.args }, "agent tool call") }),
    );
    logger.info({ steps: result.steps.length, durationMs: Math.round(performance.now() - startedAt) }, "agent run finished");
    return ok(res, result);
  } catch (err) {
    logger.error({ err, goal }, "agent run failed");
    return fail(res, 500, err instanceof Error ? err.message : String(err));
  }
});

/* ---- chats (assistant threads) ---- */
app.get("/api/chats", (_req: Request, res: Response) => ok(res, listChats()));
app.post("/api/chats", (req: Request, res: Response) => ok(res, createChat((req.body || {}).title)));
app.get("/api/chats/:id/messages", (req: Request, res: Response) => {
  return getChat(req.params.id) ? ok(res, listMessages(req.params.id)) : fail(res, 404, "chat not found");
});
app.delete("/api/chats/:id", (req: Request, res: Response) => {
  return deleteChat(req.params.id) ? ok(res, { id: req.params.id }) : fail(res, 404, "chat not found");
});
app.post("/api/chats/:id/messages", async (req: Request, res: Response) => {
  const chat = getChat(req.params.id);
  if (!chat) return fail(res, 404, "chat not found");
  const content = (req.body || {}).content;
  if (!content || typeof content !== "string") return fail(res, 400, "content required");

  const history = listMessages(chat.id).map((m) => ({ role: m.role, content: m.content })); // prior turns
  const userMsg = addMessage(chat.id, { role: "user", content });
  logger.info({ chatId: chat.id, turns: history.length }, "chat message");
  try {
    const result = await withSource("agent", () =>
      runAgent(content, { history, onStep: (s) => logger.debug({ tool: s.tool }, "chat tool call") }),
    );
    const assistant = addMessage(chat.id, { role: "assistant", content: result.final, steps: result.steps });
    return ok(res, { user: userMsg, assistant });
  } catch (err) {
    logger.error({ err, chatId: chat.id }, "chat agent failed");
    const assistant = addMessage(chat.id, { role: "assistant", content: "Sorry — something went wrong answering that." });
    return ok(res, { user: userMsg, assistant });
  }
});

/* ---- live updates (SSE) ---- */
app.get("/api/events", (req: Request, res: Response) => {
  res.set({ "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" });
  res.flushHeaders?.();
  res.write(": connected\n\n");
  const unsub = onChange((e) => res.write(`data: ${JSON.stringify(e)}\n\n`));
  const ping = setInterval(() => res.write(": ping\n\n"), 25000);
  req.on("close", () => {
    clearInterval(ping);
    unsub();
  });
});

/* ---- error handler (last) ---- */
app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  req.log?.error({ err }, "unhandled error");
  if (!res.headersSent) fail(res, 500, err instanceof Error ? err.message : "internal error");
});

const PORT = Number(process.env.PORT) || 4000;
app.listen(PORT, () => logger.info({ port: PORT, url: `http://localhost:${PORT}` }, "Personal OS API listening"));
