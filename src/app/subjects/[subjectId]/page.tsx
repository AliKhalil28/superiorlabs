import React from 'react';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth/session';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/shared/PageHeader';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { PracticalFolderCard } from '@/components/practicals/PracticalFolderCard';
import { getSubjectById, getDriveConnection } from '@/lib/data/college-store';
import { BookOpen, Folder, FolderCheck, FolderX, FileText, HardDrive, Info } from 'lucide-react';

interface Props {
  params: Promise<{ subjectId: string }>;
}

export default async function SubjectDetailPage({ params }: Props) {
  const { subjectId } = await params;
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const [subject, connection] = await Promise.all([
    getSubjectById(subjectId),
    getDriveConnection(),
  ]);

  if (!subject) {
    notFound();
  }

  const { progress } = subject;

  return (
    <AppShell
      user={session}
      syncStatus={connection.sync_status}
      lastSuccessfulSync={connection.last_successful_sync}
    >
      <PageHeader
        title={subject.name}
        subtitle={`Academic Context: ${subject.academicGroupName} · Expected: 10 Practicals`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Subjects', href: '/subjects' },
          { label: subject.name },
        ]}
      />

      {/* Subject Metrics Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs mb-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{subject.name}</h2>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
                <span className="font-medium text-slate-700">{subject.academicGroupName}</span>
                <span>•</span>
                <span className="font-mono text-[11px] text-slate-400">Drive ID: {subject.driveFolderId}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100">
              <Folder className="w-4 h-4" />
              Folder Coverage: {progress.folderCoveragePercentage}%
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-100">
              <FolderCheck className="w-4 h-4" />
              Submission Coverage: {progress.submissionCoveragePercentage}%
            </span>
          </div>
        </div>

        {/* 4 Detailed Stat Boxes */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-xs text-slate-500 block uppercase font-medium">Expected Practicals</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">{progress.expectedPracticals}</span>
            <span className="text-[11px] text-slate-400">Institutional Target</span>
          </div>

          <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-100 text-blue-900">
            <span className="text-xs text-blue-600 block uppercase font-medium">Folders Detected</span>
            <span className="text-2xl font-bold text-blue-800 mt-1 block">{progress.practicalFoldersDetected}</span>
            <span className="text-[11px] text-blue-600">
              {progress.missingPracticalFolders} missing from Drive
            </span>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-100 text-emerald-900">
            <span className="text-xs text-emerald-600 block uppercase font-medium">Populated Practicals</span>
            <span className="text-2xl font-bold text-emerald-700 mt-1 block">{progress.populatedPracticalFolders}</span>
            <span className="text-[11px] text-emerald-600">
              {progress.emptyPracticalFolders} empty folders
            </span>
          </div>

          <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-100 text-purple-900">
            <span className="text-xs text-purple-600 block uppercase font-medium">Total Files Discovered</span>
            <span className="text-2xl font-bold text-purple-800 mt-1 block">{progress.totalSubmissionFiles}</span>
            <span className="text-[11px] text-purple-600">Student submissions</span>
          </div>
        </div>

        {/* Progress Bars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <ProgressBar
            percentage={progress.folderCoveragePercentage}
            label="Practical Folder Coverage"
            subtext={`${progress.practicalFoldersDetected} of 10 practical folders organized in Google Drive`}
            variant="blue"
          />
          <ProgressBar
            percentage={progress.submissionCoveragePercentage}
            label="Student Submission Coverage"
            subtext={`${progress.populatedPracticalFolders} of 10 practicals have student submission files`}
            variant="emerald"
          />
        </div>
      </div>

      {/* 10 Practicals Grid Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            10 Practical Schedule Breakdown
          </h3>
          <p className="text-xs text-slate-500">
            Click any populated or empty practical folder to view discovered student submission filenames
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Populated
          </span>
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Empty
          </span>
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-300" /> Missing
          </span>
        </div>
      </div>

      {/* Grid of 10 Practicals */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {progress.practicals.map((practical) => (
          <PracticalFolderCard
            key={practical.id}
            id={practical.id}
            name={practical.name}
            practicalNumber={practical.practicalNumber}
            status={practical.status}
            fileCount={practical.fileCount}
            lastModified={practical.lastModified}
            subjectId={subject.id}
            isVirtualPlaceholder={practical.isVirtualPlaceholder}
          />
        ))}
      </div>

      {/* Informational Guidance */}
      <div className="mt-8 p-4 bg-blue-50/50 border border-blue-200/60 rounded-xl flex items-start gap-3 text-xs text-blue-900">
        <Info className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-semibold block">Academic Integrity Notice</span>
          <p className="text-blue-800 leading-relaxed">
            The presence of 25 files in Lab 1 represents <strong>1 practical containing 25 files</strong>, not 25 completed practicals. Empty folders (e.g. Lab 3) do not count as submitted until files are present. Missing practicals are calculated targets and will automatically become available once created in Google Drive.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
