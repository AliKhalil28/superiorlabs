'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, BookOpen, GraduationCap, FolderCheck, FileText, ArrowRight, ExternalLink } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export const SearchClientView: React.FC = () => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<{
    academicGroups: Array<{ id: string; name: string }>;
    subjects: Array<{ id: string; name: string; academicGroupName?: string }>;
    practicals: Array<{ id: string; name: string; subjectName: string; academicGroupName: string; fileCount: number }>;
    files: Array<{
      id: string;
      name: string;
      extension: string | null;
      modifiedTime: string | null;
      practicalId: string;
      practicalName: string;
      subjectName: string;
      academicGroupName: string;
      webViewLink: string | null;
    }>;
  }>({
    academicGroups: [],
    subjects: [],
    practicals: [],
    files: [],
  });

  useEffect(() => {
    if (!query.trim()) {
      setResults({ academicGroups: [], subjects: [], practicals: [], files: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        }
      } catch (e) {
        console.error('Search query failed', e);
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const totalResultsCount =
    results.academicGroups.length +
    results.subjects.length +
    results.practicals.length +
    results.files.length;

  return (
    <div className="space-y-6">
      {/* Search Input Bar */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            autoFocus
            placeholder="Search academic groups, course subjects, practical folders, or student filenames..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
          />
        </div>
        <p className="text-[11px] text-slate-400 mt-2 px-1">
          Metadata index search. Filenames and folder structures are indexed directly from Google Drive metadata without reading file content.
        </p>
      </div>

      {isLoading && (
        <div className="p-8 text-center text-slate-500 text-xs">
          Searching synchronized academic metadata...
        </div>
      )}

      {!isLoading && query.trim() && totalResultsCount === 0 && (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-xl text-slate-500 text-sm">
          No matches found for &quot;<strong className="text-slate-800">{query}</strong>&quot;.
        </div>
      )}

      {/* Results Sections */}
      {!isLoading && totalResultsCount > 0 && (
        <div className="space-y-6">
          {/* Files Matches */}
          {results.files.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="p-4 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-600" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Discovered Student Files ({results.files.length})
                  </h3>
                </div>
              </div>
              <div className="divide-y divide-slate-100 text-xs">
                {results.files.map((file) => (
                  <div
                    key={file.id}
                    className="p-3.5 hover:bg-slate-50 flex items-center justify-between gap-4 transition-colors"
                  >
                    <div className="overflow-hidden">
                      <div className="font-mono font-semibold text-slate-900 truncate">
                        {file.name}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Location: <span className="font-medium text-slate-700">{file.subjectName}</span> /{' '}
                        <span className="font-medium text-slate-700">{file.practicalName}</span> ({file.academicGroupName})
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        href={`/practicals/${file.practicalId}`}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium transition-colors"
                      >
                        View in Folder
                      </Link>
                      {file.webViewLink && (
                        <a
                          href={file.webViewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-slate-400 hover:text-blue-700 transition-colors"
                          title="Open in Drive"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Subjects Matches */}
          {results.subjects.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="p-4 bg-slate-50/80 border-b border-slate-100 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Course Subjects ({results.subjects.length})
                </h3>
              </div>
              <div className="divide-y divide-slate-100 text-xs">
                {results.subjects.map((subj) => (
                  <Link
                    key={subj.id}
                    href={`/subjects/${subj.id}`}
                    className="p-3.5 hover:bg-slate-50 flex items-center justify-between transition-colors block"
                  >
                    <div>
                      <div className="font-semibold text-slate-900">{subj.name}</div>
                      <div className="text-[11px] text-slate-500">{subj.academicGroupName}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Practicals Matches */}
          {results.practicals.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="p-4 bg-slate-50/80 border-b border-slate-100 flex items-center gap-2">
                <FolderCheck className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Practical Folders ({results.practicals.length})
                </h3>
              </div>
              <div className="divide-y divide-slate-100 text-xs">
                {results.practicals.map((p) => (
                  <Link
                    key={p.id}
                    href={`/practicals/${p.id}`}
                    className="p-3.5 hover:bg-slate-50 flex items-center justify-between transition-colors block"
                  >
                    <div>
                      <div className="font-semibold text-slate-900">{p.name}</div>
                      <div className="text-[11px] text-slate-500">
                        {p.subjectName} · {p.academicGroupName} · {p.fileCount} files
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Academic Groups Matches */}
          {results.academicGroups.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="p-4 bg-slate-50/80 border-b border-slate-100 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Academic Groups & Semesters ({results.academicGroups.length})
                </h3>
              </div>
              <div className="divide-y divide-slate-100 text-xs">
                {results.academicGroups.map((g) => (
                  <Link
                    key={g.id}
                    href={`/academics/${g.id}`}
                    className="p-3.5 hover:bg-slate-50 flex items-center justify-between transition-colors block"
                  >
                    <div className="font-semibold text-slate-900">{g.name}</div>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
