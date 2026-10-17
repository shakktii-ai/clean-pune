'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FilePlus2,
  MapPin,
  Camera,
  Video,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Shield,
  Clock,
  Sparkles,
  Crosshair,
  Lock,
  Eye,
  EyeOff,
  Copy,
  Check,
  X,
  Upload,
  Info,
} from 'lucide-react';
import { useLanguage } from '@/components/LanguageProvider';
import { PriorityBadge } from '@/components/Badge';
import { DEMO_CATEGORIES, DEMO_WARDS } from '@/lib/demoData';

// Preset Pune landmark hotspots for 1-click location pinning
const PUNE_HOTSPOTS = [
  { name: 'FC Road / Goodluck Chowk', ward: 2, lat: 18.5167, lng: 73.8415, addr: 'Near Cafe Goodluck, FC Road, Shivajinagar, Pune' },
  { name: 'Baner High Street', ward: 1, lat: 18.5598, lng: 73.7912, addr: 'Lane 4, Near Datta Mandir, Baner Road, Pune' },
  { name: 'Kothrud / Dahanukar Colony', ward: 3, lat: 18.5023, lng: 73.8115, addr: 'Near Cummins College, Dahanukar Colony, Kothrud, Pune' },
  { name: 'Kasba Peth / Ganpati Mandir', ward: 4, lat: 18.5204, lng: 73.8540, addr: 'Near Kasba Ganpati Mandir, Shaniwar Peth, Pune' },
  { name: 'Hadapsar Gadital', ward: 5, lat: 18.5089, lng: 73.9260, addr: 'Solapur Road, Near Gadital Chowk, Hadapsar, Pune' },
  { name: 'Viman Nagar / Phoenix Corridor', ward: 6, lat: 18.5582, lng: 73.9168, addr: 'Nagar Road, Opposite Phoenix Marketcity, Viman Nagar, Pune' },
];

