import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden text-center">
        {/* Superior College Header */}
        <div className="bg-slate-900 p-8 text-white">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white p-1 flex items-center justify-center shadow-lg border-2 border-emerald-500/30">
            <Image
              src="/images/superior-logo.png"
              alt="Superior College Logo"
              width={64}
              height={64}
              className="w-full h-full object-contain rounded-full"
              priority
            />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Superior Lab Tracker</h1>
          <p className="text-xs text-slate-300 mt-1 font-medium">
            Superior College, Mian Channu — Punjab, Pakistan
          </p>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="text-5xl font-black text-slate-200 mb-2">404</div>
          <h2 className="text-base font-bold text-slate-900 mb-2">
            Academic Page Not Found
          </h2>
          <p className="text-xs text-slate-500 mb-6 leading-relaxed">
            The requested academic record, lab folder, or page does not exist or may have been moved.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
            >
              <Home className="w-4 h-4" />
              <span>Go to Dashboard</span>
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Sign In</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
