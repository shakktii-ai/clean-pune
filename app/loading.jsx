import React from 'react';

export default function Loading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-sm font-semibold text-slate-700">Loading Pune Civic Platform...</p>
      <p className="text-xs text-slate-500 mt-1">Connecting to civic services</p>
    </div>
  );
}
