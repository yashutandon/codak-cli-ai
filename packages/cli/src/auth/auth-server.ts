import { createServer } from "http";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface RunningAuthServer {
  port: number;
  waitForToken: () => Promise<AuthTokens>;
}

/**
 * Starts an ephemeral local HTTP server to receive the OAuth callback.
 * Using port 0 allows the operating system to safely allocate any available,
 * non-excluded port, avoiding Windows Hyper-V / WSL port exclusion conflicts (EADDRINUSE).
 */
export function startAuthServer(): Promise<RunningAuthServer> {
  return new Promise((resolveStart, rejectStart) => {
    let tokenResolve: (tokens: AuthTokens) => void;
    let tokenReject: (err: Error) => void;

    const tokenPromise = new Promise<AuthTokens>((res, rej) => {
      tokenResolve = res;
      tokenReject = rej;
    });

    const server = createServer((req, res) => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      const url = new URL(req.url ?? "/", `http://localhost:${port}`);

      if (url.pathname !== "/callback") {
        res.writeHead(404);
        res.end();
        return;
      }

      const accessToken = url.searchParams.get("token");
      const refreshToken = url.searchParams.get("refreshToken");

      if (!accessToken) {
        res.writeHead(400);
        res.end("Missing token");
        tokenReject(new Error("No token received"));
        server.close();
        return;
      }

      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Codak Authenticated</title>
            <style>
              body { background: #080810; color: rgba(255,255,255,0.7); font-family: 'Courier New', monospace; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; flex-direction: column; gap: 12px; }
              h1 { color: #fff; font-size: 18px; letter-spacing: 0.2em; }
              p { font-size: 13px; opacity: 0.4; }
            </style>
          </head>
          <body>
            <h1>✓ AUTHENTICATED</h1>
            <p>You can close this tab and return to the CLI.</p>
          </body>
        </html>
      `);

      tokenResolve({ accessToken, refreshToken: refreshToken ?? "" });
      server.close();
    });

    server.on("error", (err) => {
      rejectStart(err);
      if (tokenReject) tokenReject(err);
    });

    // Port 0 tells the OS to assign an available ephemeral port
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;

      const timeout = setTimeout(() => {
        server.close();
        tokenReject(new Error("Auth timeout — no response within 5 minutes"));
      }, 5 * 60 * 1000);

      resolveStart({
        port,
        waitForToken: () => tokenPromise.finally(() => clearTimeout(timeout)),
      });
    });
  });
}

/**
 * Backward-compatible helper that starts the server and waits for the token.
 */
export async function waitForToken(port?: number): Promise<AuthTokens> {
  const authServer = await startAuthServer();
  return authServer.waitForToken();
}

export function getRandomPort(): number {
  return Math.floor(Math.random() * (65535 - 49152 + 1)) + 49152;
}