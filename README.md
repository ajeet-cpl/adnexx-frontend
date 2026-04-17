# ADNexx — Master Data Management v1

A Next.js 14 application for managing all AODB master/reference data.

## Modules

| Page | Route | API Endpoint | Table |
|------|-------|-------------|-------|
| Dashboard | /admin | — | overview |
| Airlines | /admin/airlines | /api/v1/admin/airlines | aodb.ref_airline |
| Airports | /admin/airports | /api/v1/admin/airports | aodb.ref_airport |
| Aircraft Types | /admin/aircraft-types | /api/v1/admin/aircraft-types | aodb.ref_aircraft_type |
| Countries | /admin/countries | /api/v1/admin/countries | aodb.ref_country |
| Terminals | /admin/terminals | /api/v1/admin/terminals | aodb.ref_terminal |
| Gates | /admin/gates | /api/v1/admin/gates | aodb.ref_gate |
| Stands | /admin/stands | /api/v1/admin/stands | aodb.ref_stand |
| Runways | /admin/runways | /api/v1/admin/runways | aodb.ref_runway |
| Baggage Belts | /admin/belts | /api/v1/admin/belts | aodb.ref_belt |
| Check-in Desks | /admin/checkin-desks | /api/v1/admin/checkin-desks | aodb.ref_checkin_desk |
| Ground Handlers | /admin/ground-handlers | /api/v1/admin/ground-handlers | aodb.ref_ground_handler |
| Delay Codes | /admin/delay-codes | /api/v1/admin/delay-codes | aodb.ref_delay_code |
| Users | /admin/users | /api/v1/admin/users | aodb.app_user |
| Tenants | /admin/tenants | /api/v1/admin/tenants | aodb.tenant |

## Setup

```bash
cp .env.example .env.local
npm install
npm run dev  # → http://localhost:3020
```

## API Convention

All admin endpoints follow REST:
- GET    /api/v1/admin/{resource}       — list (search, page, per_page, is_active)
- GET    /api/v1/admin/{resource}/{id}  — get one
- POST   /api/v1/admin/{resource}       — create
- PUT    /api/v1/admin/{resource}/{id}  — update
- DELETE /api/v1/admin/{resource}/{id}  — delete

Auth: Bearer JWT in Authorization header + X-Tenant-Id header
