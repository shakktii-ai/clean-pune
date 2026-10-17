import React from 'react';
import Link from 'next/link';
import {
  Shield,
  Target,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Users2,
  Lock,
  ArrowRight,
} from 'lucide-react';

export const metadata = {
  title: 'About Us | Pune Civic Platform',
  description:
    'Learn about Pune Civic Platform — an independent civic technology initiative providing transparent issue reporting and civic oversight across Pune.',
};

export default function AboutPage() {
  return (
    <div className="py-12 sm:py-16 space-y-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
          <Shield className="w-3.5 h-3.5 text-blue-600" />
          <span>Independent Citizen Initiative</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          Empowering Punekars Through Civic Transparency
        </h1>
        <p className="text-base text-slate-600 leading-relaxed font-normal">
          Pune Civic Platform is an independent, non-partisan civic technology bridge built by
          citizens and technologists to document, track, and accelerate the redressal of public
          infrastructure challenges across Pune.
        </p>
      </div>

      {/* Statutory Disclaimer Box */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-6 sm:p-8 flex items-start gap-4">
        <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-2 text-xs sm:text-sm text-amber-900 leading-relaxed">
          <h2 className="font-bold text-sm sm:text-base text-amber-950">
            Important Notice on Independence & Governance
          </h2>
          <p>
            This platform is <strong>NOT</strong> owned, operated, or endorsed by the Pune Municipal
            Corporation (PMC), Pimpri Chinchwad Municipal Corporation (PCMC), or the Government of
            Maharashtra. It operates strictly as an independent community oversight and civic
            grievance catalog.
          </p>
          <p>
            Citizens are encouraged to simultaneously use statutory grievance mechanisms such as the
            official PMC Care Portal (1800-1030-222) for formal municipal processing.
          </p>
        </div>
      </div>

      {/* Core Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
            <Target className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-slate-900">Accountability</h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
            Every reported issue is time-stamped and assigned standard resolution timeframes (SLAs),
            making departmental performance visible to the public.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
            <Eye className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-slate-900">Transparency</h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
            All non-sensitive complaint locations, statuses, and field verification pictures are
            openly viewable on the civic map for community oversight.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
            <Users2 className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-slate-900">Citizen First</h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
            Designed for mobile access with Marathi and English localization, ensuring every Punekar
            can voice infrastructure concerns without friction.
          </p>
        </div>
      </div>

      {/* How the Platform Operates */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-10 space-y-6">
        <div className="space-y-2">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
            Operational Blueprint
          </span>
          <h2 className="text-2xl font-bold text-slate-900">Bridging Citizens & Pune Authorities</h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
            When a citizen reports a hazard on Pune Civic Platform, the issue undergoes structured
            processing:
          </p>
        </div>

        <div className="space-y-4 text-xs sm:text-sm text-slate-700">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900">Geospatial Validation:</strong> The complaint is
              indexed with latitude/longitude coordinates and linked to one of Pune’s 15
              administrative ward offices.
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900">Department Routing:</strong> Triage algorithms categorize
              the complaint under Solid Waste, Roads & Traffic, Water Supply, Drainage, or Street Lighting.
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900">Public Redressal Record:</strong> The status remains
              publicly visible until resolved with photo evidence, preventing unresolved issues from
              quietly disappearing.
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Pune Municipal Corporation (PMC) Region</span>
          </div>
          <Link
            href="/report"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Report an Issue Now <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
