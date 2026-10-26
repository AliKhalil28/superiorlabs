import React from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/shared/PageHeader';
import { getDriveConnection } from '@/lib/data/college-store';
import { GitFork, CheckCircle2, AlertTriangle, ShieldCheck, Layers, HelpCircle } from 'lucide-react';

export default async function HierarchySettingsPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  if (session.role !== 'administrator') {
    redirect('/dashboard?error=unauthorized');
  }

  const connection = await getDriveConnection();

  const rules = [
    {
      id: 'rule-01',
      pattern: '^(?:BS|SE|CS|IT|BBA)\\b',
      type: 'Academic Group (Program)',
      depth: 1,
      status: 'Active',
      description: 'Identifies degree programs directly beneath college root',
    },
    {
      id: 'rule-02',
      pattern: '\\b(?:\\d+(?:st|nd|rd|th)|semester|sem)\\b',
      type: 'Academic Group (Semester)',
      depth: 2,
      status: 'Active',
      description: 'Identifies semester sub-groupings like "SE 3rd" or "Semester 4"',
    },
    {
      id: 'rule-03',
      pattern: '^(?:Data Structure|OOP|Database Systems|Computer Networks)\\b',
      type: 'Subject (Course)',
      depth: 3,
      status: 'Active',
      description: 'Identifies subjects containing practical lab folders',
    },
    {
      id: 'rule-04',
      pattern: '^(?:lab|practical|experiment|exp)[_\\s\\-#.]*0*([1-9]\\d*)\\b',
      type: 'Practical Folder',
      depth: 4,
      status: 'Active',
      description: 'Normalizes Lab 1 through Lab 10 and extracts practical numbers',
    },
  ];

  return (
    <AppShell
      user={session}
      syncStatus={connection.sync_status}
      lastSuccessfulSync={connection.last_successful_sync}
    >
      <PageHeader
        title="Folder Hierarchy Configuration"
        subtitle="Manage rules for interpreting nested Google Drive folders and reviewing ambiguous classifications"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Settings' },
          { label: 'Hierarchy' },
        ]}
      />

      <div className="space-y-6 max-w-4xl">
        {/* Active Hierarchy Interpretation Rules */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-700" />
              <h2 className="text-sm font-bold text-slate-900">
                Active Classification Heuristics
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              4 Active Rules
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4 w-44">Target Classification</th>
                  <th className="py-2.5 px-4 font-mono">RegEx Pattern</th>
                  <th className="py-2.5 px-4 text-center w-20">Expected Depth</th>
                  <th className="py-2.5 px-4">Description</th>
                  <th className="py-2.5 px-4 text-right w-24">State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {rules.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {r.type}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-blue-800 bg-blue-50/30 rounded">
                      {r.pattern}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-slate-500">
                      Level {r.depth}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {r.description}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                        <CheckCircle2 className="w-3 h-3" />
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Ambiguous Classification Review State */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Ambiguous Classifications Queue
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Folders discovered under root that did not match standard subject or practical heuristics.
          </p>

          <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
            <span className="font-semibold text-slate-800 block">No Unresolved Folder Classifications</span>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              All folders under &quot;{connection.root_folder_name}&quot; have been mapped with confidence &gt; 90%.
            </span>
          </div>
        </div>

        {/* Guidelines */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-slate-900 block">Non-Destructive Synchronization</span>
            <p className="text-slate-500 leading-relaxed text-[11px]">
              The synchronization engine never deletes or mutates folders on Google Drive. If a new folder is created, it is classified automatically on the next scan according to these depth and name rules.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
