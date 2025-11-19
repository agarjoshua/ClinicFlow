-- Demo Clinic Seed Data - STEP 1: Create Clinic
-- Run this first, then get the generated clinic ID
-- Date: 2025-11-19

BEGIN;

INSERT INTO clinics (name, slug, owner_id, subscription_tier, subscription_status, max_consultants, max_assistants, settings)
VALUES (
  'Nairobi Neurosurgery Center - Demo',
  'nairobi-neurosurgery-demo',
  NULL, -- Will be updated after creating demo users
  'professional',
  'active',
  5,
  10,
  '{"demo": true, "features": ["advanced_analytics", "multi_location", "api_access"]}'::jsonb
)
RETURNING id, name, slug;

-- Copy the returned 'id' value - you'll need it for the next steps!

COMMIT;
