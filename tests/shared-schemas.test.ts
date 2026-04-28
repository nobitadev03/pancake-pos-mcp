import { describe, it, expect } from "vitest";
import { z } from "zod";
import { VietnamAddressSchema, type VietnamAddress } from "../src/shared/schemas.js";

describe("VietnamAddressSchema", () => {
  it("accepts empty object (all fields optional)", () => {
    expect(VietnamAddressSchema.safeParse({}).success).toBe(true);
  });

  it("accepts OLD format (3-tier: province/district/commune)", () => {
    const old = {
      full_name: "Nguyen Van A",
      phone_number: "0900000000",
      address: "123 Le Loi",
      country_code: 84,
      province_id: "701",
      district_id: "70101",
      commune_id: "7010101",
    };
    expect(VietnamAddressSchema.safeParse(old).success).toBe(true);
  });

  it("accepts NEW format (2-tier: new_province/new_commune)", () => {
    const fresh = {
      full_name: "Nguyen Van B",
      phone_number: "0911111111",
      address: "45 Tran Hung Dao",
      new_province_id: "84_VN129",
      new_commune_id: "84_VN129_001",
      new_full_address: "45 Tran Hung Dao, HCM",
    };
    expect(VietnamAddressSchema.safeParse(fresh).success).toBe(true);
  });

  it("accepts both OLD and NEW fields together", () => {
    const mixed = {
      province_id: "701",
      district_id: "70101",
      commune_id: "7010101",
      new_province_id: "84_VN129",
      new_commune_id: "84_VN129_001",
    };
    expect(VietnamAddressSchema.safeParse(mixed).success).toBe(true);
  });

  it("rejects wrong type (province_id as number)", () => {
    const bad = { province_id: 701 };
    expect(VietnamAddressSchema.safeParse(bad).success).toBe(false);
  });

  it("extended schema enforces required fields at callsite", () => {
    const Required = VietnamAddressSchema.extend({ full_name: z.string() });
    expect(Required.safeParse({}).success).toBe(false);
    expect(Required.safeParse({ full_name: "X" }).success).toBe(true);
  });

  it("type inference exposes optional fields", () => {
    const a: VietnamAddress = {};
    expect(a).toBeDefined();
  });
});
