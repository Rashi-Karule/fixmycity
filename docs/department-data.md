# Municipal Department Directory & Data Governance Guide

## 1. Overview & Data Philosophy

In FixMyCity, civic complaints are not routed to arbitrary generic mailboxes. They are dispatched to specific geographic ward offices operated by authorized municipal departments.

Because OpenStreetMap and external GIS layers do not contain complete, authoritative municipal directory data for Indian cities, FixMyCity maintains a separate **Department Office Master Registry**.

---

## 2. Municipal Department Schema & Categories

FixMyCity models municipal governance across 8 core civic domains:

| Department Code | Department Name | Categories Handled | SLA Urgency Default |
|---|---|---|---|
| `DEPT-ROADS` | Public Works & Roads Infrastructure Dept | `ROADS_INFRASTRUCTURE` | Standard (7d) / Intermediate (24h for sinkholes) |
| `DEPT-WASTE` | Solid Waste Management & Swachhata Dept | `WASTE_MANAGEMENT` | Moderate (3d) |
| `DEPT-WATER` | Water Supply & Sewerage Board | `WATER_SUPPLY` | Intermediate (24h) |
| `DEPT-LIGHT` | Street Lighting & Electrical Division | `STREET_LIGHTING` | Moderate (3d) |
| `DEPT-HEALTH` | Public Health, Sanitation & Vector Control | `PUBLIC_HEALTH`, `ENVIRONMENT_POLLUTION` | Moderate (3d) |
| `DEPT-TRAFFIC` | Traffic Engineering & Municipal Transit | `TRAFFIC_TRANSPORT`, `SAFETY_GOVERNANCE` | Standard (7d) |

---

## 3. CSV Import Format for Administrators

Administrators can bulk-import verified ward offices through the **Admin Command Center** (`/admin -> Departments & CSV Import`) or via `POST /api/departments/import-csv`.

### CSV Header Format:
```csv
office_name,office_code,department_id,address,latitude,longitude,service_radius_km,jurisdiction_area,phone,contact_person
```

### Example CSV Data (Pune Corporation Wards):
```csv
office_name,office_code,department_id,address,latitude,longitude,service_radius_km,jurisdiction_area,phone,contact_person
PWD Baner Ward Unit,OFF-PWD-BANER,d1000000-0000-0000-0000-000000000001,Baner Main Rd Pune 411045,18.5590,73.7868,6.5,Baner & Balewadi,020-25501105,AE R. T. Gaikwad
Waste Sanitation Hub Kothrud,OFF-SWM-KOTHRUD,d2000000-0000-0000-0000-000000000002,Near Vanaz Metro Station Pune 411038,18.5020,73.8050,5.0,Kothrud Ward 12,020-25501206,SI M. P. शिंदे
Water Maintenance Hadapsar,OFF-WATER-HADAPSAR,d3000000-0000-0000-0000-000000000003,Magarpatta Junction Pune 411028,18.5140,73.9290,7.0,Hadapsar & Mundhwa,020-25501308,EE K. V. Patil
```

---

## 4. Verification & Maintenance Best Practices

1. **GPS Coordinate Validation:** Always verify latitude and longitude against official ward maps before importing. Incorrect coordinates will cause spatial routing misallocations.
2. **Service Radius Configuration:** Set `service_radius_km` according to ward size (typically 5km–10km in urban Indian municipal wards).
3. **Dynamic Radius Expansion:** If an issue is reported outside the default radius of all offices, the router automatically expands the search perimeter up to 50km in 5km increments. If no office is within range, it flags the issue for **Administrative Review** instead of misrouting.
4. **Active/Inactive Status:** When a ward office undergoes renovations or staff reassignments, toggle its `active` boolean flag to `false`. The router will automatically skip inactive offices and route to the next nearest active ward.
