# ClinicFlow – Application Flow and Working Structure

This document summarizes how ClinicFlow is structured and how the main pieces work together at a high level.

## 1. High-Level Architecture

- **Frontend**: React + TypeScript SPA under `client/`, using:
  - `wouter` for routing (`client/src/App.tsx`)
  - `@tanstack/react-query` for data fetching/caching
  - Shadcn UI components (`client/src/components/ui/`)
- **Backend**: Supabase (PostgreSQL + auth + storage) accessed directly from the client via the Supabase JS SDK (`client/src/lib/supabaseClient.ts`).
- **Shared Schema**: Drizzle ORM schema in `shared/schema.ts` defines database tables and TypeScript types (e.g. `patients`, `patientAdmissions`, `Patient`).
- **Server utilities**: `server/` contains Node helpers (e.g. for Vite SSR / API), but the primary data access path is client → Supabase.

## 2. Authentication and Roles

**File:** `client/src/App.tsx`

1. On app start, `supabase.auth.getSession()` is called to determine if a user is logged in.
2. If logged in, the app queries the `users` table to fetch the user profile and **role** (`consultant` or `assistant`).
3. Role and profile are stored in React state (`userRole`, `userData`).
4. Auth state changes (sign-in/sign-out) are tracked via `supabase.auth.onAuthStateChange` and the UI reacts accordingly.
5. If the user has a session but no profile in `users`, a special screen explains that the profile must be completed.

Routing is handled in `Router` (inside `App.tsx`):

- `"/auth"` → authentication page.
- All other routes expect a valid session + profile; otherwise the user is redirected to `/auth` from individual pages.

## 3. Layout and Navigation (Sidebar)

**File:** `client/src/components/app-sidebar.tsx`

- The main layout uses `SidebarProvider` and `AppSidebar` to render a left navigation and a header.
- Sidebar content depends on `userRole`:
  - **Consultant menu** (clinical focus):
    - `Calendar` → `/calendar`
    - `Patients` (consultant view) → `/consultant-patients`
    - `Inpatients` → `/inpatients`
    - `Clinical Cases` → `/clinical-cases`
    - `Procedures` → `/procedures`
    - `Hospitals` → `/hospitals`
  - **Assistant menu** (front-desk/workflow focus):
    - `Dashboard` → `/`
    - `Appointments` → `/appointments`
    - `Triage` → `/triage`
    - `Diagnoses` → `/diagnoses`
    - `Procedures` → `/procedures`
    - `Patients` (assistant list) → `/patients`
    - `Inpatients` → `/inpatients`
    - `Post-Op Updates` → `/post-op-updates`
    - `Discharged` → `/discharged`
    - `Hospitals` → `/hospitals`
    - `Calendar Management` → `/calendar`

Each menu item is a `wouter` `<Link>`; current route is highlighted via `isActive` using `useLocation()`.

## 4. Core Domain: Patients and Admissions

### 4.1 Database Model (simplified)

Defined in `shared/schema.ts` and migrations (e.g. `003_add_inpatient_support.sql`):

- **`patients`**
  - Demographics: `first_name`, `last_name`, `date_of_birth`, `age`, `gender`, `phone`, `email`, `address`, etc.
  - Emergency info: `emergency_contact`, `emergency_contact_phone`.
  - Medical info: `medical_history`, `allergies`, `current_medications`, `blood_type`.
  - Inpatient fields:
    - `is_inpatient` (boolean)
    - `current_hospital_id` (FK → `hospitals.id`)
    - `inpatient_admitted_at` (timestamp)
    - `inpatient_notes` (text)

- **`patient_admissions`**
  - Links a patient to a hospital and an optional clinical case.
  - Fields: `admission_reason`, `diagnosis_summary`, `admission_date`, `status` (`admitted` | `discharged` | `transferred`), `discharge_date`, `discharge_summary`.

Other tables (not exhaustively listed): `hospitals`, `appointments`, `clinical_cases`, `procedures`, `discharges`, `medical_images`, etc.

### 4.2 Assistant Patient List (`/patients`)

**File:** `client/src/pages/patients.tsx`

Flow:

