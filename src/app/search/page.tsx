import React from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/shared/PageHeader';
import { getDriveConnection } from '@/lib/data/college-store';
import { SearchClientView } from './SearchClientView';

export default async function SearchPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const connection = await getDriveConnection();

  return (
    <AppShell
      user={session}
      syncStatus={connection.sync_status}
      lastSuccessfulSync={connection.last_successful_sync}
    >
      <PageHeader
        title="Global Metadata Search"
        subtitle="Search across academic groups, subjects, practical folders, and student submission filenames"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Search' },
        ]}
      />

      <SearchClientView />
    </AppShell>
  );
}
