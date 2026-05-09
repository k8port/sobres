import Link from 'next/link';

export default function NavMenu({ enabled }: { enabled: boolean }) {
  if (!enabled) return null;

  return (
    <nav aria-label="Primary" className="mt-6 flex gap-12 font-bold font-slackey text-arcticblue text-xs">
      <Link href="/transactions">Transactions</Link>
      <Link href="/envelopes">Envelopes</Link>
      <Link href="/payments">Payments</Link>
      <Link href="/deposits">Deposits</Link>
    </nav>
  );
}
