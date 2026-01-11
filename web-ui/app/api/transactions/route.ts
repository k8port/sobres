// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8000';

export async function POST(request: NextRequest) {
    try {
        const incoming = await request.formData();

        const hasFileKey = incoming.get('file') as File | null;
        const hasStatementKey = incoming.get('statement') as File | null;
        const file = hasFileKey || hasStatementKey;
    
        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const formData = new FormData();
        const forwardKey = hasFileKey ? 'file' : 'statement';
        formData.append(forwardKey, file, file.name);

        const targetA = `${BACKEND_URL}/api/upload/`;
        const targetB = `${BACKEND_URL}/api/upload`;

        let response = await fetch(targetA, {
            method: 'POST',
            body: formData,
        });

        if (response.status === 418) {
            response = await fetch(targetB, {
                method: 'POST',
                body: formData,
            });
        }

        const text = await response.text();
        
        return new NextResponse(text, {
            status: response.status,
            headers: {
                "content-type": response.headers.get("content-type") ?? "application/json",
            },
        });
    } catch (error) {
        console.error('Proxy / API / Upload error:', error);
        return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
    }
}