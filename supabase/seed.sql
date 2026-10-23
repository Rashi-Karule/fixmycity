-- ==============================================================================
-- FixMyCity: Seed Data for Prototype Demonstration & Testing
-- Sample Multi-Jurisdiction Civic Administration Data (Synthetic Test Records)
-- ==============================================================================

-- Priority Policies
INSERT INTO priority_policies (id, priority_level, label, label_hi, duration_hours, description)
VALUES
('policy-intermediate', 'INTERMEDIATE', 'Intermediate Priority', 'उच्च प्राथमिकता', 24, 'Hazardous situations, water main bursts, road sinkholes, live electric wires.'),
('policy-moderate', 'MODERATE', 'Moderate Priority', 'मध्यम प्राथमिकता', 72, 'Community garbage accumulation, dark streetlights, drainage blockage.'),
('policy-standard', 'STANDARD', 'Standard Priority', 'सामान्य प्राथमिकता', 168, 'Routine pothole repair, pavement leveling, municipal sign replacements.')
ON CONFLICT (priority_level) DO UPDATE SET duration_hours = EXCLUDED.duration_hours;

-- Departments
INSERT INTO departments (id, code, name, name_hi, description, categories, contact_email, helpline, active)
VALUES
(
  'd1000000-0000-0000-0000-000000000001',
  'DEPT-ROADS',
  'Public Works & Roads Infrastructure Dept',
  'लोक निर्माण एवं सड़क बुनियादी ढांचा विभाग',
  'Responsible for asphalt repair, potholes, road dividers, pedestrian footpaths and bridges.',
  ARRAY['ROADS_INFRASTRUCTURE'],
  'pwd.roads@civic.sample.in',
  '1800-CIVIC-ROADS (Sample)',
  true
),
(
  'd2000000-0000-0000-0000-000000000002',
  'DEPT-WASTE',
  'Solid Waste Management & Swachhata Dept',
  'ठोस अपशिष्ट प्रबंधन एवं स्वच्छता विभाग',
  'Door-to-door garbage collection, dump clearance, public dustbins and composting plants.',
  ARRAY['WASTE_MANAGEMENT'],
  'swachhata@civic.sample.in',
  '1800-CIVIC-WASTE (Sample)',
  true
),
(
  'd3000000-0000-0000-0000-000000000003',
  'DEPT-WATER',
  'Water Supply & Sewerage Board',
  'जल आपूर्ति एवं सीवरेज बोर्ड',
  'Municipal water supply, pipeline leakage resolution, contamination checks and drainage maintenance.',
  ARRAY['WATER_SUPPLY'],
  'waterboard@civic.sample.in',
  '1800-CIVIC-WATER (Sample)',
  true
),
(
  'd4000000-0000-0000-0000-000000000004',
  'DEPT-LIGHT',
  'Street Lighting & Electrical Infrastructure',
  'सड़क बत्तियां एवं विद्युत बुनियादी ढांचा',
  'Street lighting poles, LED bulb maintenance, electrical transformers and wire hazard clearing.',
  ARRAY['STREET_LIGHTING'],
  'electrical@civic.sample.in',
  '1800-CIVIC-LIGHT (Sample)',
  true
),
(
  'd5000000-0000-0000-0000-000000000005',
  'DEPT-HEALTH',
  'Public Health, Sanitation & Vector Control',
  'सार्वजनिक स्वास्थ्य एवं रोग नियंत्रण',
  'Mosquito fogging, stagnant water abatement, public toilets and community sanitation inspection.',
  ARRAY['PUBLIC_HEALTH', 'ENVIRONMENT_POLLUTION'],
  'health@civic.sample.in',
  '1800-CIVIC-HEALTH (Sample)',
  true
),
(
  'd6000000-0000-0000-0000-000000000006',
  'DEPT-TRAFFIC',
  'Traffic Engineering & Municipal Transit',
  'यातायात इंजीनियरिंग एवं परिवहन प्रभाग',
  'Traffic signages, zebra crossings, bus shelters, pedestrian safety barriers and traffic light timing.',
  ARRAY['TRAFFIC_TRANSPORT', 'SAFETY_GOVERNANCE'],
  'traffic@civic.sample.in',
  '1800-CIVIC-TRAFFIC (Sample)',
  true
)
ON CONFLICT (code) DO NOTHING;

