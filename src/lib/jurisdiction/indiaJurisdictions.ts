import { LocalBodyType } from '@/types';

export interface StateUT {
  code: string;
  name: string;
  name_hi: string;
  type: 'STATE' | 'UT';
  capital: string;
  centerCoordinates: { lat: number; lng: number };
}

export interface DistrictData {
  name: string;
  name_hi: string;
  stateCode: string;
  centerCoordinates: { lat: number; lng: number };
}

export interface LocalBodyData {
  name: string;
  name_hi: string;
  stateCode: string;
  district: string;
  type: LocalBodyType;
  jurisdictionCategory: 'URBAN' | 'RURAL';
  lgdCode: string;
  wardsOrVillages: string[];
}

// All 28 States & 8 Union Territories of India
export const INDIAN_STATES_AND_UTS: StateUT[] = [
  // States
  { code: 'AP', name: 'Andhra Pradesh', name_hi: 'आंध्र प्रदेश', type: 'STATE', capital: 'Amaravati', centerCoordinates: { lat: 15.9129, lng: 79.7400 } },
  { code: 'AR', name: 'Arunachal Pradesh', name_hi: 'अरुणाचल प्रदेश', type: 'STATE', capital: 'Itanagar', centerCoordinates: { lat: 28.2180, lng: 94.7278 } },
  { code: 'AS', name: 'Assam', name_hi: 'असम', type: 'STATE', capital: 'Dispur', centerCoordinates: { lat: 26.2006, lng: 92.9376 } },
  { code: 'BR', name: 'Bihar', name_hi: 'बिहार', type: 'STATE', capital: 'Patna', centerCoordinates: { lat: 25.0961, lng: 85.3131 } },
  { code: 'CG', name: 'Chhattisgarh', name_hi: 'छत्तीसगढ़', type: 'STATE', capital: 'Raipur', centerCoordinates: { lat: 21.2787, lng: 81.8661 } },
  { code: 'GA', name: 'Goa', name_hi: 'गोवा', type: 'STATE', capital: 'Panaji', centerCoordinates: { lat: 15.2993, lng: 74.1240 } },
  { code: 'GJ', name: 'Gujarat', name_hi: 'गुजरात', type: 'STATE', capital: 'Gandhinagar', centerCoordinates: { lat: 22.2587, lng: 71.1924 } },
  { code: 'HR', name: 'Haryana', name_hi: 'हरियाणा', type: 'STATE', capital: 'Chandigarh', centerCoordinates: { lat: 29.0588, lng: 76.0856 } },
  { code: 'HP', name: 'Himachal Pradesh', name_hi: 'हिमाचल प्रदेश', type: 'STATE', capital: 'Shimla', centerCoordinates: { lat: 31.1048, lng: 77.1734 } },
  { code: 'JH', name: 'Jharkhand', name_hi: 'झारखंड', type: 'STATE', capital: 'Ranchi', centerCoordinates: { lat: 23.6102, lng: 85.2799 } },
  { code: 'KA', name: 'Karnataka', name_hi: 'कर्नाटक', type: 'STATE', capital: 'Bengaluru', centerCoordinates: { lat: 15.3173, lng: 75.7139 } },
  { code: 'KL', name: 'Kerala', name_hi: 'केरल', type: 'STATE', capital: 'Thiruvananthapuram', centerCoordinates: { lat: 10.8505, lng: 76.2711 } },
  { code: 'MP', name: 'Madhya Pradesh', name_hi: 'मध्य प्रदेश', type: 'STATE', capital: 'Bhopal', centerCoordinates: { lat: 22.9734, lng: 78.6569 } },
  { code: 'MH', name: 'Maharashtra', name_hi: 'महाराष्ट्र', type: 'STATE', capital: 'Mumbai', centerCoordinates: { lat: 19.7515, lng: 75.7139 } },
  { code: 'MN', name: 'Manipur', name_hi: 'मणिपुर', type: 'STATE', capital: 'Imphal', centerCoordinates: { lat: 24.6637, lng: 93.9063 } },
  { code: 'ML', name: 'Meghalaya', name_hi: 'मेघालय', type: 'STATE', capital: 'Shillong', centerCoordinates: { lat: 25.4670, lng: 91.3662 } },
  { code: 'MZ', name: 'Mizoram', name_hi: 'मिज़ोरम', type: 'STATE', capital: 'Aizawl', centerCoordinates: { lat: 23.1645, lng: 92.9376 } },
  { code: 'NL', name: 'Nagaland', name_hi: 'नागालैंड', type: 'STATE', capital: 'Kohima', centerCoordinates: { lat: 26.1584, lng: 94.5624 } },
  { code: 'OD', name: 'Odisha', name_hi: 'ओडिशा', type: 'STATE', capital: 'Bhubaneswar', centerCoordinates: { lat: 20.9517, lng: 85.0985 } },
  { code: 'PB', name: 'Punjab', name_hi: 'पंजाब', type: 'STATE', capital: 'Chandigarh', centerCoordinates: { lat: 31.1471, lng: 75.3412 } },
  { code: 'RJ', name: 'Rajasthan', name_hi: 'राजस्थान', type: 'STATE', capital: 'Jaipur', centerCoordinates: { lat: 27.0238, lng: 74.2179 } },
  { code: 'SK', name: 'Sikkim', name_hi: 'सिक्किम', type: 'STATE', capital: 'Gangtok', centerCoordinates: { lat: 27.5330, lng: 88.5122 } },
  { code: 'TN', name: 'Tamil Nadu', name_hi: 'तमिलनाडु', type: 'STATE', capital: 'Chennai', centerCoordinates: { lat: 11.1271, lng: 78.6569 } },
  { code: 'TG', name: 'Telangana', name_hi: 'तेलंगाना', type: 'STATE', capital: 'Hyderabad', centerCoordinates: { lat: 18.1124, lng: 79.0193 } },
  { code: 'TR', name: 'Tripura', name_hi: 'त्रिपुरा', type: 'STATE', capital: 'Agartala', centerCoordinates: { lat: 23.9408, lng: 91.9882 } },
  { code: 'UP', name: 'Uttar Pradesh', name_hi: 'उत्तर प्रदेश', type: 'STATE', capital: 'Lucknow', centerCoordinates: { lat: 26.8467, lng: 80.9462 } },
  { code: 'UK', name: 'Uttarakhand', name_hi: 'उत्तराखंड', type: 'STATE', capital: 'Dehradun', centerCoordinates: { lat: 30.0668, lng: 79.0193 } },
  { code: 'WB', name: 'West Bengal', name_hi: 'पश्चिम बंगाल', type: 'STATE', capital: 'Kolkata', centerCoordinates: { lat: 22.9868, lng: 87.8550 } },

  // Union Territories
  { code: 'AN', name: 'Andaman and Nicobar Islands', name_hi: 'अंडमान और निकोबार द्वीप समूह', type: 'UT', capital: 'Port Blair', centerCoordinates: { lat: 11.7401, lng: 92.6586 } },
  { code: 'CH', name: 'Chandigarh', name_hi: 'चंडीगढ़', type: 'UT', capital: 'Chandigarh', centerCoordinates: { lat: 30.7333, lng: 76.7794 } },
  { code: 'DN', name: 'Dadra & Nagar Haveli and Daman & Diu', name_hi: 'दादरा और नगर हवेली तथा दमन और दीव', type: 'UT', capital: 'Daman', centerCoordinates: { lat: 20.4283, lng: 72.8397 } },
  { code: 'DL', name: 'Delhi (NCT)', name_hi: 'दिल्ली राष्ट्रीय राजधानी क्षेत्र', type: 'UT', capital: 'New Delhi', centerCoordinates: { lat: 28.6139, lng: 77.2090 } },
  { code: 'JK', name: 'Jammu and Kashmir', name_hi: 'जम्मू और कश्मीर', type: 'UT', capital: 'Srinagar/Jammu', centerCoordinates: { lat: 33.7782, lng: 76.5762 } },
  { code: 'LA', name: 'Ladakh', name_hi: 'लद्दाख', type: 'UT', capital: 'Leh', centerCoordinates: { lat: 34.1526, lng: 77.5771 } },
  { code: 'LD', name: 'Lakshadweep', name_hi: 'लक्षद्वीप', type: 'UT', capital: 'Kavaratti', centerCoordinates: { lat: 10.5667, lng: 72.6417 } },
  { code: 'PY', name: 'Puducherry', name_hi: 'पुडुचेरी', type: 'UT', capital: 'Puducherry', centerCoordinates: { lat: 11.9416, lng: 79.8083 } },
];

