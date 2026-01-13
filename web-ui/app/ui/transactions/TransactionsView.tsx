'use client';

import { useEffect, useMemo, useState } from 'react';
import TransactionsTable from '@/app/ui/transactions/TransactionsTable';
import type { SpendingCategory } from '@/app/lib/types';
import { getEnvelopes } from '@/app/api/envelopes/service';
import { getTransactions, type TransactionRow } from '@/app/api/transactions/service';

type Props = {
  title: string;
  cat: 'payments' | 'deposits' | 'all';
  withEnvelopes?: boolean; // true for payments + all, false for deposits
};

export default function TransactionsView({ title, cat, withEnvelopes = false }: Props) {
  const [rows, setRows] = useState<TransactionRow[]>([]);
  const [envelopes, setEnvelopes] = useState<SpendingCategory[]>([]);
  const [envelopeByTransId, setEnvelopeByTransId] = useState<Record<string, string | null>>({});
  const [notesById, setNotesById] = useState<Record<string, string>>({});
  const [isSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const txPromise = getTransactions(cat);
      const envPromise = withEnvelopes ? getEnvelopes() : Promise.resolve({ categories: [] as SpendingCategory[] });

      const [tx, env] = await Promise.all([txPromise, envPromise]);
      if (cancelled) return;

      setRows(tx);
      setEnvelopes(env.categories);

      const map: Record<string, string | null> = {};
      for (const r of tx) map[r.id] = r.envelopeId ?? null;
      setEnvelopeByTransId(map);
    })();

    return () => {
      cancelled = true;
    };
  }, [cat, withEnvelopes]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">{title}</h1>

      <TransactionsTable
        rows={rows as unknown as Record<string, unknown>[]}
        notesById={notesById}
        isSaving={isSaving}
        onNotesChange={(id, value) => setNotesById((m) => ({ ...m, [String(id)]: value }))}
        envelopes={withEnvelopes ? envelopes : []}
        envelopeByTransId={withEnvelopes ? envelopeByTransId : {}}
      />
    </div>
  );
}
