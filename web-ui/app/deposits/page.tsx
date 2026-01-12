import TransactionsView from '@/app/ui/transactions/TransactionsView';

export default function DepositsPage() {
  return <TransactionsView title="Deposits" cat="deposits" withEnvelopes={false} />;
}
