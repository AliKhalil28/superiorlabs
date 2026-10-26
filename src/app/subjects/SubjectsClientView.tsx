'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { SubjectSummaryView } from '@/types/database.types';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { Search, Filter, BookOpen, ArrowRight, Folder, FolderCheck, FolderX, FileText } from 'lucide-react';

interface SubjectsClientViewProps {
  initialSubjects: SubjectSummaryView[];
}

export const SubjectsClientView: React.FC<SubjectsClientViewProps> = ({ initialSubjects }) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'missing' | 'incomplete' | 'completed'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'lowest_coverage' | 'highest_coverage'>('name');

  const filtered = initialSubjects.filter((s) => {
    const matchesSearch = s.subject_name.toLowerCase().includes(search.toLowerCase()) ||
      (s.academic_group_name && s.academic_group_name.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;

    if (filter === 'missing') return s.missing_practical_folders > 0;
    if (filter === 'incomplete') return s.submission_coverage_percentage < 100;
    if (filter === 'completed') return s.submission_coverage_percentage === 100;

    return true;
  });

  filtered.sort((a, b) => {
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
            placeholder="Search subjects or academic groups..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-600"
          >
            <option value="all">All Subjects ({initialSubjects.length})</option>
            <option value="missing">Missing Practical Folders</option>
            <option value="incomplete">Incomplete Submissions</option>
            <option value="completed">100% Fully Populated</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-600"
          >
            <option value="name">Sort by Name</option>
            <option value="lowest_coverage">Lowest Submission Coverage</option>
            <option value="highest_coverage">Highest Submission Coverage</option>
          </select>
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
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{subj.subject_name}</h3>
                      <span className="text-xs text-slate-500">
                        {subj.academic_group_name}
                      </span>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold shrink-0">
                    Expected: 10
                  </span>
                </div>

                {/* Practical Counts Breakdown */}
                <div className="grid grid-cols-4 gap-2 text-center py-2.5 px-3 bg-slate-50 rounded-lg my-3 text-xs">
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
                <div className="space-y-2.5 mb-3">
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

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400 truncate max-w-[150px]">
                  ID: {subj.drive_folder_id}
                </span>

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
    </div>
  );
};
