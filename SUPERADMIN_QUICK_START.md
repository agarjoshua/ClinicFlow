# SuperAdmin Quick Access Card

## 🚀 Quick Setup (5 minutes)

### 1. Create Auth User
```
Supabase Dashboard → Authentication → Users → Add User
Email: superadmin@zahaniflow.com
Password: [Your Strong Password]
✅ Auto Confirm User
```

### 2. Get User ID
Copy the UUID from the user list (looks like: `abc12345-6789-...`)

### 3. Run SQL Migration
```sql
-- In Supabase SQL Editor
INSERT INTO users (user_id, name, email, role, phone, clinic_id)
VALUES (
  'YOUR_UUID_HERE',  -- ⚠️ Replace with actual UUID
  'Super Admin',
  'superadmin@zahaniflow.com',
  'superadmin',
  NULL,
  NULL
);
```

### 4. Login & Access
```
1. Go to /auth
2. Login with superadmin credentials
3. Look for 👑 SuperAdmin Portal in sidebar
4. Click to access dashboard at /superadmin
```

---

## 📊 What You Can Track

### Feature Analytics
- Most/least used features across platform
- Usage trends over time (7d, 30d, 90d, 1y)
- Per-clinic feature adoption
- Last used timestamps

### Business Metrics
- Monthly Recurring Revenue (MRR)
- Subscription distribution (Trial/Premium/Enterprise)
- Active vs. inactive clinics
- User growth (consultants + assistants)
- Patient volume

### Clinic Health
- Individual clinic statistics
- User counts per clinic
- Patient counts per clinic
- Appointment activity

---

## 🎯 Key Use Cases

**Product Decisions:**
- Which features to prioritize based on usage
- Which features need better onboarding
- Feature adoption patterns

**Sales & Growth:**
- Identify clinics ready to upgrade
- Track trial-to-paid conversions
- Monitor churn risks

**Support:**
- Identify struggling clinics (low usage)
- Proactive outreach opportunities
- Usage-based success metrics

---

## 🔒 Security Note

Superadmin role:
- ✅ Sees ALL clinic data (for analytics)
- ✅ Platform-wide visibility
- ⚠️ Should be limited to trusted admins only
- ⚠️ No self-service access
- 💡 Recommend enabling MFA

---

## 📋 Revenue Calculation

```
Trial:      $0/month
Premium:    $99/month
Enterprise: $299/month

MRR = (Premium clinics × $99) + (Enterprise clinics × $299)
```

---

## 🎨 Dashboard Tabs

| Tab | What It Shows |
|-----|---------------|
| **Feature Analytics** | Usage charts, feature adoption, trends |
| **Clinic Management** | All clinics table with stats |
| **Subscriptions** | Revenue breakdown, tier distribution |

---

## 🛠️ Troubleshooting

**"Unauthorized"**
→ Check user role = 'superadmin' in database

**"No analytics data"**
→ Expand date range or check if clinics have activity

**"Charts not showing"**
→ Verify recharts is installed: `npm install recharts`

---

## 📞 Support
Full documentation: `SUPERADMIN_PORTAL_GUIDE.md`
