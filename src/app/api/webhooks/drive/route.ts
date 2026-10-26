import { NextRequest, NextResponse } from 'next/server';
import { runDriveSync } from '@/lib/drive/sync-service';
import { getDriveConnection } from '@/lib/data/college-store';

/**
 * Google Drive Changes Push Notification Webhook Receiver
 * Triggered by Google Drive Changes Watch API
 */
export async function POST(req: NextRequest) {
  const channelId = req.headers.get('x-goog-channel-id');
  const resourceId = req.headers.get('x-goog-resource-id');
  const resourceState = req.headers.get('x-goog-resource-state');

  // Verify headers
  if (!channelId || !resourceId) {
    return NextResponse.json({ error: 'Missing required Google webhook headers' }, { status: 400 });
  }

  // Handle sync verification ping from Google
  if (resourceState === 'sync') {
    return NextResponse.json({ status: 'sync_acknowledged' }, { status: 200 });
  }

  try {
    const connection = await getDriveConnection();

    // Trigger incremental sync job
    // Webhooks should trigger reading the real changes feed, not be trusted as self-contained records
    await runDriveSync({
      jobType: 'incremental',
      rootFolderId: connection.root_folder_id,
      encryptedRefreshToken: connection.encrypted_refresh_token || undefined,
    });

    return NextResponse.json({ status: 'change_processed' }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Webhook error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
