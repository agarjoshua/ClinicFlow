1. Multi-Tenancy Architecture
Core Changes Needed:
Add Organization/Clinic Entity:

Create a clinics or organizations table as the tenant boundary
Each clinic has its own: name, address, billing info, subscription status, settings
Add clinic_id foreign key to all major tables (patients, appointments, users, hospitals, etc.)

Update Database Schema (shared/schema.ts):
sql-- New table
CREATE TABLE clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- for subdomain/URL routing
  owner_id UUID REFERENCES users(id),
  subscription_tier TEXT DEFAULT 'trial', -- trial, basic, pro, enterprise
  subscription_status TEXT DEFAULT 'active',
  max_consultants INTEGER DEFAULT 1,
  max_assistants INTEGER DEFAULT 2,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  settings JSONB -- store clinic-specific configs
);

-- Add clinic_id to existing tables
ALTER TABLE users ADD COLUMN clinic_id UUID REFERENCES clinics(id);
ALTER TABLE patients ADD COLUMN clinic_id UUID REFERENCES clinics(id);
ALTER TABLE appointments ADD COLUMN clinic_id UUID REFERENCES clinics(id);
-- ... repeat for all major tables
Row Level Security (RLS) in Supabase:
sql-- Example: Users can only see patients from their clinic
CREATE POLICY "Users see own clinic patients" ON patients
  FOR SELECT USING (
    clinic_id IN (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    )
  );
2. Onboarding & Clinic Setup Flow
New Pages Needed:

/signup - Clinic owner registration (separate from staff login)
/onboarding - Multi-step wizard:

Step 1: Clinic details (name, location, specialties)
Step 2: Primary contact/owner info
Step 3: Choose subscription plan
Step 4: Add first hospital locations
Step 5: Invite first assistant



File: client/src/pages/clinic-onboarding.tsx
3. Subscription & Billing System
Integration Options for Kenya:

M-Pesa Integration via Safaricom Daraja API (most critical for Kenya!)
Card Payments: Integrate Stripe (international) or Flutterwave/Paystack (African-focused)
Bank Transfers: Manual payment tracking with admin approval

New Tables:
sqlCREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  clinic_id UUID REFERENCES clinics(id),
  plan_tier TEXT, -- trial, basic, pro
  billing_cycle TEXT, -- monthly, annual
  amount DECIMAL,
  currency TEXT DEFAULT 'KES',
  status TEXT, -- active, past_due, canceled
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  mpesa_transactions JSONB[] -- track M-Pesa payments
);

CREATE TABLE invoices (
  id UUID PRIMARY KEY,
  clinic_id UUID REFERENCES clinics(id),
  amount DECIMAL,
  status TEXT, -- paid, pending, overdue
  payment_method TEXT, -- mpesa, card, bank_transfer
  mpesa_receipt_number TEXT,
  issued_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ
);
New Pages:

/subscription - View plan, usage limits, billing history
/upgrade - Compare plans and upgrade
/billing - Invoices, payment methods, M-Pesa statements

4. Team & Staff Management
Enhance User Management:
New Page: /team - Clinic owner can:

Invite consultants and assistants via email
Set permissions per user (view-only, full-access, admin)
Deactivate users when they leave
Track active sessions

