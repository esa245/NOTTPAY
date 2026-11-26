'use client';

import { ArrowLeftRight, Bell, HelpCircle, QrCode } from 'lucide-react';
import { ModalType, PageTab } from '@/lib/wallet-types';

interface WalletHeaderProps {
  activePage: PageTab;
  onNavigate: (page: PageTab) => void;
  onOpenModal: (modal: ModalType) => void;
  unreadCount: number;
}

const NAV_ITEMS: { id: PageTab; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'services', label: 'Services' },
  { id: 'activity', label: 'Activity' },
  { id: 'profile', label: 'Profile' },
];

export default function WalletHeader({
  activePage,
  onNavigate,
  onOpenModal,
  unreadCount,
}: WalletHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-[#eeeaf5] bg-[#f7f5fb]/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-8 px-4 sm:px-6 lg:h-16">
        {/* Zone 1: Brand Wordmark */}
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-lg py-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6d28d9]/50"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#a78bfa] via-[#6d28d9] to-[#ec4899] text-white shadow-[0_6px_14px_rgba(109,40,217,0.28)]">
            <ArrowLeftRight className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="text-[20px] font-extrabold tracking-tight text-[#291b45]">
            NOTT<span className="text-[#6d28d9]">PAY</span>
          </span>
        </button>

        {/* Zone 2: Desktop Single-Line Navigation Links */}
        <nav
          aria-label="Primary navigation"
          className="hidden items-center gap-7 lg:flex"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`relative whitespace-nowrap shrink-0 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6d28d9]/50 ${
                  isActive
                    ? 'text-[#6d28d9]'
                    : 'text-[#5c536f] hover:text-[#201735]'
                }`}
              >
                {item.label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-[1px] h-0.5 rounded-full bg-[#6d28d9]"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Actions */}
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            aria-label="Help center"
            onClick={() => onOpenModal('help')}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#eeeaf5] bg-white text-[#55466d] transition-colors hover:border-[#d9cef0] hover:text-[#6d28d9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6d28d9]/50"
          >
            <HelpCircle className="h-[19px] w-[19px]" aria-hidden="true" />
          </button>

          <button
            type="button"
            aria-label={
              unreadCount > 0
                ? `Notifications (${unreadCount} unread)`
                : 'Notifications'
            }
            onClick={() => onOpenModal('notifications')}
            className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-[#eeeaf5] bg-white text-[#55466d] transition-colors hover:border-[#d9cef0] hover:text-[#6d28d9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6d28d9]/50"
          >
            <Bell className="h-[19px] w-[19px]" aria-hidden="true" />
            {unreadCount > 0 && (
              <span className="absolute right-2 top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ec4899] px-1 text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => onOpenModal('qr')}
            className="hidden h-11 items-center gap-2 whitespace-nowrap rounded-xl bg-[#6d28d9] px-4 text-xs font-bold text-white shadow-[0_6px_14px_rgba(109,40,217,0.22)] transition-colors hover:bg-[#5b21b6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6d28d9]/50 lg:inline-flex"
          >
            <QrCode className="h-4 w-4" aria-hidden="true" />
            Scan & Pay
          </button>
        </div>
      </div>
    </header>
  );
}
