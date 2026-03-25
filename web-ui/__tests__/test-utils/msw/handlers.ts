// test-utils/msw/handlers.ts
import type { SpendingCategory } from '@/app/lib/types';
import type { TransactionRow } from '@/app/api/transactions/service';
import { http, HttpResponse } from 'msw';

// msw handlers for REST mocks
const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8000';

let envelopes: SpendingCategory[] = [
    { id: 'env_1', name: 'Rent' },
    { id: 'env_2', name: 'Groceries' },
];

let transactions: TransactionRow[] = [
    { id: 't_1', date: '2025-01-01', payee: 'Coffee', amount: -4.5, cat: 'payments', envelopeId: 'env_34', uploadId: 'stmt_2501' },
    { id: 't_2', date: '2025-01-02', payee: 'Employer', amount: 2500, cat: 'deposits', envelopeId: 'env_x0', uploadId: 'stmt_2501' },
    { id: 't_3', date: '2025-01-03', payee: 'Market', amount: -230.1, cat: 'payments', envelopeId: 'env_2', uploadId: 'stmt_2501' },
];


let patchCounter = 0;

export let lastUploadCount = 0;
export function clearUploadCaptured() { lastUploadCount = 0; }

let savedUploadRanges: Array<{ start: string; end: string }> = [];
export function ___setSavedUploadRanges(ranges: Array<{ start: string; end: string }>) {
    savedUploadRanges = ranges;
}

let lastTransactionsBody: any = null;
export function clearCaptured() { lastTransactionsBody = null; }
export const ___getLastTransactionsBody = () => lastTransactionsBody;
export const ___resetLastTransactionsBody = () => { lastTransactionsBody = null; };

