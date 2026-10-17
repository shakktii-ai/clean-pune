'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Load PuneCivicMap dynamically to avoid SSR window issues with Leaflet
const PuneCivicMap = dynamic(() => import('@/components/PuneCivicMap'), {
  ssr: false,
  loading: () => (
    <div className="w-screen h-[100dvh] bg-slate-900 flex items-center justify-center">
      <div className="flex items-center gap-3 text-sm font-bold text-white bg-slate-800/90 px-5 py-3 rounded-2xl shadow-xl border border-slate-700">
        <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
        <span>Initializing Full-Screen Pune Civic Map...</span>
      </div>
    </div>
  ),
});

export default function IssueMapPage() {
  return (
    <div className="fixed inset-0 w-screen h-[100dvh] overflow-hidden bg-slate-100 z-30">
      <PuneCivicMap fullScreen={true} />
    </div>
  );
}
