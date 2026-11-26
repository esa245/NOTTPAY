import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  formatBDT,
  generateReference,
  INITIAL_BALANCE,
  isOutgoingTransaction,
  Transaction,
  TRANSACTION_LABELS,
  TransactionType,
  WalletNotification,
} from './wallet-types';
import { formatPhoneDisplay, normalizePhoneNumber } from './server-auth';
import { getServerSupabaseClient } from './supabase';

export interface UserRecord {
  id: string;
  phone: string;
  name: string;
  pinSalt: string;
  pinHash: string;
  pinEnabled: boolean;
  biometricEnabled: boolean;
  balance: number;
  transactions: Transaction[];
  notifications: WalletNotification[];
  createdAt: string;
}

export interface PublicWalletUser {
  id: string;
  phone: string;
  displayPhone: string;
  name: string;
  pinEnabled: boolean;
  biometricEnabled: boolean;
  balance: number;
  transactions: Transaction[];
  notifications: WalletNotification[];
}

interface SupabaseWalletRow {
  id: string;
  phone: string;
  name: string;
  pin_salt: string;
  pin_hash: string;
  pin_enabled: boolean;
  biometric_enabled: boolean;
  balance: number | string;
  transactions: Transaction[];
  notifications: WalletNotification[];
  created_at: string;
}

const SUPABASE_TABLE = 'nottpay_wallets';

const DATA_DIR = path.resolve(process.cwd(), '.data');
const STORE_PATH = path.resolve(DATA_DIR, 'nottpay-users.json');

if (!STORE_PATH.startsWith(DATA_DIR + path.sep)) {
  throw new Error('Invalid store path configuration');
}

const globalForStore = globalThis as typeof globalThis & {
  __nottpayUsersCache?: Map<string, UserRecord>;
  __nottpayStoreLoaded?: boolean;
  __nottpayWriteQueue?: Promise<void>;
};

function getCache(): Map<string, UserRecord> {
  if (!globalForStore.__nottpayUsersCache) {
    globalForStore.__nottpayUsersCache = new Map<string, UserRecord>();
  }
  return globalForStore.__nottpayUsersCache;
}

function rowToUserRecord(row: SupabaseWalletRow): UserRecord {
  return {
    id: row.id,
    phone: row.phone,
    name: row.name,
    pinSalt: row.pin_salt,
    pinHash: row.pin_hash,
    pinEnabled: row.pin_enabled,
    biometricEnabled: row.biometric_enabled,
    balance: Number(row.balance),
    transactions: Array.isArray(row.transactions) ? row.transactions : [],
    notifications: Array.isArray(row.notifications) ? row.notifications : [],
    createdAt: row.created_at,
  };
}

function userRecordToRow(user: UserRecord): SupabaseWalletRow {
  return {
    id: user.id,
    phone: user.phone,
    name: user.name,
    pin_salt: user.pinSalt,
    pin_hash: user.pinHash,
    pin_enabled: user.pinEnabled,
    biometric_enabled: user.biometricEnabled,
    balance: user.balance,
    transactions: user.transactions,
    notifications: user.notifications,
    created_at: user.createdAt,
  };
}

async function syncUserToSupabase(user: UserRecord): Promise<void> {
  try {
    const client = getServerSupabaseClient();
    await client
      .from(SUPABASE_TABLE)
      .upsert(userRecordToRow(user), { onConflict: 'id' });
  } catch {
    // Keep local fallback resilient if table/RLS is not yet configured
  }
}

async function fetchUserFromSupabase(
  column: 'phone' | 'id',
  value: string
): Promise<UserRecord | null> {
  try {
    const client = getServerSupabaseClient();
    const { data, error } = await client
      .from(SUPABASE_TABLE)
      .select('*')
      .eq(column, value)
      .maybeSingle();

    if (error || !data) return null;
    const record = rowToUserRecord(data as SupabaseWalletRow);
    const cache = getCache();
    cache.set(record.id, record);
    return record;
  } catch {
    return null;
  }
}

