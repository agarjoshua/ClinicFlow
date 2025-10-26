# MediCare - Hospital Management System

## Overview
A modern, fully-functional hospital and clinic management web application built for client demonstration. The system provides complete CRUD operations for patient registration, diagnosis management, and patient discharge workflows with professional medical aesthetics and PostgreSQL data persistence.

## Current State
**Status**: Production-ready MVP complete ✓
**Last Updated**: October 24, 2025

## Recent Changes
- **2025-10-24**: Complete hospital management system implementation
  - PostgreSQL database with patients, diagnoses, and discharges tables
  - Full CRUD API endpoints (Create, Read, Update, Delete) for all entities
  - Modern React frontend with sidebar navigation and dashboard
  - Patient management with search, filter, and CSV export
  - Diagnosis entry system with vital signs tracking
  - Discharge workflow with summary and follow-up instructions
  - Professional medical UI with calming blue/teal color scheme

## Core Features

### Patient Management
- **Patient Registration**: Complete demographic information capture (name, age, gender, contact, emergency contact, address)
- **Medical History**: Track medical history, allergies, and current medications
- **Auto-generated Patient IDs**: Unique identifiers (format: P-YYYYMMDD-XXX)
- **Patient Search & Filter**: Search by name, ID, or contact with status filtering
- **CSV Export**: Download patient data for reporting

### Diagnosis System
- **Vital Signs Recording**: Temperature, blood pressure, heart rate, oxygen saturation
- **Symptoms & Notes**: Detailed symptom tracking and diagnosis documentation
- **Treatment Plans**: Medications and treatment plan documentation
- **Diagnosis History**: Complete timeline view of all diagnoses per patient

### Discharge Management
- **Discharge Workflow**: Structured discharge process with summaries
- **Prescribed Medications**: Track medications prescribed at discharge
- **Follow-up Instructions**: Document post-discharge care instructions
- **Status Updates**: Automatic patient status change to "discharged"

### Dashboard & Analytics
- **Statistics Cards**: Total patients, active today, new admissions, discharged count
- **Recent Admissions**: Quick view of latest patient registrations
- **Quick Actions**: One-click access to common operations

## Project Architecture

### Technology Stack
- **Frontend**: React 18 with TypeScript, Wouter routing, TanStack Query for state management
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL (Neon-backed) with Drizzle ORM
- **UI Components**: Shadcn UI components with Tailwind CSS
- **Styling**: Custom design system with medical aesthetics (calming blues/teals)

### Database Schema
```
patients
- id (UUID, primary key)
- patientId (unique, auto-generated)
- name, age, gender, contact, emergencyContact, address
- medicalHistory, allergies, currentMedications
- status (active/discharged)
- admissionDate, dischargeDate

diagnoses
- id (UUID, primary key)
- patientId (foreign key → patients.id)
- symptoms, diagnosisNotes
- temperature, bloodPressure, heartRate, oxygenSaturation
- medications, treatmentPlan
- diagnosisDate

discharges
- id (UUID, primary key)
- patientId (foreign key → patients.id)
- dischargeSummary, prescribedMedications, followUpInstructions
- dischargeReason, dischargeDate
```

### API Endpoints

**Patients**
- `GET /api/patients` - Get all patients
- `GET /api/patients/recent` - Get recent patients (limit 5)
- `GET /api/patients/:id` - Get patient by ID
- `POST /api/patients` - Create new patient
- `PATCH /api/patients/:id` - Update patient information
- `DELETE /api/patients/:id` - Delete patient

**Diagnoses**
- `GET /api/diagnoses` - Get all diagnoses
- `GET /api/diagnoses/:patientId` - Get diagnoses for a patient
- `POST /api/diagnoses` - Create diagnosis
- `PATCH /api/diagnoses/:id` - Update diagnosis
- `DELETE /api/diagnoses/:id` - Delete diagnosis

**Discharges**
- `GET /api/discharges/:patientId` - Get discharges for a patient
- `POST /api/discharges` - Create discharge record
- `PATCH /api/discharges/:id` - Update discharge record
- `DELETE /api/discharges/:id` - Delete discharge

## File Structure
```
client/
  src/
    components/
      app-sidebar.tsx - Navigation sidebar
      diagnosis-dialog.tsx - Diagnosis entry form
      discharge-dialog.tsx - Discharge form dialog
      ui/ - Shadcn UI components
    pages/
      dashboard.tsx - Main dashboard with stats
      patients.tsx - Patient list view
      patient-form.tsx - New patient registration
      patient-detail.tsx - Patient detail with tabs
      diagnoses.tsx - All diagnoses view
      discharged.tsx - Discharged patients list
    App.tsx - Main app with routing
    index.css - Design system styles

server/
  db.ts - Database connection
  storage.ts - Data access layer
  routes.ts - API endpoints
  
shared/
  schema.ts - Database schema & validation
```

## Design System
- **Color Scheme**: Calming medical blues and teals (#0891b2 primary)
- **Typography**: Inter for UI, JetBrains Mono for patient IDs
- **Components**: Professional card-based layouts with subtle shadows
- **Interactions**: Smooth hover states, loading states, confirmation dialogs
- **Responsiveness**: Desktop-first with tablet support

## User Workflows

### Register New Patient
1. Click "New Patient" from dashboard or patients page
2. Fill in personal information (name, age, gender, contact, emergency contact, address)
3. Add medical history, allergies, and current medications
4. Submit to auto-generate patient ID and create record

### Add Diagnosis
1. Navigate to patient detail page
2. Click "Add Diagnosis"
3. Enter vital signs (optional)
4. Document symptoms and diagnosis notes
5. Add medications and treatment plan
6. Save to create diagnosis record

### Discharge Patient
1. Open patient detail page (must be "active" status)
2. Click "Discharge"
3. Enter discharge summary and reason
4. List prescribed medications
5. Document follow-up instructions
6. Submit to update patient status to "discharged"

## Development

### Running Locally
```bash
npm run dev
```
Access at http://localhost:5000

### Database Migrations
```bash
npm run db:push
```

### Environment Variables
- `DATABASE_URL` - PostgreSQL connection string (auto-configured)
- `SESSION_SECRET` - Session encryption secret (auto-configured)

## Production Deployment
The application is ready for deployment using Replit's built-in deployment system:
1. Click "Deploy" button in Replit
2. Application will be available at `*.replit.app` domain
3. Database and environment variables are automatically configured

## Notes
- No authentication system (intentionally omitted for client demo simplicity)
- All data persists in PostgreSQL database
- Patient IDs are auto-generated and immutable
- Cascading deletes: Deleting a patient removes all associated diagnoses and discharges
- Discharging a patient automatically updates status and sets discharge date
