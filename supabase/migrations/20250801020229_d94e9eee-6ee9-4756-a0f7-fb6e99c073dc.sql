-- Fix email_change column issue in auth.users table
-- Convert NULL values to empty string to prevent SQL scan errors
UPDATE auth.users 
SET email_change = ''
WHERE email_change IS NULL;