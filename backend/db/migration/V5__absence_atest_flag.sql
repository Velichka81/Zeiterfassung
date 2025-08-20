-- Add A-Test flag to absence and seed a few demo rows with A-Test
ALTER TABLE absence ADD COLUMN has_atest INTEGER DEFAULT 0;
