'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CivicMap from '@/components/maps/CivicMap';
import { DuplicateAlertModal } from '@/components/complaints/DuplicateAlertModal';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useAuth } from '@/features/auth/AuthContext';
import { CivicCategory, Department, DuplicateCandidate, PriorityLevel } from '@/types';
import {
  UploadCloud,
  MapPin,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Building,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

const CATEGORIES: { key: CivicCategory; labelEn: string; labelHi: string }[] = [
  { key: 'ROADS_INFRASTRUCTURE', labelEn: 'Roads, Potholes & Infrastructure', labelHi: 'सड़कें, गड्ढे एवं बुनियादी ढांचा' },
  { key: 'WASTE_MANAGEMENT', labelEn: 'Waste Management & Sanitation', labelHi: 'कचरा प्रबंधन एवं स्वच्छता' },
  { key: 'WATER_SUPPLY', labelEn: 'Water Supply & Leakage', labelHi: 'जल आपूर्ति एवं रिसाव' },
  { key: 'STREET_LIGHTING', labelEn: 'Street Lighting & Electricity', labelHi: 'सड़क बत्तियां एवं विद्युत' },
  { key: 'TRAFFIC_TRANSPORT', labelEn: 'Traffic & Transportation', labelHi: 'यातायात एवं परिवहन' },
  { key: 'ENVIRONMENT_POLLUTION', labelEn: 'Environment & Pollution', labelHi: 'पर्यावरण एवं प्रदूषण नियंत्रण' },
  { key: 'PUBLIC_HEALTH', labelEn: 'Public Health & Drainage', labelHi: 'सार्वजनिक स्वास्थ्य एवं जल निकासी' },
  { key: 'SAFETY_GOVERNANCE', labelEn: 'Safety, Hazards & Governance', labelHi: 'सुरक्षा, खतरे एवं शासन' },
];

export default function ReportIssuePage() {
  const { lang, t } = useLanguage();
  const { user } = useAuth();

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<CivicCategory>('ROADS_INFRASTRUCTURE');
  const [suggestedCategory, setSuggestedCategory] = useState<CivicCategory | null>(null);
  const [aiConfidence, setAiConfidence] = useState<number | null>(null);
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [priority, setPriority] = useState<PriorityLevel>('MODERATE');

  // Location states (Pune Municipal area defaults)
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: 18.5285, lng: 73.8480 });
  const [address, setAddress] = useState('FC Road, Shivajinagar, Pune 411005');
  const [landmark, setLandmark] = useState('');
  const [isLocating, setIsLocating] = useState(false);

  // Photos
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Departments list for dropdown
  const [departments, setDepartments] = useState<Department[]>([]);

  // Duplicate detection state
  const [duplicateCandidate, setDuplicateCandidate] = useState<DuplicateCandidate | null>(null);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{
    tracking_id: string;
    department_name: string;
    office_name?: string;
    deadline: string;
  } | null>(null);

  useEffect(() => {
    fetch('/api/departments')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setDepartments(data.departments);
          if (data.departments.length > 0) {
            setSelectedDeptId(data.departments[0].id);
          }
        }
      });
  }, []);

  // Browser Geolocation Detection
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setAddress(`GPS Lat: ${pos.coords.latitude.toFixed(4)}, Lon: ${pos.coords.longitude.toFixed(4)} (Pune Ward Area)`);
        setIsLocating(false);
      },
      (err) => {
        console.warn('Geolocation denied or unavailable:', err.message);
        setIsLocating(false);
        alert('Location permission denied or unavailable. You can click on the map below to pinpoint exact location.');
      },
      { timeout: 10000 }
    );
  };

  // AI-Assisted Category Suggestion trigger
  const runAiClassification = async (textToAnalyze: string, filename?: string) => {
    if (!textToAnalyze || textToAnalyze.trim().length < 4) return;
    try {
      const res = await fetch('/api/classification/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToAnalyze, filename }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setSuggestedCategory(json.data.suggestedCategory);
        setAiConfidence(json.data.confidence);
        setCategory(json.data.suggestedCategory);
      }
    } catch (err) {
      console.error('Classification error:', err);
    }
  };

  // Photo Upload Handler
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setUploadingPhoto(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        setPhotoUrls([data.url]);
        // Trigger AI classification using image name & description
        runAiClassification(`${title} ${description} ${file.name}`, file.name);
      } else {
        alert(data.error || 'Failed to upload photo');
      }
    } catch {
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Pre-submission Duplicate Check
  const handleSubmitClick = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim() || title.length < 5) {
      setErrorMessage('Please provide a descriptive title (at least 5 characters).');
      return;
    }
    if (!description.trim() || description.length < 10) {
      setErrorMessage('Please provide a detailed description (at least 10 characters).');
      return;
    }
    if (photoUrls.length === 0) {
      // For fast demo testing if user doesn't pick an image, provide a default realistic evidence image
      setPhotoUrls(['https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80']);
    }

    setIsSubmitting(true);

    try {
      // First check for duplicates
      const dupRes = await fetch('/api/complaints/check-duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: coords.lat,
          longitude: coords.lng,
          category,
          title,
          description,
        }),
      });
      const dupData = await dupRes.json();

      if (dupData.success && dupData.count > 0) {
        // Show duplicate candidate modal
        setDuplicateCandidate(dupData.candidates[0]);
        setIsSubmitting(false);
        return;
      }

      // If no duplicate, proceed directly
      await executeCreateComplaint();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error submitting grievance';
      setErrorMessage(msg);
      setIsSubmitting(false);
    }
  };

  // Perform Final Creation
  const executeCreateComplaint = async () => {
    setIsSubmitting(true);
    setDuplicateCandidate(null);

    const payload = {
      title,
      description,
      category,
      suggested_category: suggestedCategory || undefined,
      classification_confidence: aiConfidence || undefined,
      department_id: selectedDeptId || undefined,
      latitude: coords.lat,
      longitude: coords.lng,
      address,
      landmark: landmark || undefined,
      priority,
      image_urls: photoUrls.length > 0 ? photoUrls : ['https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80'],
      citizen_id: user?.id || 'u1000000-0000-0000-0000-000000000001',
      citizen_name: user?.name || 'Aarav Sharma',
      citizen_phone: user?.phone || '+91 98765 43210',
    };

    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success && data.data) {
        setSuccessResult({
          tracking_id: data.data.tracking_id,
          department_name: data.data.department_name || 'Municipal Department',
          office_name: data.data.department_office_name,
          deadline: data.data.deadline,
        });
      } else {
        setErrorMessage(data.error || 'Failed to create complaint');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Submission failed';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // User chooses to support existing complaint instead of creating duplicate
  const handleSupportExisting = async (complaintId: string) => {
    try {
      await fetch(`/api/complaints/${complaintId}/support`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user?.id || 'u1000000-0000-0000-0000-000000000001' }),
      });
      if (duplicateCandidate) {
        window.location.href = `/track?id=${duplicateCandidate.complaint.tracking_id}`;
      }
    } catch {
      alert('Failed to register support');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Navbar />

      <main className="flex-1 py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        {/* Success Confirmation View */}
        {successResult ? (
          <div className="bg-white rounded-xl border border-emerald-200 shadow-md p-6 sm:p-10 text-center space-y-6 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#17304F] font-heading">
                {t('report.successTitle', 'Complaint Registered Successfully!')}
              </h2>
              <p className="text-sm text-slate-600 mt-2">
                Your civic grievance has been officially cataloged and dispatched for municipal resolution.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 max-w-md mx-auto text-left space-y-3">
              <div>
                <span className="text-xs text-slate-500 font-medium">{t('report.trackingId', 'Complaint Reference Number')}:</span>
                <div className="text-xl font-mono font-extrabold text-[#E07B2E] tracking-wider mt-0.5">
                  {successResult.tracking_id}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200">
                <span className="text-xs text-slate-500 font-medium">{t('report.routedTo', 'Routed to Office')}:</span>
                <div className="text-sm font-bold text-[#17304F]">
                  {successResult.department_name}
                </div>
                {successResult.office_name && (
                  <div className="text-xs text-slate-600">{successResult.office_name}</div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-200">
                <span className="text-xs text-slate-500 font-medium">{t('report.deadlineNotice', 'Resolution Deadline (IST)')}:</span>
                <div className="text-xs font-semibold text-blue-700">
                  {new Date(successResult.deadline).toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
              <a
                href={`/track?id=${successResult.tracking_id}`}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-[#E07B2E] text-white font-bold text-sm hover:bg-[#c9671d] shadow-sm transition-colors"
              >
                <span>{t('report.trackNow', 'Track This Complaint Now')}</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <button
                onClick={() => {
                  setSuccessResult(null);
                  setTitle('');
                  setDescription('');
                  setPhotoUrls([]);
                }}
                className="px-5 py-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#17304F] font-semibold text-sm transition-colors border border-slate-300"
              >
                Report Another Issue
              </button>
            </div>
          </div>
        ) : (
          /* Grievance Reporting Form */
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17304F] font-heading">
                {t('report.title', 'File a Civic Grievance')}
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                {t('report.subtitle', 'Provide issue details, location, and photos for immediate municipal action.')}
              </p>
            </div>

            {errorMessage && (
              <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmitClick} className="space-y-6">
              {/* Card 1: Issue Summary & Description */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
                <h2 className="text-base font-bold text-[#17304F] font-heading border-b border-slate-100 pb-2">
                  1. Grievance Description & Classification
                </h2>

                <div>
                  <label className="block text-xs font-bold text-[#17304F] uppercase tracking-wider mb-1.5">
                    {t('report.issueTitle', 'Issue Title / Summary')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      if (e.target.value.length > 6) {
                        runAiClassification(e.target.value);
                      }
                    }}
                    placeholder={t(
                      'report.issueTitlePlaceholder',
                      'e.g., Deep dangerous pothole on JM Road near Modern School gate'
                    )}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#E07B2E]/50 focus:border-[#E07B2E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#17304F] uppercase tracking-wider mb-1.5">
                    {t('report.description', 'Detailed Description')} *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t(
                      'report.descriptionPlaceholder',
                      'Describe the exact hazard, how long it has persisted, and any specific landmarks...'
                    )}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#E07B2E]/50 focus:border-[#E07B2E]"
                  />
                </div>

                {/* AI-Assisted Classification Banner */}
                {suggestedCategory && (
                  <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-3 flex items-start gap-2.5 text-xs">
                    <Sparkles className="w-4 h-4 text-[#E07B2E] shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <span className="font-bold text-[#17304F]">
                        {t('report.categorySuggestion', 'AI Suggested Category')}:{' '}
                      </span>
                      <span className="font-semibold text-[#E07B2E]">
                        {t(`categories.${suggestedCategory}`)}
                      </span>
                      {aiConfidence && (
                        <span className="text-slate-500 ml-1.5">
                          ({(aiConfidence * 100).toFixed(0)}% confidence score)
                        </span>
                      )}
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        You can confirm this category or manually override below.
                      </p>
                    </div>
                  </div>
                )}

                {/* Category Selection Grid */}
                <div>
                  <label className="block text-xs font-bold text-[#17304F] uppercase tracking-wider mb-2">
                    {t('report.category', 'Issue Category')} *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {CATEGORIES.map((cat) => {
                      const isSelected = category === cat.key;
                      return (
                        <button
                          key={cat.key}
                          type="button"
                          onClick={() => setCategory(cat.key)}
                          className={`text-left px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all border ${
                            isSelected
                              ? 'bg-[#17304F] text-white border-[#17304F] font-bold shadow-xs'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {lang === 'hi' ? cat.labelHi : cat.labelEn}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Department Selection (Required per spec: citizen can choose responsible department) */}
                <div className="pt-2">
                  <label className="block text-xs font-bold text-[#17304F] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-[#E07B2E]" />
                    <span>{t('report.department', 'Responsible Department')}</span>
                  </label>
                  <select
                    value={selectedDeptId}
                    onChange={(e) => setSelectedDeptId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs font-medium text-[#17304F] bg-white focus:outline-hidden focus:border-[#E07B2E]"
                  >
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name} ({dept.code})
                      </option>
                    ))}
                  </select>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Our smart routing engine validates this selection against eligible municipal ward offices.
                  </span>
                </div>
              </div>

              {/* Card 2: Photo Evidence Upload */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
                <h2 className="text-base font-bold text-[#17304F] font-heading border-b border-slate-100 pb-2">
                  2. Photo Evidence
                </h2>

                <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-[#E07B2E] transition-colors">
                  <UploadCloud className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  <label className="cursor-pointer">
                    <span className="text-xs font-bold text-[#E07B2E] hover:underline">
                      {uploadingPhoto ? 'Uploading image...' : 'Click to upload photograph'}
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handlePhotoUpload}
                      disabled={uploadingPhoto}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {t('report.photoNote', 'PNG, JPG up to 5MB. Clear evidence speeds up verification.')}
                  </p>
                </div>

                {photoUrls.length > 0 && (
                  <div className="flex gap-3 pt-2">
                    {photoUrls.map((url, idx) => (
                      <div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden border border-slate-200">
                        <img src={url} alt="Evidence" className="w-full h-full object-cover" />
                        <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] px-1 rounded">
                          Evidence
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Card 3: Location & GIS Pinpoint */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h2 className="text-base font-bold text-[#17304F] font-heading">
                    3. Exact Grievance Location
                  </h2>
                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    disabled={isLocating}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#244670] hover:bg-[#17304F] text-white text-xs font-semibold transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5 text-[#E07B2E]" />
                    <span>{isLocating ? 'Detecting...' : t('report.useCurrentLocation', 'Detect GPS')}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#17304F] uppercase tracking-wider mb-1.5">
                      {t('report.address', 'Street Address / Ward')} *
                    </label>
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs focus:outline-hidden focus:border-[#E07B2E]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#17304F] uppercase tracking-wider mb-1.5">
                      Nearby Landmark
                    </label>
                    <input
                      type="text"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      placeholder="e.g. Near Shivajinagar Railway Station, Gate 1"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs focus:outline-hidden focus:border-[#E07B2E]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-[11px] text-slate-500 font-medium">
                    {t('report.pinpointMap', 'Click anywhere on the map to fine-tune the exact pin location.')}
                  </div>
                  <CivicMap
                    selectedLocation={coords}
                    searchRadiusMeters={150}
                    onLocationSelect={(newCoords) => setCoords(newCoords)}
                    height="280px"
                  />
                  <div className="text-[10px] text-slate-400">
                    Selected coordinates: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)} &bull; 150m duplicate detection radius active
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 rounded-xl bg-[#E07B2E] hover:bg-[#c9671d] text-white font-bold text-sm tracking-wide transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-5 h-5" />
                  <span>
                    {isSubmitting
                      ? t('report.submitting', 'Submitting Grievance...')
                      : t('report.submitButton', 'Submit Complaint')}
                  </span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Duplicate Candidate Modal */}
        {duplicateCandidate && (
          <DuplicateAlertModal
            candidate={duplicateCandidate}
            onSupportExisting={handleSupportExisting}
            onProceedAnyway={executeCreateComplaint}
            onCancel={() => setDuplicateCandidate(null)}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}
