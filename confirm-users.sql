-- ============================================
-- Confirm All Users' Emails
-- ============================================
-- This fixes the email confirmation issue when 
-- "Confirm email" is turned off but users still 
-- need to confirm their email

-- Confirm Dr. Lee Oguda's email
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email = 'leeoguda@gmail.com';

-- Optionally: Confirm all users at once
-- Uncomment the line below if you want to confirm ALL users
-- UPDATE auth.users 
-- SET email_confirmed_at = NOW()
-- WHERE email_confirmed_at IS NULL;

-- Verify the update
SELECT id, email, email_confirmed_at, confirmed_at 
FROM auth.users 
WHERE email = 'leeoguda@gmail.com';
