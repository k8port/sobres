// app/api/uploads/ranges/route.ts
import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8000';

// Prevent Next.js from caching this route handler response
export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const response = await fetch(`${BACKEND_URL}/api/uploads/ranges`, {
            method: 'GET',
            cache: 'no-store',
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