// Configurable Multi-State District Catalog (supports state-by-state directory onboarding)
export const DISTRICTS_CATALOG: DistrictData[] = [
  // Maharashtra
  { name: 'Pune', name_hi: 'पुणे', stateCode: 'MH', centerCoordinates: { lat: 18.5204, lng: 73.8567 } },
  { name: 'Mumbai Suburban', name_hi: 'मुंबई उपनगर', stateCode: 'MH', centerCoordinates: { lat: 19.1136, lng: 72.8697 } },
  { name: 'Nagpur', name_hi: 'नागपुर', stateCode: 'MH', centerCoordinates: { lat: 21.1458, lng: 79.0882 } },
  { name: 'Thane', name_hi: 'ठाणे', stateCode: 'MH', centerCoordinates: { lat: 19.2183, lng: 72.9781 } },
  { name: 'Nashik', name_hi: 'नाशिक', stateCode: 'MH', centerCoordinates: { lat: 19.9975, lng: 73.7898 } },

  // Karnataka
  { name: 'Bengaluru Urban', name_hi: 'बेंगलुरु शहरी', stateCode: 'KA', centerCoordinates: { lat: 12.9716, lng: 77.5946 } },
  { name: 'Mysuru', name_hi: 'मैसूरु', stateCode: 'KA', centerCoordinates: { lat: 12.2958, lng: 76.6394 } },
  { name: 'Dharwad', name_hi: 'धारवाड़', stateCode: 'KA', centerCoordinates: { lat: 15.4589, lng: 75.0078 } },

  // Delhi (NCT)
  { name: 'New Delhi', name_hi: 'नई दिल्ली', stateCode: 'DL', centerCoordinates: { lat: 28.6139, lng: 77.2090 } },
  { name: 'South Delhi', name_hi: 'दक्षिण दिल्ली', stateCode: 'DL', centerCoordinates: { lat: 28.4817, lng: 77.1873 } },
  { name: 'Central Delhi', name_hi: 'मध्य दिल्ली', stateCode: 'DL', centerCoordinates: { lat: 28.6448, lng: 77.2167 } },

  // Tamil Nadu
  { name: 'Chennai', name_hi: 'चेन्नई', stateCode: 'TN', centerCoordinates: { lat: 13.0827, lng: 80.2707 } },
  { name: 'Coimbatore', name_hi: 'कोयंबटूर', stateCode: 'TN', centerCoordinates: { lat: 11.0168, lng: 76.9558 } },

  // Uttar Pradesh
  { name: 'Lucknow', name_hi: 'लखनऊ', stateCode: 'UP', centerCoordinates: { lat: 26.8467, lng: 80.9462 } },
  { name: 'Gautam Buddha Nagar (Noida)', name_hi: 'गौतम बुद्ध नगर (नोएडा)', stateCode: 'UP', centerCoordinates: { lat: 28.5355, lng: 77.3910 } },
  { name: 'Varanasi', name_hi: 'वाराणसी', stateCode: 'UP', centerCoordinates: { lat: 25.3176, lng: 82.9739 } },

  // Gujarat
  { name: 'Ahmedabad', name_hi: 'अहमदाबाद', stateCode: 'GJ', centerCoordinates: { lat: 23.0225, lng: 72.5714 } },
  { name: 'Surat', name_hi: 'सूरत', stateCode: 'GJ', centerCoordinates: { lat: 21.1702, lng: 72.8311 } },

  // West Bengal
  { name: 'Kolkata', name_hi: 'कोलकाता', stateCode: 'WB', centerCoordinates: { lat: 22.5726, lng: 88.3639 } },
  { name: 'North 24 Parganas', name_hi: 'उत्तर 24 परगना', stateCode: 'WB', centerCoordinates: { lat: 22.7210, lng: 88.4820 } },

  // Rajasthan
  { name: 'Jaipur', name_hi: 'जयपुर', stateCode: 'RJ', centerCoordinates: { lat: 26.9124, lng: 75.7873 } },
  { name: 'Jodhpur', name_hi: 'जोधपुर', stateCode: 'RJ', centerCoordinates: { lat: 26.2389, lng: 73.0243 } },

  // Kerala
  { name: 'Ernakulam (Kochi)', name_hi: 'एर्नाकुलम (कोच्चि)', stateCode: 'KL', centerCoordinates: { lat: 9.9816, lng: 76.2999 } },
  { name: 'Thiruvananthapuram', name_hi: 'तिरुवनंतपुरम', stateCode: 'KL', centerCoordinates: { lat: 8.5241, lng: 76.9366 } },

  // Madhya Pradesh
  { name: 'Indore', name_hi: 'इंदौर', stateCode: 'MP', centerCoordinates: { lat: 22.7196, lng: 75.8577 } },
  { name: 'Bhopal', name_hi: 'भोपाल', stateCode: 'MP', centerCoordinates: { lat: 23.2599, lng: 77.4126 } },
];

