import { NextRequest, NextResponse } from 'next/server';

const DEVICE_LOCK_COOKIE = 'nottpay_device_registered';

export async function GET(req: NextRequest) {
  const deviceRegistered =
    req.cookies.get(DEVICE_LOCK_COOKIE)?.value === '1';
  return NextResponse.json({ deviceRegistered });
}
