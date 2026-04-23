-- Drop existing FKs that point to auth.users
ALTER TABLE public.donor_assignments DROP CONSTRAINT IF EXISTS donor_assignments_donor_id_fkey;
ALTER TABLE public.donor_details DROP CONSTRAINT IF EXISTS donor_details_user_id_fkey;

-- Re-create pointing to public.profiles so PostgREST can expose joins
ALTER TABLE public.donor_assignments
  ADD CONSTRAINT donor_assignments_donor_id_fkey
  FOREIGN KEY (donor_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.donor_details
  ADD CONSTRAINT donor_details_user_id_unique UNIQUE (user_id);

ALTER TABLE public.donor_details
  ADD CONSTRAINT donor_details_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_donor_assignments_donor_id ON public.donor_assignments(donor_id);
CREATE INDEX IF NOT EXISTS idx_donor_assignments_request_id ON public.donor_assignments(request_id);
CREATE INDEX IF NOT EXISTS idx_profiles_blood_group ON public.profiles(blood_group);
CREATE INDEX IF NOT EXISTS idx_blood_requests_status ON public.blood_requests(status);

-- Tell PostgREST to reload its schema cache so the new relationships are visible
NOTIFY pgrst, 'reload schema';