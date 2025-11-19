# SuperAdmin Portal - Setup & Usage Guide

## Overview

The SuperAdmin Portal provides platform-wide analytics and subscription management for ZahaniFlow/ClinicFlow. It allows you to monitor all clinics, track feature usage, and manage subscriptions from a single dashboard.

---

## Features

### 1. **Feature Usage Analytics** 📊
Track which features are used most across the platform:
- **Patient Appointments** - Booking system usage
- **Clinical Diagnoses** - Diagnosis feature adoption
- **Procedures Scheduled** - Surgical planning usage
- **Patient Registrations** - New patient onboarding
- **Clinic Sessions** - Calendar management usage
- **Patient Admissions** - Inpatient management usage

**Analytics Include:**
- Usage counts over selectable time periods (7, 30, 90, 365 days)
- Last used timestamps for each feature
- Percentage distribution of feature usage
- Visual bar charts and pie charts
- Ability to filter by specific clinic or view all clinics

### 2. **Clinic Management** 🏥
View and manage all clinics on the platform:
- Clinic name and creation date
- Subscription status (active, trial, expired)
- Subscription tier (trial, premium, enterprise)
- User count (consultants + assistants)
- Patient count
- Appointment count
- Quick actions for management

### 3. **Subscription Management** 💳
Monitor revenue and subscription distribution:
- Monthly Recurring Revenue (MRR) calculation
- Subscription tier distribution:
  - **Trial** - Free tier
  - **Premium** - $99/month
  - **Enterprise** - $299/month
- Revenue breakdown by clinic
- Next billing dates
- Status tracking (active, trial, expired, cancelled)

### 4. **Platform Overview** 📈
High-level metrics displayed in summary cards:
- **Total Clinics** - All registered clinics
- **Active Clinics** - Clinics with active subscriptions
- **MRR** - Monthly recurring revenue
- **Total Users** - All consultants and assistants
- **Total Patients** - Patients across all clinics
- **Platform Health** - System status indicator

---

## Setup Instructions

### Step 1: Create SuperAdmin Auth User

1. Log in to your **Supabase Dashboard**
2. Navigate to **Authentication** → **Users**
3. Click **Add User** → **Create new user**
4. Enter details:
   - **Email:** `superadmin@zahaniflow.com` (or your preferred email)
   - **Password:** Create a strong password
   - **Auto Confirm User:** ✅ Enable
5. Click **Create User**
6. **Copy the User ID** (UUID) from the user list

### Step 2: Create SuperAdmin Profile

1. Go to **SQL Editor** in Supabase
2. Open `migrations/create_superadmin.sql`
3. Replace `YOUR_SUPERADMIN_AUTH_UID` with the UUID you copied
4. Run the migration:
   ```sql
   INSERT INTO users (user_id, name, email, role, phone, clinic_id)
   VALUES (
     'abc123-your-uuid-here'::text,
     'Super Admin',
     'superadmin@zahaniflow.com',
     'superadmin',
     NULL,
     NULL
   );
   ```
5. Verify with:
   ```sql
   SELECT * FROM users WHERE role = 'superadmin';
   ```

### Step 3: Access the Portal

1. Log out of any current session
2. Navigate to `/auth`
3. Sign in with superadmin credentials
4. You'll see a new **SuperAdmin Portal** menu item in the sidebar (with crown icon)
5. Click it to access the dashboard at `/superadmin`

---

## Usage Guide

### Viewing Analytics

1. **Select Time Period:**
   - Use the dropdown in the top-right to select: Last 7 Days, 30 Days, 90 Days, or Last Year
   - Analytics will update automatically

2. **Filter by Clinic:**
   - Use the clinic dropdown to filter data for a specific clinic
   - Select "All Clinics" to view platform-wide data

3. **Feature Usage Tab:**
   - View bar chart showing usage counts
   - Check detailed table with:
     - Feature name
     - Total usage count
     - Last used timestamp
     - Percentage of total activity

4. **Subscription Distribution:**
   - Pie chart shows breakdown by tier
   - Visualize trial vs. paying customers

### Managing Clinics

1. Go to **Clinic Management** tab
2. View all clinics in sortable table
3. See key metrics for each clinic:
   - Status badge (active/trial)
   - Tier badge (trial/premium/enterprise)
   - User count
   - Patient count
   - Appointment count
   - Creation date
