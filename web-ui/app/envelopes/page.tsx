'use client';

import useSWR from 'swr';
import fetcher from '@/app/lib/fetcher';
import type { SpendingCategory } from '@/app/lib/types';
import EnvelopeForm from '@/app/components/envelopes/EnvelopeForm';

type EnvelopesResponse = { categories: SpendingCategory[] };

export default function EnvelopesPage() {
  const { data, mutate, isLoading } = useSWR<EnvelopesResponse>('/api/envelopes', fetcher);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Envelope Balances</h1>

      <EnvelopeForm
        onCreate={async ({ name, monthlyAmount }) => {
          await fetch('/api/envelopes', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ name, monthlyAmount }),
          });

          await mutate(); // re-fetch GET /api/envelopes
        }}
        disabled={isLoading}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data?.categories?.map((cat) => (
          <div key={cat.id} className="p-4 bg-white rounded shadow">
            <h2 className="font-semibold">{cat.name}</h2>

            {'percentage' in cat && typeof cat.percentage === 'number' && (
              <p>Allocation: {cat.percentage}%</p>
            )}

            {'balance' in cat && typeof cat.balance === 'number' && (
              <p>Balance: ${cat.balance.toFixed(2)}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
