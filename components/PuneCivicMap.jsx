'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import Link from 'next/link';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  Filter,
  Layers,
  Search,
  Flame,
  List,
  Map as MapIcon,
  ShieldCheck,
  Clock,
  ExternalLink,
  Info,
  X,
  Camera,
  Navigation,
  FileText,
  Building2,
  Calendar,
  Share2,
  Check,
  Shield,
  RotateCcw,
  ArrowLeft,
  Maximize2,
  ChevronDown,
  ChevronUp,
  FilePlus2,
} from 'lucide-react';
import { StatusBadge, PriorityBadge } from '@/components/Badge';
import {
  PUNE_BOUNDS,
  PMC_VIEWING_BOUNDS,
  PMC_BOUNDARY_POLYGON,
  isWithinPune,
} from '@/lib/geoBounds';

export { PUNE_BOUNDS, PMC_VIEWING_BOUNDS, PMC_BOUNDARY_POLYGON, isWithinPune };

// Helper to escape HTML safely in Leaflet popups
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Pune Hotspot Presets for quick civic navigation (all within PMC limits)
const PUNE_LOCALITIES = [
  { name: 'Shivajinagar', lat: 18.5284, lng: 73.8443 },
  { name: 'Kothrud', lat: 18.5074, lng: 73.8077 },
  { name: 'Aundh - Baner', lat: 18.5598, lng: 73.7912 },
  { name: 'Viman Nagar', lat: 18.5679, lng: 73.9143 },
  { name: 'Swargate / Kasba', lat: 18.5018, lng: 73.8586 },
  { name: 'Hadapsar', lat: 18.5089, lng: 73.9259 },
  { name: 'Katraj', lat: 18.4575, lng: 73.8677 },
  { name: 'Yerawada', lat: 18.5492, lng: 73.9038 },
];

