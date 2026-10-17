'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, Phone, ExternalLink } from 'lucide-react';
import { useLanguage } from './LanguageProvider';

export default function Footer() {
  const { t } = useLanguage();
  const pathname = usePathname();

  if (pathname === '/map') return null;

  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Col 1: Platform Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                <Shield className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg text-white tracking-tight">
                {t('platformName')}
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Empowering citizens of Pune through transparent reporting of civic infrastructure issues, 
              geo-tagged tracking, and community oversight.
            </p>
            <div className="pt-2 text-xs text-slate-400">
              <span className="block font-medium text-slate-300">Community Civic Platform</span>
              <span>Pune Municipal Corporation (PMC) Region</span>
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Platform Links</h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  {t('navHome')}
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  {t('navAbout')}
                </Link>
              </li>
              <li>
                <Link href="/report" className="hover:text-white transition-colors font-semibold text-blue-400">
                  {t('navReport')}
                </Link>
              </li>
              <li>
                <Link href="/track" className="hover:text-white transition-colors">
                  {t('navTrack')}
                </Link>
              </li>
              <li>
                <Link href="/map" className="hover:text-white transition-colors">
                  {t('navMap')}
                </Link>
              </li>
              <li>
                <Link href="/statistics" className="hover:text-white transition-colors">
                  {t('navStats')}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  {t('navContact')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Official Govt Emergency Helplines */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Official Govt Helplines
              </h3>
              <ExternalLink className="w-3 h-3 text-slate-500" />
            </div>
            <p className="text-[11px] text-slate-400">
              Official Pune Municipal Corporation (PMC) & State emergency channels:
            </p>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-300">PMC Care Toll-Free:</span>
                <span className="font-semibold text-white">1800 1030 222</span>
              </li>
              <li className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-300">Pune Police Emergency:</span>
                <span className="font-semibold text-white">112</span>
              </li>
              <li className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-300">Fire Brigade Control:</span>
                <span className="font-semibold text-white">101</span>
              </li>
              <li className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-300">Medical / Ambulance:</span>
                <span className="font-semibold text-white">108</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-slate-300">PMC Disaster Cell:</span>
                <span className="font-semibold text-white">020-25501269</span>
              </li>
            </ul>
          </div>

          {/* Col 4: Governance & Legal */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Transparency & Legal</h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/disclaimer" className="hover:text-white transition-colors">
                  Platform Disclaimer
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Terms and Conditions
                </Link>
              </li>
            </ul>
            <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400">
              <p>Non-commercial civic technology infrastructure built for citizen empowerment.</p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Pune Civic Platform. Community open-civic project.</p>
          <p>Made with responsibility for Pune, Maharashtra.</p>
        </div>
      </div>
    </footer>
  );
}
