'use client';

import {
  ArrowDownToLine,
  ArrowUpRight,
  Plus,
  ReceiptText,
  Smartphone,
  Store,
} from 'lucide-react';
import {
  formatBDT,
  formatDateLabel,
  formatTimeShort,
  isOutgoingTransaction,
  Transaction,
  TRANSACTION_LABELS,
  TransactionType,
} from '@/lib/wallet-types';

interface TransactionListProps {
  transactions: Transaction[];
  onSelectTransaction: (tx: Transaction) => void;
  emptyTitle?: string;
  emptySubtitle?: string;
}

function TransactionIcon({ type }: { type: TransactionType }) {
  switch (type) {
    case 'send':
      return <ArrowUpRight className="h-[18px] w-[18px]" aria-hidden="true" />;
    case 'add':
      return <Plus className="h-[18px] w-[18px]" aria-hidden="true" />;
    case 'cashout':
      return <ArrowDownToLine className="h-[18px] w-[18px]" aria-hidden="true" />;
    case 'payment':
      return <Store className="h-[18px] w-[18px]" aria-hidden="true" />;
    case 'recharge':
      return <Smartphone className="h-[18px] w-[18px]" aria-hidden="true" />;
    case 'bills':
      return <ReceiptText className="h-[18px] w-[18px]" aria-hidden="true" />;
  }
}

export default function TransactionList({
  transactions,
  onSelectTransaction,
  emptyTitle = 'No transactions yet',
  emptySubtitle = 'Your activity will appear here.',
}: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <div className="rounded-[20px] bg-white px-4 py-8 text-center shadow-[0_5px_18px_rgba(51,32,91,0.04)]">
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f4f0fa] text-[#8b7aa8]">
          <ReceiptText className="h-5 w-5" aria-hidden="true" />
        </div>
        <p className="text-sm font-semibold text-[#201735]">{emptyTitle}</p>
        <p className="mt-1 text-xs text-[#6e6580]">{emptySubtitle}</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-[#f2eff6] rounded-[20px] bg-white px-4 shadow-[0_5px_18px_rgba(51,32,91,0.04)]">
      {transactions.map((tx) => {
        const outgoing = isOutgoingTransaction(tx.type);
        const label = TRANSACTION_LABELS[tx.type];

        return (
          <button
            key={tx.id}
            type="button"
            onClick={() => onSelectTransaction(tx)}
            className="flex min-h-[60px] w-full items-center gap-3 py-3 text-left transition-colors hover:bg-[#faf8fd] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6d28d9]/40"
          >
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] ${
                outgoing
                  ? 'bg-[#fff0f5] text-[#df4d91]'
                  : 'bg-[#e8f8f1] text-[#159b70]'
              }`}
            >
              <TransactionIcon type={tx.type} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-[#201735]">
                {label}
              </p>
              <p className="mt-0.5 truncate text-[11px] text-[#6e6580]">
                {tx.recipient}
                <span aria-hidden="true"> · </span>
                {formatTimeShort(tx.date)}
              </p>
            </div>

            <div className="shrink-0 text-right">
              <p
                className={`font-mono text-[13px] font-semibold tabular-nums ${
                  outgoing ? 'text-[#201735]' : 'text-[#159b70]'
                }`}
              >
                {outgoing ? '−' : '+'} {formatBDT(tx.amount)}
              </p>
              <p className="mt-0.5 text-[10px] text-[#6e6580]">
                {formatDateLabel(tx.date)}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
