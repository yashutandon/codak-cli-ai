import { describe, it, expect } from "vitest";
import { semverGt } from "./update-notifier";

describe("semverGt", () => {
  it("should return true when remote is strictly greater", () => {
    expect(semverGt("1.0.1", "1.0.0")).toBe(true);
    expect(semverGt("1.1.0", "1.0.9")).toBe(true);
    expect(semverGt("2.0.0", "1.9.9")).toBe(true);
  });

  it("should return false when local is greater or equal", () => {
    expect(semverGt("1.0.0", "1.0.0")).toBe(false);
    expect(semverGt("1.0.0", "1.0.1")).toBe(false);
    expect(semverGt("1.0.9", "1.1.0")).toBe(false);
  });

  it("should handle malformed versions gracefully", () => {
    expect(semverGt("1.0", "1.0.0")).toBe(false);
    expect(semverGt("invalid", "1.0.0")).toBe(false);
  });
});
