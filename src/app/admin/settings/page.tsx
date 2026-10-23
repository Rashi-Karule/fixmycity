'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { PriorityPolicy, PriorityLevel } from '@/types';
import {
  Settings,
  Clock,
  Save,
  CheckCircle,
  AlertTriangle,
  SlidersHorizontal,
  Compass,
  Bell,
  ShieldAlert,
} from 'lucide-react';

export default function AdminSettingsPage() {
  const { lang } = useLanguage();

  const [policies, setPolicies] = useState<PriorityPolicy[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states for SLA policies
  const [intermediateHours, setIntermediateHours] = useState(24);
  const [moderateHours, setModerateHours] = useState(72);
  const [standardHours, setStandardHours] = useState(168);

  // GIS Search radius configurations
  const [initialRadius, setInitialRadius] = useState(5);
  const [radiusIncrement, setRadiusIncrement] = useState(5);
  const [maxRadius, setMaxRadius] = useState(50);

  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/admin/policies')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data) {
          setPolicies(d.data);
          d.data.forEach((p: PriorityPolicy) => {
            if (p.priority_level === 'INTERMEDIATE') setIntermediateHours(p.duration_hours);
            if (p.priority_level === 'MODERATE') setModerateHours(p.duration_hours);
            if (p.priority_level === 'STANDARD') setStandardHours(p.duration_hours);
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSavePolicies = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveMessage(null);
    try {
      await Promise.all([
        fetch('/api/admin/policies', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ priority_level: 'INTERMEDIATE', duration_hours: intermediateHours }),
        }),
        fetch('/api/admin/policies', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ priority_level: 'MODERATE', duration_hours: moderateHours }),
        }),
        fetch('/api/admin/policies', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ priority_level: 'STANDARD', duration_hours: standardHours }),
        }),
      ]);

      setSaveMessage({
        type: 'success',
        text:
          lang === 'hi'
            ? 'SLA समय-सीमा नीतियां सफलतापूर्वक अपडेट की गईं!'
            : 'Priority SLA policies successfully updated in system database!',
      });
    } catch (err: unknown) {
      setSaveMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to update SLA policies.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-100 text-purple-700 rounded-xl">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 font-heading">
              {lang === 'hi' ? 'प्रणाली SLA नीतियां एवं कॉन्फ़िगरेशन' : 'System SLA Policies & Routing Settings'}
            </h1>
            <p className="text-sm text-slate-600">
              {lang === 'hi'
                ? 'प्राथमिकता समय-सीमा अवधि एवं जीपीएस क्षेत्रीय खोज त्रिज्या नीतियां'
                : 'Configure priority SLA resolution thresholds, geographic ward routing radii, and automated escalation limits'}
            </p>
          </div>
        </div>
      </div>

      {saveMessage && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold mb-6 flex items-center gap-2 ${
            saveMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {saveMessage.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
          <span>{saveMessage.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* SLA Policy Management Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200">
            <Clock className="w-5 h-5 text-purple-600" />
            <h2 className="text-base font-bold text-slate-900 font-heading">
              {lang === 'hi' ? 'SLA प्राथमिकता समय-सीमा नीतियां' : 'Priority SLA Deadline Thresholds'}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mb-6">
            {lang === 'hi'
              ? 'प्रत्येक शिकायत की समय-सीमा उसकी प्राथमिकता के अनुसार तय होती है। समय सीमा समाप्त होने पर स्वचालित एस्केलेशन ट्रिगर होता है।'
              : 'Every complaint receives a binding deadline derived from its priority. Unresolved complaints past their deadline trigger automated escalation.'}
          </p>

          {loading ? (
            <div className="py-8 text-center text-slate-500">
              <div className="inline-block animate-spin w-6 h-6 border-3 border-purple-500 border-t-transparent rounded-full mb-2" />
              <p className="text-xs">Loading policy rules...</p>
            </div>
          ) : (
            <form onSubmit={handleSavePolicies} className="space-y-5">
              {/* Intermediate */}
              <div className="p-4 rounded-lg border border-red-200 bg-red-50/40">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <span className="text-xs font-bold text-slate-900">INTERMEDIATE (उच्च प्राथमिकता)</span>
                  </div>
                  <span className="text-[11px] font-mono text-red-700 font-semibold">{intermediateHours} hours ({Math.round(intermediateHours / 24)} days)</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="12"
                    max="72"
                    step="6"
                    value={intermediateHours}
                    onChange={(e) => setIntermediateHours(Number(e.target.value))}
                    className="flex-1 accent-red-600 cursor-pointer"
                  />
                  <input
                    type="number"
                    min="1"
                    max="168"
                    value={intermediateHours}
                    onChange={(e) => setIntermediateHours(Number(e.target.value))}
                    className="w-20 p-1.5 text-xs text-center border border-slate-300 rounded bg-white font-mono"
                  />
                  <span className="text-xs text-slate-500">hours</span>
                </div>
              </div>

              {/* Moderate */}
              <div className="p-4 rounded-lg border border-amber-200 bg-amber-50/40">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="text-xs font-bold text-slate-900">MODERATE (मध्यम प्राथमिकता)</span>
                  </div>
                  <span className="text-[11px] font-mono text-amber-700 font-semibold">{moderateHours} hours ({Math.round(moderateHours / 24)} days)</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="24"
                    max="120"
                    step="12"
                    value={moderateHours}
                    onChange={(e) => setModerateHours(Number(e.target.value))}
                    className="flex-1 accent-amber-600 cursor-pointer"
                  />
                  <input
                    type="number"
                    min="1"
                    max="240"
                    value={moderateHours}
                    onChange={(e) => setModerateHours(Number(e.target.value))}
                    className="w-20 p-1.5 text-xs text-center border border-slate-300 rounded bg-white font-mono"
                  />
                  <span className="text-xs text-slate-500">hours</span>
                </div>
              </div>

              {/* Standard */}
              <div className="p-4 rounded-lg border border-blue-200 bg-blue-50/40">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <span className="text-xs font-bold text-slate-900">STANDARD (मानक प्राथमिकता)</span>
                  </div>
                  <span className="text-[11px] font-mono text-blue-700 font-semibold">{standardHours} hours ({Math.round(standardHours / 24)} days)</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="48"
                    max="336"
                    step="24"
                    value={standardHours}
                    onChange={(e) => setStandardHours(Number(e.target.value))}
                    className="flex-1 accent-blue-600 cursor-pointer"
                  />
                  <input
                    type="number"
                    min="1"
                    max="720"
                    value={standardHours}
                    onChange={(e) => setStandardHours(Number(e.target.value))}
                    className="w-20 p-1.5 text-xs text-center border border-slate-300 rounded bg-white font-mono"
                  />
                  <span className="text-xs text-slate-500">hours</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? (lang === 'hi' ? 'सहेजा जा रहा है...' : 'Saving Policies...') : (lang === 'hi' ? 'SLA नीतियां सहेजें' : 'Save SLA Thresholds')}</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* GIS Routing Rules Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200">
              <Compass className="w-5 h-5 text-purple-600" />
              <h2 className="text-base font-bold text-slate-900 font-heading">
                {lang === 'hi' ? 'जीपीएस ऑटो-रूटिंग एवं खोज त्रिज्या' : 'GIS Auto-Routing Radius Policy'}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mb-6">
              {lang === 'hi'
                ? 'नागरिक रिपोर्ट दर्ज होने पर प्रणाली निकटतम पात्र क्षेत्रीय कार्यालय खोजती है। यदि कोई सक्रिय कार्यालय नहीं मिलता, तो त्रिज्या बढ़ाई जाती है।'
                : 'When a complaint is submitted, the engine searches for active eligible offices covering the category, progressively expanding the perimeter.'}
            </p>

            <div className="space-y-4">
              <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700">Initial Search Radius</span>
                  <span className="font-mono text-xs font-bold text-purple-700">{initialRadius} km</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">Initial search perimeter around complaint coordinates (Default: 5 km)</p>
              </div>

              <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700">Radius Expansion Increment</span>
                  <span className="font-mono text-xs font-bold text-purple-700">+{radiusIncrement} km</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">Step expansion if no eligible office found in current perimeter (Default: 5 km)</p>
              </div>

              <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700">Maximum Search Boundary</span>
                  <span className="font-mono text-xs font-bold text-purple-700">{maxRadius} km</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">Ceiling radius; if still no office found, complaint flagged for Admin Review</p>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 rounded-xl bg-purple-50/70 border border-purple-200 text-xs text-purple-900">
            <strong className="font-semibold">{lang === 'hi' ? 'सख्त रूटिंग नियम 7:' : 'Strict Routing Rule 7:'}</strong>{' '}
            {lang === 'hi'
              ? 'यदि 50 किमी तक कोई पात्र कार्यालय नहीं मिलता, तो शिकायत को किसी असंबंधित विभाग को नहीं सौंपा जाता, बल्कि सीधे प्रशासनिक संज्ञान हेतु चिह्नित किया जाता है।'
              : 'If no eligible department office is within the search boundary, the issue is marked for Administrative Review rather than misrouted.'}
          </div>
        </div>
      </div>
    </div>
  );
}
