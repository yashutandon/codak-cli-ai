import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../../../app";
import { prismaMock } from "../../../../__tests__/mocks/prisma";
import bcrypt from "bcryptjs";

// Mock bcrypt
vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("hashed_password"),
    compare: vi.fn().mockResolvedValue(true),
  },
}));

describe("Auth API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should register a new user", async () => {
    // Mock user lookup (user does not exist)
    prismaMock.user.findUnique.mockResolvedValue(null);

    // Mock user creation
    prismaMock.user.create.mockResolvedValue({
      id: "u_123",
      email: "test@example.com",
      password: "hashed_password",
      name: "Test User",
      isOAuthUser: false,
      tier: "FREE",
      razorpayCustomerId: null,
      razorpaySubscriptionId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await request(app).post("/api/v1/auth/register").send({
      email: "test@example.com",
      password: "Password123",
      name: "Test User",
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe("test@example.com");
    expect(res.body.data.accessToken).toBeDefined();
    
    expect(prismaMock.user.create).toHaveBeenCalledOnce();
  });

  it("should login an existing user", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "u_123",
      email: "test@example.com",
      password: "hashed_password",
      name: "Test User",
      isOAuthUser: false,
      tier: "FREE",
      razorpayCustomerId: null,
      razorpaySubscriptionId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // We mocked bcrypt.compare to always return true

    const res = await request(app).post("/api/v1/auth/login").send({
      email: "test@example.com",
      password: "Password123",
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
  });
});
