'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { SubjectSummaryView } from '@/types/database.types';
import { ProgressBar } from '@/components/shared/ProgressBar';
import {
  Search,
  Filter,
  BookOpen,
  ArrowRight,
  FileText,
  UserCheck,
  Pencil,
  X,
  Check,
  GraduationCap,
} from 'lucide-react';

interface SubjectsClientViewProps {
  initialSubjects: SubjectSummaryView[];
  isAdmin?: boolean;
  initialTeacherFilter?: string;
}

export const SubjectsClientView: React.FC<SubjectsClientViewProps> = ({
  initialSubjects,
  isAdmin = false,
  initialTeacherFilter,
}) => {
  const [subjectsList, setSubjectsList] = useState<SubjectSummaryView[]>(initialSubjects);
  const [search, setSearch] = useState(() => {
    if (initialTeacherFilter && initialTeacherFilter.toLowerCase() !== 'unassigned') {
      return initialTeacherFilter;
    }
    return '';
  });
  const [filter, setFilter] = useState<'all' | 'assigned' | 'unassigned' | 'missing' | 'incomplete' | 'completed'>(() => {
    if (initialTeacherFilter && initialTeacherFilter.toLowerCase() === 'unassigned') {
      return 'unassigned';
    }
    return 'all';
  });
  const [sortBy, setSortBy] = useState<
    'name' | 'teacher_asc' | 'teacher_desc' | 'lowest_coverage' | 'highest_coverage'
  >('name');

  // Modal State for Teacher Assignment
  const [editingSubject, setEditingSubject] = useState<SubjectSummaryView | null>(null);
  const [teacherInput, setTeacherInput] = useState('');
  const [isSavingTeacher, setIsSavingTeacher] = useState(false);
  const [teacherSaveError, setTeacherSaveError] = useState('');

  const openTeacherModal = (subj: SubjectSummaryView) => {
    setEditingSubject(subj);
    setTeacherInput(subj.teacher_name || '');
    setTeacherSaveError('');
  };

  const handleSaveTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubject) return;

    setIsSavingTeacher(true);
    setTeacherSaveError('');

    try {
      const res = await fetch(`/api/subjects/${editingSubject.subject_id}/teacher`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherName: teacherInput }),
      });

      const data = await res.json();
      if (!res.ok) {
        setTeacherSaveError(data.error || 'Failed to update teacher name');
        return;
      }

      // Update in local state
      setSubjectsList((prev) =>
        prev.map((s) =>
          s.subject_id === editingSubject.subject_id
            ? { ...s, teacher_name: data.teacherName }
            : s
        )
      );

      setEditingSubject(null);
    } catch {
      setTeacherSaveError('A network error occurred. Please try again.');
    } finally {
      setIsSavingTeacher(false);
    }
  };

  const filtered = subjectsList.filter((s) => {
    const term = search.toLowerCase();
    const matchesSearch =
      s.subject_name.toLowerCase().includes(term) ||
      (s.academic_group_name && s.academic_group_name.toLowerCase().includes(term)) ||
      (s.teacher_name && s.teacher_name.toLowerCase().includes(term));

    if (!matchesSearch) return false;

    if (filter === 'assigned') return Boolean(s.teacher_name);
    if (filter === 'unassigned') return !s.teacher_name;
    if (filter === 'missing') return s.missing_practical_folders > 0;
    if (filter === 'incomplete') return s.submission_coverage_percentage < 100;
    if (filter === 'completed') return s.submission_coverage_percentage === 100;

    return true;
  });

  filtered.sort((a, b) => {
    if (sortBy === 'teacher_asc') {
      const tA = (a.teacher_name || 'ZZZ').toLowerCase();
      const tB = (b.teacher_name || 'ZZZ').toLowerCase();
      return tA.localeCompare(tB);
    }
    if (sortBy === 'teacher_desc') {
      const tA = (a.teacher_name || '').toLowerCase();
      const tB = (b.teacher_name || '').toLowerCase();
      return tB.localeCompare(tA);
    }
    if (sortBy === 'lowest_coverage') {
      return a.submission_coverage_percentage - b.submission_coverage_percentage;
    }
    if (sortBy === 'highest_coverage') {
      return b.submission_coverage_percentage - a.submission_coverage_percentage;
    }
    return a.subject_name.localeCompare(b.subject_name);
  });

  return (
    <div className="space-y-6">
      {/* Search, Filter, and Sort Controls */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search subjects, groups, or teacher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-600"
          >
            <option value="all">All Subjects ({subjectsList.length})</option>
            <option value="assigned">Teacher Assigned</option>
            <option value="unassigned">No Teacher Assigned</option>
            <option value="missing">Missing Practical Folders</option>
            <option value="incomplete">Incomplete Submissions</option>
            <option value="completed">100% Fully Populated</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-600 font-medium"
          >
            <option value="name">Sort by Subject Name (A-Z)</option>
            <option value="teacher_asc">Sort by Teacher Name (A to Z)</option>
            <option value="teacher_desc">Sort by Teacher Name (Z to A)</option>
            <option value="lowest_coverage">Lowest Submission Coverage</option>
            <option value="highest_coverage">Highest Submission Coverage</option>
          </select>

          <Link
            href="/teachers"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold transition-colors shrink-0"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>View Teacher Cards</span>
          </Link>
        </div>
      </div>

      {/* Grid of Subjects */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-white border border-slate-200 rounded-xl text-slate-500 italic">
            No subjects match your filter or search criteria.
          </div>
        ) : (
          filtered.map((subj) => (
            <div
              key={subj.subject_id}
              className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{subj.subject_name}</h3>
                      <span className="text-xs text-slate-500">{subj.academic_group_name}</span>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold shrink-0">
                    Expected: 10
                  </span>
                </div>

                {/* Assigned Teacher Name Banner */}
                <div className="flex items-center justify-between text-xs py-2 px-3 bg-slate-50 rounded-lg my-3 border border-slate-100">
                  <div className="flex items-center gap-2 truncate">
                    <UserCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span className="text-slate-500 font-medium">Instructor:</span>
                    <span className="font-semibold text-slate-900 truncate">
                      {subj.teacher_name ? (
                        subj.teacher_name
                      ) : (
                        <span className="text-slate-400 font-normal italic">Not Assigned</span>
                      )}
                    </span>
                  </div>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => openTeacherModal(subj)}
                      className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold hover:underline shrink-0 flex items-center gap-1 pl-2 border-l border-slate-200"
                    >
                      <Pencil className="w-3 h-3" />
                      <span>{subj.teacher_name ? 'Edit' : 'Assign'}</span>
                    </button>
                  )}
                </div>

                {/* Practical Counts Breakdown */}
                <div className="grid grid-cols-4 gap-2 text-center py-2 px-3 bg-slate-50 rounded-lg mb-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Detected</span>
                    <span className="font-bold text-slate-900">{subj.practical_folders_detected} / 10</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-600 block uppercase font-medium">Populated</span>
                    <span className="font-bold text-emerald-700">{subj.populated_practical_folders}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-amber-600 block uppercase font-medium">Empty</span>
                    <span className="font-bold text-amber-700">{subj.empty_practical_folders}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-rose-600 block uppercase font-medium">Missing</span>
                    <span className="font-bold text-rose-700">{subj.missing_practical_folders}</span>
                  </div>
                </div>

                {/* Coverage Bars */}
                <div className="space-y-2 mb-3">
                  <ProgressBar
                    percentage={subj.folder_coverage_percentage}
                    label="Practical Folder Coverage"
                    size="sm"
                    variant="blue"
                  />
                  <ProgressBar
                    percentage={subj.submission_coverage_percentage}
                    label="Submission Coverage"
                    size="sm"
                    variant="emerald"
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600 py-1.5 border-t border-slate-100">
                  <span className="flex items-center gap-1 text-slate-500">
                    <FileText className="w-3.5 h-3.5" />
                    Discovered Files:
                  </span>
                  <span className="font-semibold text-slate-900">
                    {subj.total_submission_files} files
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end">
                <Link
                  href={`/subjects/${subj.subject_id}`}
                  className="px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <span>View 10 Practicals</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Admin Only Modal: Assign / Edit Subject Teacher */}
      {editingSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                  <GraduationCap className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Assign Subject Teacher</h3>
                  <p className="text-[11px] text-slate-400 truncate max-w-[280px]">
                    {editingSubject.subject_name}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingSubject(null)}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTeacher} className="p-6 space-y-4">
              {teacherSaveError && (
                <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-lg font-medium">
                  {teacherSaveError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Teacher / Instructor Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Prof. Muhammad Tariq, Engr. Ali"
                  value={teacherInput}
                  onChange={(e) => setTeacherInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  autoFocus
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Only college administrators can assign or update subject instructors.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingSubject(null)}
                  disabled={isSavingTeacher}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingTeacher}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSavingTeacher ? (
                    <span>Saving...</span>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Save Teacher</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