-- Department Offices (Wards)
INSERT INTO department_offices (id, department_id, office_name, office_code, address, latitude, longitude, service_radius_km, jurisdiction_area, phone, contact_person, active)
VALUES
(
  'f1000000-0000-0000-0000-000000000001',
  'd1000000-0000-0000-0000-000000000001',
  'PWD Division Office — Western Zone',
  'OFF-PWD-WEST',
  'Civic Administration Complex, Ghole Road, Ward 8, Pune 411005',
  18.5314,
  73.8446,
  6.0,
  'Western Zone Wards',
  'Not yet verified',
  'Duty Executive Engineer',
  true
),
(
  'f1000000-0000-0000-0000-000000000002',
  'd1000000-0000-0000-0000-000000000001',
  'PWD Division Office — South-West Sub-Division',
  'OFF-PWD-SW',
  'Civic Complex, Paud Road, Ward 12, Pune 411038',
  18.5074,
  73.8077,
  7.0,
  'South-West Sector Wards',
  'Not yet verified',
  'Duty Assistant Engineer',
  true
),
(
  'f2000000-0000-0000-0000-000000000001',
  'd2000000-0000-0000-0000-000000000002',
  'Solid Waste Sanitation Center — North Zone',
  'OFF-SWM-NORTH',
  'Sanitation Facility, DP Road, Ward 2, Pune 411007',
  18.5580,
  73.8070,
  5.0,
  'North Zone Wards',
  'Not yet verified',
  'Sanitary Inspector (Duty)',
  true
),
(
  'f3000000-0000-0000-0000-000000000001',
  'd3000000-0000-0000-0000-000000000003',
  'Jal Board Maintenance Unit — Central Division',
  'OFF-WATER-CENTRAL',
  'Water Works Campus, Swargate, Pune 411042',
  18.5018,
  73.8580,
  8.0,
  'Central Water Supply Division',
  'Not yet verified',
  'Duty Water Works Engineer',
  true
),
(
  'f4000000-0000-0000-0000-000000000001',
  'd4000000-0000-0000-0000-000000000004',
  'Streetlight Operations Hub — Eastern Zone',
  'OFF-LIGHT-EAST',
  'Municipal Terminal Complex, Hadapsar, Pune 411028',
  18.5089,
  73.9260,
  9.0,
  'Eastern Operations Zone',
  'Not yet verified',
  'Duty Electrical Inspector',
  true
)
ON CONFLICT (office_code) DO NOTHING;

-- Demo Profiles (Citizen, Staff, Admin)
INSERT INTO profiles (id, name, phone, email, role, department_id, employee_id)
VALUES
(
  'u1000000-0000-0000-0000-000000000001',
  'Aarav Sharma (Sample Citizen)',
  '+91 98765 43210',
  'citizen.aarav@sample.in',
  'CITIZEN',
  NULL,
  NULL
),
(
  'u2000000-0000-0000-0000-000000000002',
  'Duty Engineer (Public Works)',
  '+91 98220 11223',
  'officer.pwd@civic.sample.in',
  'EMPLOYEE',
  'd1000000-0000-0000-0000-000000000001',
  'EMP-PWD-409'
),
(
  'u3000000-0000-0000-0000-000000000003',
  'Executive Administrator',
  '+91 94220 99887',
  'admin@civic.sample.in',
  'ADMIN',
  NULL,
  'ADM-EXEC-001'
)
ON CONFLICT (id) DO NOTHING;

