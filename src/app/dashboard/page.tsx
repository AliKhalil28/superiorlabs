import React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
import { getSession } from '@/lib/auth/session';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/shared/PageHeader';
import { ProgressBar } from '@/components/shared/ProgressBar';
import {
  getDashboardMetrics,
  getAllSubjectSummaries,
  getDriveConnection,
} from '@/lib/data/college-store';
import {
  GraduationCap,
  BookOpen,
  FolderCheck,
  Folder,
  FileText,
  HardDrive,
  ArrowRight,
  AlertTriangle,
  User,
  UserX,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const [metrics, subjects, connection] = await Promise.all([
    getDashboardMetrics(),
    getAllSubjectSummaries(),
    getDriveConnection(),
  ]);

  // Subjects needing attention (missing practicals or lowest submission coverage)
  const subjectsNeedingAttention = [...subjects]
    .filter((s) => s.missing_practical_folders > 0 || s.empty_practical_folders > 0)
    .sort((a, b) => a.submission_coverage_percentage - b.submission_coverage_percentage);

  // Overall calculations
  const overallFolderCoverage = metrics.total_expected_practicals > 0
    ? Math.round(
        (Math.min(metrics.total_expected_practicals, metrics.total_practical_folders_detected) /
          metrics.total_expected_practicals) *
          1000
      ) / 10
    : 0;

  const overallSubmissionCoverage = metrics.total_expected_practicals > 0
    ? Math.round(
        (Math.min(metrics.total_expected_practicals, metrics.total_practical_folders_with_submissions) /
          metrics.total_expected_practicals) *
          1000
      ) / 10
    : 0;

  return (
    <AppShell
      user={session}
      syncStatus={connection.sync_status}
      lastSuccessfulSync={connection.last_successful_sync}
    >
      <PageHeader
        title="College Lab Practical Overview"
        subtitle="Live synchronization and student submission tracking across college academic departments"
        breadcrumbs={[{ label: 'Dashboard' }]}
        actions={
          session.role === 'administrator' ? (
            <Link
              href="/settings/drive"
              className="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <HardDrive className="w-3.5 h-3.5" />
              <span>Drive Settings</span>
            </Link>
          ) : undefined
        }
      />

      {/* Main Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Card 1: Subjects */}
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Recognized Subjects</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{metrics.total_subjects}</div>
          <p className="text-[11px] text-slate-500 mt-1">
            Across {metrics.total_academic_groups} academic programs
          </p>
        </div>

        {/* Card 2: Expected vs Detected Practicals */}
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Practicals Detected</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {metrics.total_practical_folders_detected} / {metrics.total_expected_practicals}
          </div>
          <div className="mt-2">
            <ProgressBar
              percentage={overallFolderCoverage}
              label="Folder Coverage"
              size="sm"
            />
          </div>
        </div>

        {/* Card 3: Populated vs Empty */}
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Submissions Populated</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <FolderCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-700">
            {metrics.total_practical_folders_with_submissions}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {metrics.total_empty_practical_folders} empty folders · {metrics.total_missing_practical_folders} missing
          </p>
        </div>

        {/* Card 4: Discovered Files */}
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Submission Files</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{metrics.total_submission_files}</div>
          <p className="text-[11px] text-slate-500 mt-1">
            Preserved verbatim metadata from Drive
          </p>
        </div>
      </div>

      {/* Progress & Invariants Banner */}
      <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs mb-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Institutional Progress Model (10 Expected Practicals Per Subject)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Folder existence and student submission presence are tracked as strictly separate metrics.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
              <Folder className="w-3.5 h-3.5" />
              Folder Coverage: {overallFolderCoverage}%
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-100">
              <FolderCheck className="w-3.5 h-3.5" />
              Submission Coverage: {overallSubmissionCoverage}%
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
          <div>
            <ProgressBar
              percentage={overallFolderCoverage}
              label="College-wide Practical Folder Coverage"
              subtext={`${metrics.total_practical_folders_detected} practical folders created in Drive out of ${metrics.total_expected_practicals} expected`}
              variant="blue"
            />
          </div>
          <div>
            <ProgressBar
              percentage={overallSubmissionCoverage}
              label="College-wide Submission Coverage"
              subtext={`${metrics.total_practical_folders_with_submissions} practical folders contain student files out of ${metrics.total_expected_practicals} expected`}
              variant="emerald"
            />
          </div>
        </div>
      </div>

      {/* Subjects Needing Attention Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs mb-8">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <h2 className="font-semibold text-sm text-slate-900">Subjects Needing Attention</h2>
          </div>
          <Link
            href="/subjects"
            className="text-xs font-medium text-blue-700 hover:underline flex items-center gap-1"
          >
            <span>View All Subjects</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Subject Name</th>
                <th className="py-2.5 px-4">Academic Group</th>
                <th className="py-2.5 px-4">Teacher Name</th>
                <th className="py-2.5 px-4 text-center">Detected / 10</th>
                <th className="py-2.5 px-4 text-center">With Files</th>
                <th className="py-2.5 px-4 text-center">Empty</th>
                <th className="py-2.5 px-4 text-center">Missing</th>
                <th className="py-2.5 px-4">Submission Progress</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {subjectsNeedingAttention.map((subj) => (
                <tr key={subj.subject_id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    <Link
                      href={`/subjects/${subj.subject_id}`}
                      className="hover:text-blue-700 hover:underline"
                    >
                      {subj.subject_name}
                    </Link>
                  </td>
                  <td className="py-3 px-4 text-slate-500">{subj.academic_group_name}</td>
                  <td className="py-3 px-4">
                    {subj.teacher_name ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-100 shadow-2xs">
                        <User className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className="truncate max-w-[140px]">{subj.teacher_name}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 italic">
                        <UserX className="w-3 h-3 text-slate-300 shrink-0" />
                        <span>Unassigned</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center font-mono">
                    {subj.practical_folders_detected} / 10
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-emerald-700 font-semibold">
                    {subj.populated_practical_folders}
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-amber-700 font-semibold">
                    {subj.empty_practical_folders}
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-rose-700 font-semibold">
                    {subj.missing_practical_folders}
                  </td>
                  <td className="py-3 px-4 w-44">
                    <ProgressBar
                      percentage={subj.submission_coverage_percentage}
                      size="sm"
                      variant="emerald"
                    />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      href={`/subjects/${subj.subject_id}`}
                      className="text-blue-700 hover:underline font-medium inline-flex items-center gap-1"
                    >
                      <span>Inspect</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* College Drive Connection Info Banner */}
      <div className="p-4 bg-slate-900 text-white rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
            <HardDrive className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Synchronized Google Drive Root</div>
            <div className="text-sm font-semibold text-white">
              {connection.root_folder_name} ({connection.root_folder_id})
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Authorized Account: {connection.connected_email} · Last Successful Sync: {formatDate(connection.last_successful_sync)}
            </div>
          </div>
        </div>

        {session.role === 'administrator' && (
          <Link
            href="/settings/drive"
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors shrink-0 text-center"
          >
            Configure Drive Connection
          </Link>
        )}
      </div>
    </AppShell>
  );
}
