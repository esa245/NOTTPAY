import { NextRequest, NextResponse } from 'next/server';
import {
  isValidPin,
  normalizePhoneNumber,
  signSessionToken,
  verifyPin,
} from '@/lib/server-auth';
import { findUserByPhone, sanitizeUser } from '@/lib/server-store';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      phone?: unknown;
      pin?: unknown;
    };

    if (typeof body.phone !== 'string' || typeof body.pin !== 'string') {
      return NextResponse.json(
        { error: 'Mobile number and PIN are required.' },
        { status: 400 }
      );
    }

    const normalizedPhone = normalizePhoneNumber(body.phone);
    if (!normalizedPhone || !isValidPin(body.pin)) {
      return NextResponse.json(
        { error: 'Invalid mobile number or PIN.' },
        { status: 401 }
      );
    }

    const user = await findUserByPhone(normalizedPhone);
    if (!user || !verifyPin(body.pin, user.pinSalt, user.pinHash)) {
      return NextResponse.json(
        { error: 'Invalid mobile number or PIN.' },
        { status: 401 }
      );
    }

    const token = signSessionToken(user.id, user.phone);
    return NextResponse.json({ token, user: sanitizeUser(user) });
  } catch {
    return NextResponse.json(
      { error: 'Unable to sign in right now.' },
      { status: 400 }
    );
  }
}
