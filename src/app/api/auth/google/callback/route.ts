import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForTokens } from '@/lib/drive/oauth';
import { updateDriveConnection } from '@/lib/data/college-store';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || `${req.nextUrl.protocol}//${req.nextUrl.host}`;

  if (error) {
    return NextResponse.redirect(
      new URL(`/settings/drive?error=${encodeURIComponent(error)}`, appBaseUrl)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/settings/drive?error=No+authorization+code+received', appBaseUrl)
    );
  }

  try {
    const { encryptedRefreshToken, idToken } = await exchangeCodeForTokens(code);

    let connectedEmail: string | undefined = undefined;

    // Decode idToken payload if present to extract email
    if (idToken) {
      try {
        const parts = idToken.split('.');
        if (parts.length >= 2) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
          connectedEmail = payload.email;
        }
      } catch {
        // Fallback if token payload decoding fails
      }
    }

    // Update in college-store
    await updateDriveConnection({
      connection_status: 'connected',
      encrypted_refresh_token: encryptedRefreshToken || undefined,
      connected_email: connectedEmail || 'authorized.drive@superior.edu.pk',
      last_error_message: null,
    });

    // If Supabase is connected, persist to drive_connections table
    const supabase = createAdminClient();
    if (supabase) {
      await supabase
        .from('drive_connections')
        .upsert(
          {
            connection_status: 'connected',
            encrypted_refresh_token: encryptedRefreshToken,
            connected_email: connectedEmail || 'authorized.drive@superior.edu.pk',
            last_error_message: null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );
    }

    return NextResponse.redirect(
      new URL('/settings/drive?status=connected', appBaseUrl)
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Token exchange failed';
    return NextResponse.redirect(
      new URL(`/settings/drive?error=${encodeURIComponent(message)}`, appBaseUrl)
    );
  }
}
