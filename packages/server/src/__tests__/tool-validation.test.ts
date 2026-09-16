import { describe, it, expect, vi, beforeEach } from "vitest";
import { validateToolCall } from "../api/lib/tools/validate-toolcall";

describe("Tool Validation — validateToolCall", () => {
  const cwd = process.platform === "win32" ? "C:\\Users\\test\\project" : "/home/test/project";

  describe("read_file", () => {
    it("should allow reading files within cwd", () => {
      const result = validateToolCall("read_file", { path: "src/index.ts" }, cwd);
      expect(result.allowed).toBe(true);
    });

    it("should block path traversal attempts", () => {
      const result = validateToolCall("read_file", { path: "../../../etc/passwd" }, cwd);
      expect(result.allowed).toBe(false);
      if (!result.allowed) {
        expect(result.reason).toBeDefined();
      }
    });
  });

  describe("write_file", () => {
    it("should allow writing files within cwd", () => {
      const result = validateToolCall("write_file", { path: "src/new-file.ts", content: "hello" }, cwd);
      expect(result.allowed).toBe(true);
    });

    it("should block writing outside cwd", () => {
      const result = validateToolCall("write_file", { path: "../outside/file.ts", content: "evil" }, cwd);
      expect(result.allowed).toBe(false);
    });
  });

  describe("run_command", () => {
    it("should allow safe commands", () => {
      const result = validateToolCall("run_command", { command: "bun run build" }, cwd);
      expect(result.allowed).toBe(true);
    });

    it("should block destructive commands (rm -rf)", () => {
      const result = validateToolCall("run_command", { command: "rm -rf /" }, cwd);
      expect(result.allowed).toBe(false);
    });

    it("should block format commands", () => {
      const result = validateToolCall("run_command", { command: "format C:" }, cwd);
      expect(result.allowed).toBe(false);
    });
  });

  describe("delete_file", () => {
    it("should allow deleting files within cwd", () => {
      const result = validateToolCall("delete_file", { path: "temp.txt" }, cwd);
      expect(result.allowed).toBe(true);
    });

    it("should block deleting outside cwd", () => {
      const result = validateToolCall("delete_file", { path: "../../important.db" }, cwd);
      expect(result.allowed).toBe(false);
    });
  });

  describe("unknown tools", () => {
    it("should block unknown tool names", () => {
      const result = validateToolCall("evil_tool" as any, {}, cwd);
      expect(result.allowed).toBe(false);
    });
  });
});