export default function ReportPage() {
  const { t, language } = useLanguage();
  const [step, setStep] = useState(1); // Steps 1 to 5

  const [categories, setCategories] = useState(DEMO_CATEGORIES);
  const [wards, setWards] = useState(DEMO_WARDS);

  // Form State
  const [formData, setFormData] = useState({
    categoryCode: 'CAT_POTHOLE',
    subcategory: 'POTHOLE_DEEP',
    wardNumber: '2',
    address: 'Near Cafe Goodluck, FC Road, Shivajinagar, Pune',
    landmark: 'Opposite Deccan Gymkhana Bus Stand',
    latitude: 18.5167,
    longitude: 73.8415,
    title: '',
    description: '',
    priority: 'HIGH',
    evidence: [],
    isAnonymous: false,
    isSensitive: false,
    citizenName: '',
    citizenPhone: '',
    citizenEmail: '',
    agreedToTerms: false,
  });

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsSuccess, setGpsSuccess] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successComplaint, setSuccessComplaint] = useState(null);
  const [copiedToken, setCopiedToken] = useState(false);

  // AI Triage Assistant State
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiError, setAiError] = useState('');

  const handleAiAnalyze = async () => {
    const textToAnalyze = `${formData.title} ${formData.description}`.trim();
    if (textToAnalyze.length < 5) {
      setAiError('Please enter at least a few words in title or description to analyze.');
      return;
    }
    setAiAnalyzing(true);
    setAiError('');
    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToAnalyze,
          latitude: formData.latitude,
          longitude: formData.longitude,
          categoryCode: formData.categoryCode,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI analysis unavailable');
      setAiResult(data.analysis);
    } catch (err) {
      setAiError(err.message || 'AI service unavailable');
    } finally {
      setAiAnalyzing(false);
    }
  };

  const applyAiSuggestions = () => {
    if (!aiResult) return;
    const updates = { ...formData };
    if (aiResult.suggestedCategoryCode) {
      updates.categoryCode = aiResult.suggestedCategoryCode;
      if (aiResult.suggestedSubcategoryCode) {
        updates.subcategory = aiResult.suggestedSubcategoryCode;
      }
    }
    if (aiResult.suggestedPriority) {
      updates.priority = aiResult.suggestedPriority;
    }
    setFormData(updates);
  };

  useEffect(() => {
    // Fetch live categories and wards if available
    async function fetchMasters() {
      try {
        const [catRes, wardRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/wards'),
        ]);
        if (catRes.ok) {
          const d = await catRes.json();
          if (d.categories && d.categories.length > 0) setCategories(d.categories);
        }
        if (wardRes.ok) {
          const d = await wardRes.json();
          if (d.wards && d.wards.length > 0) setWards(d.wards);
        }
      } catch (e) {
        // Fallback to demo data
      }
    }
    fetchMasters();
  }, []);

  const selectedCat = categories.find((c) => c.code === formData.categoryCode) || categories[0];

  // GPS Browser Geolocation
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    setGpsLoading(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lng = parseFloat(pos.coords.longitude.toFixed(6));
        setFormData((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng,
          address: prev.address || `GPS: ${lat}, ${lng} (Pune Region)`,
        }));
        setGpsLoading(false);
        setGpsSuccess(true);
      },
      (err) => {
        setGpsLoading(false);
        setError(`Location access: ${err.message}. You can manually type your address.`);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Upload Evidence handler
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (formData.evidence.length + files.length > 5) {
      setUploadError('Maximum 5 evidence files (4 photos + 1 video) can be attached.');
      return;
    }

    setUploading(true);
    setUploadError('');

    try {
      const uploadBody = new FormData();
      files.forEach((file) => uploadBody.append('files', file));

      const res = await fetch('/api/uploads', {
        method: 'POST',
        body: uploadBody,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload file');
      }

      setFormData((prev) => ({
        ...prev,
        evidence: [...prev.evidence, ...data.files],
      }));
    } catch (err) {
      setUploadError(err.message || 'Error uploading file.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleRemoveEvidence = (indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      evidence: prev.evidence.filter((_, idx) => idx !== indexToRemove),
    }));
  };

  // Validation before progressing steps
  const handleNextStep = () => {
    setError('');
    if (step === 1) {
      if (!formData.categoryCode) {
        setError('Please select an issue category.');
        return;
      }
    } else if (step === 2) {
      if (!formData.address.trim()) {
        setError('Please specify the street location or road name.');
        return;
      }
      if (!formData.wardNumber) {
        setError('Please select the applicable Pune Ward office.');
        return;
      }
    } else if (step === 3) {
      if (!formData.title.trim()) {
        setError('Please enter a brief title for your complaint.');
        return;
      }
      if (!formData.description.trim()) {
        setError('Please provide detailed descriptions so field teams can locate the defect.');
        return;
      }
    }
    setStep((prev) => Math.min(5, prev + 1));
  };

  const handlePrevStep = () => {
    setError('');
    setStep((prev) => Math.max(1, prev - 1));
  };

  // Submit Complaint
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.agreedToTerms) {
      setError('You must confirm that this complaint is genuine and accurate.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit complaint.');
      }

      setSuccessComplaint(data.complaint);
    } catch (err) {
      setError(err.message || 'An error occurred while submitting.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyTrackingLink = () => {
    if (!successComplaint) return;
    const url = `${window.location.origin}/track?token=${successComplaint.trackingToken}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2500);
  };

  return (
    <div className="py-10 sm:py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Title Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <FilePlus2 className="w-3.5 h-3.5" />
          <span>Independent Civic Reporting Intake</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          File a Civic Grievance
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
          Complete the 5-step intake to report potholes, garbage dumps, drainage, or street hazards.
          Protected by cryptographic tracking tokens.
        </p>
      </div>

      {successComplaint ? (
        /* STEP: SUCCESS & UNGUESSABLE TOKEN CONFIRMATION */
        <div className="bg-white rounded-2xl border border-emerald-200 p-8 sm:p-12 shadow-lg text-center space-y-8">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Complaint Successfully Catalogued
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {successComplaint.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
              Your issue has been routed to <strong>{successComplaint.departmentName}</strong> in{' '}
              <strong>{successComplaint.wardName}</strong>.
            </p>
          </div>

          {/* Secure Token Box */}
          <div className="p-6 rounded-2xl bg-slate-900 text-white text-left max-w-xl mx-auto space-y-4 border border-slate-800 shadow-md">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-slate-200">Secure Unguessable Tracking Token</span>
              </div>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                Anti-Enumeration Protected
              </span>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 block mb-1">Public Display ID:</span>
              <span className="text-lg font-mono font-bold text-white tracking-wider">
                {successComplaint.complaintId}
              </span>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 block mb-1">Confidential Tracking Token:</span>
              <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800 font-mono text-xs text-emerald-300 break-all select-all">
                <span>{successComplaint.trackingToken}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              <strong>Why this matters:</strong> To protect citizen privacy, private complaints cannot be
              inspected via sequential numbers. Bookmark or save this unique token to track progress and submit feedback.
            </p>

            <button
              type="button"
              onClick={copyTrackingLink}
              className="w-full py-2.5 rounded-xl font-bold text-xs bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {copiedToken ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Tracking URL Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Secure Tracking Link</span>
                </>
              )}
            </button>
          </div>

          {/* Next Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href={`/track?token=${successComplaint.trackingToken}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-xs bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm"
            >
              <span>View Real-Time Tracking Stepper</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              type="button"
              onClick={() => {
                setSuccessComplaint(null);
                setStep(1);
                setFormData({
                  categoryCode: 'CAT_POTHOLE',
                  subcategory: 'POTHOLE_DEEP',
                  wardNumber: '2',
                  address: '',
                  landmark: '',
                  latitude: 18.5167,
                  longitude: 73.8567,
                  title: '',
                  description: '',
                  priority: 'HIGH',
                  evidence: [],
                  isAnonymous: false,
                  isSensitive: false,
                  citizenName: '',
                  citizenPhone: '',
                  citizenEmail: '',
                  agreedToTerms: false,
                });
              }}
              className="w-full sm:w-auto px-5 py-3 rounded-xl font-semibold text-xs border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Report Another Problem
            </button>
          </div>
        </div>
      ) : (
        /* MULTI-STEP INTAKE WIZARD */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Progress Bar & Step Numbers */}
          <div className="bg-slate-50 border-b border-slate-200 p-4 sm:p-6">
            <div className="grid grid-cols-5 gap-2 text-center text-xs">
              {[
                { s: 1, label: 'Category' },
                { s: 2, label: 'Location' },
                { s: 3, label: 'Details' },
                { s: 4, label: 'Evidence' },
                { s: 5, label: 'Review' },
              ].map((item) => (
                <div
                  key={item.s}
                  className={`flex flex-col items-center gap-1 ${
                    step === item.s
                      ? 'text-blue-700 font-bold'
                      : step > item.s
                      ? 'text-emerald-700 font-semibold'
                      : 'text-slate-400'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      step === item.s
                        ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                        : step > item.s
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {step > item.s ? <Check className="w-3.5 h-3.5" /> : item.s}
                  </div>
                  <span className="hidden sm:inline text-[11px]">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Form Body */}
          <div className="p-6 sm:p-10">
            {error && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5 mb-6">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* STEP 1: CATEGORY & SUBCATEGORY */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Step 1: Select Issue Category</h2>
                  <p className="text-xs text-slate-500">
                    Choose the primary category and specific defect type.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {categories.map((cat) => {
                    const isSelected = formData.categoryCode === cat.code;
                    return (
                      <button
                        key={cat.code}
                        type="button"
                        onClick={() => {
                          const firstSub = cat.subcategories?.[0]?.code || '';
                          setFormData({
                            ...formData,
                            categoryCode: cat.code,
                            subcategory: firstSub,
                          });
                        }}
                        className={`p-4 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-600/20'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs text-slate-900">{cat.name}</span>
                          <span className="text-[10px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                            {cat.slaHours}h SLA
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-1">{cat.description}</p>
                      </button>
                    );
                  })}
                </div>

                {/* Subcategories pill selection */}
                {selectedCat?.subcategories && selectedCat.subcategories.length > 0 && (
                  <div className="pt-4 border-t border-slate-100 space-y-2">
                    <label className="block text-xs font-bold text-slate-700">
                      Specific Subcategory / Defect Type
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {selectedCat.subcategories.map((sub) => (
                        <button
                          key={sub.code}
                          type="button"
                          onClick={() => setFormData({ ...formData, subcategory: sub.code })}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                            formData.subcategory === sub.code
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {sub.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: LOCATION & PUNE WARD PICKER */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Step 2: Location & Pune Ward</h2>
                  <p className="text-xs text-slate-500">
                    Use browser GPS, select from Pune hotspots, or manually input street coordinates.
                  </p>
                </div>

                {/* GPS Trigger Button */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                      <Crosshair className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-slate-900 block">
                        Detect Device GPS Coordinates
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Requires explicit browser location permission
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={gpsLoading}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors shrink-0 disabled:opacity-50 cursor-pointer"
                  >
                    {gpsLoading ? 'Detecting Location...' : gpsSuccess ? 'GPS Updated ✓' : 'Pin My Location'}
                  </button>
                </div>

                {/* Quick Pune Landmarks Picker */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Quick Landmark Presets (Pune):
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {PUNE_HOTSPOTS.map((hotspot) => (
                      <button
                        key={hotspot.name}
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            wardNumber: String(hotspot.ward),
                            address: hotspot.addr,
                            latitude: hotspot.lat,
                            longitude: hotspot.lng,
                          })
                        }
                        className="p-2 rounded-lg bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 text-left text-[11px] transition-colors"
                      >
                        <span className="font-semibold text-slate-900 block truncate">{hotspot.name}</span>
                        <span className="text-[10px] text-blue-600">Ward {hotspot.ward}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Street Address / Road Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Near Cafe Goodluck, FC Road"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nearby Landmark (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Opposite Deccan Gymkhana Bus Stand"
                      value={formData.landmark}
                      onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Pune Administrative Ward <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.wardNumber}
                      onChange={(e) => setFormData({ ...formData, wardNumber: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      {wards.map((w) => (
                        <option key={w._id} value={String(w.wardNumber)}>
                          Ward {w.wardNumber}: {w.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) || 18.5204 })}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) || 73.8567 })}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: ISSUE DETAILS */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Step 3: Issue Description & Urgency</h2>
                  <p className="text-xs text-slate-500">Provide clear context for the maintenance crew.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Summary / Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dangerous 8-inch road crater causing motorcycle skidding"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Detailed Problem Description <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={5}
                    placeholder="Describe how long the issue has persisted, size/depth, traffic obstruction, or any immediate hazards to pedestrians..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                    required
                  />
                </div>

                {/* AI Civic Intelligence Advisor */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-slate-800">
                        AI Grievance Intelligence (Advisory)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleAiAnalyze}
                      disabled={aiAnalyzing}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>{aiAnalyzing ? 'Analyzing Issue...' : 'Smart Suggest'}</span>
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Automatically extracts categories, severity, Marathi-English context, and checks for nearby duplicate reports. Strictly advisory — humans hold final operational discretion.
                  </p>

                  {aiError && (
                    <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-[11px] text-rose-700">
                      {aiError}
                    </div>
                  )}

                  {aiResult && (
                    <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-3 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="p-2 bg-slate-50 rounded-lg">
                          <span className="text-[10px] text-slate-500 block uppercase font-semibold">Suggested Category</span>
                          <span className="font-bold text-slate-900">{aiResult.suggestedCategoryCode || 'N/A'}</span>
                        </div>
                        <div className="p-2 bg-slate-50 rounded-lg">
                          <span className="text-[10px] text-slate-500 block uppercase font-semibold">Suggested Urgency</span>
                          <span className="font-bold text-blue-700">{aiResult.suggestedPriority}</span>
                        </div>
                      </div>

                      {aiResult.summary && (
                        <div className="p-2 bg-slate-50 rounded-lg">
                          <span className="text-[10px] text-slate-500 block uppercase font-semibold">Executive Summary</span>
                          <p className="text-slate-700 italic text-[11px]">{aiResult.summary}</p>
                        </div>
                      )}

                      {aiResult.duplicateCandidates?.length > 0 && (
                        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900">
                          <span className="font-semibold block text-[11px]">Notice: Similar reports detected nearby:</span>
                          <ul className="list-disc pl-4 mt-1 space-y-0.5 text-[11px]">
                            {aiResult.duplicateCandidates.map((dup) => (
                              <li key={dup.complaintId}>
                                <strong>{dup.complaintId}</strong> — {dup.title} ({Math.round(dup.similarityScore * 100)}% match)
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-slate-400">
                          Confidence: {Math.round(aiResult.confidenceScore * 100)}% ({aiResult.engine})
                        </span>
                        <button
                          type="button"
                          onClick={applyAiSuggestions}
                          className="px-3 py-1 rounded-md text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors cursor-pointer"
                        >
                          Apply Suggestions
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Priority / Severity Level
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { p: 'LOW', label: 'Low', desc: 'Minor inconvenience' },
                      { p: 'MEDIUM', label: 'Medium', desc: 'Standard turnaround' },
                      { p: 'HIGH', label: 'High', desc: 'Immediate disruption' },
                    ].map((item) => (
                      <button
                        key={item.p}
                        type="button"
                        onClick={() => setFormData({ ...formData, priority: item.p })}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          formData.priority === item.p
                            ? 'bg-blue-50 border-blue-600 text-blue-900 font-bold ring-2 ring-blue-600/20'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="block text-xs">{item.label}</span>
                        <span className="text-[10px] text-slate-500">{item.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: EVIDENCE UPLOADS (PHOTO & OPTIONAL VIDEO) */}
            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Step 4: Evidence Uploads</h2>
                  <p className="text-xs text-slate-500">
                    Attach photographic evidence (max 4 photos, 5MB each) and optional video (max 1 video, 25MB).
                    Files are validated and stored in secure object storage.
                  </p>
                </div>

                {uploadError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}

                {/* Upload Drag/Drop Box */}
                <div className="p-8 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50/60 text-center space-y-3 hover:border-blue-400 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mx-auto">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-800">
                      Choose Photos or Video to Upload
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Supports JPG, PNG, WebP images & MP4, WebM, MOV videos
                    </p>
                  </div>

                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
                    disabled={uploading}
                    onChange={handleFileUpload}
                    className="block mx-auto text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                  />
                  {uploading && <p className="text-xs text-blue-600 font-semibold animate-pulse">Uploading evidence...</p>}
                </div>

                {/* Uploaded Evidence Gallery */}
                {formData.evidence.length > 0 && (
                  <div className="space-y-3">
                    <span className="text-xs font-bold text-slate-800 block">
                      Attached Evidence ({formData.evidence.length}/5)
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {formData.evidence.map((item, idx) => (
                        <div key={idx} className="relative rounded-xl border border-slate-200 bg-white p-2 shadow-xs group">
                          {item.fileType === 'video' ? (
                            <div className="h-24 bg-slate-900 rounded-lg flex items-center justify-center text-white text-xs">
                              <Video className="w-6 h-6 text-blue-400" />
                            </div>
                          ) : (
                            <img
                              src={item.url}
                              alt={item.originalName}
                              className="h-24 w-full object-cover rounded-lg"
                            />
                          )}
                          <p className="text-[10px] text-slate-600 truncate mt-1">{item.originalName}</p>
                          <button
                            type="button"
                            onClick={() => handleRemoveEvidence(idx)}
                            className="absolute top-1 right-1 p-1 rounded-full bg-slate-900/80 text-white hover:bg-rose-600 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 5: PRIVACY, REPORTER INFO & REVIEW */}
            {step === 5 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Step 5: Privacy & Review Confirmation</h2>
                  <p className="text-xs text-slate-500">
                    Verify all information before submitting for public accountability.
                  </p>
                </div>

                {/* Privacy Preferences */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Privacy Controls
                  </h3>

                  <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700">
                    <input
                      type="checkbox"
                      checked={formData.isAnonymous}
                      onChange={(e) => setFormData({ ...formData, isAnonymous: e.target.checked })}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 mt-0.5"
                    />
                    <span>
                      <strong>Submit as Anonymous:</strong> Your personal identity will not be linked
                      or displayed in the public complaint registry.
                    </span>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700">
                    <input
                      type="checkbox"
                      checked={formData.isSensitive}
                      onChange={(e) => setFormData({ ...formData, isSensitive: e.target.checked })}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 mt-0.5"
                    />
                    <span>
                      <strong>Sensitive / Confidential Issue:</strong> Hide public map markers. Accessible
                      only via confidential tracking token or official staff login.
                    </span>
                  </label>
                </div>

                {/* Reporter Contact Info if not anonymous */}
                {!formData.isAnonymous && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Your Name</label>
                      <input
                        type="text"
                        placeholder="Rahul Sharma"
                        value={formData.citizenName}
                        onChange={(e) => setFormData({ ...formData, citizenName: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile (SMS updates)</label>
                      <input
                        type="tel"
                        placeholder="9876543210"
                        value={formData.citizenPhone}
                        onChange={(e) => setFormData({ ...formData, citizenPhone: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                      <input
                        type="email"
                        placeholder="citizen@example.com"
                        value={formData.citizenEmail}
                        onChange={(e) => setFormData({ ...formData, citizenEmail: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}

                {/* Review Summary Card */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="font-bold text-slate-900">Summary of Report:</span>
                    <span className="font-bold text-blue-700">{selectedCat.name}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600">
                    <p>
                      <strong>Title:</strong> {formData.title}
                    </p>
                    <p>
                      <strong>Ward:</strong> Ward {formData.wardNumber}
                    </p>
                    <p>
                      <strong>Address:</strong> {formData.address}
                    </p>
                    <p>
                      <strong>Coordinates:</strong> {formData.latitude}, {formData.longitude}
                    </p>
                    <p>
                      <strong>Priority:</strong> {formData.priority}
                    </p>
                    <p>
                      <strong>Attached Files:</strong> {formData.evidence.length} file(s)
                    </p>
                  </div>
                </div>

                {/* Agreement Checkbox */}
                <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-xs">
                  <label className="flex items-start gap-2.5 cursor-pointer text-slate-800">
                    <input
                      type="checkbox"
                      checked={formData.agreedToTerms}
                      onChange={(e) => setFormData({ ...formData, agreedToTerms: e.target.checked })}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 mt-0.5"
                      required
                    />
                    <span className="leading-relaxed">
                      I confirm that this report reflects a genuine municipal hazard observed in Pune.
                      I acknowledge this is an independent civic portal and not an official emergency service.
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* Stepper Navigation Buttons */}
            <div className="flex items-center justify-between pt-8 border-t border-slate-100">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>
              ) : (
                <div></div>
              )}

              {step < 5 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <span>Submitting Complaint...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm & Register Complaint</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
