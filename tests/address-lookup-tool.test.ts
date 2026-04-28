import { describe, it, expect, vi } from "vitest";
import { handleAddressLookupTool } from "../src/tools/address-lookup-tool.js";
import type { PancakeHttpClient } from "../src/api-client/pancake-http-client.js";

function mockClient(getRawImpl: () => Promise<unknown>): PancakeHttpClient {
  return {
    getRaw: vi.fn(getRawImpl),
  } as unknown as PancakeHttpClient;
}

describe("handleAddressLookupTool — known-broken upstream wrapper", () => {
  it("404 error → throws DEPRECATION_NOTE-shaped message with workaround hint", async () => {
    const err = Object.assign(new Error("HTTP 404 Not Found"), { status: 404 });
    const client = mockClient(() => Promise.reject(err));
    await expect(handleAddressLookupTool({ action: "provinces" }, client)).rejects.toThrow(
      /unavailable upstream/i,
    );
    await expect(handleAddressLookupTool({ action: "provinces" }, client)).rejects.toThrow(
      /shipping_address\.province_id|new_province_id/,
    );
  });

  it("non-404 error → original error propagates unchanged", async () => {
    const err = new Error("network down");
    const client = mockClient(() => Promise.reject(err));
    await expect(handleAddressLookupTool({ action: "provinces" }, client)).rejects.toThrow(
      "network down",
    );
  });

  it("success → returns data normally (forward-compat if upstream is fixed)", async () => {
    const client = mockClient(() => Promise.resolve([{ id: "701", name: "HCM" }]));
    const result = await handleAddressLookupTool({ action: "provinces" }, client);
    expect(result).toEqual({ data: [{ id: "701", name: "HCM" }] });
  });
});
