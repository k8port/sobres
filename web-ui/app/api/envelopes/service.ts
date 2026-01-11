import type { SpendingCategory } from '@/app/lib/types';

export type EnvelopesResponse = { categories: SpendingCategory[] };

export async function getEnvelopes(): Promise<EnvelopesResponse> {
  const res = await fetch('/api/envelopes', { method: 'GET' });
  if (!res.ok) throw new Error(`GET /api/envelopes failed: ${res.status}`);
  return (await res.json()) as EnvelopesResponse;
}

export type CreateEnvelopeBody = {
  name: string;
  monthlyAmount?: number;
};

export async function createEnvelope(body: CreateEnvelopeBody): Promise<SpendingCategory> {
  const res = await fetch('/api/envelopes', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: body.name, monthlyAmount: body.monthlyAmount }),
  });

  if (!res.ok) throw new Error(`POST /api/envelopes failed: ${res.status}`);
  return (await res.json()) as SpendingCategory;
}
