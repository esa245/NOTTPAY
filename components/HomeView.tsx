'use client';

import {
  ArrowDownToLine,
  ArrowRight,
  Eye,
  EyeOff,
  Plus,
  QrCode,
  ReceiptText,
  Smartphone,
  Sparkles,
  Star,
  Store,
  Wallet,
} from 'lucide-react';
import {
  formatBDT,
  ModalType,
  PageTab,
  Transaction,
  WalletProfile,
} from '@/lib/wallet-types';
import TransactionList from './TransactionList';

interface HomeViewProps {
  profile: WalletProfile;
  balance: number;
  showBalance: boolean;
  onToggleBalance: () => void;
  transactions: Transaction[];
  onNavigate: (page: PageTab) => void;
  onOpenModal: (modal: ModalType) => void;
  onSelectTransaction: (tx: Transaction) => void;
}

export default function HomeView({
  profile,
  balance,
  showBalance,
  onToggleBalance,
  transactions,
  onNavigate,
  onOpenModal,
  onSelectTransaction,
}: HomeViewProps) {
  const firstName =
    profile.name.trim() === 'NOTTPAY User' || !profile.name.trim()
      ? 'there!'
      : profile.name.trim().split(/\s+/)[0];

  const totalAdded = transactions
    .filter((t) => t.type === 'add')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalSpent = transactions
    .filter((t) => t.type !== 'add')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-6 lg:grid lg:grid-cols-12 lg:items-start lg:gap-7 lg:space-y-0">
      {/* Left / Primary Column */}
      <div className="space-y-6 lg:col-span-7">
        {/* Greeting */}
        <section className="px-1">
          <p className="text-xs font-semibold tracking-wide text-[#6e6580]">
            Welcome back
          </p>
          <h1 className="mt-1 text-[26px] font-extrabold tracking-tight text-[#201735] sm:text-3xl">
            Hello, <span className="text-[#6d28d9]">{firstName}</span>
          </h1>
        </section>

        {/* Hero Wallet Card */}
        <section className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#32165f] via-[#6d28d9] to-[#bd3fba] p-6 text-white shadow-[0_16px_30px_rgba(109,40,217,0.22)]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-14 -top-24 h-56 w-56 rounded-full border border-white/15"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-28 -right-8 h-44 w-44 rounded-full border border-white/15"
          />

          <div className="relative z-10 flex items-center justify-between gap-4">
            <p className="text-[11px] font-bold tracking-wider text-[#e9ddff]">
              NOTTPAY <span aria-hidden="true">·</span> Digital Wallet{' '}
              <span aria-hidden="true">·</span> Simple &amp; Secure
            </p>
            <button
              type="button"
              onClick={onToggleBalance}
              aria-label={showBalance ? 'Hide balance' : 'Show balance'}
              className="flex min-h-[36px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg bg-white/15 px-3 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              {showBalance ? (
                <>
                  <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Hide</span>
                </>
              ) : (
                <>
                  <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Show</span>
                </>
              )}
            </button>
          </div>

          <div className="relative z-10 mt-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-[#e9ddff]">
                Available demo balance
              </p>
              <p className="mt-1 font-mono text-3xl font-bold tracking-tight tabular-nums sm:text-4xl">
                {showBalance ? formatBDT(balance) : '৳ ••••••'}
              </p>
              <h2 className="mt-4 max-w-xs text-lg font-bold leading-snug tracking-tight text-white sm:text-xl">
                Your money. Your way.
              </h2>
              <p className="mt-1 text-xs text-[#e9ddff]">
                Fast payments, made beautifully simple.
              </p>
            </div>

            <div
              aria-hidden="true"
              className="hidden h-24 w-24 shrink-0 rotate-12 items-center justify-center rounded-3xl border border-white/25 bg-white/15 shadow-inner sm:flex"
            >
              <Wallet className="h-10 w-10 -rotate-12 text-white" />
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section>
          <div className="mb-3.5 flex items-center justify-between px-1">
            <h3 className="text-base font-bold tracking-tight text-[#201735]">
              Quick actions
            </h3>
            <button
              type="button"
              onClick={() => onNavigate('services')}
              className="min-h-[36px] whitespace-nowrap px-2 text-xs font-bold text-[#6d28d9] transition-colors hover:text-[#5b21b6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6d28d9]/40"
            >
              See all
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2.5 sm:gap-3.5">
            <button
              type="button"
              onClick={() => onOpenModal('send')}
              className="flex min-h-[96px] flex-col items-center justify-center gap-2.5 rounded-[18px] bg-white px-1 py-3.5 shadow-[0_5px_18px_rgba(51,32,91,0.04)] transition-transform active:scale-95 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6d28d9]/40"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f0eaff] text-[#7136d5]">
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="whitespace-nowrap text-[11px] font-bold text-[#201735]">
                Send Money
              </span>
            </button>

            <button
              type="button"
              onClick={() => onOpenModal('add')}
              className="flex min-h-[96px] flex-col items-center justify-center gap-2.5 rounded-[18px] bg-white px-1 py-3.5 shadow-[0_5px_18px_rgba(51,32,91,0.04)] transition-transform active:scale-95 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6d28d9]/40"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e8f8f1] text-[#159b70]">
                <Plus className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="whitespace-nowrap text-[11px] font-bold text-[#201735]">
                Add Money
              </span>
            </button>

            <button
              type="button"
              onClick={() => onOpenModal('cashout')}
              className="flex min-h-[96px] flex-col items-center justify-center gap-2.5 rounded-[18px] bg-white px-1 py-3.5 shadow-[0_5px_18px_rgba(51,32,91,0.04)] transition-transform active:scale-95 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6d28d9]/40"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff0f5] text-[#df4d91]">
                <ArrowDownToLine className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="whitespace-nowrap text-[11px] font-bold text-[#201735]">
                Cash Out
              </span>
            </button>

            <button
              type="button"
              onClick={() => onOpenModal('recharge')}
              className="flex min-h-[96px] flex-col items-center justify-center gap-2.5 rounded-[18px] bg-white px-1 py-3.5 shadow-[0_5px_18px_rgba(51,32,91,0.04)] transition-transform active:scale-95 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6d28d9]/40"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eaf3ff] text-[#3979d8]">
                <Smartphone className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="whitespace-nowrap text-[11px] font-bold text-[#201735]">
                Recharge
              </span>
            </button>
          </div>
        </section>

        {/* More Services */}
        <section>
          <div className="mb-3.5 flex items-center justify-between px-1">
            <h3 className="text-base font-bold tracking-tight text-[#201735]">
              More services
            </h3>
            <button
              type="button"
              onClick={() => onNavigate('services')}
              className="min-h-[36px] whitespace-nowrap px-2 text-xs font-bold text-[#6d28d9] transition-colors hover:text-[#5b21b6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6d28d9]/40"
            >
              Explore
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2.5 sm:gap-3.5">
            <button
              type="button"
              onClick={() => onOpenModal('payment')}
              className="flex min-h-[96px] flex-col items-center justify-center gap-2.5 rounded-[18px] bg-white px-1 py-3.5 shadow-[0_5px_18px_rgba(51,32,91,0.04)] transition-transform active:scale-95 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6d28d9]/40"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff0f5] text-[#df4d91]">
                <Store className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="whitespace-nowrap text-[11px] font-bold text-[#201735]">
                Payment
              </span>
            </button>

            <button
              type="button"
              onClick={() => onOpenModal('qr')}
              className="flex min-h-[96px] flex-col items-center justify-center gap-2.5 rounded-[18px] bg-white px-1 py-3.5 shadow-[0_5px_18px_rgba(51,32,91,0.04)] transition-transform active:scale-95 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6d28d9]/40"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f0eaff] text-[#7136d5]">
                <QrCode className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="whitespace-nowrap text-[11px] font-bold text-[#201735]">
                QR Pay
              </span>
            </button>

            <button
              type="button"
              onClick={() => onOpenModal('bills')}
              className="flex min-h-[96px] flex-col items-center justify-center gap-2.5 rounded-[18px] bg-white px-1 py-3.5 shadow-[0_5px_18px_rgba(51,32,91,0.04)] transition-transform active:scale-95 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6d28d9]/40"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e8f8f1] text-[#159b70]">
                <ReceiptText className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="whitespace-nowrap text-[11px] font-bold text-[#201735]">
                Pay Bills
              </span>
            </button>

            <button
              type="button"
              onClick={() => onOpenModal('offers')}
              className="flex min-h-[96px] flex-col items-center justify-center gap-2.5 rounded-[18px] bg-white px-1 py-3.5 shadow-[0_5px_18px_rgba(51,32,91,0.04)] transition-transform active:scale-95 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6d28d9]/40"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eaf3ff] text-[#3979d8]">
                <Star className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="whitespace-nowrap text-[11px] font-bold text-[#201735]">
                Offers
              </span>
            </button>
          </div>
        </section>

        {/* Promo Banner */}
        <section className="relative flex items-center justify-between gap-4 overflow-hidden rounded-[22px] bg-gradient-to-r from-[#fff0f6] to-[#f2eaff] p-5">
          <div className="max-w-xs">
            <p className="text-[11px] font-bold tracking-wide text-[#9f3883]">
              The smarter way to pay
            </p>
            <h3 className="mt-1.5 text-lg font-extrabold leading-tight text-[#39234e]">
              One app. More possibilities.
            </h3>
            <p className="mt-1 text-xs text-[#6e5c78]">
              Explore a simpler payment experience.
            </p>
            <button
              type="button"
              onClick={() => onNavigate('services')}
              className="mt-3.5 min-h-[40px] whitespace-nowrap rounded-xl bg-[#6d28d9] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[#5b21b6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6d28d9]/50"
            >
              Explore services
            </button>
          </div>

          <div
            aria-hidden="true"
            className="flex h-20 w-20 shrink-0 rotate-12 items-center justify-center rounded-3xl bg-gradient-to-br from-[#e879c5] to-[#8b5cf6] text-white shadow-[0_10px_20px_rgba(157,77,187,0.25)] sm:h-24 sm:w-24"
          >
            <Sparkles className="h-9 w-9 -rotate-12" />
          </div>
        </section>
      </div>

      {/* Right Column on Desktop / Bottom Section on Mobile */}
      <div className="space-y-5 lg:col-span-5">
        {/* Desktop Summary Strip */}
        <section className="grid grid-cols-2 gap-3 rounded-[20px] bg-white p-4 shadow-[0_5px_18px_rgba(51,32,91,0.04)]">
          <div className="rounded-xl bg-[#f8f6fc] p-3.5">
            <p className="text-[11px] font-semibold text-[#6e6580]">
              Added in session
            </p>
            <p className="mt-1 font-mono text-base font-bold text-[#159b70] tabular-nums">
              + {formatBDT(totalAdded)}
            </p>
          </div>
          <div className="rounded-xl bg-[#f8f6fc] p-3.5">
            <p className="text-[11px] font-semibold text-[#6e6580]">
              Spent in session
            </p>
            <p className="mt-1 font-mono text-base font-bold text-[#201735] tabular-nums">
              − {formatBDT(totalSpent)}
            </p>
          </div>
        </section>

        {/* Recent Activity */}
        <section>
          <div className="mb-3.5 flex items-center justify-between px-1">
            <h3 className="text-base font-bold tracking-tight text-[#201735]">
              Recent activity
            </h3>
            <button
              type="button"
              onClick={() => onNavigate('activity')}
              className="min-h-[36px] whitespace-nowrap px-2 text-xs font-bold text-[#6d28d9] transition-colors hover:text-[#5b21b6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6d28d9]/40"
            >
              View all
            </button>
          </div>

          <TransactionList
            transactions={transactions.slice(0, 5)}
            onSelectTransaction={onSelectTransaction}
          />
        </section>
      </div>
    </div>
  );
}
