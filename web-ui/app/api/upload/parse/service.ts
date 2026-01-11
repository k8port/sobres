// app/api/upload/service.ts

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8000';

export interface ParseUploadResult {
    rows: Array<Record<string, unknown>>;
}

export async function parseUploadById(uploadId: string): Promise<Response> {
    return fetch(`${BACKEND_URL}/api/upload/parse?uploadId=${encodeURIComponent(uploadId)}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ uploadId }),
    });
}

export async function parseStatement(file: File): Promise<ParseUploadResult> {
    const form = new FormData();
    form.append('statement', file);

    const res = await fetch('/api/upload', { method: 'POST', body: form });

    // Try JSON first, but capture text fallback for error messages
    let body: any = null;
    let rawText = '';
    const contentType = res.headers.get('content-type') ?? '';

    try {
        if (contentType.includes('application/json')) {
            body = await res.json();
        } else {
            rawText = await res.text();
        }
    } catch {
        /* ignore parse errors; we'll handle below */
    }

    if (!res.ok) {
        const message =
            (body && (body.detail || body.error)) ||
            rawText ||
            'Failed to upload file';
        throw new Error(message);
    }

    if (!body || typeof body !== 'object' || typeof body.id !== 'string' || typeof body.datetime !== 'string') {
        throw new Error('Malformed upload response');
    }

    return { rows: body.rows };
}
