// app/api/uploads/ranges/route.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8000';

// Prevent Next.js from caching this route handler response
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const headers = new Headers(request.headers);
        if (!headers.get('x-user-id') && process.env.NODE_ENV !== 'production') {
            headers.set('x-user-id', 'dev-user-1');
        }

        const response = await fetch(`${BACKEND_URL}/api/uploads/ranges`, {
            method: 'GET',
            cache: 'no-store',
            headers,
        });

        const text = await response.text();
        return new NextResponse(text, {
            status: response.status,
            headers: {
                'content-type':
                    response.headers.get('content-type') ?? 'application/json',
            },
        });
    } catch {
        return NextResponse.json({ ranges: [] }, { status: 200 });
    }
}
