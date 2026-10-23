import { describe, it, expect } from "vitest";
import { formatINR, formatAmount } from "@/lib/currency";

describe("formatAmount (money totals)", () => {
  it("shows zero as ₹0, never 'Free'", () => {
    expect(formatAmount(0)).toBe("₹0");
    expect(formatAmount("0")).toBe("₹0");
  });

  it("formats amounts the Indian way", () => {
    expect(formatAmount(150000)).toBe("₹1,50,000");
  });

  it("falls back to ₹0 for missing or invalid values", () => {
    expect(formatAmount(null)).toBe("₹0");
    expect(formatAmount(undefined)).toBe("₹0");
    expect(formatAmount("abc")).toBe("₹0");
  });
});

describe("formatINR (ticket prices)", () => {
  it("still shows a zero-price ticket as 'Free'", () => {
    expect(formatINR(0)).toBe("Free");
    expect(formatINR(499)).toBe("₹499");
  });
});
