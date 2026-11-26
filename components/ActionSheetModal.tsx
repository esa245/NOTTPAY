'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import {
  formatBDT,
  formatTimeShort,
  isOutgoingTransaction,
  MODAL_TITLES,
  ModalType,
  Transaction,
  TRANSACTION_LABELS,
  TransactionType,
  WalletNotification,
  WalletProfile,
} from '@/lib/wallet-types';
import QrScanAndPay from './QrScanAndPay';

interface ActionSheetModalProps {
  modalType: ModalType | null;
  selectedTransaction: Transaction | null;
  balance: number;
  profile: WalletProfile;
  notifications: WalletNotification[];
  prefillRecipient?: string;
  prefillNote?: string;
  onClose: () => void;
  onSwitchModal: (
    modal: ModalType,
    prefill?: { recipient?: string; note?: string }
  ) => void;
  onSubmitTransaction: (payload: {
    type: TransactionType;
    recipient: string;
    amount: number;
    note: string;
  }) => Promise<string | null> | string | null;
  onUpdateProfile: (next: WalletProfile) => Promise<void> | void;
  onMarkAllRead: () => void;
}

const TRANSACTION_MODALS: TransactionType[] = [
  'send',
  'add',
  'cashout',
  'payment',
  'recharge',
  'bills',
];

const QUICK_AMOUNTS = [100, 500, 1000, 2500];

const DEMO_OFFERS = [
  {
    id: 'offer-cafe',
    title: '5% Instant Cashback at Partner Cafes',
    detail: 'Valid on merchant QR and Payment transactions above ৳200.',
    actionLabel: 'Use on Payment',
    targetModal: 'payment' as ModalType,
    recipient: 'NottCafe Downtown',
    note: 'Cafe 5% Offer',
  },
  {
    id: 'offer-recharge',
    title: '৳20 Bonus on Mobile Recharge',
    detail: 'Applies on prepaid mobile top-ups of ৳199 or more.',
    actionLabel: 'Recharge Now',
    targetModal: 'recharge' as ModalType,
    recipient: '+880 1711-000123',
    note: 'Bonus Recharge Offer',
  },
  {
    id: 'offer-bills',
    title: 'Zero Fee Utility Bill Payments',
    detail: 'Pay electricity, gas, and broadband bills locally in demo mode.',
    actionLabel: 'Pay a Bill',
    targetModal: 'bills' as ModalType,
    recipient: 'DESCO Electricity',
    note: 'Zero-fee Bill Promo',
  },
];

function isTransactionModal(modal: ModalType): modal is TransactionType {
  return TRANSACTION_MODALS.includes(modal as TransactionType);
}

export default function ActionSheetModal({
  modalType,
  selectedTransaction,
  balance,
  profile,
  notifications,
  prefillRecipient = '',
  prefillNote = '',
  onClose,
  onSwitchModal,
  onSubmitTransaction,
  onUpdateProfile,
  onMarkAllRead,
}: ActionSheetModalProps) {
  return (
    <AnimatePresence>
      {modalType && (
        <ActionSheetContent
          key={`${modalType}-${prefillRecipient}-${prefillNote}`}
          modalType={modalType}
          selectedTransaction={selectedTransaction}
          balance={balance}
          profile={profile}
          notifications={notifications}
          prefillRecipient={prefillRecipient}
          prefillNote={prefillNote}
          onClose={onClose}
          onSwitchModal={onSwitchModal}
          onSubmitTransaction={onSubmitTransaction}
          onUpdateProfile={onUpdateProfile}
          onMarkAllRead={onMarkAllRead}
        />
      )}
    </AnimatePresence>
  );
}

interface ActionSheetContentProps extends Omit<ActionSheetModalProps, 'modalType'> {
  modalType: ModalType;
}

