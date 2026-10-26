'use client';

import React, { useState } from 'react';
import { SubmissionFile } from '@/types/database.types';
import { ExternalLink, Search, FileCode, FileSpreadsheet, FileText, FileBinary, File, HardDrive } from 'lucide-react';
import { formatBytes, formatDate } from '@/lib/utils';

interface SubmissionFileListProps {
  files: SubmissionFile[];
}

export const SubmissionFileList: React.FC<SubmissionFileListProps> = ({ files }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFileForInspection, setSelectedFileForInspection] = useState<SubmissionFile | null>(null);

  const filteredFiles = files.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  const getFileIcon = (fileName: string, mimeType?: string | null) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'cpp' || ext === 'c' || ext === 'h' || ext === 'java' || ext === 'py' || ext === 'js' || ext === 'html') {
      return <FileCode className="w-4 h-4 text-blue-600 shrink-0" />;
    }
    if (ext === 'exe' || ext === 'bin' || ext === 'o') {
      return <FileBinary className="w-4 h-4 text-amber-600 shrink-0" />;
    }
    if (ext === 'pdf' || ext === 'doc' || ext === 'docx' || ext === 'txt') {
      return <FileText className="w-4 h-4 text-rose-600 shrink-0" />;
    }
    if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
      return <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />;
    }
    return <File className="w-4 h-4 text-slate-500 shrink-0" />;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
      {/* Search and count header */}
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-slate-500" />
          <span className="font-semibold text-sm text-slate-800">
            {files.length} {files.length === 1 ? 'Submission File' : 'Submission Files'} Discovered
          </span>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Filter by student filename..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
          />
        </div>
      </div>

      {/* File list table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-medium">
            <tr>
              <th className="py-2.5 px-4 w-12 text-center">#</th>
              <th className="py-2.5 px-4">Exact Drive Filename</th>
              <th className="py-2.5 px-4 w-28">Type / Ext</th>
              <th className="py-2.5 px-4 w-28">Size</th>
              <th className="py-2.5 px-4 w-44">Last Modified</th>
              <th className="py-2.5 px-4 w-32 text-right">Drive Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filteredFiles.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500 italic">
                  {searchQuery ? 'No student files match the search term.' : 'No submission files found in this practical folder.'}
                </td>
              </tr>
            ) : (
              filteredFiles.map((file, idx) => (
                <tr key={file.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-4 text-center font-mono text-slate-400 text-[11px]">
                    {idx + 1}
                  </td>
                  <td className="py-2.5 px-4 font-mono font-medium text-slate-900">
                    <div className="flex items-center gap-2">
                      {getFileIcon(file.name, file.mime_type)}
                      <button
                        type="button"
                        onClick={() => setSelectedFileForInspection(file)}
                        className="hover:text-blue-700 hover:underline truncate max-w-[280px] sm:max-w-md text-left"
                        title="Click to view full untruncated filename and metadata"
                      >
                        {file.name}
                      </button>
                    </div>
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[10px] font-semibold">
                      {file.extension || 'file'}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 font-mono text-[11px] text-slate-600">
                    {formatBytes(file.file_size)}
                  </td>
                  <td className="py-2.5 px-4 text-slate-500 text-[11px]">
                    {formatDate(file.drive_modified_time)}
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    {file.web_view_link ? (
                      <a
                        href={file.web_view_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium text-[11px] hover:underline"
                        title="Open original file in Google Drive (external)"
                      >
                        <span>Open Drive</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-slate-400 text-[11px]">No link</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Untruncated filename inspector modal (Strict no-content, metadata only) */}
      {selectedFileForInspection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900">File Metadata Inspection</h3>
                <p className="text-xs text-slate-500 mt-0.5">Metadata only. No file contents are loaded or executed.</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFileForInspection(null)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs bg-slate-50 p-4 rounded-lg border border-slate-200/80">
              <div>
                <span className="text-slate-500 block text-[11px] font-medium uppercase tracking-wider">Full Drive Filename:</span>
                <span className="font-mono font-semibold text-slate-900 break-all select-all">
                  {selectedFileForInspection.name}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                <div>
                  <span className="text-slate-500 block text-[11px]">Drive File ID:</span>
                  <span className="font-mono text-slate-700 break-all">{selectedFileForInspection.drive_file_id}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">File Size:</span>
                  <span className="font-mono text-slate-700">{formatBytes(selectedFileForInspection.file_size)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Extension:</span>
                  <span className="font-mono text-slate-700">{selectedFileForInspection.extension || 'None'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">MIME Type:</span>
                  <span className="font-mono text-slate-700 truncate block">{selectedFileForInspection.mime_type || 'Unknown'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedFileForInspection(null)}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Close
              </button>
              {selectedFileForInspection.web_view_link && (
                <a
                  href={selectedFileForInspection.web_view_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors inline-flex items-center gap-1.5"
                >
                  <span>Open in Google Drive</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