// Multi-Tier Urban & Rural Local Bodies Catalog with LGD Reference Codes
export const LOCAL_BODIES_CATALOG: LocalBodyData[] = [
  // Maharashtra - Urban & Rural Local Bodies
  {
    name: 'Pune Municipal Corporation',
    name_hi: 'पुणे महानगरपालिका',
    stateCode: 'MH',
    district: 'Pune',
    type: 'MUNICIPAL_CORPORATION',
    jurisdictionCategory: 'URBAN',
    lgdCode: 'LGD-ULB-251142',
    wardsOrVillages: ['Ward 1 - Kalas-Dhanori', 'Ward 2 - Aundh-Baner', 'Ward 8 - Shivajinagar-Ghole Rd', 'Ward 12 - Kothrud-Bavdhan', 'Ward 15 - Hadapsar-Mundhwa'],
  },
  {
    name: 'Haveli Taluka Gram Panchayat Cluster',
    name_hi: 'हवेली तालुका ग्राम पंचायत समूह',
    stateCode: 'MH',
    district: 'Pune',
    type: 'GRAM_PANCHAYAT',
    jurisdictionCategory: 'RURAL',
    lgdCode: 'LGD-RLB-184520',
    wardsOrVillages: ['Gram Panchayat Wagholi', 'Gram Panchayat Uruli Kanchan', 'Gram Panchayat Manjari Budruk', 'Gram Panchayat Khadakwasla'],
  },
  {
    name: 'Brihanmumbai Municipal Corporation (BMC)',
    name_hi: 'बृहन्मुंबई महानगरपालिका',
    stateCode: 'MH',
    district: 'Mumbai Suburban',
    type: 'MUNICIPAL_CORPORATION',
    jurisdictionCategory: 'URBAN',
    lgdCode: 'LGD-ULB-251140',
    wardsOrVillages: ['Ward K/East - Andheri East', 'Ward H/West - Bandra West', 'Ward P/North - Malad', 'Ward R/South - Kandivali'],
  },
  {
    name: 'Nagpur Municipal Corporation',
    name_hi: 'नागपुर महानगरपालिका',
    stateCode: 'MH',
    district: 'Nagpur',
    type: 'MUNICIPAL_CORPORATION',
    jurisdictionCategory: 'URBAN',
    lgdCode: 'LGD-ULB-251144',
    wardsOrVillages: ['Dharampeth Zone 2', 'Hanuman Nagar Zone 3', 'Nehru Nagar Zone 5', 'Mangalwari Zone 10'],
  },

  // Karnataka - Urban & Rural
  {
    name: 'Bruhat Bengaluru Mahanagara Palike (BBMP)',
    name_hi: 'बृहत बेंगलुरु महानगर पालिके',
    stateCode: 'KA',
    district: 'Bengaluru Urban',
    type: 'MUNICIPAL_CORPORATION',
    lgdCode: 'LGD-ULB-251301',
    jurisdictionCategory: 'URBAN',
    wardsOrVillages: ['Ward 150 - Bellandur', 'Ward 174 - HSR Layout', 'Ward 112 - Domlur', 'Ward 81 - Vasanth Nagar'],
  },
  {
    name: 'Anekal Taluk Panchayat',
    name_hi: 'अनेकल तालुक पंचायत',
    stateCode: 'KA',
    district: 'Bengaluru Urban',
    type: 'BLOCK_PANCHAYAT',
    lgdCode: 'LGD-RLB-212450',
    jurisdictionCategory: 'RURAL',
    wardsOrVillages: ['Sarjapura Gram Panchayat', 'Attibele Gram Panchayat', 'Jigani Rural Unit'],
  },

  // Delhi (NCT)
  {
    name: 'Municipal Corporation of Delhi (MCD)',
    name_hi: 'दिल्ली नगर निगम',
    stateCode: 'DL',
    district: 'New Delhi',
    type: 'MUNICIPAL_CORPORATION',
    lgdCode: 'LGD-ULB-275101',
    jurisdictionCategory: 'URBAN',
    wardsOrVillages: ['Civil Lines Zone', 'Rohini Zone', 'South Zone - Saket', 'Central Zone - Lajpat Nagar'],
  },
  {
    name: 'New Delhi Municipal Council (NDMC)',
    name_hi: 'नई दिल्ली नगरपालिका परिषद',
    stateCode: 'DL',
    district: 'New Delhi',
    type: 'MUNICIPALITY',
    lgdCode: 'LGD-ULB-275102',
    jurisdictionCategory: 'URBAN',
    wardsOrVillages: ['Connaught Place Circle', 'Chanakyapuri Circle', 'Barakhamba Circle'],
  },

  // Tamil Nadu
  {
    name: 'Greater Chennai Corporation',
    name_hi: 'ग्रेटर चेन्नई कॉर्पोरेशन',
    stateCode: 'TN',
    district: 'Chennai',
    type: 'MUNICIPAL_CORPORATION',
    lgdCode: 'LGD-ULB-252101',
    jurisdictionCategory: 'URBAN',
    wardsOrVillages: ['Zone 5 - Royapuram', 'Zone 9 - Teynampet', 'Zone 13 - Adyar', 'Zone 14 - Perungudi'],
  },

  // Uttar Pradesh
  {
    name: 'Lucknow Municipal Corporation (LMC)',
    name_hi: 'लखनऊ नगर निगम',
    stateCode: 'UP',
    district: 'Lucknow',
    type: 'MUNICIPAL_CORPORATION',
    lgdCode: 'LGD-ULB-254101',
    jurisdictionCategory: 'URBAN',
    wardsOrVillages: ['Zone 1 - Hazratganj', 'Zone 3 - Aliganj', 'Zone 5 - Gomti Nagar', 'Zone 8 - Indiranagar'],
  },
  {
    name: 'Noida Authority (New Okhla Industrial Dev Authority)',
    name_hi: 'नोएडा प्राधिकरण',
    stateCode: 'UP',
    district: 'Gautam Buddha Nagar (Noida)',
    type: 'MUNICIPALITY',
    lgdCode: 'LGD-ULB-254180',
    jurisdictionCategory: 'URBAN',
    wardsOrVillages: ['Sector 18 Commercial', 'Sector 62 Institutional', 'Sector 137 Residential', 'Sector 50'],
  },

  // Gujarat
  {
    name: 'Amdavad Municipal Corporation (AMC)',
    name_hi: 'अमदावाद महानगर पालिका',
    stateCode: 'GJ',
    district: 'Ahmedabad',
    type: 'MUNICIPAL_CORPORATION',
    lgdCode: 'LGD-ULB-250101',
    jurisdictionCategory: 'URBAN',
    wardsOrVillages: ['West Zone - Navrangpura', 'North West Zone - Bodakdev', 'South Zone - Maninagar', 'Central Zone - Khadia'],
  },

  // West Bengal
  {
    name: 'Kolkata Municipal Corporation (KMC)',
    name_hi: 'कोलकाता नगर निगम',
    stateCode: 'WB',
    district: 'Kolkata',
    type: 'MUNICIPAL_CORPORATION',
    lgdCode: 'LGD-ULB-255101',
    jurisdictionCategory: 'URBAN',
    wardsOrVillages: ['Borough VII - Park Circus', 'Borough VIII - Ballygunge', 'Borough IX - Alipore', 'Borough X - Tollygunge'],
  },
];

