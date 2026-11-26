import { NextRequest, NextResponse } from 'next/server';
import {
  hashPin,
  isValidPin,
  normalizePhoneNumber,
  signSessionToken,
} from '@/lib/server-auth';
import {
  createUserAccount,
  findUserByPhone,
  sanitizeUser,
} from '@/lib/server-store';

const DEVICE_LOCK_COOKIE = 'nottpay_device_registered';

export async function POST(req: NextRequest) {
  try {
    // Enforce one-account-creation-per-device policy via HttpOnly device cookie
    if (req.cookies.get(DEVICE_LOCK_COOKIE)?.value === '1') {
      return NextResponse.json(
        {
          error:
            'An account has already been created on this device. Please sign in with your mobile number and PIN.',
        },
        { status: 403 }
      );
    }

    const body = (await req.json()) as {
      phone?: unknown;
      name?: unknown;
      pin?: unknown;
    };

    if (
      typeof body.phone !== 'string' ||
      typeof body.name !== 'string' ||
      typeof body.pin !== 'string'
    ) {
      return NextResponse.json(
        { error: 'Phone number, name, and PIN are required.' },
        { status: 400 }
      );
    }

    const normalizedPhone = normalizePhoneNumber(body.phone);
    if (!normalizedPhone) {
      return NextResponse.json(
        {
          error:
            'Enter a valid mobile number (e.g. 017XXXXXXXX or +88017XXXXXXXX).',
        },
        { status: 400 }
      );
    }

    const trimmedName = body.name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 40) {
      return NextResponse.json(
        { error: 'Display name must be between 2 and 40 characters.' },
        { status: 400 }
      );
    }

    if (!isValidPin(body.pin)) {
      return NextResponse.json(
        { error: 'PIN must be 4 to 6 numeric digits.' },
        { status: 400 }
      );
    }

    const existing = await findUserByPhone(normalizedPhone);
    if (existing) {
      return NextResponse.json(
        {
          error:
            'An account with this mobile number already exists. Please sign in.',
        },
        { status: 409 }
      );
    }

    const { salt, hash } = hashPin(body.pin);
    const created = await createUserAccount({
      phone: normalizedPhone,
      name: trimmedName,
      pinSalt: salt,
      pinHash: hash,
    });

    const token = signSessionToken(created.id, created.phone);
    const response = NextResponse.json(
      { token, user: sanitizeUser(created) },
      { status: 201 }
    );

    response.cookies.set(DEVICE_LOCK_COOKIE, '1', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      partitioned: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: 'Unable to create account right now.' },
      { status: 400 }
    );
  }
}
