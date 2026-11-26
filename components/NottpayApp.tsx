'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { PublicWalletUser } from '@/lib/server-store';
import {
  formatBDT,
  ModalType,
  PageTab,
  Transaction,
  TRANSACTION_LABELS,
  TransactionType,
  WalletProfile,
} from '@/lib/wallet-types';
import ActionSheetModal from './ActionSheetModal';
import ActivityView from './ActivityView';
import BottomNav from './BottomNav';
import HomeView from './HomeView';
import PhoneAuthScreen from './PhoneAuthScreen';
import ProfileView from './ProfileView';
import ServicesView from './ServicesView';
import Toast from './Toast';
import WalletHeader from './WalletHeader';

export default function NottpayApp() {
  // Hold session token strictly in React memory (never localStorage/sessionStorage)
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [user, setUser] = useState<PublicWalletUser | null>(null);
  const [showBalance, setShowBalance] = useState(true);
  const [activePage, setActivePage] = useState<PageTab>('home');

  const [modalType, setModalType] = useState<ModalType | null>(null);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [prefillRecipient, setPrefillRecipient] = useState('');
  const [prefillNote, setPrefillNote] = useState('');

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2600);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const handleAuthenticated = (token: string, nextUser: PublicWalletUser) => {
    setAuthToken(token);
    setUser(nextUser);
    setActivePage('home');
    setModalType(null);
    showToast(`Signed in as ${nextUser.name}`);
  };

  const handleSignOut = () => {
    setAuthToken(null);
    setUser(null);
    setModalType(null);
    setSelectedTransaction(null);
    setActivePage('home');
    showToast('Signed out');
  };

  const unreadCount = useMemo(
    () => (user ? user.notifications.filter((n) => !n.read).length : 0),
    [user]
  );

  const profile: WalletProfile = useMemo(
    () => ({
      name: user?.name ?? 'NOTTPAY User',
      phone: user?.displayPhone ?? '',
      rawPhone: user?.phone ?? '',
      pinEnabled: user?.pinEnabled ?? true,
      biometricEnabled: user?.biometricEnabled ?? false,
    }),
    [user]
  );

  const handleNavigate = (page: PageTab) => {
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenModal = (
    modal: ModalType,
    prefill?: { recipient?: string; note?: string }
  ) => {
    setPrefillRecipient(prefill?.recipient ?? '');
    setPrefillNote(prefill?.note ?? '');
    setModalType(modal);
  };

  const handleSelectTransaction = (tx: Transaction) => {
    setSelectedTransaction(tx);
    setModalType('receipt');
  };

  const handleSubmitTransaction = async ({
    type,
    recipient,
    amount,
    note,
  }: {
    type: TransactionType;
    recipient: string;
    amount: number;
    note: string;
  }): Promise<string | null> => {
    if (!authToken) return 'Session expired. Please sign in again.';

    try {
      const res = await fetch('/api/wallet/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ type, recipient, amount, note }),
      });

      if (res.status === 401) {
        handleSignOut();
        return 'Session expired. Please sign in again.';
      }

      const data = (await res.json()) as {
        user?: PublicWalletUser;
        transaction?: Transaction;
        error?: string;
      };

      if (!res.ok || !data.user || !data.transaction) {
        return data.error || 'Could not process transaction.';
      }

      setUser(data.user);
      setModalType(null);
      showToast(
        `${TRANSACTION_LABELS[type]} · ${formatBDT(data.transaction.amount)} recorded`
      );
      return null;
    } catch {
      return 'Network error. Please try again.';
    }
  };

  const handleUpdateProfile = async (next: WalletProfile) => {
    if (!authToken) return;
    try {
      const res = await fetch('/api/wallet/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          name: next.name,
          pinEnabled: next.pinEnabled,
          biometricEnabled: next.biometricEnabled,
        }),
      });
      if (res.status === 401) {
        handleSignOut();
        return;
      }
      const data = (await res.json()) as {
        user?: PublicWalletUser;
        error?: string;
      };
      if (!res.ok || !data.user) {
        showToast(data.error || 'Could not update profile');
        return;
      }
      setUser(data.user);
      showToast('Profile settings updated');
    } catch {
      showToast('Network error while updating profile');
    }
  };

  const handleMarkAllRead = async () => {
    if (!authToken) return;
    try {
      const res = await fetch('/api/wallet/notifications/read', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      if (res.status === 401) {
        handleSignOut();
        return;
      }
      const data = (await res.json()) as { user?: PublicWalletUser };
      if (res.ok && data.user) {
        setUser(data.user);
        showToast('All notifications marked as read');
      }
    } catch {
      showToast('Could not update notifications');
    }
  };

  const handleResetDemo = async () => {
    if (!authToken) return;
    try {
      const res = await fetch('/api/wallet/reset', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      if (res.status === 401) {
        handleSignOut();
        return;
      }
      const data = (await res.json()) as { user?: PublicWalletUser };
      if (res.ok && data.user) {
        setUser(data.user);
        setShowBalance(true);
        showToast('Demo wallet reset to ৳5,000.00');
      }
    } catch {
      showToast('Could not reset wallet');
    }
  };

  if (!authToken || !user) {
    return (
      <>
        <PhoneAuthScreen onAuthenticated={handleAuthenticated} />
        <Toast message={toastMessage} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f5fb] pb-24 lg:pb-12">
      <WalletHeader
        activePage={activePage}
        onNavigate={handleNavigate}
        onOpenModal={handleOpenModal}
        unreadCount={unreadCount}
      />

      <main className="mx-auto max-w-6xl px-4 pt-5 sm:px-6 lg:pt-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activePage}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
          >
            {activePage === 'home' && (
              <HomeView
                profile={profile}
                balance={user.balance}
                showBalance={showBalance}
                onToggleBalance={() => setShowBalance((prev) => !prev)}
                transactions={user.transactions}
                onNavigate={handleNavigate}
                onOpenModal={handleOpenModal}
                onSelectTransaction={handleSelectTransaction}
              />
            )}

            {activePage === 'services' && (
              <ServicesView onOpenModal={handleOpenModal} />
            )}

            {activePage === 'activity' && (
              <ActivityView
                transactions={user.transactions}
                onSelectTransaction={handleSelectTransaction}
              />
            )}

            {activePage === 'profile' && (
              <ProfileView
                profile={profile}
                onOpenModal={handleOpenModal}
                onResetDemo={handleResetDemo}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <BottomNav
        activePage={activePage}
        onNavigate={handleNavigate}
        onOpenModal={handleOpenModal}
      />

      <ActionSheetModal
        modalType={modalType}
        selectedTransaction={selectedTransaction}
        balance={user.balance}
        profile={profile}
        notifications={user.notifications}
        prefillRecipient={prefillRecipient}
        prefillNote={prefillNote}
        onClose={() => setModalType(null)}
        onSwitchModal={handleOpenModal}
        onSubmitTransaction={handleSubmitTransaction}
        onUpdateProfile={handleUpdateProfile}
        onMarkAllRead={handleMarkAllRead}
      />

      <Toast message={toastMessage} />
    </div>
  );
}
