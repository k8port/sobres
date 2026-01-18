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
    { id: 't_1', date: '2025-01-01', payee: 'Coffee', amount: -4.5, cat: 'payments', envelopeId: null, uploadId: 'stmt_2501' },
    { id: 't_2', date: '2025-01-02', payee: 'Employer', amount: 2500, cat: 'deposits', uploadId: 'stmt_2501' },
    { id: 't_3', date: '2025-01-03', payee: 'Market', amount: -230.1, cat: 'payments', envelopeId: 'env_2', uploadId: 'stmt_2501' },
];


let patchCounter = 0;

export let lastUploadCount = 0;
export function clearUploadCaptured() { lastUploadCount = 0; }

export let lastTransactionsBody: any = null;
export function clearCaptured() { lastTransactionsBody = null; }

// python backend handlers
export const handlers = [
    
    //  envelopes
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

    // transactions
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

    // unblocking handler
    http.post(`/api/upload`, async () => {
        const rows = [
            { id: 't_1', date: '2026-01-01', description: 'Coffee', amount: -4.5, payee: 'Kroger', cat: 'payments' },
            { id: 't_2', date: '2026-01-02', payee: 'The Man', amount: 2500, cat: 'deposits' },
        ]
        return HttpResponse.json(
            {
                id: 'stmt_1',
                datetime: new Date().toISOString(),
                rows,
                stored: true,
                processed: true,
                savedCount: rows.length
            },
            { status: 200 }
        );
    }),
    http.post(`/api/upload/parse`, async ({ request }) => {
        // UI calls using ?uploadId=... and/or JSON body
        const url = new URL(request.url);
        const uploadFromQuery = url.searchParams.get('uploadId');

        const body = (await request.json().catch(() => ({}))) as any;
        const uploadId = uploadFromQuery ?? body.uploadId;

        if (!uploadId) {
            return HttpResponse.json({ detail: 'Missing uploadId'}, { status: 400 });
        }

        return HttpResponse.json(
            {
                rows: [
                    { id: 1, date: '2024-01-01', description: 'Coffee', amount: 3.23, payee: 'Kroger', notes: '' },
                ],
            },
            { status: 200 }
        );
    }),
    // upload endpoint
    http.post(`${BACKEND_URL}/api/upload/`, async ({ request }) => {
        const contentType = request.headers.get('content-type');
        if (!contentType?.startsWith('multipart/form-data')) {
            return HttpResponse.json({ detail: 'multipart/form-data required' }, { status: 400 });
        }

        return HttpResponse.json(
            { id: 'u-123', datetime: '2025-08-10T12:00:00Z' },
            { status: 201, headers: { 'Content-Type': 'application/json' } }
        );
    }),

    // parse endpoint
    http.post(`${BACKEND_URL}/api/upload/parse`, async ({ request }) => {
        const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
        if (!body?.uploadId) {
            return HttpResponse.json({ detail: 'Missing uploadId' }, { status: 400 });
        }

        return HttpResponse.json({
            rows: [
                { id: 1, date: '2024-01-02', description: 'Coffee', amount: 3.23 },
                { id: 2, date: '2024-01-03', description: 'Lunch', amount: 12.34 },
                { id: 3, date: '2024-01-04', description: 'Dinner', amount: 23.45 },
                { id: 4, date: '2024-01-05', description: 'Groceries', amount: 34.56 },
                { id: 5, date: '2024-01-06', description: 'Gas', amount: 45.67 },
                { id: 6, date: '2024-01-07', description: 'Entertainment', amount: 56.78 },
                { id: 7, date: '2024-01-08', description: 'Rent', amount: 67.89 },
            ],
        }, { status: 200, headers: { 'Content-Type': 'application/json' } });
    }),

    // transactions endpoint
    http.post(`${BACKEND_URL}/api/transactions`, async ({ request }) => {
        lastTransactionsBody = await request.json().catch(() => null);
        return HttpResponse.json({ ok: true }, { status: 200 });
    }),
    http.delete('/api/transactions/:id', ({ params }) => {
        const id = String(params.id);

        const idx = transactions.findIndex((t) => t.id === id);
        if (idx === -1) return HttpResponse.json({ error: 'not found' }, { status: 404 });

        transactions = transactions.filter((t) => t.id !== id);

        // 204 is typical for delete
        return new HttpResponse(null, { status: 204 });
    }),

    http.post('/api/upload', async ({ request }) => {
    const form = await request.formData();
    const files = form.getAll('statement');
    lastUploadCount = files.length;

    if (!files.length) {
      return HttpResponse.json({ error: 'No file' }, { status: 400 });
    }

    return HttpResponse.json({
      stored: true,
      processed: true,
      transactionCount: 5,
    });
  }),
];


// Useful for tests that need a clean slate
export function ___getPatchCount() {
    return patchCounter;
}

export function ___resetMswData() {
    patchCounter = 0;
    lastUploadCount = 0;

    envelopes = [
      { id: 'env_1', name: 'Rent' },
      { id: 'env_2', name: 'Groceries' },
    ];
    transactions = [
      { id: 't_1', date: '2026-01-01', payee: 'Coffee', amount: -4.5, cat: 'payments', envelopeId: null, uploadId: 'stmt_2501' },
      { id: 't_2', date: '2026-01-02', payee: 'Employer', amount: 2500, cat: 'deposits', uploadId: 'stmt_2501' },
      { id: 't_3', date: '2026-01-03', payee: 'Market', amount: -32.1, cat: 'payments', envelopeId: 'env_2', uploadId: 'stmt_2501' },
    ];
}