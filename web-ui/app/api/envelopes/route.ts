import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ error: 'Not implemented (use backend or MSW in tests)' }, { status: 501 });
}

export async function POST() {
  return NextResponse.json({ error: 'Not implemented (use backend or MSW in tests)' }, { status: 501 });
}
