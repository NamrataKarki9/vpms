-- Run this SQL script on the shared Neon database to fix migration history sync issues
-- This ensures all collaborators have the correct migration history recorded

-- Insert current production migrations into __EFMigrationsHistory
INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES 
  ('20260512114157_InitialCreate', '8.0.0'),
  ('20260512141745_AddPasswordResetOtp', '8.0.0')
ON CONFLICT DO NOTHING;

-- Verify the records were inserted
SELECT "MigrationId", "ProductVersion" FROM "__EFMigrationsHistory" ORDER BY "MigrationId";
