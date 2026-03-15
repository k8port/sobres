// app/api/transactions/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8000';

export async function GET(request: NextRequest) {
    try {
        const cat = request.nextUrl.searchParams.get('cat') ?? '';
        const url = `${BACKEND_URL}/api/transactions?cat=${encodeURIComponent(cat)}`;
        const response = await fetch(url);
        const text = await response.text();

        return new NextResponse(text, {
            status: response.status,
            headers: { 'content-type': response.headers.get('content-type') ?? 'application/json' },
        });
    } catch (error) {
        console.error('Proxy GET /api/transactions error:', error);
        return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const id = request.nextUrl.pathname.split('/').pop();
        const response = await fetch(`${BACKEND_URL}/api/transactions/${id}`, { method: 'DELETE' });
        return new NextResponse(null, { status: response.status });
    } catch (error) {
        console.error('Proxy DELETE /api/transactions error:', error);
        return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 });
    }
}