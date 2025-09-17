-- First, create a default company for users who don't have one
INSERT INTO public.companies (name, domain) 
VALUES ('Averda', 'averda.com')
ON CONFLICT DO NOTHING;

-- Update the user's profile to have the company_id and admin role so they can create training plans
UPDATE public.profiles 
SET 
  company_id = (SELECT id FROM public.companies WHERE name = 'Averda' LIMIT 1),
  role = 'admin'
WHERE id = '535f31d7-adb7-462a-ab08-f0b22048f2d4' AND company_id IS NULL;