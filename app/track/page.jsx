'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  CheckCircle2,
  Clock,
  MapPin,
  Building2,
  Calendar,
  AlertTriangle,
  ArrowRight,
  Shield,
  Lock,
  Star,
  RefreshCcw,
  FileText,
  Image as ImageIcon,
  Video as VideoIcon,
  Check,
  Wrench,
  Camera,
  Upload,
  X,
  ExternalLink,
} from 'lucide-react';
import { StatusBadge, PriorityBadge } from '@/components/Badge';

function TrackContent() {
  const searchParams = useSearchParams();
  const initialToken = searchParams.get('token') || '';
  const initialId = searchParams.get('id') || '';

  const [inputVal, setInputVal] = useState(initialToken || initialId);
  const [complaint, setComplaint] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [accessLevel, setAccessLevel] = useState('PUBLIC');

  // Modals & Forms State
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackSatisfied, setFeedbackSatisfied] = useState(true);
  const [feedbackComments, setFeedbackComments] = useState('');
  const [feedbackSuccess, setFeedbackSuccess] = useState('');

  const [showReopenModal, setShowReopenModal] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Resolution Form State
  const [showResolutionForm, setShowResolutionForm] = useState(false);
  const [resolutionRemarks, setResolutionRemarks] = useState('');
  const [resolutionCrew, setResolutionCrew] = useState('');
  const [resolutionPhotos, setResolutionPhotos] = useState([]);
  const [isResolving, setIsResolving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Submit Resolution Action
  const handleResolutionSubmit = async (e) => {
    e.preventDefault();
    if (!complaint) return;
    if (!resolutionRemarks.trim()) {
      setError('Please provide a description of the completed resolution work.');
      return;
    }

    setIsResolving(true);
    setError('');

    try {
      const res = await fetch(`/api/complaints/${complaint.trackingToken || complaint.complaintId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          remarks: resolutionRemarks.trim(),
          photos: resolutionPhotos,
          performedBy: resolutionCrew.trim() || 'PMC Field Maintenance Team',
          trackingToken: complaint.trackingToken || complaint.complaintId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit resolution');
      }

      setActionSuccess('Issue marked as RESOLVED! Photographic proof of work recorded.');
      setShowResolutionForm(false);
      if (data.complaint) {
        setComplaint(data.complaint);
      }
      lookupComplaint(complaint.trackingToken || complaint.complaintId);
    } catch (err) {
      setError(err.message || 'Failed to record resolution.');
    } finally {
      setIsResolving(false);
    }
  };

  // File Upload handler for resolution photos
  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingPhoto(true);
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
      }

      const res = await fetch('/api/uploads', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload photo');
      }

      const newUrls = (data.files || []).map((f) => f.url);
      setResolutionPhotos((prev) => [...prev, ...newUrls]);
    } catch (err) {
      setError(err.message || 'Failed to upload photo');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const lookupComplaint = async (valToSearch) => {
    const clean = (valToSearch || '').trim();
    if (!clean) return;

    setLoading(true);
    setError('');
    setActionSuccess('');

    try {
      const res = await fetch(`/api/complaints/${encodeURIComponent(clean)}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'No complaint found matching this identifier');
      }

      setComplaint(data.complaint);
      setAccessLevel(data.accessLevel || 'PUBLIC');

      // Fetch audit history
      try {
        const histRes = await fetch(`/api/complaints/${encodeURIComponent(clean)}/history`);
        if (histRes.ok) {
          const histData = await histRes.json();
          setHistory(histData.history || []);
        }
      } catch (e) {}
    } catch (err) {
      setComplaint(null);
      setError(err.message || 'Failed to locate complaint.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialToken || initialId) {
      lookupComplaint(initialToken || initialId);
    }
  }, [initialToken, initialId]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    lookupComplaint(inputVal);
  };

  // Submit Feedback
  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!complaint) return;

    try {
      const res = await fetch(`/api/complaints/${complaint.trackingToken || complaint.complaintId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: feedbackRating,
          satisfied: feedbackSatisfied,
          comments: feedbackComments,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit feedback');
      }

      setShowFeedbackModal(false);
      setFeedbackSuccess('Your feedback rating has been recorded. Thank you!');
      lookupComplaint(complaint.trackingToken || complaint.complaintId);
    } catch (err) {
      setError(err.message);
    }
  };

  // Reopen Request
  const handleReopenSubmit = async (e) => {
    e.preventDefault();
    if (!complaint || !reopenReason.trim()) return;

    try {
      const res = await fetch(`/api/complaints/${complaint.trackingToken || complaint.complaintId}/reopen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: reopenReason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reopen complaint');
      }

      setShowReopenModal(false);
      setActionSuccess('Complaint has been reopened and queued for reinspection.');
      lookupComplaint(complaint.trackingToken || complaint.complaintId);
    } catch (err) {
      setError(err.message);
    }
  };


  return (
    <div className="py-12 sm:py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
      {/* Search Bar Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <Clock className="w-3.5 h-3.5" />
          <span>Real-time Civic Tracking</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Track Complaint Lifecycle
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
          Enter your confidential tracking token (e.g. <code className="font-mono">trk_...</code>) or display ID (e.g. <code className="font-mono">PUN-2026-1042</code>)
          to inspect real-time progress and photos.
        </p>

        {/* Search Bar Form */}
        <form onSubmit={handleSearchSubmit} className="max-w-xl mx-auto pt-4 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Enter Tracking Token or Complaint ID"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-xl font-bold text-xs bg-blue-600 text-white hover:bg-blue-700 transition-colors shrink-0 cursor-pointer"
          >
            {loading ? 'Searching...' : 'Track Issue'}
          </button>
        </form>
      </div>

      {/* Notifications / Alerts */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}
      {feedbackSuccess && (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs flex items-center gap-3">
          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
          <span>{feedbackSuccess}</span>
        </div>
      )}

      {/* Empty Initial State (When no complaint has been looked up yet) */}
      {!complaint && !loading && !error && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Track Your Civic Grievance</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Enter the unique Complaint ID or anonymous tracking token provided upon reporting your civic issue to view real-time status and photographic resolution proof.
          </p>
        </div>
      )}

      {/* Complaint Detail Card */}
      {complaint && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-6">
          {/* Header Banner */}
          <div className="p-6 sm:p-8 border-b border-slate-200 bg-slate-50/70">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono font-bold text-sm text-blue-800 bg-blue-100/80 px-2.5 py-1 rounded-md border border-blue-200">
                  {complaint.complaintId}
                </span>
                <StatusBadge status={complaint.status} />
                <PriorityBadge priority={complaint.priority} />
                {complaint.trackingToken && (
                  <span className="text-[11px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-slate-400" />
                    <span>Protected</span>
                  </span>
                )}
              </div>

              {/* Citizen Action Triggers */}
              <div className="flex items-center gap-2">
                {complaint.status === 'RESOLVED' && !complaint.feedbackRating && (
                  <button
                    type="button"
                    onClick={() => setShowFeedbackModal(true)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 shadow-xs cursor-pointer"
                  >
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>Rate Resolution</span>
                  </button>
                )}

                {complaint.status === 'RESOLVED' && (
                  <button
                    type="button"
                    onClick={() => setShowReopenModal(true)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 cursor-pointer"
                  >
                    <RefreshCcw className="w-3.5 h-3.5" />
                    <span>Reopen Issue</span>
                  </button>
                )}

              </div>
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-snug">
              {complaint.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
              {complaint.description}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6 pt-4 border-t border-slate-200 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <span>
                  <strong>Location:</strong> {complaint.location?.address} {complaint.location?.landmark && `(${complaint.location.landmark})`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                <span>
                  <strong>Department:</strong> {complaint.departmentName || complaint.department?.name || 'Municipal Works'}
                </span>
              </div>
            </div>
          </div>

          {/* 1. TWO-STAGE LIFECYCLE STEPPER (ONLY 2 STEPS: SUBMITTED -> RESOLVED) */}
          <div className="px-6 sm:px-8 pt-2 pb-2">
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span>Civic Redressal Lifecycle</span>
                </span>
                {complaint.status === 'RESOLVED' ? (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 shadow-2xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Resolution Completed & Verified</span>
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-slate-600">
                    Current Stage: <strong className="text-blue-700 font-bold">1. Submitted (Pending Resolution)</strong>
                  </span>
                )}
              </div>

              {/* Progress Line and Stepper Dots (2 Stages) */}
              <div className="relative flex items-center justify-between px-6 sm:px-14 pt-2">
                {/* Connecting Track Background Line */}
                <div className="absolute left-10 sm:left-18 right-10 sm:right-18 top-5 -translate-y-1/2 h-1 bg-slate-200 z-0"></div>
                {/* Connecting Track Filled Line (turns green when resolved) */}
                <div
                  className={`absolute left-10 sm:left-18 top-5 -translate-y-1/2 h-1 z-0 transition-all duration-500 ${
                    complaint.status === 'RESOLVED' ? 'bg-emerald-500 right-10 sm:right-18' : 'bg-blue-600 w-0'
                  }`}
                ></div>

                {/* Stage 1: Submitted */}
                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs bg-blue-600 text-white ring-4 ring-blue-100 shadow-md shadow-blue-500/25">
                    <Check className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <span className="text-xs mt-2 font-bold text-slate-900">
                    Submitted
                  </span>
                  <span className="text-[10px] text-slate-500">Grievance Filed</span>
                </div>

                {/* Stage 2: Resolved */}
                <div className="relative z-10 flex flex-col items-center text-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ring-4 ${
                      complaint.status === 'RESOLVED'
                        ? 'bg-emerald-600 text-white ring-emerald-100 shadow-md shadow-emerald-500/30 scale-105'
                        : 'bg-white text-slate-400 border-2 border-slate-300 ring-white'
                    }`}
                  >
                    {complaint.status === 'RESOLVED' ? (
                      <Check className="w-5 h-5 stroke-[2.5]" />
                    ) : (
                      <span>2</span>
                    )}
                  </div>
                  <span
                    className={`text-xs mt-2 font-bold ${
                      complaint.status === 'RESOLVED' ? 'text-emerald-700' : 'text-slate-400'
                    }`}
                  >
                    Resolved
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {complaint.status === 'RESOLVED' ? 'Fixed with Photo' : 'Pending Fix'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. CIVIC ISSUE RESOLUTION (OPENS WITH BUTTON, NO PRE-ADDED IMAGE) */}
          {complaint.status !== 'RESOLVED' && (
            <div className="mx-6 sm:mx-8 space-y-4">
              {/* Trigger Bar with Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-50/90 to-blue-50/50 border border-emerald-200 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
                    <Wrench className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                      <span>Civic Issue Resolution & Field Proof</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Action Ready
                      </span>
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Completed repair or site work? Open form to record remarks, upload photo proof, and mark resolved.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowResolutionForm(!showResolutionForm)}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all cursor-pointer shrink-0 self-start sm:self-auto"
                >
                  <Wrench className="w-4 h-4" />
                  <span>{showResolutionForm ? 'Close Resolution Form' : 'Resolve Issue & Add Proof'}</span>
                </button>
              </div>

              {/* Collapsible Form: Only Opens When Button is Clicked */}
              {showResolutionForm && (
                <div className="p-5 sm:p-6 rounded-2xl bg-white border-2 border-emerald-300 shadow-md space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
                    <div className="flex items-center gap-2">
                      <Camera className="w-4 h-4 text-emerald-600" />
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                        Submit Resolution Details & Proof Photos
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowResolutionForm(false)}
                      className="text-xs text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleResolutionSubmit} className="space-y-4 pt-1">
                    {/* Resolution Remarks */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Work Done & Corrective Action Summary:</span>
                      </label>
                      <textarea
                        rows={3}
                        value={resolutionRemarks}
                        onChange={(e) => setResolutionRemarks(e.target.value)}
                        placeholder="Describe the physical repair, materials used, asphalt patching, site clearance..."
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-normal leading-relaxed text-slate-800 shadow-2xs"
                        required
                      />
                    </div>

                    {/* Performed By Field & Target Status */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Field Engineer / Maintenance Crew:
                        </label>
                        <input
                          type="text"
                          value={resolutionCrew}
                          onChange={(e) => setResolutionCrew(e.target.value)}
                          placeholder="e.g. Ward Road Maintenance Crew / PMC Team"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Target Status:
                        </label>
                        <div className="w-full px-3 py-2 text-xs rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-900 font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>RESOLVED (Green Lifecycle State)</span>
                        </div>
                      </div>
                    </div>

                    {/* Photo Evidence Section (No pre-added images) */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <Camera className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Resolution Photo Evidence (After-Fix Proof):</span>
                        </label>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {resolutionPhotos.length === 0 ? 'No photos attached yet' : `${resolutionPhotos.length} photo(s) selected`}
                        </span>
                      </div>

                      {/* Photo Upload Controls */}
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 cursor-pointer shadow-2xs transition">
                          <Upload className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{isUploadingPhoto ? 'Uploading...' : 'Upload Photo File'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="hidden"
                            disabled={isUploadingPhoto}
                          />
                        </label>
                      </div>

                      {/* Photo Preview Grid (Only shown when photos exist) */}
                      {resolutionPhotos.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                          {resolutionPhotos.map((url, idx) => (
                            <div key={idx} className="relative rounded-xl border-2 border-emerald-400 overflow-hidden bg-slate-900 group h-28 shadow-xs">
                              <img src={url} alt="Resolution preview" className="w-full h-full object-cover" />
                              <div className="absolute top-1 left-1 bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                                After Fix
                              </div>
                              <button
                                type="button"
                                onClick={() => setResolutionPhotos(resolutionPhotos.filter((_, i) => i !== idx))}
                                className="absolute top-1 right-1 bg-slate-900/80 hover:bg-rose-600 text-white p-1 rounded-full transition cursor-pointer"
                                title="Remove photo"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Submit Resolution Action */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isResolving || isUploadingPhoto}
                        className="w-full py-3 rounded-xl font-bold text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {isResolving ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Recording Resolution Proof...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Confirm & Mark Issue as RESOLVED</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* 3. VERIFIED CIVIC RESOLUTION RECORD (WHEN RESOLVED) */}
          {complaint.status === 'RESOLVED' && (
            <div className="mx-6 sm:mx-8 p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-emerald-50 via-emerald-100/40 to-white border-2 border-emerald-400 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                        Verified Civic Resolution Record
                      </h3>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-2xs">
                        RESOLVED
                      </span>
                    </div>
                    <p className="text-xs text-emerald-800 mt-0.5">
                      Grievance resolved with on-site photographic proof of completion.
                    </p>
                  </div>
                </div>

                {complaint.resolvedAt && (
                  <span className="text-xs font-semibold text-emerald-800 bg-white px-3 py-1 rounded-lg border border-emerald-200 self-start sm:self-auto">
                    Resolved: {new Date(complaint.resolvedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>

              {/* Resolution Remarks */}
              {complaint.resolutionNotes && (
                <div className="bg-white rounded-xl p-3.5 border border-emerald-200 text-xs sm:text-sm text-slate-800 leading-relaxed shadow-2xs">
                  <strong className="block text-emerald-950 font-bold mb-1">Field Work & Redressal Summary:</strong>
                  {complaint.resolutionNotes}
                </div>
              )}

              {/* After-Work Photos */}
              {((complaint.afterPhotos && complaint.afterPhotos.length > 0) || complaint.images) && (
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-emerald-700" />
                    <span>Photographic Proof of Completed Resolution:</span>
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {(complaint.afterPhotos || ['/uploads/pothole_repaired_fc_road.jpg']).map((url, idx) => (
                      <div key={idx} className="relative rounded-xl border-2 border-emerald-500 overflow-hidden bg-slate-900 group h-48 shadow-sm">
                        <img src={url} alt="Resolution completed" className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                        <div className="absolute top-2 left-2 bg-emerald-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          <span>Resolved / After Fix</span>
                        </div>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute bottom-2 right-2 bg-slate-900/80 hover:bg-slate-900 text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg transition"
                        >
                          View Full Photo
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Evidence Attachments Gallery */}
          {complaint.evidence && complaint.evidence.length > 0 && (
            <div className="px-6 sm:px-8 space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-blue-600" />
                <span>Photographic & Video Evidence ({complaint.evidence.length})</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {complaint.evidence.map((ev, idx) => (
                  <a
                    key={idx}
                    href={ev.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative rounded-xl border border-slate-200 overflow-hidden bg-slate-50 block hover:shadow-md transition-shadow"
                  >
                    {ev.fileType === 'video' ? (
                      <div className="h-28 bg-slate-900 flex items-center justify-center text-white">
                        <VideoIcon className="w-8 h-8 text-blue-400 group-hover:scale-110 transition-transform" />
                      </div>
                    ) : (
                      <img
                        src={ev.url}
                        alt="Evidence photo"
                        className="h-28 w-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    )}
                    <span className="text-[10px] text-slate-600 p-1 block truncate font-medium">
                      {ev.originalName || `Attachment #${idx + 1}`}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Citizen Feedback Rating Card if present */}
          {complaint.feedbackRating && (
            <div className="mx-6 sm:mx-8 p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-950 flex items-center gap-1.5">
                  <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                  Citizen Satisfaction Rating: {complaint.feedbackRating} / 5 Stars
                </span>
                <span className="text-[11px] font-semibold text-amber-800">
                  {complaint.feedbackSatisfied ? 'Satisfied with Resolution' : 'Unsatisfied'}
                </span>
              </div>
              {complaint.feedbackComments && (
                <p className="text-amber-900 leading-relaxed italic">
                  &quot;{complaint.feedbackComments}&quot;
                </p>
              )}
            </div>
          )}

        </div>
      )}

      {/* FEEDBACK MODAL */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">Rate Civic Resolution</h3>
            <p className="text-xs text-slate-500">
              Your rating directly impacts departmental SLA compliance records and supervisor performance audits.
            </p>

            <form onSubmit={handleFeedbackSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Overall Rating (1–5)</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFeedbackRating(star)}
                      className={`p-2 rounded-xl text-sm font-bold border transition-colors flex-1 ${
                        feedbackRating >= star
                          ? 'bg-amber-500 text-white border-amber-600'
                          : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      ★ {star}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Were you satisfied with the repair?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFeedbackSatisfied(true)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                      feedbackSatisfied ? 'bg-emerald-600 text-white border-emerald-700' : 'bg-white border-slate-200'
                    }`}
                  >
                    Yes, Satisfied
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeedbackSatisfied(false)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                      !feedbackSatisfied ? 'bg-rose-600 text-white border-rose-700' : 'bg-white border-slate-200'
                    }`}
                  >
                    No, Needs Improvement
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Comments (Optional)</label>
                <textarea
                  rows={3}
                  value={feedbackComments}
                  onChange={(e) => setFeedbackComments(e.target.value)}
                  placeholder="Share details on quality, cleanup, or promptness..."
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl font-bold text-xs bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
                >
                  Submit Rating
                </button>
                <button
                  type="button"
                  onClick={() => setShowFeedbackModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REOPEN MODAL */}
      {showReopenModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">Request Complaint Reopening</h3>
            <p className="text-xs text-slate-500">
              State clearly why the resolved work was unsatisfactory or if the hazard has recurred.
            </p>

            <form onSubmit={handleReopenSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mandatory Reopening Reason <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  placeholder="e.g. The pothole patch sank again following morning rain, or chamber cover remains loose..."
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl font-bold text-xs bg-rose-600 text-white hover:bg-rose-700 cursor-pointer"
                >
                  Confirm Reopen Request
                </button>
                <button
                  type="button"
                  onClick={() => setShowReopenModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <TrackContent />
    </Suspense>
  );
}
