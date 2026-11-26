import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedSession } from '@/lib/server-auth';
import { markUserNotificationsRead, sanitizeUser } from '@/lib/server-store';

export async function POST(req: NextRequest) {
  const session = getAuthenticatedSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const updated = await markUserNotificationsRead(session.userId);
  if (!updated) {
    return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
  }

  return NextResponse.json({ user: sanitizeUser(updated) });
}
