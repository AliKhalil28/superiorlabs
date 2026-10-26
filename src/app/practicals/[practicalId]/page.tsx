import React from 'react';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
import { getSession } from '@/lib/auth/session';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { SubmissionFileList } from '@/components/practicals/SubmissionFileList';
import { getPracticalById, getDriveConnection } from '@/lib/data/college-store';
import { FolderCheck, Calendar, HardDrive, ShieldAlert, ArrowLeft } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface Props {
  params: Promise<{ practicalId: string }>;
}

export default async function PracticalDetailPage({ params }: Props) {
  const { practicalId } = await params;
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const [practical, connection] = await Promise.all([
    getPracticalById(practicalId),
    getDriveConnection(),
  ]);

  if (!practical) {
    notFound();
  }

  return (
    <AppShell
      user={session}
      syncStatus={connection.sync_status}
      lastSuccessfulSync={connection.last_successful_sync}
    >
      <PageHeader
        title={`${practical.name} — Student Submissions`}
        subtitle={`${practical.subjectName} · ${practical.academicGroupName}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Subjects', href: '/subjects' },
          { label: practical.subjectName, href: `/subjects/${practical.subjectId}` },
          { label: practical.name },
        ]}
        actions={
          <Link
            href={`/subjects/${practical.subjectId}`}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to {practical.subjectName}</span>
          </Link>
        }
      />

      {/* Practical Header Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
              <FolderCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">{practical.name}</h2>
                <StatusBadge
                  status={practical.fileCount > 0 ? 'submissions_available' : 'no_submissions'}
                  fileCount={practical.fileCount}
                />
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {practical.subjectName} ({practical.academicGroupName})
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
            <div className="flex items-center gap-1.5">
              <HardDrive className="w-4 h-4 text-slate-400" />
              <span>
                Files: <strong className="text-slate-900">{practical.fileCount}</strong>
              </span>
            </div>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>
                Last Modified: <strong className="text-slate-900">{formatDate(practical.driveModifiedTime)}</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Strict No-Content & Security Notice */}
      <div className="mb-6 p-4 rounded-xl bg-slate-900 text-slate-200 text-xs flex items-start gap-3">
        <ShieldAlert className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-semibold text-white block">Strict Metadata Only View Policy</span>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            To preserve college security and network integrity, student source files (e.g. <code>.cpp</code>, <code>.exe</code>, <code>.java</code>) are tracked by exact metadata only. File content execution and previewing inside the web server is strictly disabled. Authorized staff can open the verified file in Google Drive via the action link.
          </p>
        </div>
      </div>

      {/* Discovered Student Files List */}
      <SubmissionFileList files={practical.files} />
    </AppShell>
  );
}
