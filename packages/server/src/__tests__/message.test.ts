import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../app";
import { prismaMock } from "./mocks/prisma";
import jwt from "jsonwebtoken";

const generateToken = (userId: string) => {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET || "test_secret", {
    expiresIn: "1h",
  });
};

describe("Messages API", () => {
  const userId = "test_user_msg";
  const sessionId = "test_sess_msg";
  const token = generateToken(userId);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Auth Guard", () => {
    it("should return 401 without token", async () => {
      const res = await request(app)
        .post(`/api/v1/sessions/${sessionId}/messages`)
        .send({
          content: "Hello",
          model: "gemini-2.0-flash",
          mode: "BUILD",
        });
      expect(res.status).toBe(401);
    });

    it("should return 401 with invalid token", async () => {
      const res = await request(app)
        .post(`/api/v1/sessions/${sessionId}/messages`)
        .set("Authorization", "Bearer invalid_token")
        .send({
          content: "Hello",
          model: "gemini-2.0-flash",
          mode: "BUILD",
        });
      expect(res.status).toBe(401);
    });
  });

  describe("Validation", () => {
    it("should reject empty content", async () => {
      const res = await request(app)
        .post(`/api/v1/sessions/${sessionId}/messages`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          content: "",
          model: "gemini-2.0-flash",
          mode: "BUILD",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should reject unsupported model", async () => {
      const res = await request(app)
        .post(`/api/v1/sessions/${sessionId}/messages`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          content: "Hello",
          model: "gpt-fake-999",
          mode: "BUILD",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should reject invalid mode", async () => {
      const res = await request(app)
        .post(`/api/v1/sessions/${sessionId}/messages`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          content: "Hello",
          model: "gemini-2.0-flash",
          mode: "SUPER_AI",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe("Session Not Found", () => {
    it("should return 404 if session does not exist", async () => {
      prismaMock.session.findFirst.mockResolvedValue(null);

      const res = await request(app)
        .post(`/api/v1/sessions/${sessionId}/messages`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          content: "Hello world",
          model: "gemini-2.0-flash",
          mode: "BUILD",
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});
