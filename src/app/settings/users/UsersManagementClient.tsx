'use client';

import React, { useState } from 'react';
import { CollegeUser } from '@/lib/data/college-store';
import { UserSession } from '@/lib/auth/session';
import {
  Users,
  ShieldCheck,
  UserCheck,
  CheckCircle2,
  XCircle,
  Plus,
  KeyRound,
  Pencil,
  Trash2,
  X,
  Check,
  Eye,
  EyeOff,
  Sparkles,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface UsersManagementClientProps {
  initialUsers: CollegeUser[];
  currentUser: UserSession;
}

export const UsersManagementClient: React.FC<UsersManagementClientProps> = ({
  initialUsers,
  currentUser,
}) => {
  const [users, setUsers] = useState<CollegeUser[]>(initialUsers);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<CollegeUser | null>(null);
  const [passwordResetUser, setPasswordResetUser] = useState<CollegeUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<CollegeUser | null>(null);

  // Add Form State
  const [newEmail, setNewEmail] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newRole, setNewRole] = useState<'administrator' | 'viewer'>('viewer');
  const [newPassword, setNewPassword] = useState('Superior2026!');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);

  // Edit Form State
  const [editFullName, setEditFullName] = useState('');
  const [editRole, setEditRole] = useState<'administrator' | 'viewer'>('viewer');
  const [editIsActive, setEditIsActive] = useState(true);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Direct Password Override State
  const [overridePassword, setOverridePassword] = useState('');
  const [showOverridePassword, setShowOverridePassword] = useState(true);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  // Delete State
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let res = 'Sup-';
    for (let i = 0; i < 8; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return res;
  };

  // Open Edit Modal
  const handleOpenEdit = (user: CollegeUser) => {
    setEditingUser(user);
    setEditFullName(user.full_name);
    setEditRole(user.role);
    setEditIsActive(user.is_active);
  };

  // Open Direct Password Override Modal
  const handleOpenPasswordReset = (user: CollegeUser) => {
    setPasswordResetUser(user);
    setOverridePassword(generateRandomPassword());
    setShowOverridePassword(true);
  };

  // Submit Add User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingAdd(true);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newEmail.trim(),
          fullName: newFullName.trim(),
          role: newRole,
          password: newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast('error', data.error || 'Failed to create user');
        return;
      }

      setUsers((prev) => [...prev, data.user]);
      setIsAddModalOpen(false);
      setNewEmail('');
      setNewFullName('');
      setNewPassword('Superior2026!');
      showToast('success', `User account for ${data.user.email} created successfully.`);
    } catch {
      showToast('error', 'Network error while creating user');
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  // Submit Edit User
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsSubmittingEdit(true);

    try {
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: editFullName.trim(),
          role: editRole,
          isActive: editIsActive,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast('error', data.error || 'Failed to update profile');
        return;
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === editingUser.id ? { ...u, ...data.user } : u))
      );
      setEditingUser(null);
      showToast('success', `Profile for ${editingUser.email} updated successfully.`);
    } catch {
      showToast('error', 'Network error while updating profile');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Submit Direct Password Override (NO old password required!)
  const handleDirectPasswordOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordResetUser) return;

    if (!overridePassword || overridePassword.length < 6) {
      showToast('error', 'Password must be at least 6 characters long');
      return;
    }

    setIsSubmittingPassword(true);

    try {
      const res = await fetch(`/api/admin/users/${passwordResetUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: overridePassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast('error', data.error || 'Failed to reset password');
        return;
      }

      showToast(
        'success',
        `Password for ${passwordResetUser.email} has been updated to: "${overridePassword}". No old password required.`
      );
      setPasswordResetUser(null);
    } catch {
      showToast('error', 'Network error while resetting password');
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  // Submit Delete User
  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    setIsSubmittingDelete(true);

    try {
      const res = await fetch(`/api/admin/users/${deletingUser.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) {
        showToast('error', data.error || 'Failed to delete user');
        return;
      }

      setUsers((prev) => prev.filter((u) => u.id !== deletingUser.id));
      showToast('success', `User ${deletingUser.email} has been permanently deleted.`);
      setDeletingUser(null);
    } catch {
      showToast('error', 'Network error while deleting user');
    } finally {
      setIsSubmittingDelete(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between shadow-sm animate-in fade-in duration-200 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-semibold">
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-xs font-bold text-slate-400 hover:text-slate-600 ml-4"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Role Matrix Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-blue-700">
            <ShieldCheck className="w-5 h-5" />
            <h3 className="font-bold text-sm text-slate-900">Administrator Role</h3>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Full control over Google Drive OAuth, root folder selection, hierarchy mapping heuristics, manual synchronization, teacher assignment, and staff user provisioning.
          </p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-emerald-700">
            <UserCheck className="w-5 h-5" />
            <h3 className="font-bold text-sm text-slate-900">Viewer Role (Lab Incharge & HOD)</h3>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            View-only access to academic programs, subjects, practical folders, student counts, and coverage. Cannot edit hierarchy or view raw student Drive files.
          </p>
        </div>
      </div>

      {/* Authorized Users Management Card */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">College Staff User Directory</h2>
              <p className="text-xs text-slate-500">Manage credentials, roles, and direct password resets</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center justify-center gap-1.5 transition-colors self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New User</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Staff Member</th>
                <th className="py-2.5 px-4">Email</th>
                <th className="py-2.5 px-4">Role</th>
                <th className="py-2.5 px-4">Account Status</th>
                <th className="py-2.5 px-4">Created</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {users.map((u) => {
                const isSelf = u.id === currentUser.id;
                return (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      <div className="flex items-center gap-2">
                        <span>{u.full_name}</span>
                        {isSelf && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-semibold">
                            You
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {u.email}
                    </td>
                    <td className="py-3 px-4">
                      {u.role === 'administrator' ? (
                        <span className="inline-flex items-center gap-1 text-blue-700 font-semibold bg-blue-50 px-2.5 py-0.5 rounded-full text-[11px] border border-blue-100">
                          <ShieldCheck className="w-3 h-3 text-blue-600" />
                          Administrator
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full text-[11px] border border-emerald-100">
                          <UserCheck className="w-3 h-3 text-emerald-600" />
                          Viewer
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {u.is_active ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-medium text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-400 font-medium text-[11px]">
                          <XCircle className="w-3.5 h-3.5 text-slate-400" />
                          Disabled
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {formatDate(u.created_at)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Direct Password Reset Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenPasswordReset(u)}
                          title="Direct Password Reset (no old password required)"
                          className="px-2 py-1 text-xs font-semibold rounded bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 inline-flex items-center gap-1 transition-colors"
                        >
                          <KeyRound className="w-3 h-3 text-amber-600" />
                          <span>Reset Password</span>
                        </button>

                        {/* Edit User Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(u)}
                          title="Edit staff details"
                          className="p-1 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded border border-slate-200 transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete User Button (disabled for self) */}
                        {!isSelf && (
                          <button
                            type="button"
                            onClick={() => setDeletingUser(u)}
                            title="Delete staff account"
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded border border-slate-200 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: ADD NEW USER */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-900">Provision New College User</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Institutional Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@superiorcollegemc.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name & Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Noor Fatima (Lab Incharge)"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  User Role *
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as 'administrator' | 'viewer')}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                >
                  <option value="viewer">Viewer (Lab Incharge / HOD - View Only)</option>
                  <option value="administrator">Administrator (Full Access)</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">Initial Password *</label>
                  <button
                    type="button"
                    onClick={() => setNewPassword(generateRandomPassword())}
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Generate Strong</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-9 text-xs font-mono bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdd}
                  className="px-4 py-1.5 text-xs font-semibold bg-blue-700 hover:bg-blue-800 text-white rounded-lg transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  {isSubmittingAdd && <RefreshCw className="w-3 h-3 animate-spin" />}
                  <span>Create Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: DIRECT PASSWORD RESET (NO PREVIOUS PASSWORD REQUIRED!) */}
      {/* ========================================================================= */}
      {passwordResetUser && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-amber-50/70">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
                  <KeyRound className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-900">Direct Password Reset</h3>
              </div>
              <button
                type="button"
                onClick={() => setPasswordResetUser(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleDirectPasswordOverride} className="p-5 space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                <div className="font-semibold text-slate-900">{passwordResetUser.full_name}</div>
                <div className="font-mono text-[11px] text-slate-500">{passwordResetUser.email}</div>
                <p className="text-[11px] text-amber-700 font-medium pt-1">
                  ⚡ As administrator, you can override this password directly. You do not need to know or provide the previous password.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">New Password *</label>
                  <button
                    type="button"
                    onClick={() => setOverridePassword(generateRandomPassword())}
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Generate Strong</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showOverridePassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={overridePassword}
                    onChange={(e) => setOverridePassword(e.target.value)}
                    placeholder="Enter new password (min 6 characters)"
                    className="w-full px-3 py-2 pr-9 text-xs font-mono bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOverridePassword(!showOverridePassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showOverridePassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPasswordResetUser(null)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPassword}
                  className="px-4 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  {isSubmittingPassword && <RefreshCw className="w-3 h-3 animate-spin" />}
                  <span>Set New Password</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: EDIT USER DETAILS */}
      {/* ========================================================================= */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                  <Pencil className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-900">Edit Staff Member</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Email (Fixed)
                </label>
                <input
                  type="text"
                  disabled
                  value={editingUser.email}
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-100 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name & Title *
                </label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assigned Role *
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as 'administrator' | 'viewer')}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                >
                  <option value="viewer">Viewer (Lab Incharge / HOD - View Only)</option>
                  <option value="administrator">Administrator (Full Access)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="editIsActive"
                  checked={editIsActive}
                  onChange={(e) => setEditIsActive(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="editIsActive" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Account is Active (allows login)
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="px-4 py-1.5 text-xs font-semibold bg-blue-700 hover:bg-blue-800 text-white rounded-lg transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  {isSubmittingEdit && <RefreshCw className="w-3 h-3 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: DELETE CONFIRMATION */}
      {/* ========================================================================= */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full border border-slate-200 p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-9 h-9 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">Delete Staff Account?</h3>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Are you sure you want to permanently delete the account for{' '}
              <strong className="text-slate-900">{deletingUser.full_name}</strong> (
              <span className="font-mono text-slate-700">{deletingUser.email}</span>)? They will immediately lose access to the portal.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={isSubmittingDelete}
                className="px-4 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {isSubmittingDelete && <RefreshCw className="w-3 h-3 animate-spin" />}
                <span>Delete Account</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
