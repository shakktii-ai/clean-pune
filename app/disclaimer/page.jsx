import React from 'react';
import Link from 'next/link';
import { AlertTriangle, Shield, Phone, ExternalLink } from 'lucide-react';

export const metadata = {
  title: 'Platform Disclaimer | Pune Civic Platform',
  description:
    'Independent Civic Platform Disclaimer — Clarifying non-affiliation with PMC, PCMC, or Government of Maharashtra.',
};

export default function DisclaimerPage() {
  return (
    <div className="py-12 sm:py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="space-y-3 pb-6 border-b border-slate-200">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          <span>Statutory Clarification & Non-Affiliation</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Platform Disclaimer</h1>
        <p className="text-xs text-slate-500">Last Reviewed: October 17, 2026</p>
      </div>

      <div className="bg-amber-50/80 border-2 border-amber-300 rounded-2xl p-6 sm:p-8 space-y-4">
        <h2 className="text-base sm:text-lg font-bold text-amber-950 flex items-center gap-2">
          <Shield className="w-5 h-5 text-amber-700 shrink-0" />
          <span>Independent Citizen Technology Initiative</span>
        </h2>
        <p className="text-xs sm:text-sm text-amber-900 leading-relaxed font-medium">
          <strong>Pune Civic Platform</strong> is strictly an <strong>independent, non-governmental civic technology platform</strong>.
          It is <strong>NOT</strong> affiliated with, operated by, endorsed by, or an official service of:
        </p>
        <ul className="list-disc pl-5 text-xs sm:text-sm text-amber-900 space-y-1">
          <li>Pune Municipal Corporation (PMC)</li>
          <li>Pimpri Chinchwad Municipal Corporation (PCMC)</li>
          <li>Pune Metropolitan Region Development Authority (PMRDA)</li>
          <li>Government of Maharashtra or Government of India</li>
        </ul>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 shadow-xs space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">1. Purpose of the Platform</h2>
          <p>
            The purpose of this platform is to provide citizens of Pune with an open, community-driven
            oversight tool to document municipal defects, track resolution progress with photo evidence,
            and foster civic transparency. We assist community members in organizing civic data and
            presenting it constructively to local authorities.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">2. Emergency & Life Safety Situations</h2>
          <p className="font-semibold text-rose-700">
            DO NOT USE THIS PLATFORM FOR ACTIVE LIFE SAFETY EMERGENCIES, MEDICAL CRISES, STRUCTURAL
            COLLAPSES, OR ACTIVE FIRES.
          </p>
          <p>
            For emergency assistance, contact statutory first responders immediately:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block">Emergency Response</span>
              <span className="font-bold text-slate-900 text-sm">Dial 112</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block">Fire Brigade</span>
              <span className="font-bold text-slate-900 text-sm">Dial 101</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block">Ambulance</span>
              <span className="font-bold text-slate-900 text-sm">Dial 108</span>
            </div>
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">3. Official PMC Grievance Channels</h2>
          <p>
            Citizens seeking official statutory grievance registration, municipal compensation, or
            formal administrative orders should also register their grievances directly with the
            Pune Municipal Corporation via their official portal:
          </p>
          <p className="flex items-center gap-2 pt-1 font-semibold text-blue-700">
            <ExternalLink className="w-4 h-4" />
            <span>PMC Care Toll-Free: 1800 1030 222 | Official Portal: pmc.gov.in</span>
          </p>
        </section>
      </div>
    </div>
  );
}
