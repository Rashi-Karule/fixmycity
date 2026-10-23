'use client';

import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Compass,
  Building,
  Navigation,
  Info,
  CheckCircle2,
} from 'lucide-react';
import CivicMap from '@/components/maps/CivicMap';
import {
  INDIAN_STATES_AND_UTS,
  getDistrictsForState,
  getLocalBodies,
  resolveCoordinatesForStateOrDistrict,
} from '@/lib/jurisdiction/indiaJurisdictions';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export interface JurisdictionSelection {
  state: string;
  district: string;
  jurisdictionType: 'URBAN' | 'RURAL';
  localBodyName: string;
  lgdCode: string;
  wardOrVillage: string;
  address: string;
  landmark: string;
  coords: { lat: number; lng: number };
}

interface JurisdictionLocationPickerProps {
  initialState?: string;
  initialDistrict?: string;
  initialCoords?: { lat: number; lng: number };
  initialAddress?: string;
  initialLandmark?: string;
  onChange: (data: JurisdictionSelection) => void;
}

export default function JurisdictionLocationPicker({
  initialState = '',
  initialDistrict = '',
  initialCoords = { lat: 20.5937, lng: 78.9629 },
  initialAddress = '',
  initialLandmark = '',
  onChange,
}: JurisdictionLocationPickerProps) {
  const { lang } = useLanguage();

  const [state, setState] = useState(initialState);
  const [district, setDistrict] = useState(initialDistrict);
  const [jurisdictionType, setJurisdictionType] = useState<'URBAN' | 'RURAL'>('URBAN');
  const [localBodyName, setLocalBodyName] = useState(
    initialDistrict ? (initialDistrict === 'Pune' ? 'Pune Municipal Corporation' : `${initialDistrict} Municipal Corporation`) : ''
  );
  const [lgdCode, setLgdCode] = useState(initialDistrict ? 'LGD-ULB-GEN' : '');
  const [wardOrVillage, setWardOrVillage] = useState(initialDistrict ? 'Ward 1' : '');
  const [address, setAddress] = useState(initialAddress);
  const [landmark, setLandmark] = useState(initialLandmark);
  const [coords, setCoords] = useState(initialCoords);
  const [isLocating, setIsLocating] = useState(false);
  const [gpsDetected, setGpsDetected] = useState(false);

  // Available options derived dynamically
  const districts = getDistrictsForState(state);
  const localBodies = getLocalBodies(district, jurisdictionType);

  // Whenever state changes, update available districts
  const handleStateChange = (newState: string) => {
    setState(newState);
    const newDistricts = getDistrictsForState(newState);
    const nextDistrict = newDistricts.length > 0 ? newDistricts[0].name : '';
    setDistrict(nextDistrict);

    const newLocalBodies = getLocalBodies(nextDistrict, jurisdictionType);
    if (newLocalBodies.length > 0) {
      setLocalBodyName(newLocalBodies[0].name);
      setLgdCode(newLocalBodies[0].lgdCode);
      setWardOrVillage(newLocalBodies[0].wardsOrVillages[0] || 'Unit 1');
    } else {
      setLocalBodyName(`${nextDistrict} Civic Authority`);
      setLgdCode('LGD-PENDING');
      setWardOrVillage('Ward 1');
    }

    const newCenter = resolveCoordinatesForStateOrDistrict(newState, nextDistrict);
    setCoords(newCenter);
  };

  // Whenever district changes, update local bodies
  const handleDistrictChange = (newDistrict: string) => {
    setDistrict(newDistrict);
    const newLocalBodies = getLocalBodies(newDistrict, jurisdictionType);
    if (newLocalBodies.length > 0) {
      setLocalBodyName(newLocalBodies[0].name);
      setLgdCode(newLocalBodies[0].lgdCode);
      setWardOrVillage(newLocalBodies[0].wardsOrVillages[0] || 'Unit 1');
    } else {
      setLocalBodyName(`${newDistrict} Civic Authority`);
      setLgdCode('LGD-PENDING');
      setWardOrVillage('Ward 1');
    }

    const newCenter = resolveCoordinatesForStateOrDistrict(state, newDistrict);
    setCoords(newCenter);
  };

  // Whenever local body changes
  const handleLocalBodyChange = (name: string) => {
    setLocalBodyName(name);
    const found = localBodies.find((b) => b.name === name);
    if (found) {
      setLgdCode(found.lgdCode);
      setWardOrVillage(found.wardsOrVillages[0] || 'Unit 1');
    }
  };

  // Propagate changes to parent
  useEffect(() => {
    onChange({
      state,
      district,
      jurisdictionType,
      localBodyName,
      lgdCode,
      wardOrVillage,
      address,
      landmark,
      coords,
    });
  }, [state, district, jurisdictionType, localBodyName, lgdCode, wardOrVillage, address, landmark, coords]);

  // Geolocation Detection with clear consent & privacy notice
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(newCoords);
        setGpsDetected(true);
        if (!address) {
          setAddress(`GPS Lat: ${pos.coords.latitude.toFixed(4)}, Lon: ${pos.coords.longitude.toFixed(4)}`);
        }
        setIsLocating(false);
      },
      (err) => {
        console.warn('Geolocation unavailable:', err.message);
        setIsLocating(false);
        alert(
          'Location permission denied or unavailable. You can choose your State/District and click on the map to pinpoint exact location.'
        );
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="space-y-4 bg-slate-50/70 border border-slate-200 p-4 sm:p-5 rounded-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
        <div>
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5 font-heading">
            <Building className="w-4 h-4 text-[#E07B2E]" />
            <span>{lang === 'hi' ? 'अखिल भारतीय प्रशासनिक अधिकार क्षेत्र चयन' : 'Pan-India Public Jurisdiction & Location'}</span>
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {lang === 'hi'
              ? 'शिकायत को सही स्थानीय निकाय (नगर पालिका या ग्राम पंचायत) तक पहुंचाने हेतु अधिकार क्षेत्र चुनें:'
              : 'Select your administrative jurisdiction (Urban Local Body or Rural Panchayat) for accurate dispatch:'}
          </p>
        </div>

        {/* GPS Location Button */}
        <button
          type="button"
          onClick={handleDetectLocation}
          disabled={isLocating}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 transition-colors shadow-2xs shrink-0 self-start sm:self-auto"
        >
          <Navigation className={`w-3.5 h-3.5 text-blue-600 ${isLocating ? 'animate-spin' : ''}`} />
          <span>{isLocating ? 'Detecting GPS...' : (lang === 'hi' ? 'वर्तमान GPS स्थान' : 'Use Current GPS')}</span>
        </button>
      </div>

      {/* GPS Consent notice */}
      <div className="flex items-start gap-2 bg-blue-50/60 border border-blue-100 p-2.5 rounded-xl text-[11px] text-blue-900">
        <Info className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
        <span>
          <strong>{lang === 'hi' ? 'गोपनीयता सूचना:' : 'Location Purpose:'}</strong>{' '}
          {lang === 'hi'
            ? 'स्थान डेटा का उपयोग केवल समस्या को निकटतम अधिकृत स्थानीय कार्यालय तक रूट करने और नागरिक मानचित्र पर प्रदर्शित करने हेतु किया जाता है।'
            : 'Location access is used solely to pinpoint the defect on civic maps and route directly to the nearest responsible local government authority.'}
        </span>
      </div>

      {/* Grid: 4-Tier Jurisdiction Hierarchy */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Tier 1: State / UT */}
        <div>
          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
            {lang === 'hi' ? 'राज्य / केंद्र शासित प्रदेश' : 'State / Union Territory'} *
          </label>
          <select
            value={state}
            onChange={(e) => handleStateChange(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs bg-white rounded-lg border border-slate-300 focus:outline-hidden focus:border-[#E07B2E]"
          >
            <option value="">{lang === 'hi' ? '-- राज्य / केंद्र शासित प्रदेश चुनें --' : '-- Select State / UT --'}</option>
            {INDIAN_STATES_AND_UTS.map((st) => (
              <option key={st.code} value={st.name}>
                {lang === 'hi' ? `${st.name_hi} (${st.name})` : st.name}
              </option>
            ))}
          </select>
        </div>

        {/* Tier 2: District */}
        <div>
          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
            {lang === 'hi' ? 'ज़िला / District' : 'District'} *
          </label>
          <select
            value={district}
            onChange={(e) => handleDistrictChange(e.target.value)}
            disabled={!state}
            className="w-full px-2.5 py-1.5 text-xs bg-white rounded-lg border border-slate-300 focus:outline-hidden focus:border-[#E07B2E] disabled:bg-slate-100 disabled:text-slate-400"
          >
            <option value="">
              {state
                ? (lang === 'hi' ? '-- ज़िला चुनें --' : '-- Select District --')
                : (lang === 'hi' ? '-- पहले राज्य चुनें --' : '-- Select State First --')}
            </option>
            {districts.map((d) => (
              <option key={d.name} value={d.name}>
                {lang === 'hi' ? `${d.name_hi} (${d.name})` : d.name}
              </option>
            ))}
          </select>
        </div>

        {/* Tier 3: Urban vs Rural Selection */}
        <div>
          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
            {lang === 'hi' ? 'प्रशासनिक निकाय प्रकार' : 'Local Body Type'} *
          </label>
          <div className="grid grid-cols-2 gap-1 bg-slate-200/60 p-0.5 rounded-lg text-[11px] font-semibold">
            <button
              type="button"
              onClick={() => {
                setJurisdictionType('URBAN');
                const newBodies = getLocalBodies(district, 'URBAN');
                if (newBodies.length > 0) {
                  setLocalBodyName(newBodies[0].name);
                  setLgdCode(newBodies[0].lgdCode);
                }
              }}
              className={`py-1 text-center rounded transition-colors ${
                jurisdictionType === 'URBAN' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600'
              }`}
            >
              {lang === 'hi' ? 'शहरी (नगर निगम)' : 'Urban (ULB)'}
            </button>
            <button
              type="button"
              onClick={() => {
                setJurisdictionType('RURAL');
                const newBodies = getLocalBodies(district, 'RURAL');
                if (newBodies.length > 0) {
                  setLocalBodyName(newBodies[0].name);
                  setLgdCode(newBodies[0].lgdCode);
                }
              }}
              className={`py-1 text-center rounded transition-colors ${
                jurisdictionType === 'RURAL' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600'
              }`}
            >
              {lang === 'hi' ? 'ग्रामीण (पंचायत)' : 'Rural (Panchayat)'}
            </button>
          </div>
        </div>

        {/* Tier 4: Local Body Name (with LGD Tag) */}
        <div>
          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>{jurisdictionType === 'URBAN' ? 'Municipal Body' : 'Panchayat Unit'} *</span>
            <span className="text-[10px] font-mono text-[#E07B2E]">{lgdCode}</span>
          </label>
          <select
            value={localBodyName}
            onChange={(e) => handleLocalBodyChange(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs bg-white rounded-lg border border-slate-300 focus:outline-hidden focus:border-[#E07B2E]"
          >
            {localBodies.length > 0 ? (
              localBodies.map((b) => (
                <option key={b.name} value={b.name}>
                  {b.name}
                </option>
              ))
            ) : (
              <option value={`${district} Local Administration`}>
                {`${district} Local Administration`}
              </option>
            )}
          </select>
        </div>
      </div>

      {/* Street Address and Landmark Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <div>
          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
            {lang === 'hi' ? 'सड़क का पता / मोहल्ला / गांव' : 'Street Address / Locality / Village'} *
          </label>
          <input
            type="text"
            required
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder={
              jurisdictionType === 'URBAN'
                ? 'e.g., Near City Center, Main Road'
                : 'e.g., Near Gram Panchayat Bhavan, Main Chowk'
            }
            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:border-[#E07B2E]"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
            {lang === 'hi' ? 'निकटतम प्रमुख स्थल (Landmark)' : 'Nearby Landmark'}
          </label>
          <input
            type="text"
            value={landmark}
            onChange={(e) => setLandmark(e.target.value)}
            placeholder="e.g., Opposite Primary Health Center / High School Gate"
            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:border-[#E07B2E]"
          />
        </div>
      </div>

      {/* Interactive Map Pinning */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-slate-600">
          <span className="flex items-center gap-1 font-semibold">
            <Compass className="w-3.5 h-3.5 text-[#E07B2E]" />
            <span>{lang === 'hi' ? 'मानचित्र पर सटीक पिन लगाएं (क्लिक करें):' : 'Click Map to Adjust Exact Defect Pinpoint:'}</span>
          </span>
          <span className="font-mono text-[11px] text-slate-500">
            {coords.lat.toFixed(4)}°N, {coords.lng.toFixed(4)}°E
          </span>
        </div>

        <div className="rounded-xl overflow-hidden border border-slate-200">
          <CivicMap
            center={[coords.lat, coords.lng]}
            zoom={coords.lat === 20.5937 ? 5 : 14}
            selectedLocation={coords}
            onLocationSelect={(newCoords) => {
              setCoords(newCoords);
              if (!address) {
                setAddress(`Pinned Lat: ${newCoords.lat.toFixed(4)}, Lon: ${newCoords.lng.toFixed(4)}`);
              }
            }}
            height="220px"
          />
        </div>
      </div>
    </div>
  );
}
