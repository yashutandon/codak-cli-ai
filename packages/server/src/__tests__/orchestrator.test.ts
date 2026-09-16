import { describe, it, expect } from "vitest";
import { detectComplexity } from "../api/infra/agents/orchestrator";

describe("Orchestrator — detectComplexity", () => {
  describe("should return FALSE for simple tasks", () => {
    it("simple fix request", () => {
      expect(detectComplexity("fix the typo in the header")).toBe(false);
    });

    it("add a button", () => {
      expect(detectComplexity("add a submit button to the form")).toBe(false);
    });

    it("explain code", () => {
      expect(detectComplexity("what does this function do")).toBe(false);
    });

    it("short single-word", () => {
      expect(detectComplexity("hello")).toBe(false);
    });

    it("empty string", () => {
      expect(detectComplexity("")).toBe(false);
    });

    it("simple read request", () => {
      expect(detectComplexity("show me the contents of package.json")).toBe(false);
    });
  });

  describe("should return TRUE for complex tasks", () => {
    it("multi-step with implementation keyword", () => {
      expect(
        detectComplexity("implement JWT authentication middleware and then add rate limiting to all auth routes")
      ).toBe(true);
    });

    it("scaffold with multi-file scope", () => {
      expect(
        detectComplexity("scaffold a complete CRUD API for users across all files in the api directory")
      ).toBe(true);
    });

    it("refactor with conjunction", () => {
      expect(
        detectComplexity("refactor the database layer and then migrate to the new schema")
      ).toBe(true);
    });

    it("integrate with technical domain", () => {
      expect(
        detectComplexity("integrate Razorpay payment gateway and then add webhook handler for subscription events")
      ).toBe(true);
    });

    it("long detailed request with domain keywords", () => {
      const longMessage = `I need you to create an authentication system with JWT tokens, 
        refresh token rotation, bcrypt password hashing, and Redis session caching. 
        Also add rate limiting middleware and Helmet security headers to the Express app. 
        Make sure to write tests for the auth service and controller.`;
      expect(detectComplexity(longMessage)).toBe(true);
    });
  });

  describe("threshold boundary cases", () => {
    it("creation keyword alone (1 point) should be simple", () => {
      // "create" = 1 point, threshold is 4
      expect(detectComplexity("create a file")).toBe(false);
    });

    it("creation + technical domain (2 points) should be simple", () => {
      // "create" = 1, "auth" = 1, total = 2
      expect(detectComplexity("create auth")).toBe(false);
    });

    it("implement keyword alone (2 points) should be simple", () => {
      // "implement" = 2, total = 2
      expect(detectComplexity("implement logging")).toBe(false);
    });

    it("implement + technical domain (3 points) should be simple", () => {
      // "implement" = 2, "middleware" = 1, total = 3 (below threshold of 4)
      expect(detectComplexity("implement middleware")).toBe(false);
    });

    it("implement + domain + conjunction hits threshold", () => {
      // "implement" = 2, "middleware" = 1, "and then" = 2, total = 5 (above threshold)
      expect(detectComplexity("implement middleware and then test it")).toBe(true);
    });
  });
});