export default function PuneCivicMap({
  initialComplaints = [],
  fullScreen = false,
  fullWidth = true,
  heightClass = 'h-[calc(100dvh-104px)] sm:h-[calc(100dvh-116px)] min-h-[500px]',
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const circlesLayerRef = useRef(null);
  const boundaryLayerRef = useRef(null);
  const leafletRef = useRef(null);

  const [complaints, setComplaints] = useState(initialComplaints);
  const [loading, setLoading] = useState(!initialComplaints.length);
  const [showHotspots, setShowHotspots] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isLegendExpanded, setIsLegendExpanded] = useState(true);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Reset photo index when selected complaint changes
  useEffect(() => {
    setActivePhotoIndex(0);
    setCopiedLink(false);
  }, [selectedComplaint]);

  // Global helper for opening complaint modal from within Leaflet HTML popups
  useEffect(() => {
    window.__puneOpenComplaintModal = (id) => {
      const match = complaints.find((item) => item.complaintId === id || item.id === id);
      if (match) {
        setSelectedComplaint(match);
      }
    };

    return () => {
      delete window.__puneOpenComplaintModal;
    };
  }, [complaints]);

  // Fetch live points from database
  useEffect(() => {
    let isMounted = true;
    async function fetchPoints() {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (statusFilter !== 'ALL') params.set('status', statusFilter);
        if (priorityFilter !== 'ALL') params.set('priority', priorityFilter);

        const res = await fetch(`/api/map/complaints?${params.toString()}`);
        if (res.ok && isMounted) {
          const data = await res.json();
          // Filter strictly to Pune geographic bounds
          const safeComplaints = (data.complaints || []).filter((c) =>
            isWithinPune(c.latitude, c.longitude)
          );
          setComplaints(safeComplaints);
        }
      } catch (err) {
        console.error('Failed to load map data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchPoints();
    return () => {
      isMounted = false;
    };
  }, [statusFilter, priorityFilter]);

  // Filter complaints based on search query
  const filteredComplaints = useMemo(() => {
    return complaints.filter((c) => {
      if (!isWithinPune(c.latitude, c.longitude)) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        c.title?.toLowerCase().includes(q) ||
        c.complaintId?.toLowerCase().includes(q) ||
        c.category?.toLowerCase().includes(q) ||
        c.address?.toLowerCase().includes(q) ||
        c.landmark?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q) ||
        c.ward?.toLowerCase().includes(q)
      );
    });
  }, [complaints, searchQuery]);

  // Initialize Leaflet Map with strict Pune boundary enforcement
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (typeof window === 'undefined' || !mapContainerRef.current) return;

      const L = (await import('leaflet')).default;
      leafletRef.current = L;

      if (!isMounted) return;

      if (!mapInstanceRef.current) {
        // Tight PMC Viewing Bounding Box (encapsulates PMC municipal perimeter)
        const pmcViewingBounds = L.latLngBounds(
          [PMC_VIEWING_BOUNDS.minLat, PMC_VIEWING_BOUNDS.minLng], // South-West
          [PMC_VIEWING_BOUNDS.maxLat, PMC_VIEWING_BOUNDS.maxLng]  // North-East
        );

        const map = L.map(mapContainerRef.current, {
          center: [18.5204, 73.8567], // Pune City Center
          zoomControl: true,
          attributionControl: true,
          maxBounds: pmcViewingBounds,
          maxBoundsViscosity: 1.0, // 100% rigid boundary resistance preventing panning outside Pune
        });

        // Fit map view tightly to PMC area so Pune fills the viewport
        map.fitBounds(pmcViewingBounds, {
          padding: fullScreen ? [24, 24] : [16, 16],
          animate: false,
        });

        // Determine minimum zoom from viewport dimensions and PMC boundary
        const boundsZoom = map.getBoundsZoom(pmcViewingBounds, false);
        const calculatedMinZoom = Math.max(11, boundsZoom);
        map.setMinZoom(calculatedMinZoom);
        map.setMaxZoom(18);

        // Strict drag event enforcement: immediately clamp back if browser drag triggers outside
        map.on('drag', () => {
          map.panInsideBounds(pmcViewingBounds, { animate: false });
        });

        // OpenStreetMap tiles without artificial tile-level clipping bounds
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          minZoom: 10,
          maxZoom: 19,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | PMC Civic Oversight',
        }).addTo(map);

        // PMC Civic Boundary Polygon Overlay (subtle blue dashed line)
        const pmcBoundary = L.polygon(PMC_BOUNDARY_POLYGON, {
          color: '#2563eb', // Royal Pune blue
          weight: 2.5,
          opacity: 0.85,
          dashArray: '6, 6',
          fillColor: '#3b82f6',
          fillOpacity: 0.05,
        }).addTo(map);

        pmcBoundary.bindTooltip('Pune Municipal Corporation (PMC) Official Civic Boundary', {
          sticky: true,
          direction: 'top',
          className: 'pmc-boundary-tooltip',
        });

        boundaryLayerRef.current = pmcBoundary;
        mapInstanceRef.current = map;
        markersLayerRef.current = L.layerGroup().addTo(map);
        circlesLayerRef.current = L.layerGroup().addTo(map);

        // Invalidate size after layout settles to guarantee 100% container tile coverage
        setTimeout(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize();
          }
        }, 150);
        setTimeout(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize();
          }
        }, 500);
      }

      renderMarkers(L);
    }

    initMap();

    return () => {
      isMounted = false;
    };
  }, []);

  // Window resize and container dimension watcher
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const handleResize = () => {
      if (mapInstanceRef.current && leafletRef.current) {
        mapInstanceRef.current.invalidateSize();
        const L = leafletRef.current;
        const pmcViewingBounds = L.latLngBounds(
          [PMC_VIEWING_BOUNDS.minLat, PMC_VIEWING_BOUNDS.minLng],
          [PMC_VIEWING_BOUNDS.maxLat, PMC_VIEWING_BOUNDS.maxLng]
        );
        const currentBoundsZoom = mapInstanceRef.current.getBoundsZoom(pmcViewingBounds, false);
        const newMin = Math.max(11, currentBoundsZoom);
        mapInstanceRef.current.setMinZoom(newMin);
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    let resizeObserver;
    if (typeof ResizeObserver !== 'undefined' && mapContainerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        handleResize();
      });
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, []);

  // Update markers when filtered complaints, hotspots, or search change
  useEffect(() => {
    if (leafletRef.current && mapInstanceRef.current) {
      renderMarkers(leafletRef.current);
    }
  }, [filteredComplaints, showHotspots]);

  function getMarkerColor(status) {
    switch (status) {
      case 'SUBMITTED':
      case 'REJECTED':
      case 'CANCELLED':
        return '#ef4444'; // Red
      case 'UNDER_REVIEW':
      case 'VERIFIED':
        return '#6366f1'; // Indigo
      case 'ASSIGNED':
      case 'IN_PROGRESS':
      case 'ON_HOLD':
        return '#f59e0b'; // Amber
      case 'RESOLUTION_SUBMITTED':
      case 'UNDER_VERIFICATION':
        return '#3b82f6'; // Blue
      case 'RESOLVED':
        return '#10b981'; // Emerald
      default:
        return '#64748b';
    }
  }

  function createCustomIcon(L, status, isFuzzed) {
    const color = getMarkerColor(status);
    const html = `
      <div style="
        position: relative;
        width: 30px;
        height: 30px;
        background-color: ${color};
        border: 2px solid white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      ">
        <div style="
          width: 9px;
          height: 9px;
          background: white;
          border-radius: 50%;
          transform: rotate(45deg);
        "></div>
        ${
          isFuzzed
            ? `<div style="
                position: absolute;
                top: -5px;
                right: -5px;
                width: 10px;
                height: 10px;
                background: #6366f1;
                border-radius: 50%;
                border: 2px solid white;
              " title="Approximate area (privacy protected)"></div>`
            : ''
        }
      </div>
    `;

    return L.divIcon({
      className: 'custom-leaflet-marker',
      html,
      iconSize: [30, 30],
      iconAnchor: [15, 30],
      popupAnchor: [0, -28],
    });
  }

  function renderMarkers(L) {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();
    if (circlesLayerRef.current) circlesLayerRef.current.clearLayers();

    filteredComplaints.forEach((c) => {
      if (!c.latitude || !c.longitude || !isWithinPune(c.latitude, c.longitude)) return;

      const marker = L.marker([c.latitude, c.longitude], {
        icon: createCustomIcon(L, c.status, c.isFuzzed),
      });

      const primaryPhoto = c.thumbnail || (c.photos && c.photos[0]) || null;
      const statusColor = getMarkerColor(c.status);

      // Compact popup without personal information
      const popupContent = `
        <div style="font-family: inherit; font-size: 12px; width: 260px; max-width: 85vw; line-height: 1.35; color: #0f172a;">
          ${
            primaryPhoto
              ? `<div style="position: relative; width: 100%; height: 120px; margin-bottom: 7px; border-radius: 6px; overflow: hidden; background: #f1f5f9;">
                  <img
                    src="${escapeHtml(primaryPhoto)}"
                    alt="Issue photo"
                    style="width: 100%; height: 100%; object-fit: cover; display: block;"
                    onerror="this.parentElement.style.display='none';"
                  />
                  <div style="position: absolute; bottom: 5px; right: 5px; background: rgba(15, 23, 42, 0.75); color: white; padding: 2px 5px; border-radius: 4px; font-size: 9px; font-weight: 600;">
                    📷 Photo
                  </div>
                </div>`
              : ''
          }

          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <strong style="font-size: 11px; color: #1e40af; font-family: monospace;">${escapeHtml(c.complaintId)}</strong>
            <span style="font-size: 9px; padding: 1.5px 6px; border-radius: 9999px; background: ${statusColor}18; color: ${statusColor}; font-weight: 700; border: 1px solid ${statusColor}35;">
              ${escapeHtml(c.status)}
            </span>
          </div>

          <h4 style="margin: 0 0 4px 0; font-size: 12px; font-weight: 700; color: #0f172a; line-height: 1.3;">
            ${escapeHtml(c.title)}
          </h4>

          <div style="margin-bottom: 5px; font-size: 11px; color: #475569; display: flex; align-items: flex-start; gap: 4px;">
            <span style="color: #64748b; shrink-0;">📍</span>
            <span>
              <strong>${escapeHtml(c.address || c.ward || 'Pune')}</strong>
              ${c.landmark ? `<br/><span style="color: #64748b; font-size: 10px;">Near ${escapeHtml(c.landmark)}</span>` : ''}
            </span>
          </div>

          <div style="display: flex; gap: 5px; padding-top: 5px; border-top: 1px solid #e2e8f0; margin-top: 5px;">
            <button
              type="button"
              onclick="window.__puneOpenComplaintModal('${escapeHtml(c.complaintId)}')"
              style="flex: 1; padding: 5px 8px; background: #2563eb; color: #ffffff; border: none; border-radius: 5px; font-size: 11px; font-weight: 700; cursor: pointer; text-align: center;"
            >
              Inspect Details
            </button>
            <a
              href="/track?token=${escapeHtml(c.complaintId)}"
              style="padding: 5px 9px; background: #f8fafc; color: #334155; border: 1px solid #cbd5e1; border-radius: 5px; font-size: 11px; font-weight: 700; text-decoration: none; display: inline-flex; align-items: center; justify-content: center;"
            >
              Track →
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, {
        maxWidth: 290,
        className: 'custom-pune-leaflet-popup',
      });

      marker.on('click', () => {
        setSelectedComplaint(c);
      });

      markersLayerRef.current.addLayer(marker);

      // Hotspot circle visualization
      if (showHotspots && circlesLayerRef.current) {
        const circle = L.circle([c.latitude, c.longitude], {
          color: getMarkerColor(c.status),
          fillColor: getMarkerColor(c.status),
          fillOpacity: 0.16,
          radius: 350,
        });
        circlesLayerRef.current.addLayer(circle);
      }
    });
  }

  function panToLocality(locality) {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([locality.lat, locality.lng], 14, {
        duration: 1.2,
      });
    }
  }

  function flyToComplaint(c) {
    if (mapInstanceRef.current && c.latitude && c.longitude) {
      mapInstanceRef.current.flyTo([c.latitude, c.longitude], 16, {
        duration: 1.2,
      });
    }
    setSelectedComplaint(c);
  }

  const resetAllFilters = () => {
    setStatusFilter('ALL');
    setPriorityFilter('ALL');
    setSearchQuery('');
    if (mapInstanceRef.current && leafletRef.current) {
      const L = leafletRef.current;
      const pmcViewingBounds = L.latLngBounds(
        [PMC_VIEWING_BOUNDS.minLat, PMC_VIEWING_BOUNDS.minLng],
        [PMC_VIEWING_BOUNDS.maxLat, PMC_VIEWING_BOUNDS.maxLng]
      );
      mapInstanceRef.current.fitBounds(pmcViewingBounds, {
        padding: fullScreen ? [24, 24] : [16, 16],
      });
    }
  };

  const handleShare = () => {
    if (selectedComplaint && typeof window !== 'undefined') {
      const url = `${window.location.origin}/track?token=${selectedComplaint.complaintId}`;
      navigator.clipboard?.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div
      className={
        fullScreen
          ? 'relative w-screen h-[100dvh] overflow-hidden bg-slate-100 pune-fullscreen-map'
          : `relative w-full overflow-hidden bg-slate-100 pune-fullscreen-map ${heightClass}`
      }
    >
      {/* Global CSS overrides to ensure full tile coverage without grey borders */}
      <style jsx global>{`
        .leaflet-container {
          width: 100% !important;
          height: 100% !important;
          background: #f1f5f9 !important;
          outline: none !important;
        }
        .pune-fullscreen-map .leaflet-top.leaflet-left {
          top: 76px !important;
          left: 16px !important;
        }
        @media (max-width: 640px) {
          .pune-fullscreen-map .leaflet-top.leaflet-left {
            top: 78px !important;
            left: 12px !important;
          }
        }
        .leaflet-bar {
          border-radius: 12px !important;
          box-shadow: 0 4px 14px rgba(15, 23, 42, 0.15) !important;
          border: 1px solid rgba(203, 213, 225, 0.9) !important;
          overflow: hidden !important;
        }
        .leaflet-bar a {
          background-color: #ffffff !important;
          color: #1e293b !important;
          border-bottom: 1px solid #e2e8f0 !important;
          width: 34px !important;
          height: 34px !important;
          line-height: 34px !important;
          font-size: 16px !important;
          font-weight: bold !important;
          transition: background 0.15s ease;
        }
        .leaflet-bar a:hover {
          background-color: #f8fafc !important;
          color: #2563eb !important;
        }
      `}</style>

      {/* COMPACT FLOATING TOP HEADER OVERLAY (ON BOTH HOMEPAGE AND /MAP) */}
      <header className="absolute top-3 left-3 right-3 sm:top-4 sm:left-4 sm:right-4 z-20 pointer-events-none">
        <div className="pointer-events-auto bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-xl px-3 py-2.5 sm:px-4 sm:py-3 flex items-center justify-between gap-2.5">
          {/* Left: Back button (if fullScreen) or Title + PMC Badge */}
          <div className="flex items-center gap-2 shrink-0">
            {fullScreen ? (
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition shadow-2xs"
                title="Return to Homepage"
              >
                <ArrowLeft className="w-4 h-4 text-slate-600" />
                <span className="hidden sm:inline">Home</span>
              </Link>
            ) : null}

            <div className={`flex items-center gap-2 ${fullScreen ? 'pl-2 border-l border-slate-200' : ''}`}>
              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold shadow-2xs shrink-0">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight leading-tight">
                  {fullScreen ? 'Pune Civic Map' : 'Civic Issues Across Pune'}
                </h1>
                <span className="hidden md:inline-flex items-center gap-1 text-[10px] text-blue-700 font-semibold bg-blue-50 px-2 py-0.2 rounded-full border border-blue-200">
                  PMC Boundary Locked
                </span>
              </div>
            </div>
          </div>

          {/* Middle: Search Box */}
          <div className="relative flex-1 min-w-[120px] sm:min-w-[180px] max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Pune areas or ID..."
              className="w-full pl-8 pr-6 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/70"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Right: Quick Controls, Filters & CTAs */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Desktop Quick Locality Jumper (on homepage embedded view) */}
            {!fullScreen && (
              <div className="hidden xl:flex items-center gap-1 text-[11px] pr-1 border-r border-slate-200">
                {PUNE_LOCALITIES.slice(0, 3).map((loc) => (
                  <button
                    key={loc.name}
                    type="button"
                    onClick={() => panToLocality(loc)}
                    className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition"
                  >
                    {loc.name.split('/')[0]}
                  </button>
                ))}
              </div>
            )}

            {/* Desktop Filter Selects */}
            <div className="hidden lg:flex items-center gap-1.5 text-xs">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="py-1 px-2 rounded-lg border border-slate-300 bg-white text-xs font-medium"
              >
                <option value="ALL">All Statuses</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="py-1 px-2 rounded-lg border border-slate-300 bg-white text-xs font-medium"
              >
                <option value="ALL">All Priorities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
              </select>
            </div>

            {/* Mobile Filter Toggle */}
            <button
              type="button"
              onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
              className="lg:hidden p-1.5 rounded-lg border border-slate-300 bg-white text-slate-700"
              title="Toggle Filters"
            >
              <Filter className="w-4 h-4 text-slate-600" />
            </button>

            {/* Density Hotspot Toggle */}
            <button
              type="button"
              onClick={() => setShowHotspots(!showHotspots)}
              className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer border ${
                showHotspots
                  ? 'bg-rose-50 border-rose-300 text-rose-700'
                  : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
              }`}
              title="Toggle Hotspots"
            >
              <Flame className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{showHotspots ? 'Hotspots On' : 'Hotspots'}</span>
            </button>

            {/* Fullscreen Button (shown on homepage embedded view) */}
            {!fullScreen && (
              <Link
                href="/map"
                className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer border bg-white border-slate-300 text-slate-700 hover:bg-slate-50 shadow-2xs"
                title="Open Dedicated Full-Screen Map"
              >
                <Maximize2 className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden md:inline">Full Screen</span>
              </Link>
            )}

            {/* Report Issue Primary CTA */}
            <Link
              href="/report"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition"
            >
              <FilePlus2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Report Issue</span>
            </Link>
          </div>
        </div>

        {/* Mobile Filter Drawer */}
        {mobileFilterOpen && (
          <div className="pointer-events-auto mt-2 p-3 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-xl flex flex-wrap items-center gap-2 animate-in fade-in slide-in-from-top-1 text-xs">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 py-1 px-2 rounded-lg border border-slate-300 bg-white text-xs font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="flex-1 py-1 px-2 rounded-lg border border-slate-300 bg-white text-xs font-medium"
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
            </select>

            <button
              type="button"
              onClick={resetAllFilters}
              className="py-1 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
            >
              Reset
            </button>
          </div>
        )}
      </header>

      {/* MAIN LEAFLET MAP ELEMENT (OCCUPIES 100% OF THE CONTAINER) */}
      <div
        ref={mapContainerRef}
        className="w-full h-full absolute inset-0 z-0"
        style={{ width: '100%', height: '100%' }}
      />

      {/* Loading Indicator */}
      {loading && (
        <div className="absolute inset-0 z-20 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center">
          <div className="flex items-center gap-3 text-xs font-bold text-slate-800 bg-white px-4 py-2.5 rounded-2xl shadow-xl border border-slate-200">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span>Loading Pune Civic Geo-Data...</span>
          </div>
        </div>
      )}

      {/* Friendly Empty State Overlay when no complaints match */}
      {!loading && filteredComplaints.length === 0 && (
        <div className="absolute top-20 sm:top-24 left-1/2 -translate-x-1/2 z-20 bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl border border-slate-200 shadow-xl max-w-sm w-[90vw] text-center space-y-1.5 animate-in fade-in">
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-800">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span>No Public Complaints Match Selected Filter</span>
          </div>
          <p className="text-[11px] text-slate-500">
            The map is strictly constrained to the Pune Municipal Corporation (PMC) area. Try adjusting your filters.
          </p>
          <button
            type="button"
            onClick={resetAllFilters}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
          >
            Reset All Filters
          </button>
        </div>
      )}

      {/* RESPONSIVE FLOATING STATUS LEGEND (BOTTOM-LEFT) */}
      <div className="absolute bottom-4 left-4 z-20 pointer-events-auto bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/90 p-3 max-w-[calc(100vw-32px)] sm:max-w-xs text-xs space-y-2">
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
            <span className="font-extrabold text-slate-900 text-xs">
              PMC Issues ({filteredComplaints.length})
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsLegendExpanded(!isLegendExpanded)}
            className="p-1 rounded-md hover:bg-slate-100 text-slate-500"
            aria-label="Toggle legend"
          >
            {isLegendExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>

        {isLegendExpanded && (
          <div className="space-y-1.5 pt-0.5 animate-in fade-in">
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0"></div>
                <span className="text-slate-600 truncate">Submitted / Critical</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></div>
                <span className="text-slate-600 truncate">In Progress</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0"></div>
                <span className="text-slate-600 truncate">Verification</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></div>
                <span className="text-slate-600 truncate">Resolved</span>
              </div>
            </div>

            <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
              <div className="flex items-center gap-1 text-blue-600 font-semibold">
                <span className="w-3 h-0.5 border-t border-dashed border-blue-600"></span>
                <span>PMC Official Boundary</span>
              </div>
              <span className="text-slate-400">100% Pune Locked</span>
            </div>

            {/* Locality Jump Buttons inside legend */}
            <div className="pt-1 border-t border-slate-100 flex items-center gap-1 overflow-x-auto text-[10px]">
              <span className="text-slate-400 font-semibold shrink-0">Jump:</span>
              {PUNE_LOCALITIES.slice(0, 4).map((loc) => (
                <button
                  key={loc.name}
                  type="button"
                  onClick={() => panToLocality(loc)}
                  className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium whitespace-nowrap"
                >
                  {loc.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* COMPREHENSIVE COMPLAINT & PHOTO MODAL (ACCESSIBLE TO ANY VISITOR, NO PERSONAL INFO) */}
      {selectedComplaint && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
          onClick={() => setSelectedComplaint(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden my-auto relative space-y-0"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/80">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-extrabold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-md border border-blue-200">
                    {selectedComplaint.complaintId}
                  </span>
                  <StatusBadge status={selectedComplaint.status} />
                  <PriorityBadge priority={selectedComplaint.priority} />
                  {selectedComplaint.isFuzzed && (
                    <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Privacy Protected</span>
                    </span>
                  )}
                </div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                  {selectedComplaint.title}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setSelectedComplaint(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition shrink-0 cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 max-h-[75vh] overflow-y-auto space-y-5 text-sm">
              {/* Photo Display Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-blue-600" />
                    <span>Evidence Pictures & Field Verification ({selectedComplaint.photos?.length || (selectedComplaint.thumbnail ? 1 : 0)})</span>
                  </span>
                  {selectedComplaint.photos?.length > 1 && (
                    <span className="text-xs font-semibold text-slate-500">
                      Photo {activePhotoIndex + 1} of {selectedComplaint.photos.length}
                    </span>
                  )}
                </div>

                {selectedComplaint.photos && selectedComplaint.photos.length > 0 ? (
                  <div className="space-y-2">
                    {/* Active Selected Photo */}
                    <div className="relative w-full h-64 sm:h-80 bg-slate-900 rounded-xl overflow-hidden border border-slate-200 flex items-center justify-center">
                      <img
                        src={selectedComplaint.photos[activePhotoIndex] || selectedComplaint.photos[0]}
                        alt="Civic issue evidence"
                        className="w-full h-full object-contain"
                      />
                      <a
                        href={selectedComplaint.photos[activePhotoIndex] || selectedComplaint.photos[0]}
                        target="_blank"
                        rel="noreferrer"
                        className="absolute bottom-3 right-3 bg-slate-900/80 hover:bg-slate-900 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 backdrop-blur-xs transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>View Original</span>
                      </a>
                    </div>

                    {/* Thumbnail Selector if multiple photos */}
                    {selectedComplaint.photos.length > 1 && (
                      <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        {selectedComplaint.photos.map((url, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setActivePhotoIndex(idx)}
                            className={`w-16 h-16 rounded-lg overflow-hidden border-2 shrink-0 cursor-pointer transition ${
                              activePhotoIndex === idx
                                ? 'border-blue-600 ring-2 ring-blue-500/30'
                                : 'border-slate-200 opacity-60 hover:opacity-100'
                            }`}
                          >
                            <img src={url} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : selectedComplaint.thumbnail ? (
                  <div className="relative w-full h-64 sm:h-80 bg-slate-900 rounded-xl overflow-hidden border border-slate-200 flex items-center justify-center">
                    <img
                      src={selectedComplaint.thumbnail}
                      alt="Civic issue evidence"
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="p-8 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1">
                    <Camera className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs font-bold text-slate-600">No citizen photos submitted for this issue</p>
                    <p className="text-[11px] text-slate-400">
                      The reporter filed this issue via direct SMS/Call/Geotag without media evidence.
                    </p>
                  </div>
                )}
              </div>

              {/* Location Description & Landmark */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <span>Location Details</span>
                  </span>
                  {selectedComplaint.latitude && selectedComplaint.longitude && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${selectedComplaint.latitude},${selectedComplaint.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Open in Google Maps</span>
                    </a>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 font-semibold block">Address / Street:</span>
                    <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                      {selectedComplaint.address || 'Pune Municipal Area'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 font-semibold block">Nearest Landmark:</span>
                    <span className="font-bold text-slate-800 mt-0.5 block">
                      {selectedComplaint.landmark || 'No specific landmark provided'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 font-semibold block">Administrative Ward:</span>
                    <span className="font-bold text-slate-800 mt-0.5 block">
                      {selectedComplaint.ward || 'Central Pune'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 font-semibold block">GPS Coordinates:</span>
                    <span className="font-mono text-slate-700 mt-0.5 block">
                      {selectedComplaint.latitude ? `${selectedComplaint.latitude.toFixed(5)}, ${selectedComplaint.longitude?.toFixed(5)}` : 'Not geo-tagged'}
                    </span>
                  </div>
                </div>

                {selectedComplaint.isFuzzed && (
                  <div className="p-2.5 rounded-lg bg-indigo-50 border border-indigo-100 text-[11px] text-indigo-900 flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Geo-Privacy Protection:</strong> This location pin has been snapped to a nearby public street boundary (~150m) to preserve citizen residential privacy.
                    </span>
                  </div>
                )}
              </div>

              {/* Full Description Section */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>Full Grievance Description</span>
                </span>
                <div className="p-4 rounded-xl bg-blue-50/40 border border-blue-100 text-slate-800 text-xs sm:text-sm leading-relaxed">
                  {selectedComplaint.description || (
                    <span className="text-slate-400 italic">No detailed description entered for this grievance.</span>
                  )}
                </div>
              </div>

              {/* Administrative Category & Department */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-500 font-semibold flex items-center gap-1 mb-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Responsible Department</span>
                  </span>
                  <p className="font-bold text-slate-800">{selectedComplaint.department || 'Municipal Works'}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold flex items-center gap-1 mb-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Category & Target SLA</span>
                  </span>
                  <p className="font-bold text-slate-800">{selectedComplaint.category || 'General'}</p>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/80 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleShare}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Link Copied!' : 'Share'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => flyToComplaint(selectedComplaint)}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  <span>Center On Map</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedComplaint(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 transition cursor-pointer"
                >
                  Close
                </button>

                <Link
                  href={`/track?token=${selectedComplaint.complaintId}`}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm shadow-blue-600/20 transition"
                >
                  <span>Track Full Lifecycle</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
