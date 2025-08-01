-- Fix confirmation_token column issue in auth.users table
-- Convert NULL values to empty string to prevent SQL scan errors
UPDATE auth.users 
SET confirmation_token = ''
WHERE confirmation_token IS NULL;