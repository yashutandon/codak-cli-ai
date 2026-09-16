import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../app";

describe("API Health Check", () => {
  it("should return 200 with health status", async () => {
    const res = await request(app).get("/api/v1/health");
    // Health service checks DB + Redis. In test env, both are mocked.
    // DB mock returns ok (prisma mock is set up), Redis mock returns PONG.
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("status");
    expect(res.body).toHaveProperty("services");
    expect(res.body).toHaveProperty("timestamp");
    expect(res.body).toHaveProperty("uptime");
    expect(["healthy", "degraded"]).toContain(res.body.status);
  });

  it("should return 404 for unknown routes", async () => {
    const res = await request(app).get("/api/v1/nonexistent");
    expect(res.status).toBe(404);
  });
});
