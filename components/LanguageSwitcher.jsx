'use client';

import React from 'react';
import { useLanguage } from './LanguageProvider';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="inline-flex items-center rounded-lg border border-slate-300 bg-white p-0.5 text-xs font-medium shadow-sm">
      <div className="px-1.5 text-slate-400">
        <Globe className="w-3.5 h-3.5" />
      </div>
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`px-2.5 py-1 rounded-md transition-colors ${
          language === 'en'
            ? 'bg-blue-600 text-white font-semibold shadow-xs'
            : 'text-slate-600 hover:text-slate-900'
        }`}
        aria-label="Switch to English"
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLanguage('mr')}
        className={`px-2.5 py-1 rounded-md transition-colors ${
          language === 'mr'
            ? 'bg-blue-600 text-white font-semibold shadow-xs'
            : 'text-slate-600 hover:text-slate-900'
        }`}
        aria-label="मराठी मध्ये बदला"
      >
        मराठी
      </button>
    </div>
  );
}