// Query helper utilities
export function getAllStatesAndUTs(): StateUT[] {
  return INDIAN_STATES_AND_UTS;
}

export function getStateByCode(code: string): StateUT | undefined {
  return INDIAN_STATES_AND_UTS.find((s) => s.code.toUpperCase() === code.toUpperCase());
}

export function getStateByName(name: string): StateUT | undefined {
  return INDIAN_STATES_AND_UTS.find(
    (s) => s.name.toLowerCase() === name.toLowerCase() || s.name_hi === name
  );
}

export function getDistrictsForState(stateCodeOrName: string): DistrictData[] {
  const state =
    getStateByCode(stateCodeOrName) || getStateByName(stateCodeOrName);
  const code = state ? state.code : stateCodeOrName.toUpperCase();
  return DISTRICTS_CATALOG.filter((d) => d.stateCode === code);
}

export function getLocalBodies(
  districtName: string,
  category?: 'URBAN' | 'RURAL'
): LocalBodyData[] {
  return LOCAL_BODIES_CATALOG.filter((b) => {
    const matchesDistrict = b.district.toLowerCase() === districtName.toLowerCase();
    if (!matchesDistrict) return false;
    if (category) return b.jurisdictionCategory === category;
    return true;
  });
}

export function getLocalBodyByName(name: string): LocalBodyData | undefined {
  return LOCAL_BODIES_CATALOG.find(
    (b) => b.name.toLowerCase() === name.toLowerCase() || b.name_hi === name
  );
}

export function resolveCoordinatesForStateOrDistrict(
  stateName?: string,
  districtName?: string
): { lat: number; lng: number } {
  if (districtName) {
    const dist = DISTRICTS_CATALOG.find(
      (d) => d.name.toLowerCase() === districtName.toLowerCase()
    );
    if (dist) return dist.centerCoordinates;
  }
  if (stateName) {
    const st = getStateByName(stateName) || getStateByCode(stateName);
    if (st) return st.centerCoordinates;
  }
  // Pan-India geographic midpoint (near Nagpur, Maharashtra)
  return { lat: 21.1458, lng: 79.0882 };
}
