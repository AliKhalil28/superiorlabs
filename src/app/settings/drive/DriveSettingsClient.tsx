'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { DriveConnection } from '@/types/database.types';
import {
  HardDrive,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Save,
  ShieldCheck,
  ExternalLink,
  KeyRound,
  FolderSync,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface DriveSettingsClientProps {
  initialConnection: DriveConnection;
}

export const DriveSettingsClient: React.FC<DriveSettingsClientProps> = ({ initialConnection }) => {
  const searchParams = useSearchParams();
  const [rootFolderId, setRootFolderId] = useState(initialConnection.root_folder_id);
  const [rootFolderName, setRootFolderName] = useState(initialConnection.root_folder_name);
  const [connectedEmail, setConnectedEmail] = useState(initialConnection.connected_email || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    const status = searchParams.get('status');
    const error = searchParams.get('error');

    if (status === 'connected') {
      setFeedback({
        type: 'success',
        message: 'Google Account successfully authorized and connected! You can now configure the root folder and run sync.',
      });
    } else if (error) {
      setFeedback({
        type: 'error',
        message: `Google OAuth authorization error: ${decodeURIComponent(error)}`,
      });
    }
  }, [searchParams]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/drive/connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rootFolderId, rootFolderName, connectedEmail }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: 'error', message: data.error || 'Failed to update settings.' });
        return;
      }

      setFeedback({ type: 'success', message: 'Google Drive configuration saved successfully.' });
    } catch {
      setFeedback({ type: 'error', message: 'A network error occurred.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTriggerSync = async () => {
    setIsSyncing(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/drive/sync', { method: 'POST' });
      const data = await res.json();

      if (!res.ok) {
        setFeedback({ type: 'error', message: data.error || 'Synchronization failed.' });
        return;
      }

      setFeedback({
        type: 'success',
        message: `Sync completed: ${data.foldersDiscovered} folders and ${data.filesDiscovered} files discovered.`,
      });
    } catch {
      setFeedback({ type: 'error', message: 'Sync request failed.' });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {feedback && (
        <div
          role="alert"
          className={`p-4 rounded-xl border text-xs font-medium flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Connection Status Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Google Cloud Drive Connection</h2>
              <p className="text-xs text-slate-500">
                Connected account: <strong>{connectedEmail || 'it.dept@superior.edu.pk'}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/api/drive/connect"
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors border border-slate-200"
            >
              <KeyRound className="w-3.5 h-3.5 text-blue-600" />
              <span>Authorize with Google</span>
            </a>

            <button
              type="button"
              onClick={handleTriggerSync}
              disabled={isSyncing}
              className="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Synchronizing...' : 'Run Sync Now'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-slate-500 block text-[11px]">Connection Status</span>
            <span className="font-semibold text-emerald-700 capitalize text-sm">
              {initialConnection.connection_status}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-slate-500 block text-[11px]">Last Attempted Sync</span>
            <span className="font-semibold text-slate-900 text-sm">
              {formatDate(initialConnection.last_attempted_sync)}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-slate-500 block text-[11px]">Last Successful Sync</span>
            <span className="font-semibold text-slate-900 text-sm">
              {formatDate(initialConnection.last_successful_sync)}
            </span>
          </div>
        </div>
      </div>

      {/* Root Folder Configuration Form */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-1">
          Configured Root Folder Settings
        </h2>
        <p className="text-xs text-slate-500 mb-5">
          Enter the Google Drive folder ID or full URL containing the college lab practicals hierarchy.
        </p>

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Google Drive Root Folder ID or URL
            </label>
            <input
              type="text"
              required
              value={rootFolderId}
              onChange={(e) => {
                const val = e.target.value.trim();
                // Extract folder ID if a full URL was pasted
                const match = val.match(/folders\/([a-zA-Z0-9_-]+)/);
                setRootFolderId(match ? match[1] : val);
              }}
              placeholder="e.g. 1AbC_xyzSuperiorLabs2026Root or https://drive.google.com/drive/folders/..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs focus:outline-none focus:border-blue-600 focus:bg-white"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              The crawler will recursively scan descendants of this root folder for academic groups, subjects, and practicals.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Root Display Label
              </label>
              <input
                type="text"
                value={rootFolderName}
                onChange={(e) => setRootFolderName(e.target.value)}
                placeholder="e.g. BS Labs Practicals Data"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Authorized College Admin Email
              </label>
              <input
                type="email"
                value={connectedEmail}
                onChange={(e) => setConnectedEmail(e.target.value)}
                placeholder="it.dept@superior.edu.pk"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              Changes apply to all future recursive and incremental sync operations.
            </span>

            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Configuration'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Guide Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-xs text-blue-900 space-y-3">
        <div className="flex items-center gap-2 font-bold text-blue-950">
          <FolderSync className="w-4 h-4 text-blue-700" />
          <span>How to Connect Real Google Drive in 4 Steps</span>
        </div>
        <ol className="list-decimal list-inside space-y-2 text-[11px] text-blue-800 leading-relaxed">
          <li>
            <strong>Configure OAuth in Google Cloud:</strong> Create an OAuth 2.0 Web Client in Google Cloud Console with scope <code>drive.metadata.readonly</code> and redirect URI <code>/api/auth/google/callback</code>.
          </li>
          <li>
            <strong>Add Environment Variables:</strong> Set <code>GOOGLE_CLIENT_ID</code>, <code>GOOGLE_CLIENT_SECRET</code>, <code>GOOGLE_REDIRECT_URI</code>, and <code>GOOGLE_TOKEN_ENCRYPTION_KEY</code> in your Vercel or <code>.env.local</code> settings.
          </li>
          <li>
            <strong>Authorize Account:</strong> Click the <strong>&quot;Authorize with Google&quot;</strong> button above to connect the college Google Workspace account.
          </li>
          <li>
            <strong>Paste Root Folder &amp; Run Sync:</strong> Paste your college lab root folder ID or URL above, click <strong>&quot;Save Configuration&quot;</strong>, then click <strong>&quot;Run Sync Now&quot;</strong>.
          </li>
        </ol>
      </div>

      {/* Security notice */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-semibold text-slate-900 block">Least Privilege Scopes Enforced</span>
          <p className="text-slate-500 leading-relaxed text-[11px]">
            Google OAuth connection requests read-only metadata scope (<code>drive.metadata.readonly</code>). The application never downloads, reads, or executes student code or files. Refresh tokens are AES-256-GCM encrypted on the server.
          </p>
        </div>
      </div>
    </div>
  );
};
