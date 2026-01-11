import { vi, it, expect, beforeEach } from 'vitest';
import { uploadStatement } from '@/app/api/upload/service';

beforeEach(() => vi.restoreAllMocks());

it('uploads statement', async () => {
  // ✅ mock success from Next proxy
    vi.stubGlobal('fetch', vi.fn(async (input: any) => {
        if (typeof input === 'string' && input === '/api/upload') {
            return new Response(
                JSON.stringify({ id: 'u-unit', datetime: '2025-01-01T12:00:00Z' }),
                { status: 201, headers: { 'content-type': 'application/json' } }
            );
        }
        return new Response('unhandled', { status: 418 });
    }) as any);

    const file = new File(['x'], 'bank.pdf', { type: 'application/pdf' });
    const res = await uploadStatement(file);
    expect(res).toEqual({ id: 'u-unit', datetime: '2025-01-01T12:00:00Z' });
});
