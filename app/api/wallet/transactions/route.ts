import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedSession } from '@/lib/server-auth';
import { recordWalletTransaction, sanitizeUser } from '@/lib/server-store';
import { TransactionType } from '@/lib/wallet-types';

const ALLOWED_TYPES: TransactionType[] = [
  'send',
  'add',
  'cashout',
  'payment',
  'recharge',
  'bills',
];

export async function POST(req: NextRequest) {
  const session = getAuthenticatedSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = (await req.json()) as {
      type?: unknown;
      recipient?: unknown;
      amount?: unknown;
      note?: unknown;
    };

    if (
      typeof body.type !== 'string' ||
      !ALLOWED_TYPES.includes(body.type as TransactionType)
    ) {
      return NextResponse.json(
        { error: 'Invalid transaction type.' },
        { status: 400 }
      );
    }

    if (typeof body.recipient !== 'string' || !body.recipient.trim()) {
      return NextResponse.json(
        { error: 'Recipient or source is required.' },
        { status: 400 }
      );
    }

    const recipient = body.recipient.trim().slice(0, 80);
    const numericAmount = Number(body.amount);
    if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0 ||
      numericAmount > 100000
    ) {
      return NextResponse.json(
        { error: 'Amount must be between ৳1 and ৳100,000.' },
        { status: 400 }
      );
    }

    const note =
      typeof body.note === 'string' ? body.note.trim().slice(0, 80) : '';

    const result = await recordWalletTransaction({
      userId: session.userId,
      type: body.type as TransactionType,
      recipient,
      amount: numericAmount,
      note,
    });

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      user: sanitizeUser(result.user),
      transaction: result.transaction,
    });
  } catch {
    return NextResponse.json(
      { error: 'Unable to process transaction.' },
      { status: 400 }
    );
  }
}
