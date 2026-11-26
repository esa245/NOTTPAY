'use client';

import {
  ChevronRight,
  HelpCircle,
  Info,
  RotateCcw,
  ShieldCheck,
  UserPen,
} from 'lucide-react';
import { ModalType, WalletProfile } from '@/lib/wallet-types';

interface ProfileViewProps {
  profile: WalletProfile;
  onOpenModal: (modal: ModalType) => void;
  onResetDemo: () => void;
}

export default function ProfileView({
  profile,
  onOpenModal,
  onResetDemo,
}: ProfileViewProps) {
  const initial = profile.name.trim().charAt(0).toUpperCase() || 'N';

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="px-1">
        <h2 className="text-2xl font-extrabold tracking-tight text-[#201735]">
          My profile
        </h2>
        <p className="mt-1 text-xs text-[#6e6580]">
          Manage your account details.
        </p>
      </div>

      <section className="rounded-[22px] bg-white p-6 text-center shadow-[0_5px_18px_rgba(51,32,91,0.04)]">
        <div className="mx-auto flex h-18 w-18 items-center justify-center rounded-[22px] bg-gradient-to-br from-[#c4b5fd] to-[#7c3aed] text-2xl font-extrabold text-white shadow-[0_10px_20px_rgba(124,58,237,0.22)]">
          {initial}
        </div>
        <h3 className="mt-3.5 text-lg font-bold text-[#201735]">
          {profile.name}
        </h3>
        <p className="mt-1 font-mono text-xs text-[#6e6580]">
          {profile.phone}
          <span aria-hidden="true"> · </span>
          <span className="font-sans">Active wallet</span>
        </p>
      </section>

      <section className="divide-y divide-[#f2eff6] rounded-[22px] bg-white px-4 shadow-[0_5px_18px_rgba(51,32,91,0.04)]">
        <button
          type="button"
          onClick={() => onOpenModal('edit-profile')}
          className="flex min-h-[56px] w-full items-center justify-between gap-3 py-3 text-left transition-colors hover:bg-[#faf8fd] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6d28d9]/40"
        >
          <span className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f0eaff] text-[#6d28d9]">
              <UserPen className="h-[18px] w-[18px]" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-sm font-bold text-[#201735]">
                Edit profile
              </span>
              <span className="block text-xs text-[#6e6580]">
                Update your display name
              </span>
            </span>
          </span>
          <ChevronRight className="h-4 w-4 text-[#8b8499]" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={() => onOpenModal('security')}
          className="flex min-h-[56px] w-full items-center justify-between gap-3 py-3 text-left transition-colors hover:bg-[#faf8fd] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6d28d9]/40"
        >
          <span className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e8f8f1] text-[#159b70]">
              <ShieldCheck className="h-[18px] w-[18px]" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-sm font-bold text-[#201735]">
                Security &amp; PIN
              </span>
              <span className="block text-xs text-[#6e6580]">
                {profile.pinEnabled ? 'Wallet PIN enabled' : 'Wallet PIN off'}
                <span aria-hidden="true"> · </span>
                {profile.biometricEnabled ? 'Biometrics on' : 'Biometrics off'}
              </span>
            </span>
          </span>
          <ChevronRight className="h-4 w-4 text-[#8b8499]" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={() => onOpenModal('help')}
          className="flex min-h-[56px] w-full items-center justify-between gap-3 py-3 text-left transition-colors hover:bg-[#faf8fd] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6d28d9]/40"
        >
          <span className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eaf3ff] text-[#3979d8]">
              <HelpCircle className="h-[18px] w-[18px]" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-sm font-bold text-[#201735]">
                Help &amp; support
              </span>
              <span className="block text-xs text-[#6e6580]">
                Guides and common wallet questions
              </span>
            </span>
          </span>
          <ChevronRight className="h-4 w-4 text-[#8b8499]" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={() => onOpenModal('about')}
          className="flex min-h-[56px] w-full items-center justify-between gap-3 py-3 text-left transition-colors hover:bg-[#faf8fd] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6d28d9]/40"
        >
          <span className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff0f5] text-[#df4d91]">
              <Info className="h-[18px] w-[18px]" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-sm font-bold text-[#201735]">
                About NOTTPAY
              </span>
              <span className="block text-xs text-[#6e6580]">
                Interactive digital wallet preview
              </span>
            </span>
          </span>
          <ChevronRight className="h-4 w-4 text-[#8b8499]" aria-hidden="true" />
        </button>
      </section>

      <div className="pt-1">
        <button
          type="button"
          onClick={onResetDemo}
          className="flex min-h-[48px] w-full items-center justify-center gap-2 whitespace-nowrap rounded-2xl border border-[#e9e3f1] bg-white px-4 py-3 text-xs font-bold text-[#5c536f] transition-colors hover:border-[#d5cbe6] hover:text-[#201735] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6d28d9]/40"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Reset demo balance
        </button>
      </div>
    </div>
  );
}
