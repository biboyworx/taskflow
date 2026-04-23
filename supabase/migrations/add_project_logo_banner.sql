-- Add logo_url and banner_url columns to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS banner_url text;
