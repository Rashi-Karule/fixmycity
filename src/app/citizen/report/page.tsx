'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import CivicMap from '@/components/maps/CivicMap';
import JurisdictionLocationPicker, { JurisdictionSelection } from '@/components/complaints/JurisdictionLocationPicker';
import { DuplicateAlertModal } from '@/components/complaints/DuplicateAlertModal';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useAuth } from '@/features/auth/AuthContext';
import { CivicCategory, Department, DuplicateCandidate, PriorityLevel } from '@/types';
import { ImageAnalysisResult } from '@/features/classification/imageAnalyzer';
import {
  Camera,
  UploadCloud,
  MapPin,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Building,
  ArrowRight,
  ShieldCheck,
  FileText,
  Layers,
  RefreshCw,
  Info,
  Clock,
  Phone,
  HelpCircle,
  X,
} from 'lucide-react';

const CATEGORIES: { key: CivicCategory; labelEn: string; labelHi: string }[] = [
  { key: 'ROADS_INFRASTRUCTURE', labelEn: 'Roads, Potholes & Infrastructure', labelHi: 'सड़कें, गड्ढे एवं बुनियादी ढांचा' },
  { key: 'WASTE_MANAGEMENT', labelEn: 'Waste Management & Sanitation', labelHi: 'कचरा प्रबंधन एवं स्वच्छता' },
  { key: 'WATER_SUPPLY', labelEn: 'Water Supply & Leakage', labelHi: 'जल आपूर्ति एवं रिसाव' },
  { key: 'STREET_LIGHTING', labelEn: 'Street Lighting & Electricity', labelHi: 'सड़क रोशनी एवं बिजली' },
  { key: 'TRAFFIC_TRANSPORT', labelEn: 'Traffic & Transportation', labelHi: 'यातायात एवं परिवहन' },
  { key: 'ENVIRONMENT_POLLUTION', labelEn: 'Environment & Pollution', labelHi: 'पर्यावरण एवं प्रदूषण नियंत्रण' },
  { key: 'PUBLIC_HEALTH', labelEn: 'Public Health & Drainage', labelHi: 'सार्वजनिक स्वास्थ्य एवं जल निकासी' },
  { key: 'SAFETY_GOVERNANCE', labelEn: 'Safety, Hazards & Governance', labelHi: 'सुरक्षा, खतरे एवं शासन' },
];

