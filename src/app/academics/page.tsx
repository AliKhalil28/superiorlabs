import React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
import { getSession } from '@/lib/auth/session';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/shared/PageHeader';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { getAcademicGroups, getDriveConnection } from '@/lib/data/college-store';
import { GraduationCap, ArrowRight, FileText, UserCheck } from 'lucide-react';

interface AcademicsPageProps {
  searchParams?: Promise<{ view?: string }>;
}

export default async function AcademicsPage({ searchParams }: AcademicsPageProps) {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const resolvedParams = searchParams ? await searchParams : undefined;
  if (resolvedParams?.view === 'teachers') {
    redirect('/teachers');
  }

  const [groups, connection] = await Promise.all([
    getAcademicGroups(),
    getDriveConnection(),
  ]);

  return (
    <AppShell
      user={session}
      syncStatus={connection.sync_status}
      lastSuccessfulSync={connection.last_successful_sync}
    >
      <PageHeader
        title="Academic Programs & Semesters"
        subtitle="Browse academic departments and semester groups discovered in Google Drive"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Academic Groups' },
        ]}
      />

      {/* Switcher between Academic Programs and Faculty Teachers */}
      <div className="flex items-center gap-2 mb-6 border-b border-slate-200 pb-4">
        <Link
          href="/academics"
          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white shadow-xs flex items-center gap-2"
        >
          <GraduationCap className="w-4 h-4" />
          <span>Academic Programs ({groups.length})</span>
        </Link>
        <Link
          href="/teachers"
          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center gap-2 transition-colors border border-transparent"
        >
          <UserCheck className="w-4 h-4 text-slate-500" />
          <span>Faculty Teachers</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {groups.map((group) => (
          <div
            key={group.academic_group_id}
            className="p-6 bg-white border border-slate-200 rounded-xl shadow-xs hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">{group.academic_group_name}</h2>
                    <span className="text-xs text-slate-500 font-mono">
                      {group.total_subjects} {group.total_subjects === 1 ? 'Subject' : 'Subjects'} Registered
                    </span>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                  {group.total_expected_practicals} Practicals Exp.
                </span>
              </div>

              {/* Counts grid */}
              <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 text-center my-4">
                <div className="p-2 rounded-lg bg-slate-50">
                  <span className="text-[10px] text-slate-500 block uppercase font-medium">Detected</span>
                  <span className="text-sm font-bold text-slate-900">{group.total_practical_folders_detected}</span>
                </div>
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                  <span className="text-[10px] block uppercase font-medium">Populated</span>
                  <span className="text-sm font-bold">{group.total_populated_practical_folders}</span>
                </div>
                <div className="p-2 rounded-lg bg-rose-50 text-rose-700">
                  <span className="text-[10px] block uppercase font-medium">Missing</span>
                  <span className="text-sm font-bold">{group.total_missing_practical_folders}</span>
                </div>
              </div>

              {/* Progress bars */}
              <div className="space-y-3 mb-4">
                <ProgressBar
                  percentage={group.overall_folder_coverage_percentage}
                  label="Practical Folder Coverage"
                  size="sm"
                  variant="blue"
                />
                <ProgressBar
                  percentage={group.overall_submission_coverage_percentage}
                  label="Submission Coverage"
                  size="sm"
                  variant="emerald"
                />
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
                <FileText className="w-3.5 h-3.5" />
                <span>Total files discovered: <strong>{group.total_submission_files}</strong></span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
              <Link
                href={`/academics/${group.academic_group_id}`}
                className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors"
              >
                <span>Browse Subjects</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
