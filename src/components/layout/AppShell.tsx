'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  HardDrive,
  GitFork,
  Activity,
  Users,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SyncIndicator } from '@/components/shared/SyncIndicator';
import { SyncStatus } from '@/types/database.types';

interface AppShellProps {
  children: React.ReactNode;
  user?: {
    name: string;
    email: string;
    role: 'administrator' | 'viewer';
  } | null;
  syncStatus?: SyncStatus;
  lastSuccessfulSync?: string | null;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  user = {
    name: 'IT Administrator',
    email: 'admin@superiorcollegemc.com',
    role: 'administrator',
  },
  syncStatus = 'successful',
  lastSuccessfulSync = new Date().toISOString(),
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isAdmin = user?.role === 'administrator';

  const primaryNavItems = [
    { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Academic Groups', href: '/academics', icon: GraduationCap },
    { label: 'Subjects & Practicals', href: '/subjects', icon: BookOpen },
  ];

  const adminNavItems = [
    { label: 'Google Drive Connection', href: '/settings/drive', icon: HardDrive },
    { label: 'Hierarchy Configuration', href: '/settings/hierarchy', icon: GitFork },
    { label: 'Sync Diagnostics', href: '/settings/sync', icon: Activity },
    { label: 'Authorized Users', href: '/settings/users', icon: Users },
  ];

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch {
      router.push('/login');
    }
  };

  const handleManualSync = async () => {
    try {
      await fetch('/api/drive/sync', { method: 'POST' });
      router.refresh();
    } catch (e) {
      console.error('Failed to trigger sync', e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row antialiased text-slate-900">
      {/* Mobile Header Bar */}
      <header className="lg:hidden bg-slate-900 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-40 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-white p-0.5 flex items-center justify-center shrink-0 shadow-xs border border-slate-700">
            <Image
              src="/images/superior-logo.png"
              alt="Superior College Logo"
              width={32}
              height={32}
              className="w-full h-full object-contain rounded-full"
              priority
            />
          </div>
          <div>
            <div className="text-xs font-bold tracking-tight">Superior Lab Tracker</div>
            <div className="text-[10px] text-slate-400">Mian Channu Campus</div>
          </div>
        </div>

        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-1.5 rounded-md hover:bg-slate-800 text-slate-300"
          aria-label="Toggle navigation menu"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Sidebar Navigation */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col justify-between transition-transform duration-200 ease-in-out border-r border-slate-800 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 shrink-0',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col min-h-0 flex-1">
          {/* Brand Header with Official Superior Logo */}
          <div className="p-4 border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-white p-1 flex items-center justify-center shrink-0 shadow-sm border border-slate-700">
                <Image
                  src="/images/superior-logo.png"
                  alt="Superior College Logo"
                  width={44}
                  height={44}
                  className="w-full h-full object-contain rounded-full"
                  priority
                />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-xs tracking-tight text-white truncate">
                  Superior Lab Tracker
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  Superior College, Mian Channu
                </div>
              </div>
            </div>
          </div>

          {/* Nav List */}
          <nav className="p-3 space-y-6 overflow-y-auto flex-1 min-h-0">
            {/* Primary Section */}
            <div className="space-y-1">
              <span className="px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Academic Tracking
              </span>
              {primaryNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    )}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Admin Section */}
            {isAdmin && (
              <div className="space-y-1">
                <span className="px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Administration
                </span>
                {adminNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                        isActive
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      )}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </nav>
        </div>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-slate-800 shrink-0 space-y-3 bg-slate-950/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-blue-400 shrink-0">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-medium text-white truncate">{user?.name || 'Authorized Staff'}</div>
                <div className="text-[11px] text-slate-400 flex items-center gap-1">
                  {isAdmin ? (
                    <>
                      <ShieldCheck className="w-3 h-3 text-blue-400" />
                      <span>Administrator</span>
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-3 h-3 text-emerald-400" />
                      <span>Viewer</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Sign out"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-md transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay backdrop */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Desktop Bar */}
        <header className="hidden lg:flex items-center justify-between px-8 py-3.5 bg-white border-b border-slate-200">
          <div className="text-xs text-slate-500 font-medium">
            Superior College, Mian Channu — Punjab, Pakistan
          </div>

          <div className="flex items-center gap-4">
            <SyncIndicator
              status={syncStatus}
              lastSuccessfulSync={lastSuccessfulSync}
              isAdmin={isAdmin}
              onRefresh={handleManualSync}
            />

            <span className="text-slate-200">|</span>

            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Role: <strong className="text-slate-800 capitalize">{user?.role || 'Viewer'}</strong></span>
            </div>
          </div>
        </header>

        {/* Page Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
