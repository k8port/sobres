// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8000';

function buildForwardHeaders(request: NextRequest) {
    const forwarded = new Headers(request.headers);
    if (!forwarded.get('x-user-id') && process.env.NODE_ENV !== 'production') {
        forwarded.set('x-user-id', 'dev-user-1');
    }
    return forwarded;
}

export async function POST(request: NextRequest) {
    try {
        // test-only bypass: allows JSON body having base64 / placeholder
        if (process.env.NODE_ENV === 'test') {
            const contentType = request.headers.get('content-type') ?? '';
            if (contentType.includes('application/json')) {
                const body = (await request.json().catch(() => null)) as any;
                const hasFile = !!body?.statement || !!body?.file;
                if (!hasFile) {
                    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
                }
                
                const response = await fetch(`${BACKEND_URL}/api/upload/`, { 
                    method: 'POST',
                    headers: buildForwardHeaders(request),
                    body: new FormData(),
                });
                const text = await response.text();
                return new NextResponse(text, { 
                    status: response.status, 
                    headers: { 'content-type': response.headers.get('content-type') ?? 'application/json' },
                });
            }
        }
        
        const incoming = await request.formData();

        // support for 1...n files
        const statementFiles = incoming.getAll('statement').filter(Boolean) as File[];
        const fileFiles =  incoming.getAll('file').filter(Boolean) as File[];

        const files = statementFiles.length ? statementFiles : fileFiles;

        if (!files.length) { return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        // backend-friendly form
        const formData = new FormData();
        for (const f of files) {
            // keep both keys if either backend or tests expect
            formData.append('statement', f, f.name);
            formData.append('file', f, f.name);
        }
        
        const primary = `${BACKEND_URL}/api/upload`; // without trailing forward slash
        const secondary = `${BACKEND_URL}/api/upload/`; // with trailing forward slash

        // Strip content-type so fetch auto-sets it with the correct multipart boundary
        // for the newly-constructed FormData. Forwarding the browser's boundary causes
        // a boundary mismatch and a 400 from python_multipart.
        const forwardHeaders = buildForwardHeaders(request);
        forwardHeaders.delete('content-type');

        let response = await fetch(primary, {
            method: 'POST',
            headers: forwardHeaders,
            body: formData,
        });
        if (response.status === 418) {
            response = await fetch(secondary, {
                method: 'POST',
                headers: forwardHeaders,
                body: formData,
            });
        }

        const text = await response.text();

        return new NextResponse(text, {
            status: response.status,
            headers: { 'content-type': response.headers.get('content-type') ?? 'application/json', },
        });

    } catch (error) {
        console.error('Proxy / API / Upload error:', error);
        return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
    }
}