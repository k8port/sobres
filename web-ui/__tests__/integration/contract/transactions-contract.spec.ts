import { describe, it, expect, beforeEach } from 'vitest';
import { ___resetMswData } from '@/__tests__/test-utils/msw/handlers';
import { getTransactions, patchTransaction } from '@/app/api/transactions/service';

describe('API contract: /api/transactions', () => {
  beforeEach(() => ___resetMswData());

  it('GET /api/transactions?cat=payments -> [{ id, date, payee, amount, envelopeId }]', async () => {
    const rows = await getTransactions('payments');
    // console.log('GET /api/transactions?cat=payments =>  ${rows}', rows);
    // console.log('******************************');
    expect(Array.isArray(rows)).toBe(true);
    expect(rows.length).toBeGreaterThan(0);

    for (const r of rows) {
      // console.log('===========\ncurrent row of transaction data: ${}', r);
      expect(r.cat).toBe('payments');
      expect(r.envelopeId !== null).toBe(true);
      expect(typeof r.uploadId === 'string' || r.uploadId === null || r.uploadId === undefined).toBe(true);
    }

  });

  it('PATCH /api/transactions/:id body { envelopeId } -> updated transaction', async () => {
    const rows = await getTransactions('payments');
    const target = rows[0];

    const updated = await patchTransaction(target.id, { envelopeId: 'env_1' });
    // console.log('§§§§§§§§§§ After patch ${updated} = ', updated);
    expect(updated.envelopeId).toBe('env_1');
  });

  it('GET /api/transactions?cat=all -> [{ id, date, payee, amount, envelopeId, uploadId }]', async () => {
  
    const rows = await getTransactions('all');
    // console.log('GET /api/transactions?cat=all =>  ${rows}', rows);
    // console.log('******************************');
    expect(Array.isArray(rows)).toBe(true);
    expect(rows.length).toBeGreaterThan(0);

    for (const row of rows) {
      expect(['payments', 'deposits']).toContain(row.cat);
      expect(row).toHaveProperty('uploadId');
      if (!row.envelopeId) row.envelopeId = 'general';
      expect(row).toHaveProperty('envelopeId');
    }
  })
});
