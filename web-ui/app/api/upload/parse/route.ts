// app/api/upload/parse/route.ts
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

export async function POST(req: NextRequest) {
    
    const { searchParams } = new URL(req.url);
    const uploadId = searchParams.get("uploadId");

    if (!uploadId) {
        return NextResponse.json({ detail: "Missing uploadId" }, { status: 400 });
    }

    try {
        const response = await fetch(`${BACKEND_URL}/api/upload/parse?uploadId=${encodeURIComponent(uploadId)}`, {
            method: "POST",
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ uploadId }),
        });

        const contentType = response.headers.get('content-type') ?? '';
        if (contentType.includes('application/json')) {
            const json = await response.json();
            return NextResponse.json(json, { status: response.status });
        }
        const text = await response.text();
        return new Response(text, { status: response.status });
    } catch (e: any) {
        return NextResponse.json({ detail: "Proxy error" }, { status: 502 });
    }
}
