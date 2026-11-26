export type PageTab = 'home' | 'services' | 'activity' | 'profile';

export type TransactionType =
  | 'send'
  | 'add'
  | 'cashout'
  | 'payment'
  | 'recharge'
  | 'bills';

export type ModalType =
  | TransactionType
  | 'qr'
  | 'offers'
  | 'notifications'
  | 'help'
  | 'edit-profile'
  | 'security'
  | 'about'
  | 'receipt';

export interface Transaction {
  id: string;
  type: TransactionType;
  recipient: string;
  amount: number;
  note?: string;
  date: string; // ISO string
  reference: string;
}

export interface WalletProfile {
  name: string;
  phone: string;
  rawPhone?: string;
  pinEnabled: boolean;
  biometricEnabled: boolean;
}

export interface WalletNotification {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
}

export const INITIAL_BALANCE = 5000;

export const DEFAULT_PROFILE: WalletProfile = {
  name: 'NOTTPAY User',
  phone: '+880 1700-000000',
  pinEnabled: true,
  biometricEnabled: false,
};

export const INITIAL_NOTIFICATIONS: WalletNotification[] = [
  {
    id: 'notif-welcome',
    title: 'Welcome to NOTTPAY',
    body: 'Your demo wallet is ready with ৳5,000.00 in preview funds to explore Send Money, QR Pay, and Activity.',
    time: 'Just now',
    read: false,
  },
  {
    id: 'notif-tip',
    title: 'Instant BDT transfers',
    body: 'Every transaction you record updates your balance and generates a reference receipt locally.',
    time: 'Today',
    read: false,
  },
];

export const TRANSACTION_LABELS: Record<TransactionType, string> = {
  send: 'Money sent',
  add: 'Money added',
  cashout: 'Cash out',
  payment: 'Payment',
  recharge: 'Mobile recharge',
  bills: 'Bill payment',
};

export const MODAL_TITLES: Record<ModalType, string> = {
  send: 'Send Money',
  add: 'Add Money',
  cashout: 'Cash Out',
  payment: 'Make a Payment',
  recharge: 'Mobile Recharge',
  bills: 'Pay Bills',
  qr: 'Scan & Pay',
  offers: 'Wallet Offers',
  notifications: 'Notifications',
  help: 'Help & Support',
  'edit-profile': 'Edit Profile',
  security: 'Security & PIN',
  about: 'About NOTTPAY',
  receipt: 'Transaction Receipt',
};

export function isOutgoingTransaction(type: TransactionType): boolean {
  return type !== 'add';
}

export function formatBDT(amount: number): string {
  return `৳${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatTimeShort(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return 'Today';
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateLabel(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return 'Demo · Today';
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (sameDay) return 'Demo · Today';
  return `Demo · ${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
}

export function generateReference(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'NP-';
  for (let i = 0; i < 6; i += 1) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
