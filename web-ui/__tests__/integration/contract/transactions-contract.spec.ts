import { describe, it, expect, beforeEach } from 'vitest';
import { ___resetMswData } from '@/__tests__/test-utils/msw/handlers';
import { getTransactions, patchTransaction } from '@/app/api/transactions/service';

describe('API contract: /api/transactions', () => {
  beforeEach(() => ___resetMswData());

  it('GET /api/transactions?cat=payments -> [{ id, date, payee, amount, envelopeId }]', async () => {
    const rows = await getTransactions('payments');
    expect(Array.isArray(rows)).toBe(true);
    expect(rows.length).toBeGreaterThan(0);

    for (const r of rows) {
      expect(r.cat).toBe('payments');
      expect(r).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          date: expect.any(String),
          payee: expect.any(String),
          amount: expect.any(Number),
          envelopeId: expect.anything(),
          uploadId: expect.any(String)
        }),
      );
      expect(r.envelopeId === null || r.envelopeId === 'string').toBe(true);
      expect(typeof r.uploadId === 'string' || r.uploadId === null || r.uploadId === undefined).toBe(true);
    }

  });

  it('PATCH /api/transactions/:id body { envelopeId } -> updated transaction', async () => {
    const rows = await getTransactions('payments');
    const target = rows[0];

    const updated = await patchTransaction(target.id, { envelopeId: 'env_1' });
    expect(updated.id).toBe(target.id);
    expect(updated.envelopeId).toBe('env_1');
  });

  it('GET /api/transactions?cat=all -> [{ id, date, payee, amount, envelopeId, uploadId }]', async () => {
    const rows = await getTransactions('all');
    expect(Array.isArray(rows)).toBe(true);
    expect(rows.length).toBeGreaterThan(0);

    for (const row of rows) {
      expect(['payments', 'deposits']).toContain(row.cat);
      expect(row).toHaveProperty('uploadId');
      expect(row).toHaveProperty('envelopeId');
    }

  })
});
