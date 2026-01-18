import { vi, it, expect, beforeEach, describe } from 'vitest';
import { uploadStatement, uploadStatements } from '@/app/api/upload/service';
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

    it('uploads multiple statements in single request', async () => {
        const fetchSpy = vi.fn(async (_input: any, init: any) => {
            const fd = init.body as FormData;
            expect(fd.getAll('statement')).toHaveLength(2);

            return new Response(
                JSON.stringify({ id: 'u-bulk', datetime: '2025-01-01T12:00:00Z' }),
                { status: 200, headers: { 'content-type': 'application/json' }}
            );
        });

        vi.stubGlobal('fetch', fetchSpy as any);
        
        const files = [
            new File(['a'], 'jan.pdf', { type: 'application/pdf' }),
            new File(['b'], 'feb.pdf', { type: 'application/pdf' }),
        ];

        await uploadStatements(files);
    
        expect(fetchSpy).toHaveBeenCalledTimes(1);
        expect(fetchSpy).toHaveBeenCalledWith('/api/upload', expect.objectContaining({ method: 'POST' }));
    });
});
