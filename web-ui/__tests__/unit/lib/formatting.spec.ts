import { formatCurrency } from "@/app/lib/formatting";
import { test, expect } from "vitest";

test('formats number as localized currency', () => {
    expect(formatCurrency(1234.5)).toMatch(/1,234.50/i);
})