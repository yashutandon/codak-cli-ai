import { createServer } from "http";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export function waitForToken(port: number): Promise<AuthTokens> {
  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
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
        reject(new Error("No token received"));
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

      resolve({ accessToken, refreshToken: refreshToken ?? "" });
      server.close();
    });

    server.listen(port, "localhost", () => {});

    server.on("error", (err) => {
      reject(err);
    });

    setTimeout(() => {
      server.close();
      reject(new Error("Auth timeout — no response within 5 minutes"));
    }, 5 * 60 * 1000);
  });
}

export function getRandomPort(): number {
  return Math.floor(Math.random() * (65535 - 49152 + 1)) + 49152;
}