1. Page guards against unauthenticated access by checking `supabase.auth.getSession()` and redirecting to `/auth` if needed.
2. Uses React Query (`useQuery`) to load all patients, joining the current hospital:
   - `select "*", currentHospital:hospitals(id, name, color)`
   - Maps snake_case DB fields → camelCase `PatientListItem` objects.
3. Search and filters:
   - Text search on name, patient number, phone, and email.
   - Status filter (currently UI-level; logic can be extended to use `is_inpatient` / discharge data).
4. Rendering:
   - Each patient is a card showing avatar, demographic info, and registration date.
   - If `patient.isInpatient` is true, an **Inpatient ribbon** is shown:
     - Badge "Inpatient" + bed icon
     - Current hospital name
     - "Since {date/time}" based on `inpatientAdmittedAt`.
   - Clicking the card or view button navigates to `/patients/:id` (patient detail).

### 4.3 Consultant Patient Overview (`/consultant-patients`)

**File:** `client/src/pages/consultant-patients.tsx`

Flow (simplified):

1. Fetches the current consultant user from `supabase.auth.getUser()` and the `users` table.
2. Loads patients with related `appointments`, `clinical_cases`, and `discharges`.
3. Derives “care tracking” metrics per patient:
   - `last_seen` date (latest appointment or case)
   - `next_appointment`
   - `follow_up_date`, `follow_up_instructions`
   - `total_visits`, `days_since_last_seen`
4. Separately loads **inpatients** based on surgical procedures and discharges (legacy approach). This can coexist with the new `is_inpatient` + `patient_admissions` model.
5. The UI presents tabs, search, and actions for booking, editing, and managing care per patient.

### 4.4 Patient Detail and Inpatient Management (`/patients/:id`)

**File:** `client/src/pages/patient-detail.tsx`

This is the central chart view for a single patient.

Key flows:

1. **Loading patient context**
   - Fetches the patient record (`patients` table) and maps DB fields to a rich patient object (including inpatient fields).
   - Loads related data: appointments, clinical cases (with attached `medical_images`), and admission history from `patient_admissions` + `hospitals`.

2. **Demographics / Medical info**
   - "Patient Overview" section shows avatar, age, gender, blood type, DOB.
   - Contact, emergency contact, and medical information cards, all editable.
   - Edits are persisted via `updateMutation` (Supabase `update` on `patients`).

3. **Inpatient Management card**
   - Displays a **switch** bound to `patient.isInpatient`:
     - When toggled **on**: opens an **Admit Patient** dialog.
     - When toggled **off**: opens a **Discharge Patient** dialog (if an active admission exists).
   - Shows current state:
     - Badge: "Inpatient" or "Outpatient".
     - Current hospital name (from `currentHospital`) if available.
     - "Since {date/time}" using `inpatientAdmittedAt`.
   - Shows an alert summary:
     - Active admission reason, diagnosis, and `inpatientNotes` if present.
   - Lists admission history (from `patient_admissions`), including hospital, status, admission/discharge timestamps, and summaries.

4. **Admitting a patient**

   - When the admit dialog opens, it pre-populates fields with:
     - Current hospital (if set on the patient)
     - Current timestamp
     - Latest clinical diagnosis (if available from a recent case)
     - Existing `inpatientNotes`.
   - On **Confirm Admission**:
     1. Validates hospital and date.
     2. Resolves the current user in the `users` table to set `consultant_id` and `created_by`.
     3. Inserts a new row into `patient_admissions` with `status = 'admitted'`.
     4. Updates the `patients` table to set:
        - `is_inpatient = true`
        - `current_hospital_id`
        - `inpatient_admitted_at`
        - `inpatient_notes`.
     5. Invalidates relevant React Query caches for the patient and admissions.

5. **Discharging a patient**

   - The discharge dialog shows fields for discharge date/time, summary, and notes.
   - Requires an active admission (`status = 'admitted'`) to proceed.
   - On **Confirm Discharge**:
     1. Updates that `patient_admissions` row to set:
        - `status = 'discharged'`
        - `discharge_date`
        - `discharge_summary`.
     2. Updates the `patients` table to set:
        - `is_inpatient = false`
        - `current_hospital_id = null`
        - `inpatient_admitted_at = null`
        - `inpatient_notes`.
     3. Invalidates related queries and closes the dialog.

