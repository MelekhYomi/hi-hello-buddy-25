-- Update the public contact email shown in the footer, contact section and
-- quote replies. Stored as a JSON string in site_settings.
UPDATE site_settings
SET value = '"info@cimperiumbrand.com"'::jsonb,
    updated_at = now()
WHERE key = 'contact_email';