async function ensureLoaded(): Promise<Map<string, UserRecord>> {
  const cache = getCache();
  if (globalForStore.__nottpayStoreLoaded) {
    return cache;
  }
  try {
    const raw = await fs.readFile(STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw) as UserRecord[];
    if (Array.isArray(parsed)) {
      for (const user of parsed) {
        if (user && typeof user.id === 'string' && typeof user.phone === 'string') {
          cache.set(user.id, user);
        }
      }
    }
  } catch {
    // Store file may not exist on first boot; start clean
  }
  globalForStore.__nottpayStoreLoaded = true;
  return cache;
}

async function persistStore(): Promise<void> {
  const cache = getCache();
  const payload = JSON.stringify(Array.from(cache.values()), null, 2);

  const runWrite = async () => {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      await fs.writeFile(STORE_PATH, payload, 'utf8');
    } catch {
      // Fallback safely to in-memory store if filesystem is read-only
    }
  };

  const prev = globalForStore.__nottpayWriteQueue ?? Promise.resolve();
  globalForStore.__nottpayWriteQueue = prev.then(runWrite, runWrite);
  await globalForStore.__nottpayWriteQueue;
}

export function sanitizeUser(user: UserRecord): PublicWalletUser {
  return {
    id: user.id,
    phone: user.phone,
    displayPhone: formatPhoneDisplay(user.phone),
    name: user.name,
    pinEnabled: user.pinEnabled,
    biometricEnabled: user.biometricEnabled,
    balance: user.balance,
    transactions: user.transactions,
    notifications: user.notifications,
  };
}

export async function findUserByPhone(
  phone: string
): Promise<UserRecord | null> {
  const cache = await ensureLoaded();
  for (const user of cache.values()) {
    if (user.phone === phone) return user;
  }
  return fetchUserFromSupabase('phone', phone);
}

export async function findUserById(
  userId: string
): Promise<UserRecord | null> {
  const cache = await ensureLoaded();
  const cached = cache.get(userId);
  if (cached) return cached;
  return fetchUserFromSupabase('id', userId);
}

export async function createUserAccount(params: {
  phone: string;
  name: string;
  pinSalt: string;
  pinHash: string;
}): Promise<UserRecord> {
  const cache = await ensureLoaded();
  const id = `usr_${crypto.randomUUID()}`;
  const displayPhone = formatPhoneDisplay(params.phone);

  const newUser: UserRecord = {
    id,
    phone: params.phone,
    name: params.name,
    pinSalt: params.pinSalt,
    pinHash: params.pinHash,
    pinEnabled: true,
    biometricEnabled: false,
    balance: INITIAL_BALANCE,
    transactions: [],
    notifications: [
      {
        id: `notif-welcome-${Date.now()}`,
        title: 'Welcome to NOTTPAY',
        body: `Your wallet for ${displayPhone} is active with ${formatBDT(
          INITIAL_BALANCE
        )} in demo funds.`,
        time: 'Just now',
        read: false,
      },
    ],
    createdAt: new Date().toISOString(),
  };

  cache.set(id, newUser);
  await Promise.all([persistStore(), syncUserToSupabase(newUser)]);
  return newUser;
}

export async function updateUserProfileRecord(
  userId: string,
  updates: {
    name?: string;
    pinEnabled?: boolean;
    biometricEnabled?: boolean;
  }
): Promise<UserRecord | null> {
  const user = await findUserById(userId);
  if (!user) return null;

  if (typeof updates.name === 'string' && updates.name.trim()) {
    user.name = updates.name.trim().slice(0, 40);
  }
  if (typeof updates.pinEnabled === 'boolean') {
    user.pinEnabled = updates.pinEnabled;
  }
  if (typeof updates.biometricEnabled === 'boolean') {
    user.biometricEnabled = updates.biometricEnabled;
  }

  const cache = await ensureLoaded();
  cache.set(userId, user);
  await Promise.all([persistStore(), syncUserToSupabase(user)]);
  return user;
}

