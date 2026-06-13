# Codak

**An autonomous AI coding agent that lives in your terminal.**

Codak reads your codebase, writes and edits files, runs commands, manages git, and fixes its own build errors — all from a chat interface in your CLI. Think of it as a self-hosted, open alternative to Claude Code, with multi-provider model support and a Planner/Builder workflow.

---

## ✨ Features

- **Agentic file operations** — read, write, edit (surgical diffs), delete, search files and directories
- **Shell execution** — runs commands with a safety firewall and optional Docker sandboxing
- **Git native** — status, diff, commit, branch, log, checkout — all via tool calls
- **RAG over your codebase** — automatic indexing with pgvector + Google embeddings, incremental re-indexing on every file change
- **Build → Test → Fix loop** — after every code change, the agent verifies the build and self-corrects (up to 3 iterations)
- **PLAN vs BUILD modes** — toggle with `Tab` or `@plan` / `@build`. PLAN mode produces a structured plan with no file changes; BUILD mode executes
- **Multi-agent orchestration** — complex requests are broken down by an Orchestrator into Coding + Review sub-agent tasks
- **Multi-provider models** — switch between Anthropic, OpenAI, Google, and Groq with `@models`
- **Project memory** — package manager, framework, and conventions are remembered across sessions via Redis
- **Auth** — JWT-based auth with browser-callback OAuth flow (GitHub / Google)
- **Tool execution logs** — every tool call is logged with args, result, duration, and errors for full observability

---

## 🏗️ Architecture

Codak is a Bun monorepo:

```
codak-cli-ai/
├── packages/
│   ├── cli/        # Terminal UI — @opentui/react
│   ├── server/     # Express API — agent orchestration, tools, RAG
│   ├── web/        # Next.js — auth/login page (browser callback)
│   ├── database/   # Prisma schema + client (Neon Postgres + pgvector)
│   └── shared/     # Shared types, tool definitions, model registry
```

### Tech stack

| Layer        | Technology                                              |
|--------------|----------------------------------------------------------|
| Runtime      | Bun                                                       |
| CLI UI       | React + `@opentui/react` (terminal renderer)              |
| API          | Express, Server-Sent Events for streaming                |
| AI           | Vercel AI SDK — Anthropic, OpenAI, Google, Groq           |
| Database     | PostgreSQL (Neon) + pgvector, Prisma ORM                  |
| RAG / Embeddings | Google `gemini-embedding-001` (3072-dim), pgvector cosine similarity search, chunked file indexing with rate-limit-aware retry |
| Cache/Memory | Redis (Upstash-compatible) — session cache + project memory |
| Sandbox      | Docker (optional, for isolated command execution)        |
| Auth         | JWT + bcrypt, browser-based OAuth callback flow (GitHub/Google) |

### How a message flows

```
User input (CLI)
   │
   ▼
POST /sessions/:id/messages
   │
   ├─ Load session + recent history + project memory (Redis)
   ├─ Retrieve relevant code chunks (pgvector similarity search)
   ├─ Detect package manager (bun / pnpm / yarn / npm)
   │
   ├─ PLAN mode  → Planner agent returns a structured plan (no tools)
   │
   └─ BUILD mode → Orchestrator checks task complexity
         ├─ Simple  → direct tool-calling agent (streamed)
         └─ Complex → Coding agent(s) + Review agent per sub-task
   │
   ▼
SSE stream → CLI renders text, tool calls, and results live
   │
   ▼
On finish: response saved, RAG re-indexed for changed files,
project memory updated, cache invalidated
```

---

## 🧰 Available Tools

| Tool | Description |
|------|-------------|
| `read_file` | Read a file's contents |
| `write_file` | Create or overwrite a file |
| `edit_file` | Replace an exact string within a file (surgical edits) |
| `list_files` | List a directory's contents |
| `search_files` | Glob-pattern file search |
| `create_directory` | Create directories recursively |
| `delete_file` | Delete a file or empty directory |
| `run_command` | Execute a shell command (firewalled, optionally sandboxed in Docker) |
| `git_status` / `git_diff` / `git_commit` / `git_checkout` / `git_create_branch` / `git_log` | Full git workflow |

All destructive operations (`run_command`, `delete_file`, `write_file`, `edit_file`) pass through a **validation firewall** that blocks high-risk commands (`rm -rf /`, `sudo`, `shutdown`, `mkfs`, path traversal, etc.) before execution.

---

## 🔍 RAG — Codebase Indexing & Retrieval

When a session's working directory is set, Codak indexes the project in the background so the agent can ground its responses in real code:

- **Scanning** — walks the project tree, skipping `node_modules`, `.git`, build artifacts, lockfiles, and oversized files (>500KB)
- **Chunking** — splits each file into ~150-line chunks with 20-line overlap to preserve context across boundaries
- **Embedding** — generates 3072-dim vectors via Google's `gemini-embedding-001`, batched and rate-limited (auto-retries on 429 with a 65s backoff)
- **Storage** — chunks + embeddings are stored in Postgres via `pgvector`
- **Retrieval** — on every message, the top-K most similar chunks (cosine distance) are pulled and injected into the agent's system prompt as codebase context
- **Incremental re-indexing** — after every `write_file` / `edit_file`, only the changed file is re-chunked and re-embedded — no full repo rescan

This means the agent always has up-to-date context about the files it just modified, without re-indexing the entire project on every turn.

---

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh) 1.3+
- PostgreSQL database with the [pgvector](https://github.com/pgvector/pgvector) extension (e.g. [Neon](https://neon.tech))
- Redis instance (e.g. [Upstash](https://upstash.com))
- API keys for the model providers you want to use
- (Optional) Docker, for sandboxed command execution

### Installation

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

# At least one provider key is required
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

### Database setup

Enable pgvector on your Postgres instance:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

Then push the schema:

```bash
cd packages/database
bunx prisma generate
bunx prisma db push
```

### Run

In three separate terminals:

```bash
bun run dev:server   # API on :3001
bun run dev:web      # Login page on :3000
bun run dev:cli      # Terminal UI
```

On first run, the CLI opens your browser for authentication. Once signed in, you're dropped into the chat interface.

---

## ⌨️ CLI Commands

| Command | Description |
|---------|-------------|
| `@new` | Start a new conversation |
| `@open` | Browse and resume an existing session |
| `@close` | Return to the home screen |
| `@build` / `@plan` | Switch agent mode (or press `Tab`) |
| `@models` | Switch the active AI model |
| `@setpath` | Set the project directory for the current session |
| `@theme` | Change the color theme |
| `@logout` | Sign out |
| `@help` | List all commands |
| `@exit` | Quit |

---

## 🔒 Safety

- **Firewall** — every `run_command`, `write_file`, `edit_file`, and `delete_file` call is validated before execution. Recursive deletes, disk formatting, shutdown/reboot, and path traversal outside the project root are blocked unconditionally.
- **Scoped filesystem access** — all file operations resolve relative to the session's working directory; the agent cannot read or write outside it.
- **Docker sandbox (optional)** — when Docker is available, `run_command` executes inside an isolated, network-disabled, resource-limited container (`--memory=512m --cpus=1 --network=none`) and is destroyed after use.
- **Tool execution audit log** — every tool call (arguments, result, duration, errors) is persisted for review.

---

## 🗺️ Roadmap

- [ ] `npm install -g codak-cli` distribution
- [ ] Model-per-agent configuration (different models for Planner/Coder/Reviewer)
- [ ] Incremental scoped re-indexing improvements
- [ ] Web dashboard for session history and tool execution logs

---

## 📄 License

MIT