# Paystack Integration Guide

This document explains how to set up and use the Paystack payment integration for ZahaniFlow subscription management.

## Overview

ZahaniFlow uses Paystack to process subscription payments with three tiers:
- **Starter**: KES 5,000/month (1 consultant, 2 assistants)
- **Professional**: KES 15,000/month (5 consultants, 10 assistants)
- **Enterprise**: Custom pricing (contact tech@zahaniflow.com)

## Features

- ✅ Payment initialization and processing
- ✅ Automatic subscription activation on successful payment
- ✅ Webhook support for payment events
- ✅ Subscription status tracking (active, suspended, cancelled, expired)
- ✅ Visual overlay blocking access for non-paying users
- ✅ SuperAdmin access control (suspend/activate clinics)
- ✅ Custom suspension messages

## Setup Instructions

### 1. Paystack Account Setup

1. Create a Paystack account at https://paystack.com
2. Complete KYC verification to go live
3. Get your API keys from Settings → API Keys & Webhooks

### 2. Environment Variables

Add these to your Netlify environment variables:

```bash
# Supabase (already configured)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Paystack (NEW - required)
PAYSTACK_SECRET_KEY=sk_live_xxxxx
PAYSTACK_PUBLIC_KEY=pk_live_xxxxx  # Optional, for future use
```

**Important**: Use `sk_test_xxxxx` for testing and `sk_live_xxxxx` for production.

### 3. Paystack Webhook Configuration

1. Go to Paystack Dashboard → Settings → API Keys & Webhooks
2. Add webhook URL: `https://yourdomain.com/.netlify/functions/paystack-webhook`
3. Copy the generated webhook secret (not currently used, but keep for future)

### 4. Database Migration

Add the `subscription_end_date` column to your `clinics` table:

```sql
ALTER TABLE clinics 
ADD COLUMN subscription_end_date TIMESTAMP;
```

The `settings` jsonb column is already present and will store custom suspension messages.

## How It Works

### Payment Flow

1. **User clicks "Select Plan"** on `/settings/subscription`
2. **Frontend calls** `/.netlify/functions/paystack-initialize` with:
   - Email, amount, plan, clinic_id
3. **Backend initializes** Paystack transaction
4. **User redirects** to Paystack payment page
5. **After payment**, Paystack redirects to `/.netlify/functions/paystack-callback`
6. **Callback verifies** payment with Paystack API
7. **Updates database**:
   - `subscription_tier` = selected plan
   - `subscription_status` = "active"
   - `subscription_end_date` = +1 month
8. **Redirects** user to `/settings/subscription?success=payment_successful`

### Webhook Events

The webhook handler processes these events:

- **charge.success**: Activates subscription, sets end date
- **subscription.disable**: Sets status to "suspended"
- **subscription.not_renew**: Sets status to "cancelled"
- **subscription.create**: Logs subscription creation

### Access Control

**For Regular Users:**
- Subscription overlay appears when status is: suspended, cancelled, or expired
- Blocks all UI interactions with striped gray overlay
- Shows custom message from SuperAdmin or default message
- Provides two actions: "Renew Subscription" or "Contact Support"

**For SuperAdmin:**
- Never sees overlay (always has access)
- Can suspend/activate any clinic from SuperAdmin portal
- Can set custom suspension messages
- Messages stored in `clinics.settings.suspension_message`

## API Endpoints

### Initialize Payment
```
POST /.netlify/functions/paystack-initialize
```

**Request:**
```json
{
  "email": "user@example.com",
  "amount": 500000,  // Amount in kobo (KES 5,000 * 100)
  "plan": "starter",
  "clinic_id": "uuid",
  "callback_url": "https://yourdomain.com/.netlify/functions/paystack-callback"
}
```

**Response:**
```json
{
  "status": true,
  "message": "Authorization URL created",
  "data": {
    "authorization_url": "https://checkout.paystack.com/xxxxx",
    "access_code": "xxxxx",
    "reference": "xxxxx"
  }
}
```

### Callback Handler
```
GET /.netlify/functions/paystack-callback?reference=xxxxx
```

Automatically verifies payment and redirects to subscription page with success/error params.

### Webhook Handler
```
POST /.netlify/functions/paystack-webhook
```

Receives events from Paystack and updates subscription status accordingly.

## Database Schema

### Clinics Table
```typescript
{
  id: uuid,
  name: string,
  subscription_tier: 'starter' | 'professional' | 'enterprise',
  subscription_status: 'active' | 'suspended' | 'cancelled' | 'expired',
  subscription_end_date: timestamp,
  settings: jsonb // Contains { suspension_message?: string, ... }
}
```

## SuperAdmin Controls

### Suspend a Clinic

1. Go to SuperAdmin Portal → Clinics tab
2. Click "..." menu on clinic row
3. Select "Suspend Access"
4. Enter optional custom message
5. Click "Suspend Clinic"

Custom message example:
> "Payment overdue. Please contact tech@zahaniflow.com to restore access."

### Activate a Clinic

1. Go to SuperAdmin Portal → Clinics tab
2. Find suspended clinic (Status badge shows "suspended")
3. Click "..." menu
4. Select "Activate Clinic"
5. Status instantly changes to "active"

## Testing

### Test Mode

1. Use test keys: `sk_test_xxxxx` and `pk_test_xxxxx`
2. Use Paystack test cards:
   - Success: `4084 0840 8408 4081` (any CVV, future expiry)
   - Decline: `5060 6666 6666 6666 4444`
3. Test webhook events using Paystack Dashboard → Developers → Webhooks → Test

### Test Suspension

1. Create a test clinic
2. Go to SuperAdmin portal
3. Suspend the clinic with a test message
4. Log out, log in as clinic user
5. Verify overlay appears with message
6. Test "Contact Support" and "Renew Subscription" buttons
7. Reactivate from SuperAdmin
8. Verify overlay disappears

## Troubleshooting

### Payment not activating subscription

- Check Netlify function logs for errors
- Verify `PAYSTACK_SECRET_KEY` is set correctly
- Check callback URL is accessible (not blocked by firewall)
- Verify Supabase credentials are correct

### Webhook not working

- Check webhook signature verification
- Ensure webhook URL is publicly accessible
- Check Netlify function logs
- Verify events are being sent from Paystack Dashboard

### Overlay not showing

- Check subscription_status is "suspended", "cancelled", or "expired"
- Verify user is not superadmin
- Check browser console for React errors
- Verify subscription-overlay.tsx is imported in App.tsx

### Custom message not displaying

- Verify message is stored in `clinics.settings.suspension_message`
- Check subscription overlay query includes `settings` field
- Look for JSON parsing errors in console

## Support

For technical support, contact: **tech@zahaniflow.com**

## Security Notes

- Never commit `.env` files to version control
- Use environment variables for all secrets
- Keep `SUPABASE_SERVICE_ROLE_KEY` secure (full database access)
- Keep `PAYSTACK_SECRET_KEY` secure (can process payments)
- Verify webhook signatures to prevent fraud
- Use HTTPS only for callback and webhook URLs

## Future Enhancements

- [ ] Add payment history table
- [ ] Show invoice downloads
- [ ] Support for annual billing (discounts)
- [ ] Automatic email notifications for expiring subscriptions
- [ ] Grace period before suspension (3 days)
- [ ] Multiple payment methods (M-Pesa, bank transfer)
- [ ] Proration for plan upgrades/downgrades
