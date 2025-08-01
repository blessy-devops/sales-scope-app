-- Fix the confirmation_token column issue in auth.users table
-- This addresses the "Scan error on column index 3, name 'confirmation_token': converting NULL to string is unsupported"

-- Update any NULL confirmation_token values to empty string
UPDATE auth.users 
SET confirmation_token = COALESCE(confirmation_token, '')
WHERE confirmation_token IS NULL;