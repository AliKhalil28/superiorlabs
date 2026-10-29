import React from 'react';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
import { getSession } from '@/lib/auth/session';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/shared/PageHeader';
import { getTeacherSummaries, getDriveConnection } from '@/lib/data/college-store';
import { TeachersClientView } from './TeachersClientView';

export default async function TeachersPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const [teachers, connection] = await Promise.all([
    getTeacherSummaries(),
    getDriveConnection(),
  ]);

  return (
    <AppShell
      user={session}
      syncStatus={connection.sync_status}
      lastSuccessfulSync={connection.last_successful_sync}
    >
      <PageHeader
        title="Faculty & Teacher Practical Tracking"
        subtitle="Practical folder coverage and student submission compliance tracked teacher-wise across college departments"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Faculty Teachers' },
        ]}
      />

      <TeachersClientView initialTeachers={teachers} />
    </AppShell>
  );
}
