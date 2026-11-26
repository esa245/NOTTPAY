'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import {
  formatBDT,
  isOutgoingTransaction,
  Transaction,
  TRANSACTION_LABELS,
} from '@/lib/wallet-types';
import TransactionList from './TransactionList';

interface ActivityViewProps {
  transactions: Transaction[];
  onSelectTransaction: (tx: Transaction) => void;
}

type ActivityFilter = 'all' | 'in' | 'out';

export default function ActivityView({
  transactions,
  onSelectTransaction,
}: ActivityViewProps) {
  const [filter, setFilter] = useState<ActivityFilter>('all');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return transactions.filter((tx) => {
      const outgoing = isOutgoingTransaction(tx.type);
      if (filter === 'in' && outgoing) return false;
      if (filter === 'out' && !outgoing) return false;
      if (!normalized) return true;
      const label = TRANSACTION_LABELS[tx.type].toLowerCase();
      return (
        tx.recipient.toLowerCase().includes(normalized) ||
        label.includes(normalized) ||
        (tx.note && tx.note.toLowerCase().includes(normalized)) ||
        tx.reference.toLowerCase().includes(normalized)
      );
    });
  }, [transactions, filter, query]);

  const totalNet = useMemo(
    () =>
      filtered.reduce(
        (acc, tx) =>
          isOutgoingTransaction(tx.type) ? acc - tx.amount : acc + tx.amount,
        0
      ),
    [filtered]
  );

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-col gap-3 px-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-[#201735]">
            Activity
          </h2>
          <p className="mt-1 text-xs text-[#6e6580]">
            Your recent wallet activity. Tap any row to view its receipt.
          </p>
        </div>

        {filtered.length > 0 && (
          <p className="font-mono text-xs font-semibold text-[#5c536f] tabular-nums">
            {filtered.length} {filtered.length === 1 ? 'item' : 'items'}
            <span aria-hidden="true"> · </span>
            Net {totalNet >= 0 ? '+' : '−'} {formatBDT(Math.abs(totalNet))}
          </p>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col gap-3 rounded-[20px] bg-white p-3.5 shadow-[0_5px_18px_rgba(51,32,91,0.04)] sm:flex-row sm:items-center sm:justify-between">
        <div
          role="tablist"
          aria-label="Filter transactions"
          className="grid grid-cols-3 gap-1 rounded-xl bg-[#f4f0fa] p-1 sm:w-64"
        >
          {(
            [
              { id: 'all', label: 'All' },
              { id: 'in', label: 'Money In' },
              { id: 'out', label: 'Money Out' },
            ] as const
          ).map((tab) => {
            const active = filter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(tab.id)}
                className={`min-h-[38px] whitespace-nowrap rounded-lg px-3 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6d28d9]/40 ${
                  active
                    ? 'bg-white text-[#6d28d9] shadow-sm'
                    : 'text-[#6e6580] hover:text-[#201735]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <label className="relative flex-1 sm:max-w-xs">
          <span className="sr-only">Search transactions</span>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b8499]"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search recipient, note, or ref"
            className="h-11 w-full rounded-xl border border-[#e9e3f1] bg-[#fcfbfe] pl-9 pr-3 text-xs text-[#201735] outline-none transition-colors placeholder:text-[#8b8499] focus:border-[#9b78e8] focus:ring-3 focus:ring-[#8b5cf6]/10"
          />
        </label>
      </div>

      <TransactionList
        transactions={filtered}
        onSelectTransaction={onSelectTransaction}
        emptyTitle={
          transactions.length === 0
            ? 'No transactions yet'
            : 'No matching activity'
        }
        emptySubtitle={
          transactions.length === 0
            ? 'Use Send Money, Add Money, or Scan & Pay to see activity here.'
            : 'Try clearing your search or switching the filter tab.'
        }
      />
    </div>
  );
}
