'use client';

import React, { useState } from 'react';

export type EnvelopeFormValues = {
  name: string;
  monthlyAmount?: number;
};

export default function EnvelopeForm({
  onCreate,
  disabled = false,
}: {
  onCreate: (values: EnvelopeFormValues) => Promise<void> | void;
  disabled?: boolean;
}) {
  const [name, setName] = useState('');

  return (
    <form
      className="mb-4 flex gap-2 items-end"
      onSubmit={async (e) => {
        e.preventDefault();
        const trimmed = name.trim();
        if (!trimmed) return;

        await onCreate({ name: trimmed });
        setName('');
      }}
    >
      <div className="flex flex-col">
        <label htmlFor="envelope-name" className="text-sm font-medium">
          Envelope Name
        </label>
        <input
          id="envelope-name"
          aria-label="Envelope Name"
          className="border rounded p-2 text-sm"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={disabled}
        />
      </div>

      <button
        type="submit"
        className="border rounded px-3 py-2 text-sm"
        disabled={disabled}
      >
        Add Envelope
      </button>
    </form>
  );
}
