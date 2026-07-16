import { createCliRenderer } from "@opentui/core";
import { createRoot } from "@opentui/react";
import { initRegistry } from "./helpers/slot-registry";
import { createMemoryRouter, RouterProvider } from "react-router";
import { RootLayout } from "./components/layout/root-layout";
import { Home } from "./screens/home";
import { NewChat } from "./screens/new-chat";
import { Chat } from "./screens/chats";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ensureAuthenticated } from "./auth";
import { clearToken, getStoredConfig } from "./auth/token-store";
import { config } from "dotenv";
import { resolve } from "path";
import { checkForUpdate } from "./helpers/update-notifier";
config({ path: resolve(import.meta.dirname, "../.env") });

// ── Subcommand parsing ────────────────────────────────────────────────────────
// Handles one-shot CLI commands that don't need the TUI to start.
//
//   codak logout   — remove stored token, next run will re-authenticate
//   codak whoami   — show currently stored email + session date
//   codak login    — force re-login even if a valid token exists
// ─────────────────────────────────────────────────────────────────────────────
const [, , subcmd] = process.argv;

if (subcmd === "logout") {
  await clearToken();
  console.log("\n  ✓ Logged out — token removed from ~/.codak/config.json\n");
  process.exit(0);
}

if (subcmd === "whoami") {
  const cfg = await getStoredConfig();
  if (!cfg?.accessToken) {
    console.log("\n  Not logged in. Run: codak\n");
  } else {
    const email = cfg.email || "(email not stored)";
    const since = cfg.createdAt
      ? new Date(cfg.createdAt).toLocaleString()
      : "unknown";
    console.log(`\n  Logged in as: ${email}`);
    console.log(`  Session started: ${since}\n`);
  }
  process.exit(0);
}

if (subcmd === "login") {
  // Force fresh browser login even if token is still valid
  await clearToken();
  console.log("  Cleared existing token — opening browser for login…\n");
  // Fall through to ensureAuthenticated() below
}
// ── End subcommand parsing ────────────────────────────────────────────────────

// Fire-and-forget — check NPM for updates in background
checkForUpdate();

// Auth check before rendering TUI
await ensureAuthenticated();

const router = createMemoryRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "session/new",
        element: <NewChat />,
      },
      {
        path: "session/:id",
        element: <Chat />,
      },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

const renderer = await createCliRenderer({
  targetFps: 60,
  exitOnCtrlC: false,
});

const queryClient = new QueryClient();
initRegistry(renderer);

createRoot(renderer).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);