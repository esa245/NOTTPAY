import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedSession } from '@/lib/server-auth';
import { sanitizeUser, updateUserProfileRecord } from '@/lib/server-store';

export async function PATCH(req: NextRequest) {
  const session = getAuthenticatedSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = (await req.json()) as {
      name?: unknown;
      pinEnabled?: unknown;
      biometricEnabled?: unknown;
    };

    if (body.name !== undefined) {
      if (
        typeof body.name !== 'string' ||
        body.name.trim().length < 2 ||
        body.name.trim().length > 40
      ) {
        return NextResponse.json(
          { error: 'Display name must be between 2 and 40 characters.' },
          { status: 400 }
        );
      }
    }

    const updated = await updateUserProfileRecord(session.userId, {
      name: typeof body.name === 'string' ? body.name : undefined,
      pinEnabled:
        typeof body.pinEnabled === 'boolean' ? body.pinEnabled : undefined,
      biometricEnabled:
        typeof body.biometricEnabled === 'boolean'
          ? body.biometricEnabled
          : undefined,
    });

    if (!updated) {
      return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
    }

    return NextResponse.json({ user: sanitizeUser(updated) });
  } catch {
    return NextResponse.json(
      { error: 'Unable to update profile.' },
      { status: 400 }
    );
  }
}
