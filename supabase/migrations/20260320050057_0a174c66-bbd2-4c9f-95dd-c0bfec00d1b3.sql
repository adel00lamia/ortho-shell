-- Add succession_candidates column to positions table for succession planning
ALTER TABLE public.positions
ADD COLUMN succession_candidates jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.positions.succession_candidates IS 'Array of {name, readiness} objects for backup candidates';