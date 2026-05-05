# AODB Admin Portal — Standard Operating Procedure (SOP)

**Document Title:** AODB Admin Portal — User Operating Guide  
**Version:** 1.0  
**Date:** April 2026  
**Audience:** Non-technical portal users (operators, administrators, data entry staff)

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Roles and Access Levels](#2-roles-and-access-levels)
3. [Logging In](#3-logging-in)
4. [Dashboard Overview](#4-dashboard-overview)
5. [Understanding the Portal Layout](#5-understanding-the-portal-layout)
6. [Common Actions Across All Modules](#6-common-actions-across-all-modules)
   - 6.1 [Searching for Records](#61-searching-for-records)
   - 6.2 [Adding a New Record](#62-adding-a-new-record)
   - 6.3 [Editing a Record](#63-editing-a-record)
   - 6.4 [Activating / Deactivating a Record](#64-activating--deactivating-a-record)
   - 6.5 [Refreshing the Page](#65-refreshing-the-page)
   - 6.6 [Navigating Multiple Pages](#66-navigating-multiple-pages)
   - 6.7 [Downloading a CSV Template](#67-downloading-a-csv-template)
   - 6.8 [Bulk Uploading Records via CSV](#68-bulk-uploading-records-via-csv)
7. [Reference Data Modules](#7-reference-data-modules)
   - 7.1 [Airlines](#71-airlines)
   - 7.2 [Airports](#72-airports)
   - 7.3 [Aircraft Types](#73-aircraft-types)
   - 7.4 [Countries](#74-countries)
8. [Infrastructure Modules](#8-infrastructure-modules)
   - 8.1 [Terminals](#81-terminals)
   - 8.2 [Gates](#82-gates)
   - 8.3 [Stands](#83-stands)
   - 8.4 [Runways](#84-runways)
   - 8.5 [Baggage Belts](#85-baggage-belts)
   - 8.6 [Check-in Desks](#86-check-in-desks)
9. [Operations Modules](#9-operations-modules)
   - 9.1 [Ground Handlers](#91-ground-handlers)
   - 9.2 [Delay Codes](#92-delay-codes)
10. [System Modules (Admin Only)](#10-system-modules-admin-only)
    - 10.1 [Users](#101-users)
    - 10.2 [Tenants](#102-tenants)
11. [Logging Out](#11-logging-out)
12. [Frequently Asked Questions (FAQ)](#12-frequently-asked-questions-faq)
13. [Glossary](#13-glossary)

---

## 1. Introduction

The **AeroIS Admin Portal** (also called **AeroIS**) is the central management system for all reference and configuration data used by the Airport Operational Database (AODB). It is used to maintain accurate, up-to-date information that feeds into other airport systems such as:

- **FIDS** — Flight Information Display System
- **RMS** — Resource Management System
- **Slot Allocation** applications

**Why this data matters:**  
Any change made in this portal (e.g., adding a new airline, updating a terminal) is reflected in real-time across all connected airport systems. It is therefore important to ensure all data entered is accurate and verified before saving.

---

## 2. Roles and Access Levels

There are three user roles in the portal. Your role determines what you can see and do.

| Role | What You Can Do |
|---|---|
| **ADMIN** | Full access — create, edit, activate/deactivate, manage users and tenants, bulk upload |
| **OPERATOR** | Can view all data and edit most records. Cannot manage users. |
| **VIEWER** | Read-only access. Can search and view records but cannot make changes. |

> **Note:** If you are a VIEWER, the "Add New", "Edit", and toggle buttons will not appear on your screen. Contact your ADMIN if you need higher access.

---

## 3. Logging In

### Steps

1. Open your web browser and navigate to the AODB portal URL provided by your IT team.
2. You will see the **Login screen**.
3. In the **"Username or Email"** field, enter your username or registered email address.
4. In the **"Password"** field, enter your password.  
   - You can click the **eye icon** (👁) on the right side of the password field to show or hide your password.
5. Click the **"Sign In"** button.
6. If your credentials are correct, you will be taken to the **Dashboard** automatically.

### If login fails

- Double-check your username/email and password. Passwords are case-sensitive.
- If you see the error **"Username or email is required"** — the username field is empty.
- If you see the error **"Password is required"** — the password field is empty.
- If you see a server error — your account may be locked or your credentials may be incorrect. Contact your system administrator.

> **Security tip:** Never share your login credentials. Your session is stored only for the duration of your browser session. Closing the browser or tab will log you out automatically.

---

## 4. Dashboard Overview

After logging in, you land on the **Dashboard — Master Data Administration** page.

### What you see on the Dashboard

**Information Banner:**  
At the top, there is a blue information bar reminding you that:
> *"All entities below feed into the AODB operational database. Changes here propagate to FIDS, RMS, and Slot applications in real-time. Ensure all reference data is accurate before activating operational modules."*

**Module Cards:**  
The main area shows a grid of cards, one for each data module. Each card displays:
- The **module name** (e.g., Airlines, Airports)
- A short **description** of what the module contains
- The **total count** of records in that module (e.g., "142 Airlines")
- A small **coloured icon** identifying the module category

Clicking any card takes you directly to that module.

**Available modules on the Dashboard:**

| Module | Category | Description |
|---|---|---|
| Airlines | Reference Data | IATA/ICAO codes, types, alliances |
| Airports | Reference Data | Codes, timezone, coordinates |
| Aircraft Types | Reference Data | Dimensions, wake category |
| Countries | Reference Data | ISO country reference data |
| Terminals | Infrastructure | Terminal buildings |
| Gates | Infrastructure | Boarding gates |
| Stands | Infrastructure | Apron stands |
| Runways | Infrastructure | Runway designators and dimensions |
| Baggage Belts | Infrastructure | Arrivals/departures belts |
| Check-in Desks | Infrastructure | Desk types, counters, airlines |
| Ground Handlers | Operations | GHA companies and contacts |
| Delay Codes | Operations | IATA + custom delay codes |
| Users | System (Admin only) | Platform users, roles, access |
| Tenants | System | Multi-tenancy configuration |

---

## 5. Understanding the Portal Layout

The portal has two main areas:

### Left Sidebar (Navigation)

The **left sidebar** is always visible and lets you jump between modules. It is organised into sections:

| Sidebar Section | Modules |
|---|---|
| **OVERVIEW** | Dashboard |
| **REFERENCE DATA** | Airlines, Airports, Aircraft Types, Countries |
| **INFRASTRUCTURE** | Terminals, Gates, Stands, Runways, Baggage Belts, Check-in Desks |
| **OPERATIONS** | Ground Handlers, Delay Codes |
| **SYSTEM** | Users (Admin only), Tenants |

- You can **collapse** the sidebar by clicking the **left arrow (‹)** button at the top right of the sidebar. This gives more room to the main content area.
- To **expand** it again, click the arrow icon that appears on the collapsed sidebar.
- At the bottom of the sidebar, you can see your **name/email** and **role**, and a **Logout** button.

### Main Content Area

The right side of the screen shows the content for the currently selected module. Every module page follows the same layout:

```
[Module Title & Subtitle]           [Template] [Bulk Upload] [Add New]
[Stats Bar — quick counts]
[Search Box]                                              [Refresh]
[─────────────────── Data Table ──────────────────────────────────]
[Column Header 1] [Column Header 2] ... [Actions]
[Row 1]                                [Edit] [Toggle]
[Row 2]                                [Edit] [Toggle]
...
[◀ Previous]  Page X of Y  [Next ▶]
```

---

## 6. Common Actions Across All Modules

Every module follows the same patterns for the actions below.

---

### 6.1 Searching for Records

1. In the **Search box** (top-left of the table), type any keyword — e.g., an airline name, IATA code, or country name.
2. The table filters **instantly** as you type. No need to press Enter.
3. To clear the search, delete the text from the search box.

> **Example:** In the Airlines module, typing "Air India" or just "AI" will show all matching airline records.

---

### 6.2 Adding a New Record

1. Click the **"Add [Module Name]"** button in the top-right corner (e.g., "Add Airline", "Add Airport").
2. A **form panel** (modal window) will open with all the fields for that module.
3. Fill in the required fields. Fields marked with a **red asterisk (\*)** are mandatory.
4. Some fields have **hints** shown in smaller text below them (e.g., "2-letter code e.g. AI") — follow these guides.
5. Once all required fields are filled, click the **"Save"** button at the bottom of the form.
6. A green **success notification** will appear at the top of the screen confirming the record was created.
7. The table will automatically update to show the new record.

> **If Save fails:** A red error notification will appear with the reason. Correct the highlighted field and try again.

---

### 6.3 Editing a Record

1. Find the record you want to edit in the table (use Search if needed).
2. Click the **pencil icon (✏)** in the **Actions** column on the right side of that row.
3. The same form will open, pre-filled with the existing data.
4. Make your changes.
5. Click **"Save"** to confirm.
6. A green success notification confirms the update.

> **Note:** The record ID (internal system identifier) cannot be changed. Only the data fields can be edited.

---

### 6.4 Activating / Deactivating a Record

Many modules support activating or deactivating a record without deleting it. This is useful when a gate, belt, or runway is temporarily out of service but should be kept in the system.

1. Find the record in the table.
2. Look at the **Actions column** — you will see a **toggle switch icon**.
   - A **green toggle (▶)** means the record is currently **Active**.
   - A **grey toggle (◀)** means the record is currently **Inactive**.
3. Click the toggle to switch the status.
4. A notification confirms the change.

> **Example use case:** A baggage belt goes offline for maintenance. Click the toggle to mark it Inactive. When maintenance is complete, click it again to reactivate it.

---

### 6.5 Refreshing the Page

Click the **Refresh** button (circular arrow icon, top-right of the search bar) to reload the latest data from the server. Use this if you think someone else has made changes and you want to see the most current data.

---

### 6.6 Navigating Multiple Pages

If a module has many records, they are split into multiple pages.

- At the bottom of the table, you will see: **◀ Previous | Page X of Y | Next ▶**
- Click **Next ▶** to go to the next page.
- Click **◀ Previous** to go back.

---

### 6.7 Downloading a CSV Template

Before doing a **Bulk Upload** (see next section), you should download the official template to ensure your data is in the correct format.

1. Go to the module page (e.g., Airlines).
2. Click the **"Template"** button (with a download arrow icon, ↓) in the top-right area.
3. Your browser will download a `.csv` file named after the module (e.g., `airlines.csv`).
4. Open the file in Microsoft Excel, Google Sheets, or any spreadsheet application.
5. The first row contains the **column headers** — do not change or delete these.
6. The remaining rows are **example data** showing the correct format. Replace them with your actual data.
7. Save the file in CSV format when done.

---

### 6.8 Bulk Uploading Records via CSV

> **Available to: ADMIN role only.**

Instead of adding records one by one, you can upload many records at once using a CSV file.

1. Prepare your CSV file using the template (see Section 6.7 above).
2. Go to the module page where you want to upload records.
3. Click the **"Bulk Upload"** button (upload icon, ↑) in the top-right area.
4. A file picker will open. Select your prepared CSV file.
5. The system will process the file. The button will show **"Uploading…"** while in progress.
6. When complete, a green **"Bulk Upload Complete"** notification will appear, and the table will refresh automatically.

> **If the upload fails:** A red error notification will appear with details. Common causes:
> - Wrong column headers (always use the downloaded template)
> - Missing required fields (e.g., blank IATA code)
> - Duplicate records that already exist in the system

---

## 7. Reference Data Modules

Reference data is the foundation of the AODB system. These are stable, standardised records (airlines, airports, etc.) that other modules depend on.

---

### 7.1 Airlines

**Purpose:** Stores details of all airlines operating at the airport.

**Navigation:** Sidebar → Reference Data → Airlines

**What the table shows:**

| Column | Description |
|---|---|
| IATA/ICAO | Short industry codes (e.g., AI / AIC for Air India) |
| Airline Name | Full name of the airline |
| Type | Service type (e.g., FULL SERVICE, LOW COST, CARGO) |
| Category | Operational category (FSC, LCC, CHARTER, etc.) |
| Alliance | Airline alliance membership (Star Alliance, Oneworld, SkyTeam) |
| Country | Country of the airline's home base |
| Clearing | Whether the airline is a clearing house member (Yes / No) |

**Key fields when adding / editing an airline:**

- **IATA Code** *(e.g., AI)* — 2-letter code used by passengers and booking systems. Optional but recommended.
- **ICAO Code** *(e.g., AIC)* — 3-letter code used in operational/ATC systems. Optional.
- **Airline Name** *(required)* — Full official name.
- **Airline Type** — Choose from: Full Service, Low Cost, Charter, Cargo, Regional, Private.
- **Airline Category** — More specific classification (FSC, LCC, etc.).
- **Alliance** — Select from the dropdown if applicable.
- **Country** — The country the airline is registered in.
- **Slot Priority** — A numeric priority score used in slot allocation (default is 1).
- **Clearing House Member** — Tick this if the airline settles revenue through an industry clearing house (e.g., IATA BSP).
- **Home Hub Airport** — The airline's main hub airport.
- **Tenant** — If the portal uses multi-tenant mode, associate the airline to a tenant.

**Example:**
> Adding Air India: IATA = AI, ICAO = AIC, Name = Air India, Type = FULL_SERVICE, Category = FSC, Alliance = Star Alliance, Country = India.

---

### 7.2 Airports

**Purpose:** Stores details of all airports in the system (your own airport and any other airports referenced by flight data).

**Navigation:** Sidebar → Reference Data → Airports

**What the table shows:**

| Column | Description |
|---|---|
| Codes | IATA and ICAO codes side by side |
| Airport Name | Full official name |
| City | City the airport serves |
| Type | Hub classification (Large Hub, Regional, etc.) |
| Category | International / Domestic / Regional |
| Status | ACTIVE, RESTRICTED, or CLOSED |

**Key fields when adding / editing an airport:**

- **IATA Code** *(e.g., DEL)* — Standard 3-letter passenger code.
- **ICAO Code** *(e.g., VIDP)* — 4-letter operational code.
- **Airport Name** *(required)* — Full official name.
- **City Name** — The city or metropolitan area served.
- **Country** — Country where the airport is located.
- **Type** — Large Hub / Medium Hub / Small Hub / Non-Hub / Regional / Military.
- **Category** — International, Domestic, or Regional.
- **Operational Status** — Active, Restricted, or Closed.
- **Latitude / Longitude** — GPS coordinates (decimal degrees format, e.g., 28.5665 / 77.1031).
- **Elevation (ft)** — Height above sea level in feet.
- **Timezone** — e.g., Asia/Kolkata.
- **UTC Offset** — e.g., +05:30.
- **DST Rule** — Daylight Saving Time rule code.
- **Runway Count / Terminal Count** — Number of runways and terminals.
- **Slot Coordinated** — Tick if the airport requires slot coordination.
- **Coordination Level** — LEVEL_1, LEVEL_2, or LEVEL_3 (international classification).
- **Curfew Start / End** — Time window when flight movements are restricted (e.g., 23:00 – 06:00).
- **ACDM Enabled** — Tick if the airport uses Airport Collaborative Decision Making.
- **Noise Restriction Level** — None, Low, Moderate, High, Severe.

**Example:**
> Adding Delhi airport: IATA = DEL, ICAO = VIDP, Name = Indira Gandhi International Airport, City = New Delhi, Country = India, Type = LARGE_HUB, Category = INTERNATIONAL, Status = ACTIVE.

---

### 7.3 Aircraft Types

**Purpose:** Stores details of all aircraft models that operate at the airport. This data is used for stand compatibility, parking, and slot calculations.

**Navigation:** Sidebar → Reference Data → Aircraft Types

**What the table shows:**

| Column | Description |
|---|---|
| IATA/ICAO | Aircraft type codes (e.g., 738 / B738 for Boeing 737-800) |
| Description | Aircraft model name |
| Body Class | NARROW or WIDE body |
| Wake Category | Wake turbulence category (L/M/H/J) |
| Engine | Engine type (Turbofan, Turboprop, etc.) |
| Wingspan | Wingspan in metres |
| MTOW | Maximum Take-Off Weight in kilograms |

**Key fields when adding / editing an aircraft type:**

- **ICAO Code** *(e.g., B738)* — The 4-letter ICAO aircraft type designator.
- **IATA Code** *(e.g., 738)* — The 3-digit IATA code.
- **Description** — Full aircraft model name (e.g., Boeing 737-800).
- **Body Class** — NARROW (single-aisle) or WIDE (twin-aisle).
- **Wake Category** — L (Light), M (Medium), H (Heavy), J (Super/Jumbo). Used for separation rules.
- **Wingspan (m)** — Tip-to-tip wingspan in metres.
- **Length (m)** — Aircraft fuselage length in metres.
- **MTOW (kg)** — Maximum Take-Off Weight.
- **MLW (kg)** — Maximum Landing Weight.
- **Engine Count** — Number of engines (2 or 4).
- **Engine Type** — Turbofan, Turboprop, Piston, etc.
- **Turbulence Category** — LIGHT, MEDIUM, HEAVY, SUPER.
- **Stand Compatibility Class** — The stand size class this aircraft requires (A through F).

**Example:**
> Adding Boeing 737-800: ICAO = B738, IATA = 738, Description = Boeing 737-800, Body = NARROW, Wake = M, Wingspan = 35.8m, MTOW = 79,016 kg.

---

### 7.4 Countries

**Purpose:** Stores the standard country reference list. Used by airlines, airports, and passenger-related modules.

**Navigation:** Sidebar → Reference Data → Countries

**What the table shows:**

| Column | Description |
|---|---|
| ISO2 | 2-letter country code (e.g., IN for India) |
| ISO3 | 3-letter country code (e.g., IND) |
| Country Name | Common name |
| Capital | Capital city |
| Continent | Continent code (e.g., AS for Asia, EU for Europe) |
| Status | ACTIVE or INACTIVE |

**Key fields when adding / editing a country:**

- **ISO2 / ISO3 / Numeric Code** — Standard ISO 3166-1 codes. These are internationally fixed — use the correct values.
- **Name** — Common country name (e.g., India).
- **Official Name** — Full official name (e.g., Republic of India).
- **Currency Code / Name** — e.g., INR / Indian Rupee.
- **Continent Code** — AS, EU, AF, NA, SA, OC, AN.
- **Capital** — Capital city name.
- **Default Timezone** — e.g., Asia/Kolkata.
- **Is Schengen** — Tick if this country is part of the Schengen Area (relevant for European airports).
- **Is EU** — Tick if this is a European Union member state.
- **ICAO Region Code** — e.g., VH for India.
- **Aviation Authority** — The national civil aviation authority (e.g., DGCA for India).

---

## 8. Infrastructure Modules

Infrastructure modules describe the physical components of the airport. These must be set up accurately before operational systems can use them.

---

### 8.1 Terminals

**Purpose:** Defines the terminal buildings at the airport.

**Navigation:** Sidebar → Infrastructure → Terminals

**Key fields:**

- **Terminal Code** *(required)* — Short identifier (e.g., T1, T2, T3).
- **Terminal Name** *(required)* — Full name (e.g., Terminal 3 – International).
- **Airport** *(required)* — Select the airport this terminal belongs to from the dropdown.
- **Type** — Domestic, International, or Mixed.
- **Valid From / Valid To** — The date range during which this terminal is in operation. Leave "Valid To" blank if there is no planned end date.
- **Tenant** — The tenant organisation managing this terminal (if applicable).

**Example:**
> Terminal 3 at DEL: Code = T3, Name = Terminal 3, Airport = DEL, Type = INTERNATIONAL.

> **Important:** Terminals must be created before adding Gates, Stands, Baggage Belts, or Check-in Desks, as those modules require a terminal to be selected.

---

### 8.2 Gates

**Purpose:** Defines the individual boarding gates within each terminal.

**Navigation:** Sidebar → Infrastructure → Gates

**Key fields:**

- **Gate Code** *(required)* — Gate identifier (e.g., A1, B5, C12).
- **Airport** *(required)* — Select from dropdown.
- **Terminal** *(required)* — Select from dropdown (terminals for the chosen airport will appear).
- **Type** — Domestic, International, or Domestic + International (if common use).
- **Is Common Use** — Tick if this gate is not assigned to a single airline but shared by multiple carriers.
- **Quantity** — Number of positions at this gate (usually 1).
- **Has Boarding Bridge** — Tick if this gate has a jet bridge (aerobridge). Leave unticked for remote stands accessed by bus.
- **Adjacent Gates** — Specify neighbouring gate codes (up to 2) that may be impacted when this gate is occupied by a wide-body aircraft.
- **Valid From / Valid To** — Operational date range.

---

### 8.3 Stands

**Purpose:** Defines aircraft parking positions (stands/bays) on the apron.

**Navigation:** Sidebar → Infrastructure → Stands

**Key fields:**

- **Stand Code** *(required)* — Stand identifier (e.g., 101, 201A).
- **Airport** *(required)* — Select from dropdown.
- **Terminal** — The terminal this stand is associated with (optional).
- **Max Wingspan (m)** — The maximum aircraft wingspan that can fit on this stand. This prevents aircraft that are too large from being assigned.
- **Zone** — Apron zone (e.g., NORTH, EAST, REMOTE).
- **Tow Required** — Tick if aircraft need to be towed to/from this stand (no self-maneuvering).
- **Quantity** — Number of parking positions at this stand.
- **Blocked By** — Other stands (up to 6) that cannot be used simultaneously with this stand. For example, if a wide-body parks at Stand 101, Stand 102 next to it may be blocked.
- **Valid From / Valid To** — Operational date range.

**Example use case:**
> Stand 101 at DEL: Max Wingspan = 65m, Zone = NORTH, Blocked By = 102. If an A380 (wingspan 80m) is assigned here, Stand 102 is automatically shown as blocked in the resource system.

---

### 8.4 Runways

**Purpose:** Defines the runways available at the airport.

**Navigation:** Sidebar → Infrastructure → Runways

**Key fields:**

- **Runway Code** *(required)* — The runway designator (e.g., 28, 10/28, 09L/27R). Runways are named by their magnetic heading in tens of degrees.
- **Airport** *(required)* — Select from dropdown.
- **Length (m)** — Total usable runway length in metres.
- **Width (m)** — Runway width in metres.
- **Surface** — Pavement type (ASPHALT, CONCRETE, GRAVEL, etc.).
- **Lighting** — Lighting system (HIRL = High Intensity Runway Lights, MIRL = Medium Intensity, etc.).
- **Valid From / Valid To** — Operational date range.

---

### 8.5 Baggage Belts

**Purpose:** Defines baggage reclaim belts in the arrivals hall.

**Navigation:** Sidebar → Infrastructure → Baggage Belts

**Key fields:**

- **Belt Code** *(required)* — Belt identifier (e.g., B1, B2, OVERSIZED).
- **Airport** *(required)* — Select from dropdown.
- **Terminal** — Select the terminal where this belt is located.
- **Area** — Whether the belt serves DOMESTIC or INTERNATIONAL flights.
- **International** — Tick if this belt handles international arrivals baggage.
- **Valid From / Valid To** — Operational date range.

---

### 8.6 Check-in Desks

**Purpose:** Defines check-in counters/desks in the departures area.

**Navigation:** Sidebar → Infrastructure → Check-in Desks

**Key fields:**

- **Desk Code** *(required)* — Desk identifier (e.g., C1, D5).
- **Airport** *(required)* — Select from dropdown.
- **Terminal** — Select the terminal.
- **Airline** — The airline assigned to this desk (if dedicated). Leave blank for shared/common desks.
- **Counters** — Number of individual counters within this desk block.
- **Zone** — The zone or row within the check-in hall (e.g., Zone A, Zone B).
- **Type** — FULL_SERVICE (staffed desk) or LOW_COST (self-service / LCC desk).
- **Valid From / Valid To** — Operational date range.

---

## 9. Operations Modules

---

### 9.1 Ground Handlers

**Purpose:** Stores details of ground handling companies (GHAs) that provide services at the airport. Ground handlers are responsible for tasks like aircraft turnaround, baggage loading, fuelling, and passenger handling.

**Navigation:** Sidebar → Operations → Ground Handlers

**What the table shows:**

| Column | Description |
|---|---|
| Code | Short code identifying the handler |
| Handler Name | Company name |
| Airport | The airport(s) where they operate |
| Contact | Email address |
| Services | List of services provided |
| Status | Active / Inactive |

**Key fields when adding / editing a ground handler:**

- **Handler Name** *(required)* — Full company name.
- **Short Code** *(required)* — A short identifier (e.g., AISATS, CELEBI).
- **Airport** *(required)* — The airport where this handler operates.
- **Email / Phone / Website** — Contact details.
- **Address** — Physical office address at the airport.
- **Service Types** — Select all applicable services from the list:
  - RAMP — Aircraft loading/unloading, marshalling
  - CARGO — Cargo handling
  - GROUND — Ground equipment, towing
  - FUELLING — Aircraft fuelling
  - CATERING — In-flight catering
  - CLEANING — Aircraft cabin cleaning
- **Licence Number** — Official operating licence number.
- **Certifications** — e.g., IATA ISAGO safety certification.

---

### 9.2 Delay Codes

**Purpose:** Maintains the list of IATA standard delay codes (and any airport-specific custom codes) used to categorise the reason for a flight delay.

**Navigation:** Sidebar → Operations → Delay Codes

**What the table shows:**

| Column | Description |
|---|---|
| Numeric Code | Standard numeric delay code (e.g., 93) |
| IATA Code | Alphanumeric IATA code |
| Site Code | Airport-specific code format |
| Description | Plain-English description of the delay reason |
| Category | High-level category |
| IATA Group | IATA delay group letter |

**Key fields when adding / editing a delay code:**

- **Site Code** — Your airport's internal code format (e.g., DEL-93).
- **Numeric Code** *(required)* — The standard IATA numeric code (00–99).
- **IATA Code** — The standard IATA alphanumeric code.
- **Description** *(required)* — Clear explanation of what caused the delay (e.g., "Passenger Handling – Check-In").
- **Category** — High-level grouping (e.g., PASSENGER, AIRCRAFT, WEATHER, OPERATIONAL).
- **Sub-Category** — More specific classification.
- **IATA Group** — Single letter grouping per IATA standard (A = Airline, W = Weather, M = Aircraft, etc.).
- **Is Carrier Delay** — Tick if this delay is attributed to the airline/carrier itself.

**Example:**
> Code 93: Description = "Passenger Handling – Late check-in", Category = PASSENGER, IATA Group = A, Is Carrier = No.

---

## 10. System Modules (Admin Only)

These modules are only visible and accessible to users with the **ADMIN** role.

---

### 10.1 Users

**Purpose:** Manages all user accounts that have access to the AODB Admin Portal.

**Navigation:** Sidebar → System → Users

> **Who can access this:** ADMIN role only. If you do not see this menu item, you do not have admin access.

**What the table shows:**

| Column | Description |
|---|---|
| User | Full name and username |
| Email | Registered email address |
| Role | Assigned role (ADMIN / OPERATOR / VIEWER) |
| Last Login | Date of the user's most recent login |
| Status | Active or Inactive |

#### Adding a New User

1. Click **"Add User"**.
2. Fill in the form:
   - **First Name** and **Last Name** *(required)*
   - **Username** *(required)* — Unique login identifier. No spaces allowed. e.g., `jane_doe`
   - **Email** *(required)* — Must be a valid email address.
   - **Phone Number** — Optional.
   - **Role** — Select one or more roles by ticking the checkboxes:
     - **ADMIN** — Full access
     - **OPERATOR** — Can edit data, cannot manage users
     - **VIEWER** — Read-only access
   - **Password** *(required for new users)* — Minimum 8 characters.
   - **Confirm Password** — Must match the password entered above.
3. Click **Save**.

#### Editing a User

1. Click the **pencil icon (✏)** next to the user.
2. Update the desired fields (name, email, phone, role).
3. Leave the password fields blank unless you want to change the password.
4. Click **Save**.

#### Resetting a User's Password

1. Find the user in the table.
2. Click the **key icon (🔑)** in the Actions column.
3. A "Reset Password" panel will appear.
4. Enter the **New Password** and **Confirm Password**.
5. Click **Save** to apply the new password.

> The user must be informed of their new password separately — the system does not send email notifications.

#### Activating / Deactivating a User

- Click the **toggle icon** in the Actions column to enable or disable a user's account.
- A deactivated user cannot log in but their account and history are preserved.

---

### 10.2 Tenants

**Purpose:** Manages tenant organisations in the multi-tenant AODB system. A tenant represents an organisation (e.g., an airline, a ground handling company, or an airport authority) that has its own isolated view of data.

**Navigation:** Sidebar → System → Tenants

**What the table shows:**

| Column | Description |
|---|---|
| Code | Short tenant identifier (e.g., AIRL001) |
| Tenant Name | Organisation name |
| Country | Country of registration |
| Email | Primary contact email |
| Status | Active or Inactive |

**Key fields when adding / editing a tenant:**

- **Tenant Code** *(required)* — Unique short code for the organisation (e.g., AIRL001). No spaces.
- **Tenant Name** *(required)* — Full organisation name.
- **Email** — Primary contact email.
- **Phone** — Contact phone number.
- **Website** — Organisation website.
- **Country** — Country of registration.
- **Region** — Geographic region (e.g., APAC, EMEA, AMERICAS).
- **Tier** — Service tier level (e.g., PREMIUM, STANDARD).
- **Valid From / Valid To** — The period during which this tenant is active.

---

## 11. Logging Out

To log out of the portal:

1. Look at the **bottom of the left sidebar**.
2. Click the **"Logout"** button (door/exit icon).
3. You will be taken back to the Login page immediately.

> **Important:** The portal uses **session-based storage**. This means your login is automatically cleared when you close the browser tab or window. You do not need to manually log out when closing the browser, but it is good practice to do so on shared computers.

---

## 12. Frequently Asked Questions (FAQ)

**Q: I cannot see the "Add New" button. What is wrong?**  
A: You likely have a **VIEWER** role. Viewer accounts are read-only and cannot add or edit records. Contact your ADMIN to have your role upgraded if needed.

---

**Q: I cannot see the "Users" menu item in the sidebar.**  
A: The Users module is only visible to users with the **ADMIN** role. If you need access, contact your system administrator.

---

**Q: I made a mistake in a record. Can I delete it?**  
A: The portal does not have a direct "Delete" button to prevent accidental data loss. Instead, you can **Deactivate** the incorrect record using the toggle switch, and then create a correct new record. If a record needs to be permanently removed, contact your system administrator.

---

**Q: My bulk upload CSV failed. What should I check?**  
A: Common reasons for upload failure:
1. The column headers were changed or removed — always use the **downloaded template** without altering the header row.
2. A mandatory field (like IATA code or name) was left blank in one or more rows.
3. A record already exists in the system with the same unique identifier.
4. Date fields are in the wrong format — use `YYYY-MM-DD` (e.g., 2024-01-15).

---

**Q: The page shows an error banner in red. What does it mean?**  
A: A red error message below the search bar means the portal could not connect to the server or the server returned an error. Try clicking the **Refresh** button. If the error persists, check your network connection or contact IT support.

---

**Q: Data I saved is not appearing in the table.**  
A: Click the **Refresh** button (circular arrow icon) to reload the latest data. If you are on page 2 or beyond, the new record may appear on a different page — try searching for it by name or code.

---

**Q: What does "Valid From / Valid To" mean on a record?**  
A: These dates define the period when a record is **operationally active**. For example, a temporary terminal opened for a season would have a Valid From of the opening date and a Valid To of the closing date. If a record is permanent, leave **Valid To** blank.

---

**Q: I cannot log in — the page says "Login failed".**  
A: Possible causes:
- Wrong username/email or password (check for CAPS LOCK).
- Your account has been deactivated — contact your ADMIN.
- The server may be temporarily unavailable — try again in a few minutes.

---

**Q: Can multiple users be logged in at the same time?**  
A: Yes. Multiple users can use the portal simultaneously. If two users edit the same record at the same time, the last save will overwrite the previous one. Always check with your team before editing shared records.

---

## 13. Glossary

| Term | Meaning |
|---|---|
| **AODB** | Airport Operational Database — the central database for all airport operational data |
| **FIDS** | Flight Information Display System — the departure/arrival boards seen by passengers |
| **RMS** | Resource Management System — manages allocation of airport resources (gates, stands, belts) |
| **IATA** | International Air Transport Association — sets global aviation standards and codes |
| **ICAO** | International Civil Aviation Organization — the UN body for aviation; issues 4-letter airport codes |
| **IATA Code** | A 2-letter airline code (e.g., AI) or 3-letter airport code (e.g., DEL) |
| **ICAO Code** | A 3-letter airline code (e.g., AIC) or 4-letter airport code (e.g., VIDP) |
| **Wake Category** | Classification of aircraft by the turbulence they create: L = Light, M = Medium, H = Heavy, J = Super |
| **MTOW** | Maximum Take-Off Weight — the heaviest an aircraft can be when it takes off |
| **GHA** | Ground Handling Agent — a company providing ground services at an airport |
| **Slot** | A specific time window allocated for an aircraft to arrive or depart at a coordinated airport |
| **Aerobridge** | A movable corridor connecting the terminal gate directly to the aircraft door (also called jet bridge) |
| **ACDM** | Airport Collaborative Decision Making — a process where all airport stakeholders share real-time data |
| **Schengen Area** | A group of 27 European countries with no border controls between them |
| **CSV** | Comma-Separated Values — a simple spreadsheet/text file format used for data import/export |
| **Bulk Upload** | Importing many records at once by uploading a CSV file |
| **Tenant** | An organisation with its own isolated data environment within the AODB system |
| **Toggle** | A switch button that turns a record's status between Active and Inactive |
| **Active Record** | A record that is currently in use by operational systems (shown with a green badge) |
| **Inactive Record** | A record that is temporarily disabled and not used in operations (shown with a grey badge) |
| **DST** | Daylight Saving Time — seasonal time adjustment used in some countries |
| **Coordination Level** | IATA airport slot coordination classification: Level 1 = no coordination, Level 2 = schedules facilitated, Level 3 = fully coordinated |

---

*End of Document*

---
**Maintained by:** AODB System Administration Team  
**Next Review Date:** October 2026
