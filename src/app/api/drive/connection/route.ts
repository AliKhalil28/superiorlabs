import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getDriveConnection, updateDriveConnection } from '@/lib/data/college-store';
import { z } from 'zod';

const updateConnectionSchema = z.object({
  rootFolderId: z.string().min(5, 'Root folder ID must be at least 5 characters'),
  rootFolderName: z.string().optional(),
  connectedEmail: z.string().email().optional(),
});

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const connection = await getDriveConnection();

  // Strip sensitive encrypted token from response
  return NextResponse.json({
    id: connection.id,
    connected_email: connection.connected_email,
    root_folder_id: connection.root_folder_id,
    root_folder_name: connection.root_folder_name,
    connection_status: connection.connection_status,
    sync_status: connection.sync_status,
    last_attempted_sync: connection.last_attempted_sync,
    last_successful_sync: connection.last_successful_sync,
    last_error_message: connection.last_error_message,
    webhook_expiration: connection.webhook_expiration,
  });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (session.role !== 'administrator') {
    return NextResponse.json(
      { error: 'Forbidden: Only administrators can modify Google Drive settings' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const parsed = updateConnectionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid connection payload', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { rootFolderId, rootFolderName, connectedEmail } = parsed.data;

    const updated = await updateDriveConnection({
      root_folder_id: rootFolderId,
      root_folder_name: rootFolderName || 'Configured Lab Root Folder',
      connected_email: connectedEmail || 'it.dept@superior.edu.pk',
      connection_status: 'connected',
    });

    return NextResponse.json({
      success: true,
      connection: {
        id: updated.id,
        connected_email: updated.connected_email,
        root_folder_id: updated.root_folder_id,
        root_folder_name: updated.root_folder_name,
        connection_status: updated.connection_status,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
