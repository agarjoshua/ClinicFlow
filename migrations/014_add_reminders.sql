-- Migration 014: Add reminders for anniversaries, license renewals, and custom events
-- Date: 2025-11-17

BEGIN;

-- Create reminders table
CREATE TABLE IF NOT EXISTS reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  reminder_type text NOT NULL, -- 'anniversary', 'license_renewal', 'custom', 'birthday'
  reminder_date timestamptz NOT NULL,
  color_code text DEFAULT '#3B82F6', -- Hex color for calendar display
  is_recurring boolean DEFAULT false,
  recurrence_pattern text, -- 'yearly', 'monthly', 'weekly', 'daily'
  recurrence_end_date timestamptz,
  notification_channels jsonb DEFAULT '{"email": false, "sms": false, "in_app": true}'::jsonb,
  notification_days_before integer[] DEFAULT ARRAY[7, 3, 1], -- Notify 7, 3, and 1 days before
  status text DEFAULT 'active', -- 'active', 'completed', 'dismissed'
  created_at timestamptz DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz DEFAULT timezone('utc'::text, now())
);

-- Create index for efficient date-based queries
CREATE INDEX IF NOT EXISTS idx_reminders_clinic_date ON reminders(clinic_id, reminder_date);
CREATE INDEX IF NOT EXISTS idx_reminders_user_date ON reminders(user_id, reminder_date);
CREATE INDEX IF NOT EXISTS idx_reminders_type ON reminders(reminder_type);

COMMIT;
