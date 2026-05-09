// /__tests__/unit/lib/api/transactions/service.spec.ts

import { test, expect, vi } from "vitest";
import { saveTransactions } from "@/app/api/transactions/service";

test("saves transactions", async () => {
    const mockRes = { rows: [{ id: 1 }], text: 'OK' };

    global.fetch = vi.fn().mockResolvedValueOnce(
        new Response(JSON.stringify(mockRes), { status: 200 })
    );

    const transactions = [{ id: 1, amount: 100 }];
    const result = await saveTransactions(transactions);
    expect(result).toEqual(mockRes);
    expect(fetch).toHaveBeenCalledWith(`/api/transactions`, expect.any(Object));
});