import React from 'react';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth/session';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/shared/PageHeader';
import { ProgressBar } from '@/components/shared/ProgressBar';
import {
  getAcademicGroupById,
  getAllSubjectSummaries,
  getDriveConnection,
} from '@/lib/data/college-store';
import { BookOpen, ArrowRight, Folder, FolderCheck, FolderX, FileText } from 'lucide-react';

interface Props {
  params: Promise<{ groupId: string }>;
}

export default async function AcademicGroupDetailPage({ params }: Props) {
  const { groupId } = await params;
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const [group, allSubjects, connection] = await Promise.all([
    getAcademicGroupById(groupId),
    getAllSubjectSummaries(),
    getDriveConnection(),
  ]);

  if (!group) {
    notFound();
  }

  const subjectsInGroup = allSubjects.filter((s) => s.academic_group_id === group.academic_group_id);

  return (
    <AppShell
      user={session}
      syncStatus={connection.sync_status}
      lastSuccessfulSync={connection.last_successful_sync}
    >
      <PageHeader
        title={group.academic_group_name}
        subtitle={`Academic group discovered under Google Drive root · ${subjectsInGroup.length} courses`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Academic Groups', href: '/academics' },
          { label: group.academic_group_name },
        ]}
      />

      {/* Summary card for group */}
      <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-xs mb-8">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
          Group Summary & Practical Totals
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="p-3 bg-slate-50 rounded-lg">
            <span className="text-xs text-slate-500 block">Expected Practicals</span>
            <span className="text-xl font-bold text-slate-900">{group.total_expected_practicals}</span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-700 rounded-lg">
            <span className="text-xs block">Folders Found</span>
            <span className="text-xl font-bold">{group.total_practical_folders_detected}</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg">
            <span className="text-xs block">With Submissions</span>
            <span className="text-xl font-bold">{group.total_populated_practical_folders}</span>
          </div>
          <div className="p-3 bg-rose-50 text-rose-700 rounded-lg">
            <span className="text-xs block">Missing Folders</span>
            <span className="text-xl font-bold">{group.total_missing_practical_folders}</span>
          </div>
        </div>
      </div>

      {/* Subjects Grid */}
      <h2 className="text-base font-bold text-slate-900 mb-4">
        Subjects in {group.academic_group_name}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {subjectsInGroup.map((subj) => (
          <div
            key={subj.subject_id}
            className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{subj.subject_name}</h3>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Expected: 10 Practicals
                  </span>
                </div>
              </div>

              <div className="space-y-3 my-4">
                <ProgressBar
                  percentage={subj.folder_coverage_percentage}
                  label="Practical Folder Coverage"
                  subtext={`${subj.practical_folders_detected} of 10 folders found`}
                  size="sm"
                  variant="blue"
                />
                <ProgressBar
                  percentage={subj.submission_coverage_percentage}
                  label="Submission Coverage"
                  subtext={`${subj.populated_practical_folders} of 10 practicals populated`}
                  size="sm"
                  variant="emerald"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-600 py-2 border-t border-slate-100">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <FileText className="w-3.5 h-3.5" />
                  Files Found
                </span>
                <span className="font-semibold text-slate-900">
                  {subj.total_submission_files} files
                </span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end">
              <Link
                href={`/subjects/${subj.subject_id}`}
                className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors"
              >
                <span>Open Subject Practicals</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