export async function recordWalletTransaction(params: {
  userId: string;
  type: TransactionType;
  recipient: string;
  amount: number;
  note?: string;
}): Promise<{ user: UserRecord; transaction: Transaction } | { error: string }> {
  const user = await findUserById(params.userId);
  if (!user) {
    return { error: 'Account not found.' };
  }

  const roundedAmount = Math.round(params.amount * 100) / 100;
  const outgoing = isOutgoingTransaction(params.type);

  if (outgoing && roundedAmount > user.balance) {
    return {
      error: `Insufficient demo balance (${formatBDT(user.balance)} available).`,
    };
  }

  const reference = generateReference();
  const nowIso = new Date().toISOString();
  const newTx: Transaction = {
    id: `tx-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
    type: params.type,
    recipient: params.recipient,
    amount: roundedAmount,
    note: params.note || undefined,
    date: nowIso,
    reference,
  };

  user.balance =
    Math.round(
      (outgoing ? user.balance - roundedAmount : user.balance + roundedAmount) *
        100
    ) / 100;
  user.transactions = [newTx, ...user.transactions];
  user.notifications = [
    {
      id: `notif-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
      title: TRANSACTION_LABELS[params.type],
      body: `${outgoing ? 'Sent' : 'Added'} ${formatBDT(roundedAmount)} ${
        outgoing ? 'to' : 'from'
      } ${params.recipient} (Ref ${reference}).`,
      time: 'Just now',
      read: false,
    },
    ...user.notifications.slice(0, 14),
  ];

  const cache = await ensureLoaded();
  cache.set(user.id, user);

  const syncTasks: Promise<void>[] = [syncUserToSupabase(user)];

  // If sending money to another registered NOTTPAY mobile number, credit their wallet too
  if (params.type === 'send') {
    const normalizedTarget = normalizePhoneNumber(params.recipient);
    if (normalizedTarget && normalizedTarget !== user.phone) {
      const targetUser = await findUserByPhone(normalizedTarget);
      if (targetUser) {
        const incomingTx: Transaction = {
          id: `tx-in-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
          type: 'add',
          recipient: `${user.name} (${formatPhoneDisplay(user.phone)})`,
          amount: roundedAmount,
          note: params.note || 'Received via NOTTPAY',
          date: nowIso,
          reference,
        };
        targetUser.balance =
          Math.round((targetUser.balance + roundedAmount) * 100) / 100;
        targetUser.transactions = [incomingTx, ...targetUser.transactions];
        targetUser.notifications = [
          {
            id: `notif-in-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
            title: 'Money received',
            body: `You received ${formatBDT(roundedAmount)} from ${
              user.name
            } (${formatPhoneDisplay(user.phone)}) · Ref ${reference}.`,
            time: 'Just now',
            read: false,
          },
          ...targetUser.notifications.slice(0, 14),
        ];
        cache.set(targetUser.id, targetUser);
        syncTasks.push(syncUserToSupabase(targetUser));
      }
    }
  }

  await Promise.all([persistStore(), ...syncTasks]);
  return { user, transaction: newTx };
}

export async function markUserNotificationsRead(
  userId: string
): Promise<UserRecord | null> {
  const user = await findUserById(userId);
  if (!user) return null;

  user.notifications = user.notifications.map((n) => ({ ...n, read: true }));
  const cache = await ensureLoaded();
  cache.set(userId, user);
  await Promise.all([persistStore(), syncUserToSupabase(user)]);
  return user;
}

export async function resetUserDemoWallet(
  userId: string
): Promise<UserRecord | null> {
  const user = await findUserById(userId);
  if (!user) return null;

  user.balance = INITIAL_BALANCE;
  user.transactions = [];
  user.notifications = [
    {
      id: `notif-reset-${Date.now()}`,
      title: 'Demo wallet reset',
      body: `Your demo balance has been reset to ${formatBDT(INITIAL_BALANCE)}.`,
      time: 'Just now',
      read: false,
    },
  ];
  const cache = await ensureLoaded();
  cache.set(userId, user);
  await Promise.all([persistStore(), syncUserToSupabase(user)]);
  return user;
}