// python backend handlers
export const handlers = [
    /* ******************** Envelopes *********************** */   
    /*  envelopes */
    http.get('/api/envelopes', () => {
        return HttpResponse.json({ categories: envelopes });
    }),
    http.post('/api/envelopes', async ({ request }) => {
        let body: any = {};

        try {
            body = await request.json();
        } catch {
            try {
                const text = await request.text();
                body = text ? JSON.parse(text) : {};
            } catch {
                body = {};
            }
        }

        const name = typeof body?.name === 'string' ? body.name.trim() : '';
        if (!name) return HttpResponse.json({ error: 'name required' }, { status: 400 });

        const created: SpendingCategory = {
            id: `env_${Math.random().toString(16).slice(2)}`,
            name: body.name.trim(),
        };

        envelopes = [created, ...envelopes];
        return HttpResponse.json(created, { status: 201 });
    }),
    /* ******************** Transactions *********************** */   
    /* transactions */
    http.get('/api/transactions', ({ request }) => {
        const url = new URL(request.url);
        const cat = url.searchParams.get('cat');
       
        if (!cat || cat === 'all') return HttpResponse.json(transactions);
        return HttpResponse.json(transactions.filter((t) => t.cat === cat));
    }),
    http.patch('/api/transactions/:id', async ({ params, request }) => {
        patchCounter += 1;
        const id = String(params.id);
        const body = (await request.json()) as { envelopeId?: unknown };

        const idx = transactions.findIndex((t) => t.id === id);
        if (idx === -1) return HttpResponse.json({ error: 'not found' }, { status: 404 });

        // Contract: allow string or null
        const next = body.envelopeId === null || typeof body.envelopeId === 'string'
        ? (body.envelopeId as string | null)
        : undefined;

        if (next === undefined) {
        return HttpResponse.json({ error: 'invalid envelopeId' }, { status: 400 });
        }

        // enforce “payments only”
        if (transactions[idx].cat !== 'payments') {
        return HttpResponse.json({ error: 'envelopeId allowed for payments only' }, { status: 409 });
        }

        transactions[idx] = { ...transactions[idx], envelopeId: next };
        return HttpResponse.json(transactions[idx]);
    }),
    // transactions endpoint
    http.post(`${BACKEND_URL}/api/transactions`, async ({ request }) => {
        lastTransactionsBody = await request.json();
        const count = Array.isArray(lastTransactionsBody) ? lastTransactionsBody.length : 0;
        return HttpResponse.json({ count }, { status: 200 });
    }),
    http.delete('/api/transactions/:id', ({ params }) => {
        const id = String(params.id);

        const idx = transactions.findIndex((t) => t.id === id);
        if (idx === -1) return HttpResponse.json({ error: 'not found' }, { status: 404 });

        transactions = transactions.filter((t) => t.id !== id);

        // 204 is typical for delete
        return new HttpResponse(null, { status: 204 });
    }),
    /* ******************** Upload Ranges *********************** */
    http.get('/api/uploads/ranges', () => {
        return HttpResponse.json({ ranges: savedUploadRanges });
    }),
    http.get(`${BACKEND_URL}/api/uploads/ranges`, () => {
        return HttpResponse.json({ ranges: savedUploadRanges });
    }),
    /* ******************** Uploads *********************** */   
    /* NextJS proxy upload handler - forwards to backend */
    http.post(`/api/upload`, async ({ request }) => {
        // In test environment, we don't strictly need to validate the FormData.
        // If it's a POST request, assume it has a file and return success.
        // This allows the tests to not be brittle about FormData parsing.
        
        return HttpResponse.json(
            { 
                id: `u-${Math.random().toString(36).slice(2, 9)}`,
                datetime: new Date().toISOString(),
                stored: true,
            },
            { status: 200 }
        );
    }),
    
    /* NextJS proxy parse handler - forwards to backend */
    http.post(`/api/upload/parse`, async ({ request }) => {
        const url = new URL(request.url);
        const uploadFromQuery = url.searchParams.get('uploadId');
    
        const body = (await request.json().catch(() => ({}))) as any;
        const uploadId = uploadFromQuery ?? body.uploadId;
    
        if (!uploadId) {
            return HttpResponse.json({ detail: 'Missing uploadId'}, { status: 400 });
        }

        // Return parsed transactions
        return HttpResponse.json(
            {
                rows: [
                    { id: `${Math.random()}`, date: '2026-01-01', payee: 'Coffee Shop', amount: -4.5, cat: 'payments', uploadId },
                    { id: `${Math.random()}`, date: '2026-01-02', payee: 'Employer Inc', amount: 2500, cat: 'deposits', uploadId },
                    { id: `${Math.random()}`, date: '2026-01-03', payee: 'Grocery Store', amount: -45.32, cat: 'payments', uploadId },
                ],
            },
            { status: 200 }
        );
    }),

    /* Backend upload endpoint */
    http.post(`${BACKEND_URL}/api/upload`, async ({ request }) => {
        const contentType = request.headers.get('content-type');
        if (!contentType?.startsWith('multipart/form-data')) {
            return HttpResponse.json({ detail: 'multipart/form-data required' }, { status: 400 });
        }

        let filesCount = 0;
        try {
            const fd = await request.clone().formData();
            const files = fd.getAll("statement");
            filesCount = files.length;
        } catch {
            filesCount = 0;
        }

        if (!filesCount) {
            return HttpResponse.json({ detail: 'No files provided' }, { status: 400 });
        }

        lastUploadCount = filesCount;
    
        // Return upload response indicating successful storage
        return HttpResponse.json(
            { 
                id: `u-${Math.random().toString(36).slice(2, 9)}`, 
                datetime: new Date().toISOString(),
                stored: true,
            },
            { status: 201 }
        );
    }),

    /* Backend parse endpoint */
    http.post(`${BACKEND_URL}/api/upload/parse`, async ({ request }) => {
        const url = new URL(request.url);
        const uploadFromQuery = url.searchParams.get('uploadId');
        const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
        const uploadId = uploadFromQuery ?? body?.uploadId;

        if (!uploadId) {
            return HttpResponse.json({ detail: 'Missing uploadId' }, { status: 400 });
        }
    
        // Return parsed transactions with realistic data
        return HttpResponse.json({
            rows: [
                { id: `${Math.random()}`, date: '2026-01-01', payee: 'Coffee Shop', amount: -4.5, cat: 'payments', uploadId },
                { id: `${Math.random()}`, date: '2026-01-02', payee: 'Employer Inc', amount: 2500, cat: 'deposits', uploadId },
                { id: `${Math.random()}`, date: '2026-01-03', payee: 'Grocery Store', amount: -45.32, cat: 'payments', uploadId },
                { id: `${Math.random()}`, date: '2026-01-04', payee: 'Gas Station', amount: -52.18, cat: 'payments', uploadId },
                { id: `${Math.random()}`, date: '2026-01-05', payee: 'Electric Co', amount: -120.00, cat: 'payments', uploadId },
            ],
        }, { status: 200 });
    }),
];
    
// Useful for tests that need a clean slate
export function ___getPatchCount() {
    return patchCounter;
}
    
export function ___resetMswData() {
    patchCounter = 0;
    lastUploadCount = 0;
    savedUploadRanges = [];
    
    envelopes = [
        { id: 'env_1', name: 'Rent' },
        { id: 'env_2', name: 'Groceries' },
    ];
    transactions = [
        { id: 't_1', date: '2026-01-01', payee: 'Coffee', amount: -4.5, cat: 'payments', envelopeId: 'env_5', uploadId: 'stmt_2501' },
        { id: 't_2', date: '2026-01-02', payee: 'Employer', amount: 2500, cat: 'deposits', envelopeId: 'env_3', uploadId: 'stmt_2501' },
        { id: 't_3', date: '2026-01-03', payee: 'Market', amount: -32.1, cat: 'payments', envelopeId: 'env_2', uploadId: 'stmt_2501' },
    ];
}