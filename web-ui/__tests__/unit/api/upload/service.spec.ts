import { vi, it, expect, beforeEach, describe } from 'vitest';
import { uploadStatement, uploadStatements } from '@/app/api/upload/service';
import { lastUploadCount } from '@/__tests__/test-utils/msw/handlers';

beforeEach(() => vi.restoreAllMocks());

describe('bulk upload service', () => {
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

    it('uploads multiple statements in single request', async () => {
        const files = [
            new File(['a'], 'jan.pdf', { type: 'application/pdf' }),
            new File(['b'], 'feb.pdf', { type: 'application/pdf' }),
        ];

        await uploadStatements(files);
        expect(lastUploadCount).toBe(2);
    })
});
