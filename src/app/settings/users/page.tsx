import React from 'react';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
import { getSession } from '@/lib/auth/session';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/shared/PageHeader';
import { getCollegeUsers, getDriveConnection } from '@/lib/data/college-store';
import { UsersManagementClient } from './UsersManagementClient';

export default async function UsersSettingsPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  if (session.role !== 'administrator') {
    redirect('/dashboard?error=unauthorized');
  }

  const [users, connection] = await Promise.all([
    getCollegeUsers(),
    getDriveConnection(),
  ]);

  return (
    <AppShell
      user={session}
      syncStatus={connection.sync_status}
      lastSuccessfulSync={connection.last_successful_sync}
    >
      <PageHeader
        title="Authorized Staff & Role Management"
        subtitle="Manage college staff access, administrator privileges, and direct password resets"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Settings' },
          { label: 'Users & Roles' },
        ]}
      />

      <UsersManagementClient initialUsers={users} currentUser={session} />
    </AppShell>
  );
}
