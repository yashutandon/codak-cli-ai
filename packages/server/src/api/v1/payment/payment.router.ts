import { Router } from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import { db } from "@codak/database";
import { authenticate } from "../../middleware/auth.middleware";
import type { AuthRequest } from "../../middleware/auth.middleware";

const paymentRouter = Router();

// Ensure keys exist, otherwise mock the instance for local dev if not configured
const razorpay = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET 
  ? new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })
  : null;

paymentRouter.post("/create-subscription", authenticate, async (req, res) => {
  try {
    const userId = (req as unknown as AuthRequest).userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: { message: "Unauthorized" } });
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ success: false, error: { message: "User not found" } });
    }

    if (!razorpay) {
      // Return a mock order if no keys configured (for testing)
      return res.json({
        success: true,
        data: {
          id: "sub_mock_" + Math.random().toString(36).substring(7),
          entity: "subscription",
          status: "created",
          plan_id: "plan_mock_pro",
          customer_id: "cust_mock_123",
          mock: true
        }
      });
    }

    // Assuming you have a PLAN_ID in your environment from Razorpay dashboard
    const planId = process.env.RAZORPAY_PRO_PLAN_ID || "plan_O9aJxxxxxx"; 

    // Create a customer if not exists
    let customerId = user.razorpayCustomerId;
    
    if (!customerId) {
      const customer = await razorpay.customers.create({
        email: user.email,
        name: user.name || "Codak User",
      });
      customerId = customer.id;
      
      // Save customer ID
      await db.user.update({
        where: { id: user.id },
        data: { razorpayCustomerId: customerId }
      });
    }

    // Create subscription
    const subscriptionArgs: any = {
      plan_id: planId,
      customer_notify: 1,
      total_count: 120, // 10 years
      customer_id: customerId
    };
    const subscription = await razorpay.subscriptions.create(subscriptionArgs);

    res.json({ success: true, data: subscription });

  } catch (error) {
    console.error("Create subscription error:", error);
    res.status(500).json({ success: false, error: { message: "Internal server error" } });
  }
});

// Webhook listener from Razorpay
paymentRouter.post("/webhook", async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // req.body is a raw Buffer here (express.raw middleware set in app.ts).
    // Using original bytes for HMAC — re-serialising via JSON.stringify()
    // changes key ordering/whitespace and makes valid signatures fail.
    const rawBody = Buffer.isBuffer(req.body)
      ? req.body
      : Buffer.from(JSON.stringify(req.body)); // defensive fallback

    if (secret) {
      const signature = req.headers["x-razorpay-signature"];
      if (!signature || typeof signature !== "string") {
        return res.status(400).json({ success: false, error: { message: "Missing signature" } });
      }

      const digest = crypto
        .createHmac("sha256", secret)
        .update(rawBody)
        .digest("hex");

      // Constant-time comparison to prevent timing-based attacks
      const sigBuffer = Buffer.from(signature, "hex");
      const digBuffer = Buffer.from(digest, "hex");
      const signatureValid =
        sigBuffer.length === digBuffer.length &&
        crypto.timingSafeEqual(sigBuffer, digBuffer);

      if (!signatureValid) {
        return res.status(400).json({ success: false, error: { message: "Invalid signature" } });
      }
    }

    // Parse the raw body now that signature is verified
    const body = JSON.parse(rawBody.toString("utf-8"));
    const event = body.event;
    const payload = body.payload;

    if (event === "subscription.charged" || event === "subscription.authenticated") {
      const subscription = payload.subscription.entity;
      const customerId = subscription.customer_id;

      // Upgrade user to PRO
      await db.user.updateMany({
        where: { razorpayCustomerId: customerId },
        data: { 
          tier: "PRO",
          razorpaySubscriptionId: subscription.id
        }
      });
    } else if (event === "subscription.cancelled" || event === "subscription.halted") {
      const subscription = payload.subscription.entity;
      const customerId = subscription.customer_id;

      // Downgrade user to FREE
      await db.user.updateMany({
        where: { razorpayCustomerId: customerId },
        data: { 
          tier: "FREE",
          razorpaySubscriptionId: null
        }
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({ success: false, error: { message: "Internal server error" } });
  }
});

export default paymentRouter;
