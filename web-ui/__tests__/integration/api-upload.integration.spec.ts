import { describe, it, vi } from 'vitest';
import { POST as uploadRoute } from '@/app/api/upload/route';
import { NextRequest } from 'next/server';

describe('/api/upload route (contract)', () => {
  it('accepts multipart PDF and returns { id, datetime, rows }', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 'stmt_1',
          datetime: new Date().toISOString(),
          rows: [{ id: 1, date: '2024-01-01', description: 'Coffee', amount: 3.23 }],
        }),
        { status: 200, headers: { 'content-type': 'application/json' }}
      )
    );

    const req = new NextRequest('http://localhost/api/upload?parse=1', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ statement: 'stub' }),
    });

    const resp = await uploadRoute(req);

    expect(resp.status).toBeGreaterThanOrEqual(200);
    expect(resp.status).toBeLessThan(300);

    const json = await resp.json();
    expect(json.id).toBeTruthy();
    expect(json.datetime).toBeTruthy();
    expect(Array.isArray(json.rows)).toBe(true);
    expect(json.rows.length).toBeGreaterThan(0);
  });
});
