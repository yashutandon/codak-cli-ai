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

describe("Sessions API", () => {
  const userId = "test_user_1";
  const token = generateToken(userId);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/v1/sessions", () => {
    it("should create a session with title and cwd", async () => {
      const mockSession = {
        id: "sess_123",
        title: "Fix auth middleware",
        cwd: "/home/user/project",
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        messages: [],
        codeChunks: [],
        toolExecutions: [],
        usageTokens: [],
      };

      prismaMock.session.create.mockResolvedValue(mockSession as any);

      const res = await request(app)
        .post("/api/v1/sessions")
        .set("Authorization", `Bearer ${token}`)
        .send({ title: "Fix auth middleware", cwd: "/home/user/project" });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe("Fix auth middleware");
      expect(res.body.data.cwd).toBe("/home/user/project");
    });

    it("should reject empty title", async () => {
      const res = await request(app)
        .post("/api/v1/sessions")
        .set("Authorization", `Bearer ${token}`)
        .send({ title: "" });

      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/v1/sessions", () => {
    it("should return user sessions", async () => {
      const mockSessions = [
        {
          id: "sess_1",
          title: "Session 1",
          cwd: "/project",
          userId,
          createdAt: new Date(),
          updatedAt: new Date(),
          messages: [{ id: "msg_1", role: "USER", content: "hello", status: "COMPLETE", mode: "BUILD", model: "gemini-2.0-flash", title: "", createdAt: new Date(), sessionId: "sess_1", part: null, duration: null }],
        },
        {
          id: "sess_2",
          title: "Session 2",
          cwd: null,
          userId,
          createdAt: new Date(),
          updatedAt: new Date(),
          messages: [],
        },
      ];

      prismaMock.session.findMany.mockResolvedValue(mockSessions as any);

      const res = await request(app)
        .get("/api/v1/sessions")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].title).toBe("Session 1");
    });
  });

  describe("Auth Guard", () => {
    it("should return 401 without token", async () => {
      const res = await request(app).get("/api/v1/sessions");
      expect(res.status).toBe(401);
    });

    it("should return 401 with invalid token", async () => {
      const res = await request(app)
        .get("/api/v1/sessions")
        .set("Authorization", "Bearer invalid_token_here");
      expect(res.status).toBe(401);
    });
  });
});
