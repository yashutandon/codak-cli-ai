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
import { config } from "dotenv";
import { resolve } from "path";
import { checkForUpdate } from "./helpers/update-notifier";
config({ path: resolve(import.meta.dirname, "../.env") });

// Fire-and-forget — check NPM for updates in background
checkForUpdate();

// Auth check before rendering
await ensureAuthenticated();

const router = createMemoryRouter([
  {
    path: "/",
    element: <RootLayout/>,
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