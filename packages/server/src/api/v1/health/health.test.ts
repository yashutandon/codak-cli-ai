import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../../../app";

describe("Health API", () => {
  it("should return 200 OK on /api/v1/health", async () => {
    const res = await request(app).get("/api/v1/health");
    expect(res.body.status).toBe("healthy");
    expect(res.body.success).toBe(true);
    expect(res.body.services).toBeDefined();
  });
});
