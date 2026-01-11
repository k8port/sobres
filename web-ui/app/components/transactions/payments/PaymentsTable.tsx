'use client';

import React, { useEffect, useState } from 'react';
import TransactionsTable from '@/app/components/transactions/TransactionsTable';
import type { SpendingCategory } from '@/app/lib/types';
import { getEnvelopes } from '@/app/api/envelopes/service';
import { getTransactions, patchTransaction, type TransactionRow } from '@/app/api/transactions/service';

export default function PaymentsTable() {
  const [isSaving, setIsSaving] = useState(false);
  const [rows, setRows] = useState<TransactionRow[]>([]);
  const [envelopes, setEnvelopes] = useState<SpendingCategory[]>([]);
  const [envelopeByTransId, setEnvelopeByTransId] = useState<Record<string, string | null>>({});
  const [notesById, setNotesById] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [env, tx] = await Promise.all([getEnvelopes(), getTransactions('payments')]);
      if (cancelled) return;

      setEnvelopes(env.categories);
      setRows(tx);

      const map: Record<string, string | null> = {};
      for (const r of tx) map[r.id] = r.envelopeId ?? null;
      setEnvelopeByTransId(map);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const onEnvelopeChange = async (transId: string | number, envelopeId: string | null) => {
    const id = String(transId);

    const prev = envelopeByTransId[id] ?? null;
    setEnvelopeByTransId((m) => ({ ...m, [id]: envelopeId }));
    setIsSaving(true);

    try {
      const updated = await patchTransaction(id, { envelopeId });
      setRows((rs) => rs.map((r) => (r.id === id ? updated : r)));
      setEnvelopeByTransId((m) => ({ ...m, [id]: updated.envelopeId ?? null }));
    } catch (e) {
      setEnvelopeByTransId((m) => ({ ...m, [id]: prev }));
      throw e;
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <TransactionsTable
      rows={rows as unknown as Record<string, unknown>[]}
      notesById={notesById}
      isSaving={isSaving}
      onNotesChange={(id, value) => setNotesById((m) => ({ ...m, [String(id)]: value }))}
      envelopes={envelopes}
      envelopeByTransId={envelopeByTransId}
      onEnvelopeChange={onEnvelopeChange}
    />
  );
}
