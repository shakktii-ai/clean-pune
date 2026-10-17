import React from 'react';
import Link from 'next/link';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
      <span className="text-6xl font-black text-slate-300">404</span>
      <h2 className="text-2xl font-bold text-slate-900 mt-2 mb-2">Page Not Found</h2>
      <p className="text-sm text-slate-600 mb-6 leading-relaxed">
        The civic page or complaint resource you requested does not exist or has been moved.
      </p>
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          <Home className="w-4 h-4" />
          Back to Home
        </Link>
        <Link
          href="/report"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
        >
          Report an Issue
        </Link>
      </div>
    </div>
  );
}
