-- Populate combos for existing runs prior to column addition
UPDATE "runs" SET "combos" = '[]'::jsonb WHERE "combos" IS NULL; 