6. **Clinical cases and media**

   - Clinical cases (legacy + APOC structured) are listed with diagnoses and notes.
   - The APOC documentation system provides structured multi-section documentation.
   - Media (images, videos, links) linked to clinical cases are uploaded to Supabase storage and indexed in `medical_images`.

## 5. Inpatients Overview Page (`/inpatients`)

**File:** `client/src/pages/inpatients.tsx`

This page gives assistants and consultants a consolidated view of all currently admitted patients.

Flow:

1. Uses React Query to fetch patients where `is_inpatient = true`, selecting:
   - Demographics and contact fields
   - Inpatient fields (`inpatient_admitted_at`, `inpatient_notes`, `currentHospital:hospitals`)
   - `admissions:patient_admissions` plus `hospital:hospitals` info per admission.
2. Normalizes the raw Supabase payload into `InpatientRecord` objects, resolving the primary hospital and active admission if present.
3. Computes summary metrics:
   - Total active inpatients
   - Number of hospitals involved
   - Count of inpatients missing a linked active admission record.
4. Renders:
   - Metric cards for quick overview.
   - Empty state if there are no inpatients.
   - A list of inpatient cards showing:
     - Avatar, name, patient number
     - Hospital chip with color
     - Admission range: "{date/time} • {time since}"
     - Reason, diagnosis, and notes
     - Button to open the patient chart (`/patients/:id`).

## 6. Appointments and Scheduling (Overview)

Key pages (not detailed here but structurally similar):

- `client/src/pages/appointments.tsx` – overview of appointments.
- `client/src/pages/appointment-form.tsx` – booking flow tied to `clinic_sessions` and `patients`.
- `client/src/pages/assistant-calendar.tsx` / `consultant-calendar.tsx` – calendar views per role.
- `client/src/pages/schedule-clinic.tsx` and `clinic-session-detail.tsx` – manage clinics at specific hospitals.

These pages follow a common pattern:

1. Use React Query to fetch data from Supabase (`clinic_sessions`, `appointments`, `hospitals`, `patients`).
2. Use Shadcn UI components (cards, tables, dialogs) for display.
3. Use `useMutation` for create/update/delete actions, with cache invalidation on success.

## 7. Error Handling and UX Patterns

- All data fetching is centralized in React Query hooks with `queryKey`s per resource.
- Mutations surface success and error feedback using the global toast system (`useToast`, `Toaster`).
- Loading skeletons/spinners are used on list pages and detail views.
- Forms are mostly controlled components with basic client-side validation; Supabase errors are surfaced in toasts.

## 8. How Data Flows End-to-End (Example: Admit Patient)

1. **User action**: Assistant or consultant opens a patient detail page and clicks **Admit Patient** or toggles the inpatient switch on.
2. **UI state**: `admitDialogOpen` becomes `true`, admission form is pre-populated via a `useEffect` in `patient-detail.tsx`.
3. **Submit**: User fills the fields and confirms. The `admitMutation` (`useMutation`) runs.
4. **Supabase writes**:
   - Insert into `patient_admissions` with `status = 'admitted'`.
   - Update `patients` row with inpatient fields.
5. **React Query invalidation**: Queries for `["patient", id]`, `["patient-admissions", id]`, and `["patients"]` are invalidated, causing dependent views (detail, lists, `/inpatients`) to refresh.
6. **UX feedback**: Dialog closes, toast shows success, and the UI now displays the inpatient state, hospital name, and admission timestamp in both the detail page and list/overview pages.

## 9. Extensibility Notes

- New flows (e.g. ward rounds, transfer between hospitals, more granular statuses) should:
  - Extend the Drizzle schema and migrations under `shared/` and `migrations/`.
  - Expose new fields via Supabase select queries.
  - Reuse the React Query + mutation + toast pattern.
- When adding new pages, register them in `client/src/App.tsx` and link them from `AppSidebar` for the appropriate role(s).

---

This document focuses on how the main pieces (auth, roles, patients, inpatients, and navigation) work together. If you want a diagram (sequence diagram or architecture diagram), we can add a separate `APP_DIAGRAM.md` or `.drawio` file on top of this overview.