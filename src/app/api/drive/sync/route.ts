import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { runDriveSync } from '@/lib/drive/sync-service';
import { getDriveConnection, updateDriveConnection } from '@/lib/data/college-store';

export async function POST() {
  const session = await getSession();

  // Enforce server-side role check
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (session.role !== 'administrator') {
    return NextResponse.json(
      { error: 'Forbidden: Only college administrators can initiate Drive synchronization' },
      { status: 403 }
    );
  }

  try {
    const connection = await getDriveConnection();
    await updateDriveConnection({
      sync_status: 'in_progress',
      last_attempted_sync: new Date().toISOString(),
    });

    const result = await runDriveSync({
      jobType: 'manual',
      rootFolderId: connection.root_folder_id,
      encryptedRefreshToken: connection.encrypted_refresh_token || undefined,
    });

    if (result.success) {
      await updateDriveConnection({
        sync_status: 'successful',
        last_successful_sync: result.completedAt,
        last_error_message: null,
      });
    } else {
      await updateDriveConnection({
        sync_status: result.status,
        last_error_message: result.errors.join('; ') || 'Sync failed',
      });
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown sync failure';
    await updateDriveConnection({
      sync_status: 'failed',
      last_error_message: message,
    });

    return NextResponse.json(
      { error: 'Failed to complete synchronization', details: message },
      { status: 500 }
    );
  }
}