function ReportIssueContent() {
  const searchParams = useSearchParams();
  const initialModeParam = searchParams.get('mode');
  const initialCategoryParam = searchParams.get('category') as CivicCategory | null;

  const { lang, t } = useLanguage();
  const { user } = useAuth();

  // Active reporting mode: 'ai' (Mode A), 'manual' (Mode B), 'assistant' (Mode C)
  const [mode, setMode] = useState<'ai' | 'manual' | 'assistant'>(
    initialModeParam === 'manual' ? 'manual' : initialModeParam === 'assistant' ? 'assistant' : 'ai'
  );

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<CivicCategory>(initialCategoryParam || 'ROADS_INFRASTRUCTURE');
  const [suggestedCategory, setSuggestedCategory] = useState<CivicCategory | null>(null);
  const [aiConfidence, setAiConfidence] = useState<number | null>(null);
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [priority, setPriority] = useState<PriorityLevel>('MODERATE');

  // Pan-India Jurisdiction & Location state
  const [jurisdiction, setJurisdiction] = useState<JurisdictionSelection>({
    state: '',
    district: '',
    jurisdictionType: 'URBAN',
    localBodyName: '',
    lgdCode: '',
    wardOrVillage: '',
    address: '',
    landmark: '',
    coords: { lat: 20.5937, lng: 78.9629 },
  });

  // Photo uploads
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  // AI Photo Analysis States
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const [imageAnalysisResult, setImageAnalysisResult] = useState<ImageAnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Assistant Mode C text notes
  const [assistantNotes, setAssistantNotes] = useState('');
  const [assistantAnalyzing, setAssistantAnalyzing] = useState(false);

  // Departments list
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
    office_address?: string;
    office_phone?: string;
    deadline: string;
    category: CivicCategory;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

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


  // Image Upload & AI Photo Analysis Handler
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (JPG, PNG, WebP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Photograph exceeds 5MB size limit.');
      return;
    }

    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setPhotoPreview(base64);
      setPhotoUrls([base64]);

      // If in Mode A (AI Photo Detection), immediately trigger server-side analysis
      if (mode === 'ai') {
        await executeImageAnalysis(base64, file.name, file.type);
      }
    };
    reader.readAsDataURL(file);
  };

  // Execute Server-Side Image Analysis
  const executeImageAnalysis = async (base64: string, filename: string, mimeType: string, hint?: string) => {
    setAnalyzingImage(true);
    setAnalysisError(null);
    setImageAnalysisResult(null);

    try {
      const res = await fetch('/api/classification/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64,
          filename,
          mimeType,
          userHint: hint,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        const result: ImageAnalysisResult = json.data;
        setImageAnalysisResult(result);
        setSuggestedCategory(result.suggestedCategory);
        setCategory(result.suggestedCategory);
        if (result.confidence) {
          setAiConfidence(result.confidence);
        }
        // Auto-fill title & description if not manually typed
        if (!title.trim() || title === 'Civic Issue Report') {
          setTitle(result.suggestedTitle);
        }
        if (!description.trim()) {
          setDescription(result.suggestedDescription);
        }
      } else {
        setAnalysisError(json.error || 'Failed to complete image analysis.');
      }
    } catch (err: unknown) {
      setAnalysisError(err instanceof Error ? err.message : 'Network error during image analysis.');
    } finally {
      setAnalyzingImage(false);
    }
  };

  // Assistant Mode C text analysis trigger
  const handleAssistantAnalyze = async () => {
    if (!assistantNotes.trim() && !photoPreview) {
      alert('Please enter short notes or upload a photo to analyze.');
      return;
    }
    setAssistantAnalyzing(true);
    try {
      const res = await fetch('/api/classification/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: assistantNotes,
          filename: photoFile?.name,
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setSuggestedCategory(data.data.suggestedCategory);
        setCategory(data.data.suggestedCategory);
        setAiConfidence(data.data.confidence);
        if (!title.trim()) {
          setTitle(assistantNotes.slice(0, 50) || 'Civic Issue Report');
        }
        if (!description.trim()) {
          setDescription(assistantNotes);
        }
      }
    } catch {
      alert('Failed to analyze notes.');
    } finally {
      setAssistantAnalyzing(false);
    }
  };

  // Submit Complaint Workflow
  const handleSubmitComplaint = async (e?: React.FormEvent, bypassDuplicateCheck = false) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    // Validation checks per mode
    if (mode === 'manual' && (!title.trim() || title.length < 5)) {
      setErrorMessage(lang === 'hi' ? 'कृपया कम से कम 5 अक्षरों का शीर्षक दर्ज करें।' : 'Please enter an issue title (at least 5 characters).');
      return;
    }

    // Generate a descriptive title from category and location if not explicitly entered
    const categoryEntry = CATEGORIES.find((c) => c.key === category);
    const categoryLabel = (lang === 'hi' ? categoryEntry?.labelHi : categoryEntry?.labelEn) || 'Civic Grievance';
    const finalTitle =
      title.trim() ||
      `${categoryLabel} at ${jurisdiction.address || jurisdiction.wardOrVillage || jurisdiction.localBodyName || 'Reported Location'}`;

    const finalAddress =
      jurisdiction.address ||
      `${jurisdiction.localBodyName || ''}, ${jurisdiction.district || ''}, ${jurisdiction.state || ''}`.replace(/^[\s,]+|[\s,]+$/g, '') ||
      'Civic Area Coordinates';

    const grievancePayload = {
      title: finalTitle,
      description: description || 'Civic grievance registered by citizen.',
      category,
      suggested_category: suggestedCategory || undefined,
      classification_confidence: aiConfidence || undefined,
      department_id: selectedDeptId || undefined,
      citizen_id: user?.id || 'u1000000-0000-0000-0000-000000000001',
      citizen_name: user?.name || 'Aarav Sharma',
      citizen_phone: user?.phone || '+91 98765 43210',
      latitude: jurisdiction.coords.lat,
      longitude: jurisdiction.coords.lng,
      address: finalAddress,
      landmark: jurisdiction.landmark || undefined,
      state: jurisdiction.state,
      district: jurisdiction.district,
      jurisdiction_type: jurisdiction.jurisdictionType,
      local_body_name: jurisdiction.localBodyName,
      lgd_code: jurisdiction.lgdCode,
      ward_or_village: jurisdiction.wardOrVillage,
      priority,
      image_urls: photoUrls.length > 0 ? photoUrls : ['https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800'],
    };

    setIsSubmitting(true);

    try {
      // 1. Run Duplicate Candidate Check if not bypassed
      if (!bypassDuplicateCheck) {
        const dupRes = await fetch('/api/complaints', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...grievancePayload,
            check_duplicate_only: true,
          }),
        });

        const dupData = await dupRes.json();
        if (dupData.success && dupData.duplicatesFound && dupData.duplicates?.length > 0) {
          setDuplicateCandidate(dupData.duplicates[0]);
          setIsSubmitting(false);
          return;
        }
      }

      // 2. Final Submission
      const submitRes = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(grievancePayload),
      });

      const submitData = await submitRes.json();
      if (submitData.success) {
        setSuccessResult({
          tracking_id: submitData.data.tracking_id,
          department_name: submitData.data.department_name || 'Designated Public Service Department',
          office_name: submitData.data.department_office_name,
          office_address: submitData.data.department_office_name || submitData.routing?.officeAddress || `${jurisdiction.localBodyName} Regional Office`,
          office_phone: submitData.routing?.officePhone || 'Not yet verified',
          deadline: submitData.data.deadline,
          category: submitData.data.category,
        });
      } else {
        setErrorMessage(submitData.error || 'Failed to submit complaint.');
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Submission failed due to a network error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Upvote duplicate handler
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
    <div className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
      {/* Success Confirmation View */}
      {successResult ? (
        <div className="bg-white rounded-2xl border border-emerald-200 shadow-md p-6 sm:p-10 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17304F] font-heading">
              {lang === 'hi' ? 'शिकायत सफलतापूर्वक दर्ज की गई!' : 'Complaint Registered Successfully!'}
            </h1>
            <p className="text-sm text-slate-600 mt-2">
              {lang === 'hi'
                ? 'आपकी नागरिक समस्या संबंधित नगर पालिका क्षेत्रीय कार्यालय को तत्काल निवारण हेतु प्रेषित कर दी गई है।'
                : 'Your grievance has been officially cataloged and dispatched to the designated municipal office.'}
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 max-w-lg mx-auto text-left space-y-3">
            <div>
              <span className="text-xs text-slate-500 font-medium">
                {lang === 'hi' ? 'शिकायत संदर्भ क्रमांक (ट्रैकिंग आईडी):' : 'Complaint Tracking ID:'}
              </span>
              <div className="text-2xl font-mono font-extrabold text-[#E07B2E] tracking-wider mt-0.5">
                {successResult.tracking_id}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500">{lang === 'hi' ? 'संबद्ध विभाग:' : 'Assigned Department:'}</span>
                <div className="font-bold text-slate-800 mt-0.5">{successResult.department_name}</div>
              </div>
              <div>
                <span className="text-slate-500">{lang === 'hi' ? 'क्षेत्रीय वार्ड कार्यालय:' : 'Ward Office:'}</span>
                <div className="font-bold text-slate-800 mt-0.5">{successResult.office_name || 'Central Ward Unit'}</div>
              </div>
              <div>
                <span className="text-slate-500">{lang === 'hi' ? 'कार्यालय संपर्क नंबर:' : 'Helpline Contact:'}</span>
                <div className="font-bold text-blue-700 mt-0.5 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{successResult.office_phone}</span>
                </div>
              </div>
              <div>
                <span className="text-slate-500">{lang === 'hi' ? 'SLA समाधान समय-सीमा:' : 'SLA Resolution Deadline:'}</span>
                <div className="font-bold text-red-700 mt-0.5 flex items-center gap-1 font-mono">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{new Date(successResult.deadline).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href={`/track?id=${successResult.tracking_id}`}
              className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-[#E07B2E] hover:bg-[#c96920] text-white font-semibold text-sm shadow-sm transition-colors"
            >
              {lang === 'hi' ? 'शिकायत की लाइव स्थिति देखें' : 'Track Resolution Progress'}
            </Link>
            <Link
              href="/citizen/dashboard"
              className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-colors"
            >
              {lang === 'hi' ? 'डैशबोर्ड पर लौटें' : 'Back to Citizen Dashboard'}
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Page Title & Intro */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17304F] font-heading">
              {lang === 'hi' ? 'नागरिक समस्या दर्ज करें' : 'Report a Civic Issue'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              {lang === 'hi'
                ? 'अखिल भारतीय स्तर पर नागरिक समस्याओं (सड़क, स्वच्छता, पानी, बिजली) की त्वरित रिपोर्टिंग एवं समाधान।'
                : 'Report civic infrastructure and public service grievances across urban local bodies and rural Panchayats.'}
            </p>
          </div>

          {/* THREE CLEAR MODES SELECTOR */}
          <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-2">
            {/* Mode A: AI Photo Detection */}
            <button
              type="button"
              onClick={() => setMode('ai')}
              className={`p-4 rounded-xl text-left transition-all relative ${
                mode === 'ai'
                  ? 'bg-amber-50/80 border-2 border-[#E07B2E] shadow-sm'
                  : 'hover:bg-slate-50 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div className={`p-2 rounded-lg ${mode === 'ai' ? 'bg-[#E07B2E] text-white' : 'bg-amber-100 text-amber-800'}`}>
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#E07B2E] block">
                    {lang === 'hi' ? 'मोड A — सबसे तेज़' : 'Mode A — Fastest'}
                  </span>
                  <div className="text-sm font-bold text-slate-900 font-heading">
                    {lang === 'hi' ? 'AI से समस्या पहचानें' : 'Report with AI'}
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-500 leading-snug">
                {lang === 'hi'
                  ? 'केवल फोटो खींचें या अपलोड करें। AI समस्या श्रेणी व विवरण स्वतः पहचान लेगा।'
                  : 'Capture or upload a photo first. AI detects the category and details automatically without typing.'}
              </p>
              {mode === 'ai' && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#E07B2E]" />
              )}
            </button>

            {/* Mode B: Manual Entry */}
            <button
              type="button"
              onClick={() => setMode('manual')}
              className={`p-4 rounded-xl text-left transition-all relative ${
                mode === 'manual'
                  ? 'bg-blue-50/80 border-2 border-blue-600 shadow-sm'
                  : 'hover:bg-slate-50 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div className={`p-2 rounded-lg ${mode === 'manual' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800'}`}>
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-blue-700 block">
                    {lang === 'hi' ? 'मोड B — मानक फ़ॉर्म' : 'Mode B — Standard'}
                  </span>
                  <div className="text-sm font-bold text-slate-900 font-heading">
                    {lang === 'hi' ? 'विवरण स्वयं भरें' : 'Enter Details Manually'}
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-500 leading-snug">
                {lang === 'hi'
                  ? 'पारंपरिक फ़ॉर्म। शीर्षक, विस्तृत विवरण, 8 में से श्रेणी और स्थान स्वयं दर्ज करें।'
                  : 'Comprehensive form. Enter title, description, category, and location with optional photo.'}
              </p>
              {mode === 'manual' && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-600" />
              )}
            </button>

            {/* Mode C: AI-Assisted Text and Photo */}
            <button
              type="button"
              onClick={() => setMode('assistant')}
              className={`p-4 rounded-xl text-left transition-all relative ${
                mode === 'assistant'
                  ? 'bg-purple-50/80 border-2 border-purple-600 shadow-sm'
                  : 'hover:bg-slate-50 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div className={`p-2 rounded-lg ${mode === 'assistant' ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-800'}`}>
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-purple-700 block">
                    {lang === 'hi' ? 'मोड C — सहायक' : 'Mode C — Assisted'}
                  </span>
                  <div className="text-sm font-bold text-slate-900 font-heading">
                    {lang === 'hi' ? 'AI सहायक (चित्र + विवरण)' : 'AI-Assisted Text & Photo'}
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-500 leading-snug">
                {lang === 'hi'
                  ? 'संक्षिप्त टिप्पणी या फोटो दें, AI उपयुक्त श्रेणी व सारांश सुझाएगा जिसे आप जांच सकते हैं।'
                  : 'Provide short notes or photo, and let AI assist with classification and category suggestions.'}
              </p>
              {mode === 'assistant' && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-purple-600" />
              )}
            </button>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* ============================================================== */}
          {/* MODE A: AI PHOTO DETECTION INTERFACE                            */}
          {/* ============================================================== */}
          {mode === 'ai' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#E07B2E] text-white">
                    MODE A
                  </span>
                  <h2 className="text-lg font-bold text-slate-900 font-heading">
                    {lang === 'hi' ? 'फोटो द्वारा AI समस्या पहचान' : 'AI Photo Detection & Automatic Classification'}
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {lang === 'hi'
                    ? 'गड्ढे, कचरे, पानी रिसाव या बंद लाइट की फोटो खींचें। आपको शीर्षक या विवरण टाइप करने की आवश्यकता नहीं है।'
                    : 'Upload or capture a photo of the pothole, garbage dump, water leak, or broken streetlight. Writing a description is completely optional.'}
                </p>
              </div>

              {/* Photo Input Buttons */}
              <div className="space-y-4">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  ref={cameraInputRef}
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  ref={fileInputRef}
                  onChange={handlePhotoSelect}
                  className="hidden"
                />

                {!photoPreview ? (
                  <div className="border-2 border-dashed border-amber-300 bg-amber-50/30 rounded-2xl p-8 text-center space-y-4">
                    <div className="w-14 h-14 rounded-full bg-amber-100 text-[#E07B2E] flex items-center justify-center mx-auto">
                      <Camera className="w-7 h-7" />
                    </div>
                    <div>
                      <div className="text-base font-bold text-slate-800">
                        {lang === 'hi' ? 'समस्या की फोटो लें या अपलोड करें' : 'Capture or Upload Civic Problem Photo'}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Supported: JPG, PNG, WebP up to 5MB.
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#E07B2E] hover:bg-[#c96920] text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
                      >
                        <Camera className="w-4 h-4" />
                        <span>{lang === 'hi' ? 'कैमरा खोलें (लाइव फोटो)' : 'Open Camera (Mobile Live)'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
                      >
                        <UploadCloud className="w-4 h-4 text-slate-500" />
                        <span>{lang === 'hi' ? 'गैलरी से फोटो चुनें' : 'Choose from Gallery / Files'}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900 max-h-72 flex items-center justify-center">
                      <img src={photoPreview} alt="Civic problem preview" className="max-h-72 object-contain" />
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoPreview(null);
                          setPhotoUrls([]);
                          setImageAnalysisResult(null);
                        }}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* AI Loading State */}
                    {analyzingImage && (
                      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-3 animate-pulse">
                        <RefreshCw className="w-5 h-5 text-[#E07B2E] animate-spin shrink-0" />
                        <div>
                          <div className="text-xs font-bold text-amber-900">
                            {lang === 'hi' ? 'फोटो का AI विश्लेषण जारी है...' : 'Analyzing photograph with Vision model...'}
                          </div>
                          <div className="text-[11px] text-amber-700 mt-0.5">
                            Extracting civic category, physical hazard elements, and headline...
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Analysis Result Card */}
                    {imageAnalysisResult && !analyzingImage && (
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-[#E07B2E]" />
                            <span>{lang === 'hi' ? 'AI द्वारा पहचानी गई जानकारी' : 'AI Detection Results'}</span>
                          </span>
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                            {imageAnalysisResult.modelProvider}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-slate-500 font-medium">{lang === 'hi' ? 'पहचानी गई श्रेणी:' : 'Suggested Category:'}</span>
                            <div className="mt-1">
                              <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value as CivicCategory)}
                                className="w-full p-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-[#E07B2E]"
                              >
                                {CATEGORIES.map((c) => (
                                  <option key={c.key} value={c.key}>
                                    {lang === 'hi' ? c.labelHi : c.labelEn}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div>
                            <span className="text-slate-500 font-medium">{lang === 'hi' ? 'पहचाने गए तत्व:' : 'Detected Physical Elements:'}</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {imageAnalysisResult.detectedElements.map((el, i) => (
                                <span key={i} className="px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200 text-[10px] font-medium">
                                  {el}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Editable Suggested Title & Optional Description */}
                        <div className="pt-2 border-t border-slate-200 space-y-2">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700">
                              {lang === 'hi' ? 'शीर्षक (आप चाहें तो संपादित कर सकते हैं):' : 'Suggested Title (Editable):'}
                            </label>
                            <input
                              type="text"
                              value={title}
                              onChange={(e) => setTitle(e.target.value)}
                              className="w-full mt-1 p-2 text-xs border border-slate-300 rounded-lg bg-white"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700">
                              {lang === 'hi' ? 'विवरण (वैकल्पिक):' : 'Description (Optional):'}
                            </label>
                            <textarea
                              rows={2}
                              value={description}
                              onChange={(e) => setDescription(e.target.value)}
                              placeholder="Add optional notes if desired..."
                              className="w-full mt-1 p-2 text-xs border border-slate-300 rounded-lg bg-white"
                            />
                          </div>
                        </div>

                        <div className="text-[11px] text-slate-500 bg-white p-2.5 rounded-lg border border-slate-200 flex items-start gap-1.5">
                          <Info className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                          <span>{imageAnalysisResult.analysisNotice}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Pan-India Jurisdiction & Location Section */}
              <JurisdictionLocationPicker
                initialState={jurisdiction.state}
                initialDistrict={jurisdiction.district}
                initialCoords={jurisdiction.coords}
                initialAddress={jurisdiction.address}
                initialLandmark={jurisdiction.landmark}
                onChange={setJurisdiction}
              />

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleSubmitComplaint()}
                  disabled={isSubmitting || analyzingImage || !photoPreview}
                  className="w-full py-3.5 rounded-xl bg-[#E07B2E] hover:bg-[#c96920] text-white font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>
                    {isSubmitting
                      ? (lang === 'hi' ? 'दर्ज की जा रही है...' : 'Submitting Grievance...')
                      : (lang === 'hi' ? 'AI रिपोर्ट सबमिट करें' : 'Submit AI Photo Report')}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* MODE B: MANUAL ENTRY INTERFACE                                  */}
          {/* ============================================================== */}
          {mode === 'manual' && (
            <form onSubmit={(e) => handleSubmitComplaint(e)} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white">
                    MODE B
                  </span>
                  <h2 className="text-lg font-bold text-slate-900 font-heading">
                    {lang === 'hi' ? 'विवरण स्वयं भरें (पारंपरिक फॉर्म)' : 'Manual Civic Issue Entry'}
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {lang === 'hi'
                    ? 'शीर्षक, श्रेणी, विस्तृत विवरण और स्थान दर्ज करें।'
                    : 'Complete civic report with full details, eligible category selection, and optional photos.'}
                </p>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  {lang === 'hi' ? 'समस्या का शीर्षक *' : 'Issue Title / Summary *'}
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Deep pothole causing skidding near Shivaji Park"
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              {/* Category Selector (8 Supported Categories) */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-2">
                  {lang === 'hi' ? 'नागरिक श्रेणी चुनें *' : 'Civic Issue Category *'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      type="button"
                      key={cat.key}
                      onClick={() => setCategory(cat.key)}
                      className={`p-3 rounded-lg text-left text-xs transition-colors border ${
                        category === cat.key
                          ? 'bg-blue-50 border-blue-600 text-blue-900 font-bold'
                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div>{lang === 'hi' ? cat.labelHi : cat.labelEn}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Detailed Description */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  {lang === 'hi' ? 'विस्तृत विवरण *' : 'Detailed Description *'}
                </label>
                <textarea
                  rows={4}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the exact problem, hazard level, and any landmarks..."
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              {/* Photo Evidence (Optional in Manual) */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  {lang === 'hi' ? 'फोटो साक्ष्य (वैकल्पिक)' : 'Photograph Evidence (Optional)'}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {photoPreview && (
                  <div className="mt-2 max-h-40 rounded-lg overflow-hidden border border-slate-200">
                    <img src={photoPreview} alt="Preview" className="max-h-40 object-contain mx-auto" />
                  </div>
                )}
              </div>

              {/* Pan-India Jurisdiction & Location Section */}
              <JurisdictionLocationPicker
                initialState={jurisdiction.state}
                initialDistrict={jurisdiction.district}
                initialCoords={jurisdiction.coords}
                initialAddress={jurisdiction.address}
                initialLandmark={jurisdiction.landmark}
                onChange={setJurisdiction}
              />

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>
                    {isSubmitting
                      ? (lang === 'hi' ? 'दर्ज की जा रही है...' : 'Submitting Complaint...')
                      : (lang === 'hi' ? 'शिकायत सबमिट करें' : 'Submit Manual Complaint')}
                  </span>
                </button>
              </div>
            </form>
          )}

          {/* ============================================================== */}
          {/* MODE C: AI-ASSISTED TEXT AND PHOTO                              */}
          {/* ============================================================== */}
          {mode === 'assistant' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-600 text-white">
                    MODE C
                  </span>
                  <h2 className="text-lg font-bold text-slate-900 font-heading">
                    {lang === 'hi' ? 'AI सहायक (चित्र एवं संक्षिप्त विवरण)' : 'AI-Assisted Text & Photo'}
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {lang === 'hi'
                    ? 'संक्षिप्त टिप्पणी लिखें और फोटो अपलोड करें। AI आपकी समस्या को वर्गीकृत करके उपयुक्त श्रेणी व शीर्षक सुझाएगा।'
                    : 'Provide short notes and an optional photo. AI analyzes the issue and suggests the best civic category and summary for your review.'}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    {lang === 'hi' ? 'समस्या के बारे में कुछ शब्द लिखें:' : 'Brief notes about the issue:'}
                  </label>
                  <textarea
                    rows={3}
                    value={assistantNotes}
                    onChange={(e) => setAssistantNotes(e.target.value)}
                    placeholder="e.g. Broken drainage pipe overflowing into street near vegetable market..."
                    className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    {lang === 'hi' ? 'फोटो अपलोड करें (वैकल्पिक):' : 'Upload Photograph (Optional):'}
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                  />
                  {photoPreview && (
                    <div className="mt-2 max-h-36 rounded-lg overflow-hidden border border-slate-200">
                      <img src={photoPreview} alt="Preview" className="max-h-36 object-contain mx-auto" />
                    </div>
                  )}
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleAssistantAnalyze}
                    disabled={assistantAnalyzing || (!assistantNotes.trim() && !photoPreview)}
                    className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{assistantAnalyzing ? 'Analyzing...' : (lang === 'hi' ? 'AI द्वारा विश्लेषण करें' : 'Analyze & Suggest Category')}</span>
                  </button>
                </div>

                {/* AI Category Suggestion Display */}
                {suggestedCategory && (
                  <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-purple-600" />
                        <span>AI Suggested Category:</span>
                      </span>
                      {aiConfidence && (
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white text-purple-700 font-semibold border border-purple-200">
                          {(aiConfidence * 100).toFixed(0)}% Confidence
                        </span>
                      )}
                    </div>

                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as CivicCategory)}
                      className="w-full p-2 text-xs font-semibold border border-purple-300 rounded-lg bg-white"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c.key} value={c.key}>
                          {lang === 'hi' ? c.labelHi : c.labelEn}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Pan-India Jurisdiction & Location Section */}
              <JurisdictionLocationPicker
                initialState={jurisdiction.state}
                initialDistrict={jurisdiction.district}
                initialCoords={jurisdiction.coords}
                initialAddress={jurisdiction.address}
                initialLandmark={jurisdiction.landmark}
                onChange={setJurisdiction}
              />

              {/* Submit */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleSubmitComplaint()}
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>
                    {isSubmitting
                      ? (lang === 'hi' ? 'दर्ज की जा रही है...' : 'Submitting Complaint...')
                      : (lang === 'hi' ? 'सहायक रिपोर्ट सबमिट करें' : 'Submit AI-Assisted Report')}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Duplicate Alert Modal */}
      {duplicateCandidate && (
        <DuplicateAlertModal
          candidate={duplicateCandidate}
          onSupportExisting={handleSupportExisting}
          onProceedAnyway={() => {
            setDuplicateCandidate(null);
            handleSubmitComplaint(undefined, true);
          }}
          onCancel={() => setDuplicateCandidate(null)}
        />
      )}
    </div>
  );
}

export default function ReportIssuePage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-slate-500">
          <div className="inline-block animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full mb-2" />
          <p className="text-xs">Loading Civic Reporting Interface...</p>
        </div>
      }
    >
      <ReportIssueContent />
    </Suspense>
  );
}