function ActionSheetContent({
  modalType,
  selectedTransaction,
  balance,
  profile,
  notifications,
  prefillRecipient = '',
  prefillNote = '',
  onClose,
  onSwitchModal,
  onSubmitTransaction,
  onUpdateProfile,
  onMarkAllRead,
}: ActionSheetContentProps) {
  const [recipient, setRecipient] = useState(prefillRecipient);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState(prefillNote);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [editName, setEditName] = useState(profile.name);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleTransactionSubmit = async (
    e: React.FormEvent,
    type: TransactionType
  ) => {
    e.preventDefault();
    const numericAmount = Number(amount);
    if (!recipient.trim()) {
      setErrorMsg('Please enter recipient or source details.');
      return;
    }
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setErrorMsg('Please enter a valid amount greater than ৳0.');
      return;
    }
    if (numericAmount > 100000) {
      setErrorMsg('Demo transactions are capped at ৳100,000.00.');
      return;
    }

    setSubmitting(true);
    try {
      const err = await onSubmitTransaction({
        type,
        recipient: recipient.trim(),
        amount: numericAmount,
        note: note.trim(),
      });
      if (err) {
        setErrorMsg(err);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = editName.trim();
    if (trimmedName.length < 2) {
      setErrorMsg('Display name must be at least 2 characters.');
      return;
    }
    setSubmitting(true);
    try {
      await onUpdateProfile({
        ...profile,
        name: trimmedName,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const getFieldMeta = (type: TransactionType) => {
    switch (type) {
      case 'send':
        return {
          label: 'Recipient username or mobile number',
          placeholder: 'e.g. @rafi or +880 1711-000000',
          amountLabel: 'Amount (BDT)',
        };
      case 'add':
        return {
          label: 'Bank or card source',
          placeholder: 'e.g. City Bank · Visa 4421',
          amountLabel: 'Amount to add (BDT)',
        };
      case 'cashout':
        return {
          label: 'Agent number or ATM code',
          placeholder: 'e.g. Agent 01800-000222',
          amountLabel: 'Cash out amount (BDT)',
        };
      case 'payment':
        return {
          label: 'Merchant ID or payment reference',
          placeholder: 'e.g. NottCafe or MER-204',
          amountLabel: 'Payment amount (BDT)',
        };
      case 'recharge':
        return {
          label: 'Mobile number to recharge',
          placeholder: 'e.g. +880 1711-000000',
          amountLabel: 'Recharge amount (BDT)',
        };
      case 'bills':
        return {
          label: 'Biller name & account ID',
          placeholder: 'e.g. DESCO · 9841203',
          amountLabel: 'Bill amount (BDT)',
        };
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-heading"
          className="fixed inset-0 z-50 flex items-end justify-center bg-[#170c2d]/50 backdrop-blur-[2px] sm:items-center sm:p-4"
        >
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-[26px] bg-white px-5 pb-[max(24px,env(safe-area-inset-bottom))] pt-3 shadow-[0_24px_60px_rgba(23,12,45,0.28)] sm:rounded-[26px] sm:p-6"
          >
            {/* Mobile Drag Handle Affordance */}
            <div
              aria-hidden="true"
              className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-[#e3dcf0] sm:hidden"
            />

            <div className="mb-4 flex items-center justify-between gap-4">
              <h3
                id="modal-heading"
                className="text-lg font-extrabold tracking-tight text-[#201735]"
              >
                {MODAL_TITLES[modalType]}
              </h3>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f4f0f8] text-[#5c536f] transition-colors hover:bg-[#eae2f5] hover:text-[#201735] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6d28d9]/40"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {/* Transaction Form Views */}
            {isTransactionModal(modalType) && (() => {
              const meta = getFieldMeta(modalType);
              const outgoing = isOutgoingTransaction(modalType);
              return (
                <form
                  onSubmit={(e) => handleTransactionSubmit(e, modalType)}
                  className="space-y-4"
                >
                  {outgoing && (
                    <div className="flex items-center justify-between rounded-xl bg-[#f7f5fb] px-3.5 py-2.5 text-xs">
                      <span className="font-medium text-[#6e6580]">
                        Available demo balance
                      </span>
                      <span className="font-mono font-bold text-[#201735] tabular-nums">
                        {formatBDT(balance)}
                      </span>
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="tx-recipient"
                      className="mb-1.5 block text-xs font-bold text-[#5c536f]"
                    >
                      {meta.label}
                    </label>
                    <input
                      id="tx-recipient"
                      type="text"
                      value={recipient}
                      onChange={(e) => {
                        setRecipient(e.target.value);
                        setErrorMsg(null);
                      }}
                      placeholder={meta.placeholder}
                      required
                      className="h-12 w-full rounded-xl border border-[#e9e3f1] bg-[#fcfbfe] px-3.5 text-sm text-[#201735] outline-none transition-colors placeholder:text-[#9890a8] focus:border-[#8b5cf6] focus:ring-3 focus:ring-[#8b5cf6]/10"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="tx-amount"
                      className="mb-1.5 block text-xs font-bold text-[#5c536f]"
                    >
                      {meta.amountLabel}
                    </label>
                    <input
                      id="tx-amount"
                      type="number"
                      min="1"
                      max="100000"
                      step="0.01"
                      value={amount}
                      onChange={(e) => {
                        setAmount(e.target.value);
                        setErrorMsg(null);
                      }}
                      placeholder="0.00"
                      required
                      className="h-12 w-full rounded-xl border border-[#e9e3f1] bg-[#fcfbfe] px-3.5 font-mono text-base font-semibold text-[#201735] tabular-nums outline-none transition-colors placeholder:text-[#9890a8] focus:border-[#8b5cf6] focus:ring-3 focus:ring-[#8b5cf6]/10"
                    />
                    <div className="mt-2 grid grid-cols-4 gap-2">
                      {QUICK_AMOUNTS.map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => {
                            setAmount(String(preset));
                            setErrorMsg(null);
                          }}
                          className="min-h-[36px] whitespace-nowrap rounded-lg border border-[#e9e3f1] bg-[#faf8fd] px-2 font-mono text-xs font-semibold text-[#5c536f] tabular-nums transition-colors hover:border-[#c6b5ea] hover:text-[#6d28d9]"
                        >
                          ৳{preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="tx-note"
                      className="mb-1.5 block text-xs font-bold text-[#5c536f]"
                    >
                      Note (optional)
                    </label>
                    <input
                      id="tx-note"
                      type="text"
                      maxLength={80}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="What's it for?"
                      className="h-12 w-full rounded-xl border border-[#e9e3f1] bg-[#fcfbfe] px-3.5 text-sm text-[#201735] outline-none transition-colors placeholder:text-[#9890a8] focus:border-[#8b5cf6] focus:ring-3 focus:ring-[#8b5cf6]/10"
                    />
                  </div>

                  {errorMsg && (
                    <div className="rounded-xl bg-[#fff0f5] px-3.5 py-2.5 text-xs font-semibold text-[#be264c]">
                      <p>{errorMsg}</p>
                      {outgoing && balance < Number(amount || 0) && (
                        <button
                          type="button"
                          onClick={() => onSwitchModal('add')}
                          className="mt-1.5 font-bold text-[#6d28d9] underline underline-offset-2"
                        >
                          Add money to demo balance
                        </button>
                      )}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="min-h-[48px] w-full whitespace-nowrap rounded-xl bg-gradient-to-r from-[#7134d5] to-[#a044c8] px-4 py-3 text-sm font-extrabold text-white shadow-[0_8px_16px_rgba(113,52,213,0.22)] transition-opacity hover:opacity-95 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6d28d9]/50"
                  >
                    {submitting ? 'Processing...' : 'Continue'}
                  </button>

                  <p className="text-[11px] leading-relaxed text-[#6e6580]">
                    Demo preview only. No real money will be moved or charged.
                  </p>
                </form>
              );
            })()}

            {/* QR Scan & Pay View */}
            {modalType === 'qr' && (
              <QrScanAndPay
                profile={profile}
                onScanned={(targetModal, prefill) =>
                  onSwitchModal(targetModal, prefill)
                }
              />
            )}

            {/* Offers View */}
            {modalType === 'offers' && (
              <div className="space-y-3">
                {DEMO_OFFERS.map((offer) => (
                  <div
                    key={offer.id}
                    className="rounded-2xl border border-[#eeeaf5] bg-[#faf8fd] p-4"
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f0eaff] text-[#6d28d9]">
                        <Sparkles className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-[#201735]">
                          {offer.title}
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-[#6e6580]">
                          {offer.detail}
                        </p>
                        <button
                          type="button"
                          onClick={() =>
                            onSwitchModal(offer.targetModal, {
                              recipient: offer.recipient,
                              note: offer.note,
                            })
                          }
                          className="mt-3 min-h-[36px] whitespace-nowrap rounded-lg bg-[#6d28d9] px-3.5 py-1.5 text-xs font-bold text-white transition-colors hover:bg-[#5b21b6]"
                        >
                          {offer.actionLabel}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Notifications View */}
            {modalType === 'notifications' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-[#6e6580]">
                    {notifications.filter((n) => !n.read).length} unread
                  </p>
                  <button
                    type="button"
                    onClick={onMarkAllRead}
                    className="text-xs font-bold text-[#6d28d9] hover:underline"
                  >
                    Mark all as read
                  </button>
                </div>
                <div className="divide-y divide-[#f2eff6] rounded-2xl border border-[#eeeaf5] bg-[#fcfbfe] px-3.5">
                  {notifications.map((notif) => (
                    <div key={notif.id} className="py-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-bold text-[#201735]">
                          {notif.title}
                        </p>
                        <span className="shrink-0 text-[10px] text-[#6e6580]">
                          {notif.time}
                          {!notif.read ? ' · Unread' : ''}
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-[#6e6580]">
                        {notif.body}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Edit Profile View */}
            {modalType === 'edit-profile' && (
              <form onSubmit={handleProfileSave} className="space-y-4">
                <div>
                  <label
                    htmlFor="profile-name"
                    className="mb-1.5 block text-xs font-bold text-[#5c536f]"
                  >
                    Display name
                  </label>
                  <input
                    id="profile-name"
                    type="text"
                    maxLength={40}
                    value={editName}
                    onChange={(e) => {
                      setEditName(e.target.value);
                      setErrorMsg(null);
                    }}
                    required
                    className="h-12 w-full rounded-xl border border-[#e9e3f1] bg-[#fcfbfe] px-3.5 text-sm text-[#201735] outline-none focus:border-[#8b5cf6] focus:ring-3 focus:ring-[#8b5cf6]/10"
                  />
                </div>
                <div>
                  <label
                    htmlFor="profile-phone"
                    className="mb-1.5 block text-xs font-bold text-[#5c536f]"
                  >
                    Registered mobile number
                  </label>
                  <input
                    id="profile-phone"
                    type="text"
                    value={profile.phone}
                    readOnly
                    className="h-12 w-full cursor-not-allowed rounded-xl border border-[#e9e3f1] bg-[#f4f0fa] px-3.5 font-mono text-sm text-[#5c536f] outline-none"
                  />
                </div>
                {errorMsg && (
                  <p className="rounded-xl bg-[#fff0f5] px-3.5 py-2.5 text-xs font-semibold text-[#be264c]">
                    {errorMsg}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="min-h-[48px] w-full whitespace-nowrap rounded-xl bg-gradient-to-r from-[#7134d5] to-[#a044c8] px-4 py-3 text-sm font-extrabold text-white disabled:opacity-60"
                >
                  {submitting ? 'Saving...' : 'Save changes'}
                </button>
              </form>
            )}

            {/* Security & PIN View */}
            {modalType === 'security' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-2xl border border-[#eeeaf5] bg-[#faf8fd] p-4">
                  <div>
                    <p className="text-sm font-bold text-[#201735]">
                      4-digit Wallet PIN
                    </p>
                    <p className="mt-0.5 text-xs text-[#6e6580]">
                      Require PIN confirmation on outgoing transfers
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={profile.pinEnabled}
                    onClick={() =>
                      onUpdateProfile({
                        ...profile,
                        pinEnabled: !profile.pinEnabled,
                      })
                    }
                    className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                      profile.pinEnabled ? 'bg-[#6d28d9]' : 'bg-[#d4cde0]'
                    }`}
                  >
                    <span
                      className={`block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                        profile.pinEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-[#eeeaf5] bg-[#faf8fd] p-4">
                  <div>
                    <p className="text-sm font-bold text-[#201735]">
                      Biometric unlock
                    </p>
                    <p className="mt-0.5 text-xs text-[#6e6580]">
                      Use Face ID or fingerprint on supported devices
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={profile.biometricEnabled}
                    onClick={() =>
                      onUpdateProfile({
                        ...profile,
                        biometricEnabled: !profile.biometricEnabled,
                      })
                    }
                    className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                      profile.biometricEnabled ? 'bg-[#6d28d9]' : 'bg-[#d4cde0]'
                    }`}
                  >
                    <span
                      className={`block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                        profile.biometricEnabled
                          ? 'translate-x-6'
                          : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <p className="flex items-center gap-2 pt-1 text-xs text-[#6e6580]">
                  <ShieldCheck className="h-4 w-4 text-[#159b70]" aria-hidden="true" />
                  Preferences are saved locally in this browser preview.
                </p>
              </div>
            )}

            {/* Help & Support View */}
            {modalType === 'help' && (
              <div className="space-y-3 text-xs leading-relaxed text-[#5c536f]">
                <div className="rounded-2xl bg-[#faf8fd] p-4">
                  <p className="font-bold text-[#201735]">
                    How does the NOTTPAY preview work?
                  </p>
                  <p className="mt-1">
                    You start with ৳5,000.00 in demo funds. Send Money, Cash Out, Payment, Recharge, and Pay Bills deduct locally, while Add Money tops up your balance.
                  </p>
                </div>
                <div className="rounded-2xl bg-[#faf8fd] p-4">
                  <p className="font-bold text-[#201735]">
                    Are real bank accounts or cards charged?
                  </p>
                  <p className="mt-1">
                    No. All balances, receipts, and transactions are stored only in your browser for interactive previewing.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-[44px] w-full rounded-xl bg-[#6d28d9] px-4 py-2.5 text-xs font-bold text-white"
                >
                  Got it
                </button>
              </div>
            )}

            {/* About View */}
            {modalType === 'about' && (
              <div className="space-y-3 text-xs leading-relaxed text-[#5c536f]">
                <p>
                  <strong className="text-[#201735]">NOTTPAY — Digital Wallet</strong>{' '}
                  is a mobile-first BDT wallet interface designed for fast transfers, QR payments, utility bills, and clear activity tracking.
                </p>
                <p>
                  All transactions and profile edits persist locally in your browser via local storage.
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-[44px] w-full rounded-xl border border-[#e9e3f1] bg-white px-4 py-2.5 text-xs font-bold text-[#6d28d9]"
                >
                  Close
                </button>
              </div>
            )}

            {/* Receipt Detail View */}
            {modalType === 'receipt' && selectedTransaction && (() => {
              const outgoing = isOutgoingTransaction(selectedTransaction.type);
              return (
                <div className="space-y-4">
                  <div className="rounded-2xl bg-[#faf8fd] p-5 text-center">
                    <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-[#e8f8f1] text-[#159b70]">
                      <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <p className="text-xs font-semibold text-[#6e6580]">
                      {TRANSACTION_LABELS[selectedTransaction.type]} · Demo completed
                    </p>
                    <p
                      className={`mt-1 font-mono text-2xl font-extrabold tabular-nums ${
                        outgoing ? 'text-[#201735]' : 'text-[#159b70]'
                      }`}
                    >
                      {outgoing ? '−' : '+'} {formatBDT(selectedTransaction.amount)}
                    </p>
                  </div>

                  <dl className="divide-y divide-[#f2eff6] rounded-2xl border border-[#eeeaf5] px-4 text-xs">
                    <div className="flex items-center justify-between py-3">
                      <dt className="text-[#6e6580]">Recipient / Source</dt>
                      <dd className="font-bold text-[#201735]">
                        {selectedTransaction.recipient}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between py-3">
                      <dt className="text-[#6e6580]">Time</dt>
                      <dd className="font-medium text-[#201735]">
                        {formatTimeShort(selectedTransaction.date)}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between py-3">
                      <dt className="text-[#6e6580]">Reference</dt>
                      <dd className="font-mono font-semibold text-[#201735]">
                        {selectedTransaction.reference}
                      </dd>
                    </div>
                    {selectedTransaction.note && (
                      <div className="flex items-center justify-between gap-4 py-3">
                        <dt className="shrink-0 text-[#6e6580]">Note</dt>
                        <dd className="text-right font-medium text-[#201735]">
                          {selectedTransaction.note}
                        </dd>
                      </div>
                    )}
                  </dl>

                  <button
                    type="button"
                    onClick={onClose}
                    className="min-h-[44px] w-full rounded-xl bg-[#6d28d9] px-4 py-2.5 text-xs font-bold text-white"
                  >
                    Done
                  </button>
                </div>
              );
            })()}
          </motion.div>
    </motion.div>
  );
}
