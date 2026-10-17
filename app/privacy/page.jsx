import React from 'react';
import { Shield, Lock, Eye, CheckCircle2 } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy | Pune Civic Platform',
  description: 'Privacy Policy and data governance standards of Pune Civic Platform.',
};

export default function PrivacyPage() {
  return (
    <div className="py-12 sm:py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="space-y-3 pb-6 border-b border-slate-200">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <Lock className="w-3.5 h-3.5" />
          <span>Data Governance & Protection</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Privacy Policy</h1>
        <p className="text-xs text-slate-500">Effective Date: October 17, 2026</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 shadow-xs space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">1. Overview and Commitment</h2>
          <p>
            Pune Civic Platform (&quot;we&quot;, &quot;us&quot;, or &quot;the Platform&quot;) is committed to protecting the privacy
            of Pune residents who use this portal to document and report municipal infrastructure issues.
            We believe civic engagement thrives when data collection is transparent and minimal.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">2. Information We Collect</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <strong>Complaint Information:</strong> Location coordinates (latitude/longitude),
              street address, landmark, category, description, and attached photographs.
            </li>
            <li>
              <strong>Citizen Contact Information:</strong> Name, mobile number, and email address if
              provided during submission or citizen registration.
            </li>
            <li>
              <strong>Anonymous Submissions:</strong> Citizens can elect to submit complaints
              anonymously, in which case no personal identity or phone number is linked to the public record.
            </li>
            <li>
              <strong>Technical Logs:</strong> IP address and browser user-agent collected solely for
              rate limiting, anti-spam validation, and operational security.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">3. How Information Is Used</h2>
          <p>
            Collected complaint details are utilized exclusively to catalogue civic issues, assign them
            to relevant municipal departments (e.g. Roads, Solid Waste, Water), display community issue
            density on the public map, and provide resolution status updates to the reporting citizen.
          </p>
          <p>
            We do <strong>not</strong> sell, rent, or monetize citizen contact data to commercial third parties.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">4. Public Visibility</h2>
          <p>
            Complaint descriptions, geo-locations, photos, and resolution notes are publicly accessible
            to encourage community accountability. However, personal phone numbers and email addresses
            are strictly restricted to internal operational coordinators and are never displayed on public pages.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">5. Contact Regarding Privacy</h2>
          <p>
            For privacy inquiries, data deletion requests, or questions regarding our information practices,
            please write to <span className="font-semibold text-slate-900">privacy@punecivic.org</span>.
          </p>
        </section>
      </div>
    </div>
  );
}
