'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  Search,
  MapPin,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';
import { useLanguage } from '@/components/LanguageProvider';
import { StatusBadge, PriorityBadge } from '@/components/Badge';
import { DEMO_WARDS } from '@/lib/demoData';

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
  const [selectedWard, setSelectedWard] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [complaints, setComplaints] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingComplaints, setLoadingComplaints] = useState(true);

  // Fetch real statistics and complaints from MongoDB / API
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      // 1. Fetch real statistics
      try {
        setLoadingStats(true);
        const statsRes = await fetch('/api/statistics');
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          if (isMounted && statsData.metrics) {
            setMetrics(statsData.metrics);
          }
        }
      } catch (e) {
        console.error('Failed to load real statistics:', e);
      } finally {
        if (isMounted) setLoadingStats(false);
      }

      // 2. Fetch real complaints
      try {
        setLoadingComplaints(true);
        const compRes = await fetch('/api/complaints?limit=30&sortBy=createdAt&order=desc');
        if (compRes.ok) {
          const compData = await compRes.json();
          if (isMounted && compData.complaints) {
            setComplaints(compData.complaints);
          }
        }
      } catch (e) {
        console.error('Failed to load real complaints:', e);
      } finally {
        if (isMounted) setLoadingComplaints(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Filter complaints based on user input
  const filteredComplaints = complaints.filter((c) => {
    const wardNum = c.ward?.wardNumber ?? c.wardNumber;
    const matchesWard = selectedWard === 'ALL' || String(wardNum) === selectedWard;
    const q = searchQuery.toLowerCase().trim();
    const addr = c.location?.address || '';
    const dept = c.department?.name || c.departmentName || '';
    const title = c.title || '';
    const id = c.complaintId || '';

    const matchesSearch =
      !q ||
      title.toLowerCase().includes(q) ||
      id.toLowerCase().includes(q) ||
      addr.toLowerCase().includes(q) ||
      dept.toLowerCase().includes(q);

    return matchesWard && matchesSearch;
  });

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

      {/* 2. REAL CIVIC HEALTH OVERVIEW (DYNAMIC METRICS FROM DATABASE) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mt-8 sm:mt-12">
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-6 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">Pune Civic Health Overview</h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Live Database
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Transparent complaint tracking across Pune municipal zones
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 pt-6">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 transition-all hover:bg-slate-100/60">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                {t('statsTotal')}
              </span>
              <p className="text-2xl sm:text-4xl font-extrabold text-slate-900 mt-2">
                {loadingStats ? (
                  <span className="inline-block w-16 h-8 bg-slate-200 rounded animate-pulse"></span>
                ) : (
                  (metrics?.totalComplaints ?? 0).toLocaleString()
                )}
              </p>
              <span className="text-[11px] text-slate-500 mt-1 block">Across 15 Administrative Wards</span>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 transition-all hover:bg-emerald-50">
              <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider block">
                {t('statsResolved')}
              </span>
              <p className="text-2xl sm:text-4xl font-extrabold text-emerald-700 mt-2">
                {loadingStats ? (
                  <span className="inline-block w-16 h-8 bg-emerald-200/60 rounded animate-pulse"></span>
                ) : (
                  (metrics?.resolvedComplaints ?? 0).toLocaleString()
                )}
              </p>
              <span className="text-[11px] text-emerald-600 mt-1 block font-medium">
                {metrics?.resolutionRate ?? 0}% Redressal Rate
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-100 transition-all hover:bg-amber-50">
              <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider block">
                {t('statsInProgress')}
              </span>
              <p className="text-2xl sm:text-4xl font-extrabold text-amber-700 mt-2">
                {loadingStats ? (
                  <span className="inline-block w-16 h-8 bg-amber-200/60 rounded animate-pulse"></span>
                ) : (
                  (metrics?.inProgressComplaints ?? 0).toLocaleString()
                )}
              </p>
              <span className="text-[11px] text-amber-600 mt-1 block font-medium">Assigned to Field Teams</span>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 transition-all hover:bg-blue-50">
              <span className="text-xs font-semibold text-blue-800 uppercase tracking-wider block">
                {t('statsAvgTime')}
              </span>
              <p className="text-2xl sm:text-4xl font-extrabold text-blue-700 mt-2">
                {loadingStats ? (
                  <span className="inline-block w-16 h-8 bg-blue-200/60 rounded animate-pulse"></span>
                ) : (
                  `${metrics?.averageTurnaroundHours ?? 36} `
                )}
                <span className="text-base font-normal">{t('statsHours')}</span>
              </p>
              <span className="text-[11px] text-blue-600 mt-1 block font-medium">Against 48h City Target</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. REAL RECENT PUBLIC COMPLAINTS (LIVE FROM DATABASE) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mt-10 sm:mt-14">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                {t('recentTitle')}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">{t('recentSubtitle')}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder={t('searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-2xs"
              />
            </div>

            <select
              value={selectedWard}
              onChange={(e) => setSelectedWard(e.target.value)}
              className="text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs cursor-pointer"
            >
              <option value="ALL">All Pune Wards</option>
              {DEMO_WARDS.map((w) => (
                <option key={w._id} value={String(w.wardNumber)}>
                  Ward {w.wardNumber}: {w.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loadingComplaints ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse space-y-3">
                <div className="flex gap-2">
                  <div className="h-5 w-24 bg-slate-200 rounded"></div>
                  <div className="h-5 w-16 bg-slate-200 rounded"></div>
                </div>
                <div className="h-5 w-2/3 bg-slate-200 rounded"></div>
                <div className="h-4 w-1/2 bg-slate-100 rounded"></div>
              </div>
            ))}
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center shadow-xs">
            <AlertTriangle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No complaints matched your search</p>
            <p className="text-xs text-slate-500 mt-1">Try resetting the ward or search filters</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredComplaints.slice(0, 6).map((comp) => {
              const wardNum = comp.ward?.wardNumber ?? comp.wardNumber ?? '—';
              const wardName = comp.ward?.name || comp.wardName || 'Pune Ward';
              const deptName = comp.department?.name || comp.departmentName || 'Civic Operations';
              const address = comp.location?.address || 'Pune, Maharashtra';
              const trackLink = `/track?token=${comp.trackingToken || comp.complaintId}`;

              return (
                <div
                  key={comp._id || comp.complaintId}
                  className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 hover:border-slate-300 transition-colors shadow-xs"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {comp.complaintId}
                        </span>
                        <StatusBadge status={comp.status} />
                        <PriorityBadge priority={comp.priority} />
                        <span className="text-xs text-slate-500 font-medium">
                          Ward {wardNum}: {wardName}
                        </span>
                      </div>

                      <h3 className="font-bold text-sm sm:text-base text-slate-900">{comp.title}</h3>
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {comp.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-0.5">
                        <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {address}
                        </span>
                        <span className="text-slate-400">•</span>
                        <span>Department: {deptName}</span>
                      </div>
                    </div>

                    <div className="lg:text-right shrink-0 flex items-center lg:flex-col justify-between lg:justify-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                      <Link
                        href={trackLink}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-800 hover:bg-blue-600 hover:text-white transition-all cursor-pointer shadow-2xs"
                      >
                        <span>Track Lifecycle</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. HOW IT WORKS / CIVIC REDRESSAL LIFECYCLE */}
      <section className="bg-white border-y border-slate-200 py-12 sm:py-16 mt-12 sm:mt-16">
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
