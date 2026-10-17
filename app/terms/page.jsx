import React from 'react';
import { FileText, Shield, AlertTriangle } from 'lucide-react';

export const metadata = {
  title: 'Terms & Conditions | Pune Civic Platform',
  description: 'Terms and Conditions governing the use of Pune Civic Platform.',
};

export default function TermsPage() {
  return (
    <div className="py-12 sm:py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="space-y-3 pb-6 border-b border-slate-200">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <FileText className="w-3.5 h-3.5" />
          <span>User Agreement</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Terms and Conditions</h1>
        <p className="text-xs text-slate-500">Effective Date: October 17, 2026</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 shadow-xs space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">1. Acceptance of Terms</h2>
          <p>
            By accessing or submitting information via the Pune Civic Platform (&quot;the Platform&quot;), you
            acknowledge and agree to adhere to these Terms and Conditions. If you do not agree with any part,
            you should discontinue use of the platform.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">2. Permitted Civic Reporting Use</h2>
          <p>
            This portal is created exclusively for reporting genuine municipal, infrastructural, and civic
            problems within the Pune metropolitan and municipal corporation boundaries (e.g. roads, sanitation,
            water distribution, lighting, drains).
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">3. Prohibited Conduct</h2>
          <p>Users strictly agree NOT to:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Submit fabricated, defamatory, malicious, or knowingly false complaints.</li>
            <li>Upload abusive, harassing, obscene, or threatening text or images.</li>
            <li>Attempt unauthorized access to administrative or departmental user accounts.</li>
            <li>Use the platform for commercial advertising, political campaigns, or personal vendettas.</li>
            <li>Spam automated submissions or disrupt server availability.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">4. Independent Non-Governmental Status</h2>
          <p>
            You acknowledge that the Pune Civic Platform is an independent technology bridge and is <strong>not</strong>
            a statutory government agency or municipal corporation court. While complaints are forwarded and
            monitored, the platform does not guarantee statutory legal enforcement or fixed repair schedules.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">5. Limitation of Liability</h2>
          <p>
            Under no circumstances shall Pune Civic Platform, its community contributors, or operators be liable
            for any indirect, incidental, or consequential damages arising from the use or inability to use the
            service, or delay in governmental action.
          </p>
        </section>
      </div>
    </div>
  );
}
