import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import request from "supertest";
import { app } from "../../../../app";
import { prismaMock } from "../../../../__tests__/mocks/prisma";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const generateToken = (userId: string) => {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET || "test_secret", {
    expiresIn: "1h",
  });
};

describe("Payment API", () => {
  beforeEach(() => {
    // We only set webhook secret since it's used dynamically inside the handler
    process.env.RAZORPAY_WEBHOOK_SECRET = "test_webhook_secret";
    vi.clearAllMocks();
  });

  it("should create a mock subscription if keys are absent", async () => {
    const userId = "test_user_1";
    const token = generateToken(userId);

    // Make sure Razorpay keys are unset to trigger the mock
    delete process.env.RAZORPAY_KEY_ID;
    delete process.env.RAZORPAY_KEY_SECRET;

    prismaMock.user.findUnique.mockResolvedValue({
      id: userId,
      email: "test@example.com",
      name: "Test",
    } as any);

    const res = await request(app)
      .post("/api/v1/payments/create-subscription")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.mock).toBe(true);
  });

  it("should process a valid webhook and upgrade user to PRO", async () => {
    const payload = {
      event: "subscription.charged",
      payload: {
        subscription: {
          entity: {
            id: "sub_123",
            customer_id: "cust_123",
          },
        },
      },
    };

    const shasum = crypto.createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!);
    shasum.update(JSON.stringify(payload));
    const digest = shasum.digest("hex");

    prismaMock.user.updateMany.mockResolvedValue({ count: 1 });

    const res = await request(app)
      .post("/api/v1/payments/webhook")
      .set("x-razorpay-signature", digest)
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    
    expect(prismaMock.user.updateMany).toHaveBeenCalledWith({
      where: { razorpayCustomerId: "cust_123" },
      data: {
        tier: "PRO",
        razorpaySubscriptionId: "sub_123",
      },
    });
  });

  it("should reject a webhook with an invalid signature", async () => {
    const payload = { event: "subscription.charged" };
    
    const res = await request(app)
      .post("/api/v1/payments/webhook")
      .set("x-razorpay-signature", "invalid_signature")
      .send(payload);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toBe("Invalid signature");
  });
});
