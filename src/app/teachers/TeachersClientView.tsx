'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { TeacherSummaryView } from '@/types/database.types';
import { ProgressBar } from '@/components/shared/ProgressBar';
import {
  UserCheck,
  BookOpen,
  FileText,
  ArrowRight,
  Search,
  AlertCircle,
  GraduationCap,
} from 'lucide-react';

interface TeachersClientViewProps {
  initialTeachers: TeacherSummaryView[];
}

export const TeachersClientView: React.FC<TeachersClientViewProps> = ({
  initialTeachers,
}) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'assigned' | 'unassigned'>('all');

  const filteredTeachers = initialTeachers.filter((t) => {
    if (filter === 'assigned' && t.is_unassigned) return false;
    if (filter === 'unassigned' && !t.is_unassigned) return false;

    if (!search.trim()) return true;
    const term = search.toLowerCase();

    // Match teacher name
    if (t.teacher_name.toLowerCase().includes(term)) return true;

    // Match any subject assigned to this teacher
    return t.subjects.some(
      (s) =>
        s.subject_name.toLowerCase().includes(term) ||
        (s.academic_group_name && s.academic_group_name.toLowerCase().includes(term))
    );
  });

  const totalAssignedTeachers = initialTeachers.filter((t) => !t.is_unassigned).length;
  const unassignedCount = initialTeachers.find((t) => t.is_unassigned)?.total_subjects || 0;

  return (
    <div className="space-y-6">
      {/* View Switcher Tabs: Academic Programs vs Faculty Teachers */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2">
          <Link
            href="/academics"
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center gap-2 transition-colors border border-transparent"
          >
            <GraduationCap className="w-4 h-4 text-slate-500" />
            <span>Academic Programs</span>
          </Link>
          <Link
            href="/teachers"
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white shadow-xs flex items-center gap-2"
          >
            <UserCheck className="w-4 h-4" />
            <span>Faculty Teachers ({totalAssignedTeachers})</span>
          </Link>
        </div>

        {/* Quick Filter Pills */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
              filter === 'all'
                ? 'bg-slate-900 text-white font-semibold'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            All Cards ({initialTeachers.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('assigned')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
              filter === 'assigned'
                ? 'bg-blue-600 text-white font-semibold'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Assigned ({totalAssignedTeachers})
          </button>
          {unassignedCount > 0 && (
            <button
              type="button"
              onClick={() => setFilter('unassigned')}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                filter === 'unassigned'
                  ? 'bg-amber-600 text-white font-semibold'
                  : 'bg-white border border-amber-200 text-amber-700 hover:bg-amber-50'
              }`}
            >
              Unassigned ({unassignedCount} Subjects)
            </button>
          )}
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search teacher name or course subject..."
          className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-2xs"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-semibold"
          >
            Clear
          </button>
        )}
      </div>

      {/* Teacher Cards Grid - Identical layout to Academic Groups */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredTeachers.map((teacher) => (
          <div
            key={teacher.teacher_id}
            className={`p-6 bg-white border rounded-xl shadow-xs transition-all flex flex-col justify-between ${
              teacher.is_unassigned
                ? 'border-amber-200 hover:border-amber-400 hover:shadow-md'
                : 'border-slate-200 hover:border-blue-300 hover:shadow-md'
            }`}
          >
            <div>
              {/* Card Header */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                      teacher.is_unassigned
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-blue-50 text-blue-700'
                    }`}
                  >
                    {teacher.is_unassigned ? (
                      <AlertCircle className="w-5 h-5" />
                    ) : (
                      <UserCheck className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      {teacher.teacher_name}
                    </h2>
                    <span className="text-xs text-slate-500 font-mono">
                      {teacher.total_subjects}{' '}
                      {teacher.total_subjects === 1 ? 'Subject' : 'Subjects'} Assigned
                    </span>
                  </div>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    teacher.is_unassigned
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {teacher.total_expected_practicals} Practicals Exp.
                </span>
              </div>

              {/* Assigned Subjects Badges */}
              <div className="mb-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Assigned Courses & Labs
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                  {teacher.subjects.map((subj) => (
                    <Link
                      key={subj.subject_id}
                      href={`/subjects/${subj.subject_id}`}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-xs text-slate-700 hover:text-blue-700 transition-colors"
                      title={
                        subj.academic_group_name
                          ? `${subj.subject_name} (${subj.academic_group_name})`
                          : subj.subject_name
                      }
                    >
                      <BookOpen className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="font-medium truncate max-w-[210px]">
                        {subj.subject_name}
                      </span>
                      {subj.academic_group_name && (
                        <span className="text-[10px] text-slate-400 shrink-0">
                          ({subj.academic_group_name})
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Counts grid: Detected, Populated, Missing */}
              <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 text-center my-4">
                <div className="p-2 rounded-lg bg-slate-50">
                  <span className="text-[10px] text-slate-500 block uppercase font-medium">
                    Detected
                  </span>
                  <span className="text-sm font-bold text-slate-900">
                    {teacher.total_practical_folders_detected}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                  <span className="text-[10px] block uppercase font-medium">
                    Populated
                  </span>
                  <span className="text-sm font-bold">
                    {teacher.total_populated_practical_folders}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-rose-50 text-rose-700">
                  <span className="text-[10px] block uppercase font-medium">
                    Missing
                  </span>
                  <span className="text-sm font-bold">
                    {teacher.total_missing_practical_folders}
                  </span>
                </div>
              </div>

              {/* Progress bars */}
              <div className="space-y-3 mb-4">
                <ProgressBar
                  percentage={teacher.overall_folder_coverage_percentage}
                  label="Practical Folder Coverage"
                  size="sm"
                  variant="blue"
                />
                <ProgressBar
                  percentage={teacher.overall_submission_coverage_percentage}
                  label="Submission Coverage"
                  size="sm"
                  variant="emerald"
                />
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
                <FileText className="w-3.5 h-3.5" />
                <span>
                  Total files discovered: <strong>{teacher.total_submission_files}</strong>
                </span>
              </div>
            </div>

            {/* Card Action Footer */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">
                {teacher.subjects.length} course{' '}
                {teacher.subjects.length === 1 ? 'module' : 'modules'}
              </span>
              <Link
                href={`/subjects?teacher=${encodeURIComponent(
                  teacher.is_unassigned ? 'unassigned' : teacher.teacher_name
                )}`}
                className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors"
              >
                <span>View Subjects</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {filteredTeachers.length === 0 && (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-xl">
          <UserCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No teachers found</h3>
          <p className="text-xs text-slate-500 mt-1">
            No faculty instructor matched your search filter &quot;{search}&quot;.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setFilter('all');
            }}
            className="mt-4 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold rounded-lg transition-colors"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
};

