import { NextRequest, NextResponse } from 'next/server';

const BACKEND = process.env.BACKEND_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
    const result = await fetch(`${BACKEND}/api/auth/me`, {
        headers: Object.fromEntries(request.headers),
    });
    return NextResponse.json(result.ok ? await result.json() : null, { status: result.status });
}