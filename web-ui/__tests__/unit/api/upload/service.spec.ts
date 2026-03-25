import { vi, it, expect, beforeEach, describe } from 'vitest';
import { uploadStatement, uploadStatements } from '@/app/api/upload/service';
import { fetchSavedStatementRanges } from '@/app/api/uploads/service';
import { ___resetMswData, lastUploadCount } from '@/__tests__/test-utils/msw/handlers';

beforeEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
});


describe('bulk upload service', () => {
    it('uploads statement', async () => {
        const fetchSpy = vi.fn(async () => {
            return new Response(
                JSON.stringify({ id: 'u-unit', datetime: '2025-01-01T12:00:00Z' }),
                { status: 201, headers: { 'content-type': 'application/json' }}
            );
        });

        vi.stubGlobal('fetch', fetchSpy as any);
        
        const file = new File(['x'], 'bank.pdf', { type: 'application/pdf' });
        const res = await uploadStatement(file);
        expect(res).toEqual({ id: 'u-unit', datetime: '2025-01-01T12:00:00Z' });

        const call = fetchSpy.mock.calls[0];
        expect(call).toBeDefined();
        const [, init] = call as unknown as [string, RequestInit];
        const fd = init.body as FormData;
        expect(fd.getAll('statement')).toHaveLength(1);
    });

    it('uploads multiple statements with one request per file', async () => {
        let callCount = 0;
        const fetchSpy = vi.fn(async (_input: any, init: any) => {
            callCount++;
            const fd = init.body as FormData;
            expect(fd.getAll('statement')).toHaveLength(1);

            return new Response(
                JSON.stringify({ id: `u-bulk-${callCount}`, datetime: '2025-01-01T12:00:00Z' }),
                { status: 200, headers: { 'content-type': 'application/json' }}
            );
        });

        vi.stubGlobal('fetch', fetchSpy as any);
        
        const files = [
            new File(['a'], 'jan.pdf', { type: 'application/pdf' }),
            new File(['b'], 'feb.pdf', { type: 'application/pdf' }),
        ];

        const results = await uploadStatements(files);
    
        expect(fetchSpy).toHaveBeenCalledTimes(2);
        expect(results).toHaveLength(2);
        expect(results[0].id).toBe('u-bulk-1');
        expect(results[1].id).toBe('u-bulk-2');
    });
});

describe('fetchSavedStatementRanges', () => {
    it('fetches with cache: no-store to prevent stale responses', async () => {
        const fetchSpy = vi.fn(async () => {
            return new Response(
                JSON.stringify({ ranges: [{ start: '2025-03-08', end: '2025-04-07' }] }),
                { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
        });
        vi.stubGlobal('fetch', fetchSpy as any);

        const result = await fetchSavedStatementRanges();

        expect(fetchSpy).toHaveBeenCalledWith('/api/uploads/ranges', expect.objectContaining({
            cache: 'no-store',
        }));
        expect(result).toEqual([{ start: '2025-03-08', end: '2025-04-07' }]);
    });
});