4. Use **Manage** button for future actions (upgrade, suspend, etc.)

### Monitoring Subscriptions

1. Go to **Subscriptions** tab
2. View summary cards for each tier:
   - Number of clinics on each tier
   - Revenue generated per tier
3. Check detailed subscription table:
   - Clinic name and current tier
   - Status (active, trial, expired)
   - Monthly revenue contribution
   - Next billing date

---

## Key Insights You Can Track

### Feature Adoption
- **Most Used Features:** Identify which features provide the most value
- **Underutilized Features:** Find features that need improvement or better onboarding
- **Usage Trends:** Track adoption over different time periods
- **Clinic-Specific Patterns:** See how individual clinics use the platform

### Business Metrics
- **Revenue Growth:** Track MRR as new clinics subscribe
- **Conversion Rate:** Monitor trial-to-paid conversion
- **Churn Risk:** Identify inactive clinics
- **Expansion Opportunities:** Find clinics ready to upgrade tiers

### Platform Health
- **Active Clinics:** Monitor engagement
- **User Growth:** Track consultant/assistant onboarding
- **Patient Volume:** Measure platform scale
- **Feature Utilization:** Ensure value delivery

---

## Security Notes

⚠️ **Important Security Considerations:**

1. **SuperAdmin Access:**
   - Superadmin role bypasses clinic isolation
   - Can view data across ALL clinics
   - Should be limited to trusted platform administrators only

2. **Authentication:**
   - Uses standard Supabase Auth
   - Requires manual account creation (no self-service)
   - Recommend enabling MFA for superadmin accounts

3. **Data Privacy:**
   - SuperAdmin can see aggregated statistics
   - Patient-level data is not exposed in analytics
   - Complies with multi-tenancy isolation for regular users

4. **RLS Considerations:**
   - SuperAdmin queries do NOT filter by clinic_id
   - This is intentional for platform-wide visibility
   - Regular users (consultants/assistants) remain isolated to their clinic

---

## Future Enhancements

Potential additions to the SuperAdmin Portal:

- [ ] **Clinic Suspension/Activation** - Disable access for non-paying clinics
- [ ] **Usage-Based Billing** - Track usage beyond flat subscription
- [ ] **Audit Logs** - Track all superadmin actions
- [ ] **Email Campaigns** - Send announcements to all or filtered clinics
- [ ] **Support Ticket System** - Manage support requests
- [ ] **Performance Monitoring** - Query performance and error tracking
- [ ] **Export Reports** - Generate CSV/PDF reports
- [ ] **Custom Dashboards** - Create saved views for specific metrics
- [ ] **Alerts & Notifications** - Get notified of critical events
- [ ] **A/B Testing Dashboard** - Track feature experiments

---

## Troubleshooting

### "No data showing in analytics"
- Ensure clinics have created records (patients, appointments, etc.)
- Check date filter - try expanding to "Last Year"
- Verify clinic_id is correctly set on all records

### "Unauthorized access"
- Confirm user role is set to `'superadmin'` in users table
- Log out and log back in to refresh session
- Check browser console for authentication errors

### "Charts not rendering"
- Ensure recharts is installed: `npm install recharts`
- Check browser console for errors
- Verify data is being fetched (check Network tab)

### "Revenue calculation incorrect"
- Review subscription_tier values in clinics table
- Ensure tier values are: 'trial', 'premium', or 'enterprise'
- Check subscription_status is 'active' for paying clinics

---

## API Reference

### SuperAdmin Queries

All queries run without clinic_id filtering:

```typescript
// Get all clinics
const { data } = await supabase
  .from("clinics")
  .select("*")
  .order("created_at", { ascending: false });

// Get feature usage across all clinics
const { count } = await supabase
  .from("appointments")
  .select("*", { count: "exact" })
  .gte("created_at", dateThreshold);

// Get clinic statistics
const { count: userCount } = await supabase
  .from("users")
  .select("*", { count: "exact", head: true })
  .eq("clinic_id", clinicId);
```

---

## Support

For issues with the SuperAdmin Portal:
1. Check this documentation first
2. Review browser console for errors
3. Contact platform administrator
4. Email: support@zahaniflow.com (if applicable)

---

**Last Updated:** January 2025  
**Version:** 1.0.0
