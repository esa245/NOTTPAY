'use client';

import { BarChart3, Home, LayoutGrid, QrCode, User } from 'lucide-react';
import { ModalType, PageTab } from '@/lib/wallet-types';

interface BottomNavProps {
  activePage: PageTab;
  onNavigate: (page: PageTab) => void;
  onOpenModal: (modal: ModalType) => void;
}

export default function BottomNav({
  activePage,
  onNavigate,
  onOpenModal,
}: BottomNavProps) {
  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-[#eeeaf5] bg-white/95 backdrop-blur-md lg:hidden"
    >
      <div className="mx-auto grid h-[64px] max-w-md grid-cols-5 items-center px-2 pb-[env(safe-area-inset-bottom)]">
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className={`flex min-h-[44px] flex-col items-center justify-center gap-0.5 text-[10px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6d28d9]/40 ${
            activePage === 'home' ? 'text-[#6d28d9]' : 'text-[#7f7690]'
          }`}
        >
          <Home className="h-5 w-5" aria-hidden="true" />
          <span className="whitespace-nowrap">Home</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('services')}
          className={`flex min-h-[44px] flex-col items-center justify-center gap-0.5 text-[10px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6d28d9]/40 ${
            activePage === 'services' ? 'text-[#6d28d9]' : 'text-[#7f7690]'
          }`}
        >
          <LayoutGrid className="h-5 w-5" aria-hidden="true" />
          <span className="whitespace-nowrap">Services</span>
        </button>

        <button
          type="button"
          onClick={() => onOpenModal('qr')}
          aria-label="Scan and pay"
          className="flex min-h-[48px] flex-col items-center justify-center gap-0.5 text-[10px] font-bold text-[#6d28d9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6d28d9]/40"
        >
          <span className="-mt-6 flex h-12 w-12 items-center justify-center rounded-2xl border-4 border-[#f7f5fb] bg-gradient-to-br from-[#a78bfa] to-[#6d28d9] text-white shadow-[0_8px_18px_rgba(109,40,217,0.3)] transition-transform active:scale-95">
            <QrCode className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="whitespace-nowrap">Scan</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('activity')}
          className={`flex min-h-[44px] flex-col items-center justify-center gap-0.5 text-[10px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6d28d9]/40 ${
            activePage === 'activity' ? 'text-[#6d28d9]' : 'text-[#7f7690]'
          }`}
        >
          <BarChart3 className="h-5 w-5" aria-hidden="true" />
          <span className="whitespace-nowrap">Activity</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('profile')}
          className={`flex min-h-[44px] flex-col items-center justify-center gap-0.5 text-[10px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6d28d9]/40 ${
            activePage === 'profile' ? 'text-[#6d28d9]' : 'text-[#7f7690]'
          }`}
        >
          <User className="h-5 w-5" aria-hidden="true" />
          <span className="whitespace-nowrap">Profile</span>
        </button>
      </div>
    </nav>
  );
}
