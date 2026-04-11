/// <reference types="@cloudflare/vitest-pool-workers/types" />
import { describe, it, expect } from "vitest";

describe("test setup", () => {
  it("vitest runs in workers environment", () => {
    expect(typeof globalThis.Response).toBe("function");
    expect(typeof globalThis.Request).toBe("function");
    expect(typeof crypto.randomUUID).toBe("function");
  });
});
