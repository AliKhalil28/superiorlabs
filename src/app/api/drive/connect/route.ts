import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getAuthorizationUrl } from '@/lib/drive/oauth';

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'));
  }

  if (session.role !== 'administrator') {
    return NextResponse.json(
      { error: 'Forbidden: Only administrators can connect institutional Google Drive' },
      { status: 403 }
    );
  }

  try {
    const authUrl = getAuthorizationUrl();
    return NextResponse.redirect(authUrl);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Google OAuth configuration missing';
    return NextResponse.redirect(
      new URL(`/settings/drive?error=${encodeURIComponent(message)}`, process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
    );
  }
}