-- Realistic Complaints
INSERT INTO complaints (
  id, tracking_id, title, description, category, suggested_category,
  classification_confidence, department_id, department_office_id,
  citizen_id, citizen_name, citizen_phone, latitude, longitude,
  landmark, address, status, priority, deadline, is_escalated,
  image_urls, supports_count, created_at
)
VALUES
(
  'c1000000-0000-0000-0000-000000000001',
  'FMC-2026-8821',
  'Dangerous deep pothole near Modern High School gate',
  'Large crater on road surface causing severe skidding for two-wheelers and children during school hours. Bitumen eroded completely.',
  'ROADS_INFRASTRUCTURE',
  'ROADS_INFRASTRUCTURE',
  0.92,
  'd1000000-0000-0000-0000-000000000001',
  'f1000000-0000-0000-0000-000000000001',
  'u1000000-0000-0000-0000-000000000001',
  'Aarav Sharma',
  '+91 98765 43210',
  18.5285,
  73.8480,
  'Opposite Modern High School, JM Road',
  'Jangali Maharaj Road, Shivajinagar, Pune 411005',
  'IN_PROGRESS',
  'INTERMEDIATE',
  NOW() + INTERVAL '12 hours',
  false,
  ARRAY['https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80'],
  14,
  NOW() - INTERVAL '12 hours'
),
(
  'c2000000-0000-0000-0000-000000000002',
  'FMC-2026-6612',
  'Uncollected garbage dumping site near vegetable market',
  'Community bins overflowing for over 4 days. Foul smell and stray animal hazard spreading towards residential colony.',
  'WASTE_MANAGEMENT',
  'WASTE_MANAGEMENT',
  0.88,
  'd2000000-0000-0000-0000-000000000002',
  'f2000000-0000-0000-0000-000000000001',
  'u1000000-0000-0000-0000-000000000001',
  'Aarav Sharma',
  '+91 98765 43210',
  18.5572,
  73.8085,
  'Near Aundh Mandai Gate 2',
  'DP Road, Aundh, Pune 411007',
  'PENDING',
  'MODERATE',
  NOW() - INTERVAL '10 hours',
  true,
  ARRAY['https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=800&q=80'],
  29,
  NOW() - INTERVAL '82 hours'
),
(
  'c3000000-0000-0000-0000-000000000003',
  'FMC-2026-3390',
  'Clean drinking water pipeline leakage on main road',
  'Treated municipal potable water gushing from underground pipeline joint since early morning, wasting thousands of liters.',
  'WATER_SUPPLY',
  'WATER_SUPPLY',
  0.94,
  'd3000000-0000-0000-0000-000000000003',
  'f3000000-0000-0000-0000-000000000001',
  'u1000000-0000-0000-0000-000000000001',
  'Aarav Sharma',
  '+91 98765 43210',
  18.5030,
  73.8565,
  'Near Swargate Flyover Pillar 14',
  'Tilak Road Crossing, Swargate, Pune 411042',
  'RESOLVED',
  'INTERMEDIATE',
  NOW() - INTERVAL '4 hours',
  false,
  ARRAY['https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=800&q=80'],
  7,
  NOW() - INTERVAL '20 hours'
)
ON CONFLICT (tracking_id) DO NOTHING;

-- Escalation record for the overdue garbage complaint
INSERT INTO escalation_records (
  id, complaint_id, department_id, original_deadline,
  escalation_timestamp, overdue_hours, follow_up_status, follow_up_notes
)
VALUES
(
  'e2000000-0000-0000-0000-000000000001',
  'c2000000-0000-0000-0000-000000000002',
  'd2000000-0000-0000-0000-000000000002',
  NOW() - INTERVAL '10 hours',
  NOW() - INTERVAL '9 hours',
  10,
  'IN_REVIEW',
  'Automated SLA Escalation: Overdue by 10 hours. Flagged to Zonal Sanitary Officer.'
)
ON CONFLICT (complaint_id) DO NOTHING;
