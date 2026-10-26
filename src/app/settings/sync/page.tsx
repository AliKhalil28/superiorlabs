import React from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/shared/PageHeader';
import { getDriveConnection, getSyncJobs } from '@/lib/data/college-store';
import { Activity, Radio, RefreshCw, CheckCircle2, Clock, ShieldCheck, Database } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default async function SyncDiagnosticsPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  if (session.role !== 'administrator') {
    redirect('/dashboard?error=unauthorized');
  }

  const [connection, jobs] = await Promise.all([
    getDriveConnection(),
    getSyncJobs(),
  ]);

  return (
    <AppShell
      user={session}
      syncStatus={connection.sync_status}
      lastSuccessfulSync={connection.last_successful_sync}
    >
      <PageHeader
        title="Synchronization Diagnostics"
        subtitle="Real-time monitoring of Google Drive Changes API, push webhooks, and sync event logs"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Settings' },
          { label: 'Sync Diagnostics' },
        ]}
      />

      <div className="space-y-6 max-w-4xl">
        {/* Sync Feed Engine Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Radio className="w-4 h-4 text-blue-700" />
            <span>Google Drive Changes Feed State</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-500 block text-[11px]">Change Page Token</span>
              <span className="font-mono font-semibold text-slate-900 text-xs truncate block mt-0.5">
                {connection.change_page_token || 'Initial token generated'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-500 block text-[11px]">Webhook Channel</span>
              <span className="font-mono font-semibold text-slate-900 text-xs truncate block mt-0.5">
                {connection.webhook_channel_id || 'Active'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-500 block text-[11px]">Channel Expiration</span>
              <span className="font-semibold text-slate-900 text-xs truncate block mt-0.5">
                {formatDate(connection.webhook_expiration)}
              </span>
            </div>
          </div>
        </div>

        {/* Sync Jobs Execution Log */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-700" />
              <h2 className="text-sm font-bold text-slate-900">Recent Synchronization Jobs</h2>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              {jobs.length} Executions Logged
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4 w-32">Job Type</th>
                  <th className="py-2.5 px-4">Started At</th>
                  <th className="py-2.5 px-4">Completed At</th>
                  <th className="py-2.5 px-4 text-center">Folders</th>
                  <th className="py-2.5 px-4 text-center">Files</th>
                  <th className="py-2.5 px-4">Triggered By</th>
                  <th className="py-2.5 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-semibold text-slate-900 capitalize">
                      {job.job_type}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {formatDate(job.started_at)}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {formatDate(job.completed_at)}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-medium">
                      {job.folders_discovered}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-medium text-purple-700">
                      {job.files_discovered}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500 truncate max-w-[140px]">
                      {job.triggered_by}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                        <CheckCircle2 className="w-3 h-3" />
                        {job.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Database RLS Health */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-start gap-3">
          <Database className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-slate-900 block">Row-Level Security & Cache Consistency</span>
            <p className="text-slate-500 leading-relaxed text-[11px]">
              PostgreSQL RLS ensures that viewers have read-only access to academic metadata while write operations (manual sync, credential changes, root folder targets) are blocked at the database engine level.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
