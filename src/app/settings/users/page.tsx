import React from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/shared/PageHeader';
import { getCollegeUsers, getDriveConnection } from '@/lib/data/college-store';
import { Users, ShieldCheck, UserCheck, UserPlus, Info, CheckCircle2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default async function UsersSettingsPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  if (session.role !== 'administrator') {
    redirect('/dashboard?error=unauthorized');
  }

  const [users, connection] = await Promise.all([
    getCollegeUsers(),
    getDriveConnection(),
  ]);

  return (
    <AppShell
      user={session}
      syncStatus={connection.sync_status}
      lastSuccessfulSync={connection.last_successful_sync}
    >
      <PageHeader
        title="Authorized Staff & Role Management"
        subtitle="Manage college staff access, administrator privileges, and departmental viewers"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Settings' },
          { label: 'Users & Roles' },
        ]}
      />

      <div className="space-y-6 max-w-4xl">
        {/* Role Matrix Card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-2">
            <div className="flex items-center gap-2 text-blue-700">
              <ShieldCheck className="w-5 h-5" />
              <h3 className="font-bold text-sm text-slate-900">Administrator Role</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Full control over Google Drive OAuth, root folder selection, hierarchy mapping heuristics, manual synchronization, and staff user provisioning.
            </p>
          </div>

          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-2">
            <div className="flex items-center gap-2 text-emerald-700">
              <UserCheck className="w-5 h-5" />
              <h3 className="font-bold text-sm text-slate-900">Viewer Role</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Read-only access to academic departments, course subjects, practical folder breakdowns, student submission file counts, and global metadata search.
            </p>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-700" />
              <h2 className="text-sm font-bold text-slate-900">Authorized College Staff</h2>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              {users.length} Active Accounts
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Staff Member</th>
                  <th className="py-2.5 px-4">Email</th>
                  <th className="py-2.5 px-4">Role</th>
                  <th className="py-2.5 px-4">Account Status</th>
                  <th className="py-2.5 px-4 text-right">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {u.full_name}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {u.email}
                    </td>
                    <td className="py-3 px-4">
                      {u.role === 'administrator' ? (
                        <span className="inline-flex items-center gap-1 text-blue-700 font-medium bg-blue-50 px-2.5 py-0.5 rounded-full text-[11px] border border-blue-100">
                          <ShieldCheck className="w-3 h-3" />
                          Administrator
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-medium bg-emerald-50 px-2.5 py-0.5 rounded-full text-[11px] border border-emerald-100">
                          <UserCheck className="w-3 h-3" />
                          Viewer
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Active
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px] text-right">
                      {formatDate(u.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Provisioning Notice */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-slate-900 block">Staff Provisioning Procedure</span>
            <p className="text-slate-500 leading-relaxed text-[11px]">
              In accordance with college security policies, public self-registration is permanently disabled. New faculty or laboratory demonstrators are provisioned by College IT through Supabase Auth invite API with verified institutional email addresses.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
