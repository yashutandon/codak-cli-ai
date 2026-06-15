# Codak

**Your codebase-aware autonomous software engineer.**

Codak is not a chat interface. It is an engineer — one that understands your project, remembers how you work, writes production-ready code, and fixes its own mistakes. It lives in your terminal, works on any project, and gets smarter the longer you use it.

---

## 🧠 Project Memory

Codak remembers your project across every session.

Most AI tools forget everything the moment you close the tab. Codak doesn't. It builds and maintains a persistent memory of your project — package manager, framework, conventions, decisions — stored in Redis and injected into every conversation automatically.

You never have to say "this is a Bun project" or "we use Zod for validation" twice.

```
Session 1: "This project uses Bun and Prisma"
Session 2: Codak already knows. No re-explaining needed.
```

---

## 🔍 Code Intelligence (RAG)

Codak reads your codebase before it responds.

When you ask Codak to do something, it doesn't guess. It first retrieves the most relevant parts of your codebase using vector similarity search — then grounds its response in what's actually there.

- Files are chunked (150-line segments, 20-line overlap) and embedded using Google's `gemini-embedding-001` (3072-dim vectors)
- Every message triggers a cosine similarity search via `pgvector` — top-5 most relevant chunks are injected into context
- Every file Codak edits is automatically re-indexed — context is always fresh, never stale

The result: Codak writes code that matches your patterns, imports from your actual modules, and uses your existing utilities — not generic boilerplate.

---

## 🔁 Self-Healing Workflows

Codak doesn't stop at "here's the code." It verifies it works.

After every change, Codak runs your build and tests. If something breaks, it reads the error, finds the root cause, fixes the specific file, and retries — up to 3 times, automatically.

```
Write code
   ↓
Run build
   ↓
Error? → Read stderr → Fix root cause → Retry
   ↓
Success → Report done
```

It detects your package manager automatically (`bun`, `pnpm`, `yarn`, `npm`) from lockfiles and uses the right commands throughout.

---

## 🤝 Multi-Agent Execution

Simple tasks go straight to execution. Complex tasks get broken down.

Codak's Orchestrator analyzes incoming requests and decides how to handle them:

- **Simple** — a single tool-calling agent handles it end to end, streamed live
- **Complex** — broken into sub-tasks, each handled by a specialized Coding agent, then reviewed by a Review agent that checks for bugs, type errors, and security issues before the result is returned

There's also a dedicated **PLAN mode** — Codak analyzes your request and returns a structured plan (Goal, Steps, Dependencies, Risks) with zero file changes. Review it, then switch to BUILD mode to execute.

```
@plan  →  structured analysis, no changes
@build →  full execution with tools
```

---

## 🛡️ Safe by Default

Every action Codak takes passes through a safety layer before execution.

- **Firewall** — `rm -rf`, `sudo`, disk formatting, path traversal, and shutdown commands are blocked unconditionally
- **Scoped access** — all file operations resolve relative to your project directory. Codak cannot touch anything outside it
- **Docker sandbox** — shell commands optionally run inside an isolated container (`--network=none`, `--memory=512m`) that is destroyed after each message
- **Audit log** — every tool call (arguments, result, duration, errors) is persisted to Postgres for full observability

---

## ⚡ Everything else

- **Surgical edits** — `edit_file` replaces an exact string, not the whole file
- **Full git workflow** — status, diff, commit, branch, log, checkout — all via native tool calls
- **Multi-provider models** — Anthropic, OpenAI, Google Gemini, Groq — switch with `@models`
- **React terminal UI** — built with `@opentui/react`, full keyboard navigation, live streaming
- **Browser-callback OAuth** — GitHub + Google auth without storing credentials in the CLI

---

## 🏗️ Architecture

```
codak-cli-ai/
├── packages/
│   ├── cli/        # Terminal UI — @opentui/react
│   ├── server/     # Express API — agent orchestration, tools, RAG
│   ├── web/        # Next.js — auth page (browser callback)
│   ├── database/   # Prisma + Neon Postgres + pgvector
│   └── shared/     # Types, tool definitions, model registry
```

| Layer | Technology |
|-------|------------|
| Runtime | Bun |
| CLI UI | React + `@opentui/react` |
| API | Express, Server-Sent Events |
| AI | Vercel AI SDK — Anthropic, OpenAI, Google, Groq |
| Database | PostgreSQL (Neon) + pgvector, Prisma ORM |
| RAG | `gemini-embedding-001` (3072-dim), pgvector cosine search |
| Memory / Cache | Redis — project memory (7-day TTL) + session cache (5-min TTL) |
| Sandbox | Docker — network-disabled, resource-limited, per-message |
| Auth | JWT + bcrypt, browser-callback OAuth (GitHub / Google) |

---

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh) 1.3+
- PostgreSQL with [pgvector](https://github.com/pgvector/pgvector) — [Neon](https://neon.tech) free tier works
- Redis — [Upstash](https://upstash.com) free tier works
- At least one LLM provider API key
- (Optional) Docker for sandboxed command execution

### Install

```bash
git clone https://github.com/yashutandon/codak-cli-ai.git
cd codak-cli-ai
bun install
```

### Environment variables

**`packages/server/.env`**
```env
DATABASE_URL=postgresql://<user>:<password>@<host>/<db>?sslmode=require
JWT_SECRET=<a-long-random-secret>
JWT_EXPIRES_IN=7d
REDIS_URL=rediss://<user>:<password>@<host>:6380

OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_GENERATIVE_AI_API_KEY=AIza...
GROQ_API_KEY=gsk_...

PORT=3001
```

**`packages/cli/.env`**
```env
CODAK_WEB_URL=http://localhost:3000
CODAK_API_URL=http://localhost:3001
```

**`packages/web/.env.local`**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Database

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

```bash
cd packages/database
bunx prisma generate
bunx prisma db push
```

### Run

```bash
bun run dev:server   # API on :3001
bun run dev:web      # Auth page on :3000
bun run dev:cli      # Terminal UI
```

On first run, the CLI opens your browser for authentication. Once signed in, you're in.

---

## ⌨️ Commands

| Command | Description |
|---------|-------------|
| `@new` | Start a new session |
| `@open` | Browse and resume an existing session |
| `@close` | Return to home |
| `@build` / `@plan` | Switch agent mode (or press `Tab`) |
| `@models` | Switch the active model |
| `@setpath` | Set the project directory for this session |
| `@theme` | Change color theme |
| `@logout` | Sign out |
| `@help` | List all commands |
| `@exit` | Quit |

---

## 🗺️ Roadmap

- [ ] `codak.md` — project-level rules the agent loads automatically
- [ ] Ollama support — local models, no API key required
- [ ] VS Code extension
- [ ] `npm install -g codak-cli` distribution
- [ ] Model-per-agent configuration

---

## 📄 License

MIT