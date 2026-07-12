import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../../../app";
import { prismaMock } from "../../../../__tests__/mocks/prisma";
import jwt from "jsonwebtoken";

const generateToken = (userId: string) => {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET || "test_secret", {
    expiresIn: "1h",
  });
};

describe("Usage API", () => {
  it("should block unauthorized access", async () => {
    const res = await request(app).post("/api/v1/usage/track").send({});
    expect(res.status).toBe(401);
  });

  it("should track usage and return 200", async () => {
    const userId = "test_user_1";
    const token = generateToken(userId);

    // Mock db.usageToken.create
    prismaMock.usageToken.create.mockResolvedValue({
      id: "ut_123",
      userId,
      sessionId: "session_123",
      promptTokens: 100,
      completionTokens: 50,
      totalTokens: 150,
      cost: 0.00125,
      createdAt: new Date(),
    });

    const payload = {
      sessionId: "session_123",
      promptTokens: 100,
      completionTokens: 50,
      totalTokens: 150,
      model: "gpt-4o",
    };

    const res = await request(app)
      .post("/api/v1/usage/track")
      .set("Authorization", `Bearer ${token}`)
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.cost).toBe(0.00125);
    expect(prismaMock.usageToken.create).toHaveBeenCalledOnce();
  });

  it("should get usage stats for the month", async () => {
    const userId = "test_user_2";
    const token = generateToken(userId);

    prismaMock.usageToken.aggregate.mockResolvedValue({
      _sum: {
        promptTokens: 1000,
        completionTokens: 500,
        totalTokens: 1500,
        cost: 0.0125,
      },
      _avg: {}, _count: {}, _max: {}, _min: {}
    } as any);

    const res = await request(app)
      .get("/api/v1/usage/stats")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.promptTokens).toBe(1000);
    expect(res.body.data.cost).toBe(0.0125);
    expect(prismaMock.usageToken.aggregate).toHaveBeenCalledOnce();
  });
});
