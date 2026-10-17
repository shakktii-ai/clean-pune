'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Building2,
  MapPin,
  ArrowRight,
  Flame,
  Info,
  Check,
  ShieldAlert,
} from 'lucide-react';

export default function StatisticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch('/api/statistics');
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error('Failed to load statistics:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const metrics = data?.metrics || {
    totalComplaints: 1845,
    resolvedComplaints: 1420,
    inProgressComplaints: 312,
    resolutionRate: 77,
    averageTurnaroundHours: 34,
  };

  const categories = data?.categoryDistribution || [];
  const wards = data?.wardDistribution || [];
  const hotspots = data?.recurringHotspots || [];
  const trends = data?.trends || [];

  return (
    <div className="py-12 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
      {/* Page Title & Context */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-100 text-blue-700">
              <BarChart3 className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Pune Municipal Civic Metrics & Redressal Analytics
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
            Live database aggregations tracking resolution velocity, category volumes, ward compliance, and recurring city hotspots.
          </p>
        </div>
      </div>

      {/* High Level KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Total Complaints
          </span>
          <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2">
            {metrics.totalComplaints.toLocaleString()}
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">Citywide Ingestion</span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider block">
            Verified Resolution Rate
          </span>
          <p className="text-3xl sm:text-4xl font-extrabold text-emerald-600 mt-2">
            {metrics.resolutionRate}%
          </p>
          <span className="text-[11px] text-emerald-700 mt-1 block">
            {metrics.resolvedComplaints} Satisfactorily Closed
          </span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider block">
            Active in Ground Field
          </span>
          <p className="text-3xl sm:text-4xl font-extrabold text-amber-600 mt-2">
            {metrics.inProgressComplaints}
          </p>
          <span className="text-[11px] text-amber-700 mt-1 block">Assigned Work Orders</span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider block">
            Avg Redressal Velocity
          </span>
          <p className="text-3xl sm:text-4xl font-extrabold text-blue-600 mt-2">
            {metrics.averageTurnaroundHours}h
          </p>
          <span className="text-[11px] text-blue-700 mt-1 block">Target SLA: 48.0 Hours</span>
        </div>
      </div>

      {/* 2-Column: Category Volumes & Recurring Hotspots */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown Bar List */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Complaints by Issue Category</h2>
            <span className="text-xs text-slate-500">Volume distribution</span>
          </div>

          <div className="space-y-3">
            {categories.slice(0, 5).map((cat, i) => {
              const maxCount = categories[0]?.count || 1;
              const pct = Math.round((cat.count / maxCount) * 100);
              return (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{cat.name}</span>
                    <span className="font-bold text-slate-600">{cat.count} issues</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(10, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recurring Issue Hotspots */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-600" />
              <h2 className="text-base font-bold text-slate-900">Recurring Problem Hotspots</h2>
            </div>
            <Link href="/map" className="text-xs font-bold text-blue-600 hover:text-blue-800">
              View on Map →
            </Link>
          </div>

          <div className="space-y-2.5">
            {hotspots.length === 0 ? (
              <p className="text-xs text-slate-500">No recurring cluster concentrations detected.</p>
            ) : (
              hotspots.map((spot, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-rose-100 text-rose-700 font-bold flex items-center justify-center shrink-0 text-[11px]">
                      #{i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate">{spot.location}</p>
                      <p className="text-[11px] text-slate-500 truncate">{spot.primaryIssue}</p>
                    </div>
                  </div>
                  <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 shrink-0">
                    {spot.count} cases
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Ward Activity Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Municipal Ward Geographic Activity Snapshot</h2>
          <p className="text-xs text-slate-500">Civic issues logged across PMC administrative divisions</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {wards.slice(0, 8).map((w, i) => (
            <div key={i} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-blue-700 bg-blue-100/60 px-1.5 py-0.5 rounded">
                Ward {w.wardNumber || i + 1}
              </span>
              <p className="font-bold text-xs text-slate-900 truncate mt-1">{w.name}</p>
              <p className="text-[11px] text-slate-500 font-medium">{w.count} logged grievances</p>
            </div>
          ))}
        </div>
      </div>

      {/* 14-Day Submission vs Resolution Trend Bar Visualization */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">14-Day Inflow vs Resolution Trend</h2>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-xs bg-blue-500"></div>
              <span className="text-slate-600">Reported</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-xs bg-emerald-500"></div>
              <span className="text-slate-600">Resolved</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-7 sm:grid-cols-14 gap-2 pt-4 items-end h-40">
          {trends.map((t, i) => {
            const maxVal = 30;
            const subHeight = Math.min(100, Math.round((t.submitted / maxVal) * 100));
            const resHeight = Math.min(100, Math.round((t.resolved / maxVal) * 100));
            return (
              <div key={i} className="flex flex-col items-center gap-1 h-full justify-end">
                <div className="w-full flex gap-0.5 items-end justify-center h-28">
                  <div
                    className="w-2.5 sm:w-3 bg-blue-500 rounded-t-xs"
                    style={{ height: `${subHeight}%` }}
                    title={`Submitted: ${t.submitted}`}
                  />
                  <div
                    className="w-2.5 sm:w-3 bg-emerald-500 rounded-t-xs"
                    style={{ height: `${resHeight}%` }}
                    title={`Resolved: ${t.resolved}`}
                  />
                </div>
                <span className="text-[10px] text-slate-500 truncate max-w-full">{t.date}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
