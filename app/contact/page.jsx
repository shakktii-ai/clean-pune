'use client';

import React, { useState } from 'react';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  AlertTriangle,
  ExternalLink,
  CheckCircle2,
  Send,
  Shield,
} from 'lucide-react';
import { useLanguage } from '@/components/LanguageProvider';

export default function ContactPage() {
  const { t } = useLanguage();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit inquiry');
      }
      setSubmittedTicket(data.ticketId);
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="py-12 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
      {/* Title Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <Phone className="w-3.5 h-3.5" />
          <span>Community & Civic Support</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Contact Pune Civic Platform
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
          Have inquiries regarding platform participation, technical bug reports, or ward coordination?
          We are here to assist.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Contact Form */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 shadow-xs">
          {submittedTicket ? (
            <div className="py-12 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Inquiry Ticket Created</h2>
              <div className="inline-block px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-blue-700">
                Ticket Reference: {submittedTicket}
              </div>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                Thank you for reaching out to the Pune Civic Platform team. Our community coordinator team has logged your inquiry and will respond within 24–48 hours.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSubmittedTicket(null);
                  setForm({ name: '', email: '', phone: '', subject: '', message: '' });
                }}
                className="mt-4 px-5 py-2.5 rounded-xl font-semibold text-xs border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{error}</span>
                </div>
              )}
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-slate-900">Send an Inquiry</h2>
                <p className="text-xs text-slate-500">
                  For technical feedback or non-emergency community correspondence.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Your Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Rahul Deshmukh"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="rahul@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mobile Number (Optional)
                  </label>
                  <input
                    type="tel"
                    placeholder="9876543210"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Subject / Topic <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ward Coordinator Volunteer Inquiry"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Message Details <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={5}
                  required
                  placeholder="How can we assist you with Pune civic reporting?"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-xs bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 shadow-sm transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submitting ? 'Submitting Inquiry...' : 'Send Message'}</span>
              </button>
            </form>
          )}
        </div>

        {/* Right: Official Helplines Directory */}
        <div className="space-y-6">
          {/* Statutory Helplines Card */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 space-y-4 border border-slate-800">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-400" />
              <h2 className="text-base font-bold">Official Govt Helplines</h2>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              For real-time critical emergencies and statutory municipal filings, please use the official
              Pune Municipal Corporation (PMC) channels directly:
            </p>

            <div className="space-y-3 pt-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-white block">PMC Care Center</span>
                  <span className="text-[11px] text-slate-400">Toll-free municipal helpline</span>
                </div>
                <span className="font-bold text-amber-400 font-mono">1800 1030 222</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-white block">Pune Police Control</span>
                  <span className="text-[11px] text-slate-400">All emergencies</span>
                </div>
                <span className="font-bold text-emerald-400 font-mono">112</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-white block">Fire Brigade</span>
                  <span className="text-[11px] text-slate-400">Pune Central Fire HQ</span>
                </div>
                <span className="font-bold text-rose-400 font-mono">101</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-white block">Water Emergency</span>
                  <span className="text-[11px] text-slate-400">PMC Swargate Water Depot</span>
                </div>
                <span className="font-bold text-blue-400 font-mono">020-25501000</span>
              </div>
            </div>
          </div>

          {/* Platform Contacts */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3 text-xs text-slate-600">
            <h3 className="font-bold text-sm text-slate-900">Platform Correspondence</h3>
            <p className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              <span>contact@punecivic.org</span>
            </p>
            <p className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Voluntary Triage: Mon–Sat, 9:00 AM – 6:00 PM IST</span>
            </p>
            <p className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Pune, Maharashtra, India</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
