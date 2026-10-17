'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { useLanguage } from '@/components/LanguageProvider';

// Dynamically load PuneCivicMap to avoid SSR Leaflet window reference errors
const PuneCivicMap = dynamic(() => import('@/components/PuneCivicMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[calc(100dvh-140px)] sm:h-[calc(100dvh-160px)] min-h-[500px] max-h-[780px] bg-slate-100 flex items-center justify-center rounded-2xl sm:rounded-3xl border border-slate-200">
      <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <span>Loading Pune Civic Map Engine...</span>
      </div>
    </div>
  ),
});

export default function HomePage() {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col pb-16">
      {/* 1. PUNE INTERACTIVE MAP WITH TOP, BOTTOM, RIGHT & LEFT MARGINS */}
      <section className="max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-2 sm:pb-4" id="pune-map-section">
        <div className="w-full rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-200/90 shadow-lg ring-1 ring-slate-900/5">
          <PuneCivicMap
            fullWidth={false}
            heightClass="h-[calc(100dvh-140px)] sm:h-[calc(100dvh-160px)] min-h-[500px] max-h-[780px]"
          />
        </div>
      </section>

      {/* 2. HOW IT WORKS / CIVIC REDRESSAL LIFECYCLE */}
      <section className="bg-white border-y border-slate-200 py-12 sm:py-16 mt-6 sm:mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 block mb-1">
              Transparent Lifecycle
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {t('howTitle')}
            </h2>
            <p className="text-sm text-slate-600 mt-2 font-normal">{t('howSubtitle')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/80 relative">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-base mb-4 shadow-sm shadow-blue-600/30">
                1
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5">{t('step1Title')}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{t('step1Desc')}</p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/80 relative">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-base mb-4 shadow-sm shadow-blue-600/30">
                2
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5">{t('step2Title')}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{t('step2Desc')}</p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/80 relative">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-base mb-4 shadow-sm shadow-emerald-600/30">
                3
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5">{t('step3Title')}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{t('step3Desc')}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
