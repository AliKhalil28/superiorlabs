import React, { Suspense } from 'react';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
import { getSession } from '@/lib/auth/session';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/shared/PageHeader';
import { getDriveConnection } from '@/lib/data/college-store';
import { Skeleton } from '@/components/shared/LoadingSkeleton';
import { DriveSettingsClient } from './DriveSettingsClient';

export default async function DriveSettingsPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  // Server-side authorization guard
  if (session.role !== 'administrator') {
    redirect('/dashboard?error=unauthorized');
  }

  const connection = await getDriveConnection();

  return (
    <AppShell
      user={session}
      syncStatus={connection.sync_status}
      lastSuccessfulSync={connection.last_successful_sync}
    >
      <PageHeader
        title="Google Drive Connection Settings"
        subtitle="Manage OAuth authorization, root folder target, and synchronization parameters"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Settings' },
          { label: 'Google Drive' },
        ]}
      />

      <Suspense
        fallback={
          <div className="space-y-4 max-w-4xl">
            <Skeleton className="h-44 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        }
      >
        <DriveSettingsClient initialConnection={connection} />
      </Suspense>
    </AppShell>
  );
}
