import React from 'react';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
import { getSession } from '@/lib/auth/session';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/shared/PageHeader';
import { getAllSubjectSummaries, getDriveConnection } from '@/lib/data/college-store';
import { SubjectsClientView } from './SubjectsClientView';

export default async function SubjectsPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const [subjects, connection] = await Promise.all([
    getAllSubjectSummaries(),
    getDriveConnection(),
  ]);

  return (
    <AppShell
      user={session}
      syncStatus={connection.sync_status}
      lastSuccessfulSync={connection.last_successful_sync}
    >
      <PageHeader
        title="College Course Subjects"
        subtitle="Tracking 10 expected practicals per subject and individual student submission files"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Subjects' },
        ]}
      />

      <SubjectsClientView
        initialSubjects={subjects}
        isAdmin={session.role === 'administrator'}
      />
    </AppShell>
  );
}
