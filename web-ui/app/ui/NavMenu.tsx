import Link from 'next/link';

export default function NavMenu({ enabled }: { enabled: boolean }) {
  if (!enabled) return null;

  return (
    <nav aria-label="Primary" className="mt-6 flex gap-4">
      <Link href="/transactions" className="underline">Transactions</Link>
      <Link href="/payments" className="underline">Payments</Link>
      <Link href="/deposits" className="underline">Deposits</Link>
      <Link href="/envelopes" className="underline">Envelopes</Link>
    </nav>
  );
}