Add User Invitation System:
sqlCREATE TABLE invitations (
  id UUID PRIMARY KEY,
  clinic_id UUID REFERENCES clinics(id),
  email TEXT NOT NULL,
  role TEXT, -- consultant, assistant
  invited_by UUID REFERENCES users(id),
  token TEXT UNIQUE,
  status TEXT DEFAULT 'pending', -- pending, accepted, expired
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
File: client/src/pages/team-management.tsx
5. Clinic Settings & Customization
New Page: /settings with tabs:

Clinic Profile: Name, logo, address, contact
Branding: Color theme, logo for reports
Working Hours: Default clinic hours per day
Notifications: Email/SMS preferences
Integrations: M-Pesa API keys, SMS provider
Data Privacy: GDPR/Kenya Data Protection Act compliance toggles

6. Usage Limits & Feature Gating
Implement Tier-Based Limits:
FeatureTrialBasicProEnterpriseConsultants125UnlimitedAssistants1310UnlimitedPatients/month502001000UnlimitedStorage (GB)11050CustomSMS notifications❌✅✅✅Custom reports❌❌✅✅API access❌❌❌✅
Enforcement in Code:
typescript// client/src/lib/subscription.ts
export function canAddPatient(clinic: Clinic): boolean {
  const limit = PLAN_LIMITS[clinic.subscription_tier].patients_per_month;
  return clinic.monthly_patient_count < limit;
}

// Use in patient creation flow
if (!canAddPatient(currentClinic)) {
  showUpgradePrompt();
  return;
}
7. Reporting & Analytics Dashboard
New Page: /analytics (Pro/Enterprise only)

Patient volume trends
Revenue tracking (procedure costs)
Consultant productivity metrics
Hospital-wise patient distribution
Export reports as PDF/Excel

8. Marketing Website & Landing Page
Separate Public Site:

client/src/pages/landing.tsx - Homepage explaining ClinicFlow
Pricing page
Features showcase
Kenyan healthcare compliance info
Demo booking form
Blog/resources for clinic management tips

9. Admin Super-Dashboard
New Role: super_admin for ClinicFlow operators
Admin Portal (/admin):

View all clinics
Monitor subscriptions and payments
Handle support tickets
Manually adjust limits or grant trial extensions
View system-wide analytics

10. Security & Compliance Enhancements
For Kenya's Data Protection Act:

Add consent tracking for patient data
Data retention policies
Audit logging (who accessed what patient record when)
Encrypted fields for sensitive data (ID numbers, insurance info)

New Table:
sqlCREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  clinic_id UUID,
  user_id UUID,
  action TEXT, -- view_patient, update_record, export_data
  resource_type TEXT,
  resource_id UUID,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
11. Communication Features

SMS Notifications (via Africa's Talking API for Kenya):

Appointment reminders
Prescription ready alerts
Payment confirmations


WhatsApp Integration (optional):

Automated appointment confirmations



12. Migration Path for Existing Data
Since your app currently has no multi-tenancy:

Create a "default clinic" for current data
Migrate all existing records to belong to this clinic
Convert current users to clinic owners/staff


Implementation Priority Order:
Phase 1 (MVP - 2-3 weeks):

✅ Add clinics table and multi-tenancy to database
✅ Implement RLS policies in Supabase
✅ Create clinic signup/onboarding flow
✅ Add team invitation system
✅ Build basic subscription tracking (no payment yet)

Phase 2 (Payment Integration - 2 weeks):

✅ M-Pesa Daraja API integration
✅ Subscription plans and upgrade flow
✅ Usage limits enforcement
✅ Billing/invoices page

Phase 3 (Polish - 2-3 weeks):

✅ Marketing landing page
✅ Analytics dashboard
✅ Clinic settings customization
✅ SMS notifications
✅ Admin portal

Phase 4 (Scale):

✅ Advanced reporting
✅ Mobile app (React Native reusing components)
✅ API for third-party integrations


Key Files You'll Need to Create/Modify:
New Files:

shared/schema.ts - Add clinics, subscriptions, invitations tables
client/src/pages/clinic-onboarding.tsx
client/src/pages/team-management.tsx
client/src/pages/subscription.tsx
client/src/pages/billing.tsx
client/src/pages/landing.tsx
client/src/lib/mpesa.ts - M-Pesa integration
client/src/lib/subscription.ts - Plan limits logic
client/src/contexts/ClinicContext.tsx - Current clinic state

Modified Files:

client/src/App.tsx - Add clinic context, update routing
client/src/components/app-sidebar.tsx - Add clinic switcher, settings link
All data fetching queries - Add .eq('clinic_id', currentClinic.id) filters