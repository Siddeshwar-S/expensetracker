-- Add is_default column to categories and payment_methods tables
-- This allows marking which items should be visible to new users by default

-- Add is_default column to categories
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT true;

-- Add is_default column to payment_methods
ALTER TABLE payment_methods 
ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT true;

-- Mark all existing categories as default (you can change this later)
UPDATE categories SET is_default = true WHERE is_default IS NULL;

-- Mark all existing payment methods as default (you can change this later)
UPDATE payment_methods SET is_default = true WHERE is_default IS NULL;

-- Optional: Mark specific items as non-default (hidden for new users)
-- Uncomment and modify as needed:

-- UPDATE categories SET is_default = false WHERE name IN ('Custom Category 1', 'Custom Category 2');
-- UPDATE payment_methods SET is_default = false WHERE name IN ('Custom Payment 1', 'Custom Payment 2');
