'use client';

import React, { useState } from 'react';
import { UserCheck, Pencil, X, Check, GraduationCap } from 'lucide-react';

interface SubjectTeacherBadgeProps {
  subjectId: string;
  subjectName: string;
  initialTeacherName: string | null;
  isAdmin: boolean;
}

export const SubjectTeacherBadge: React.FC<SubjectTeacherBadgeProps> = ({
  subjectId,
  subjectName,
  initialTeacherName,
  isAdmin,
}) => {
  const [teacherName, setTeacherName] = useState<string | null>(initialTeacherName);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [teacherInput, setTeacherInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const openModal = () => {
    setTeacherInput(teacherName || '');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg('');

    try {
      const res = await fetch(`/api/subjects/${subjectId}/teacher`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherName: teacherInput }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to update teacher name');
        return;
      }

      setTeacherName(data.teacherName);
      setIsModalOpen(false);
    } catch {
      setErrorMsg('A network error occurred. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-800 text-xs font-semibold border border-slate-200">
        <UserCheck className="w-4 h-4 text-blue-600" />
        <span>
          Instructor:{' '}
          <strong className="text-slate-900 font-bold">
            {teacherName || <span className="text-slate-400 font-normal italic">Unassigned</span>}
          </strong>
        </span>
        {isAdmin && (
          <button
            type="button"
            onClick={openModal}
            className="ml-1.5 text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-0.5 font-medium pl-1.5 border-l border-slate-300"
            title="Edit teacher name (Admin only)"
          >
            <Pencil className="w-3 h-3" />
            <span>{teacherName ? 'Edit' : 'Assign'}</span>
          </button>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden text-left">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                  <GraduationCap className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Assign Subject Teacher</h3>
                  <p className="text-[11px] text-slate-400 truncate max-w-[280px]">
                    {subjectName}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-lg font-medium">
                  {errorMsg}
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
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSaving}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSaving ? (
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
    </>
  );
};

