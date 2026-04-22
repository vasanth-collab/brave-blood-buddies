-- =========================================
-- ENUMS
-- =========================================
CREATE TYPE public.app_role AS ENUM ('admin', 'donor', 'requester');
CREATE TYPE public.blood_group AS ENUM ('A+','A-','B+','B-','AB+','AB-','O+','O-');
CREATE TYPE public.urgency_level AS ENUM ('normal','urgent','critical');
CREATE TYPE public.request_status AS ENUM ('open','confirmed','fulfilled','cancelled');
CREATE TYPE public.donor_role AS ENUM ('primary','alternate');
CREATE TYPE public.response_status AS ENUM ('pending','accepted','declined','unable','expired');

-- =========================================
-- PROFILES
-- =========================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  blood_group public.blood_group,
  location TEXT NOT NULL DEFAULT '',
  pincode TEXT NOT NULL DEFAULT '',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =========================================
-- USER ROLES (separate table — security best practice)
-- =========================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- =========================================
-- DONOR DETAILS
-- =========================================
CREATE TABLE public.donor_details (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_available BOOLEAN NOT NULL DEFAULT true,
  last_donation_date TIMESTAMPTZ,
  total_donations INTEGER NOT NULL DEFAULT 0,
  total_responses INTEGER NOT NULL DEFAULT 0,
  total_requests INTEGER NOT NULL DEFAULT 0,
  reliability_score INTEGER NOT NULL DEFAULT 25,
  last_active_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.donor_details ENABLE ROW LEVEL SECURITY;

-- =========================================
-- BLOOD REQUESTS
-- =========================================
CREATE TABLE public.blood_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requester_name TEXT NOT NULL,
  blood_group public.blood_group NOT NULL,
  location TEXT NOT NULL,
  pincode TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  urgency public.urgency_level NOT NULL DEFAULT 'normal',
  units_needed INTEGER NOT NULL DEFAULT 1,
  hospital_name TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  status public.request_status NOT NULL DEFAULT 'open',
  current_radius_km INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.blood_requests ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_blood_requests_status ON public.blood_requests(status);
CREATE INDEX idx_blood_requests_blood_group ON public.blood_requests(blood_group);

-- =========================================
-- DONOR ASSIGNMENTS (Primary + Alternate per request)
-- =========================================
CREATE TABLE public.donor_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.blood_requests(id) ON DELETE CASCADE,
  donor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.donor_role NOT NULL,
  response_status public.response_status NOT NULL DEFAULT 'pending',
  distance_km DOUBLE PRECISION,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at TIMESTAMPTZ,
  response_deadline TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 minutes'),
  UNIQUE(request_id, role),
  UNIQUE(request_id, donor_id)
);
ALTER TABLE public.donor_assignments ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_assignments_donor ON public.donor_assignments(donor_id);
CREATE INDEX idx_assignments_request ON public.donor_assignments(request_id);

-- =========================================
-- NOTIFICATIONS
-- =========================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_notifications_user ON public.notifications(user_id, is_read);

-- =========================================
-- RLS POLICIES
-- =========================================

-- Profiles: signed-in users can read all profiles (needed for donor cards / requester names)
CREATE POLICY "Authenticated can view profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- User roles
CREATE POLICY "Users view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Donor details
CREATE POLICY "Authenticated view donor details" ON public.donor_details
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users insert own donor details" ON public.donor_details
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own donor details" ON public.donor_details
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Blood requests
CREATE POLICY "Authenticated view requests" ON public.blood_requests
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users create own requests" ON public.blood_requests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Users update own requests" ON public.blood_requests
  FOR UPDATE TO authenticated USING (auth.uid() = requester_id);
CREATE POLICY "Users delete own requests" ON public.blood_requests
  FOR DELETE TO authenticated USING (auth.uid() = requester_id);

-- Donor assignments
CREATE POLICY "Donors and requesters view assignments" ON public.donor_assignments
  FOR SELECT TO authenticated USING (
    auth.uid() = donor_id
    OR EXISTS (SELECT 1 FROM public.blood_requests r WHERE r.id = request_id AND r.requester_id = auth.uid())
  );
CREATE POLICY "Donors update own assignment response" ON public.donor_assignments
  FOR UPDATE TO authenticated USING (auth.uid() = donor_id);

-- Notifications
CREATE POLICY "Users view own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- =========================================
-- TRIGGERS
-- =========================================

-- updated_at helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_donor_details_updated BEFORE UPDATE ON public.donor_details
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_blood_requests_updated BEFORE UPDATE ON public.blood_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile + donor role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, phone, blood_group, location, pincode)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    NULLIF(NEW.raw_user_meta_data->>'blood_group','')::public.blood_group,
    COALESCE(NEW.raw_user_meta_data->>'location', ''),
    COALESCE(NEW.raw_user_meta_data->>'pincode', '')
  );

  -- Default role: donor (users can request blood too without needing requester role)
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'donor');
  INSERT INTO public.donor_details (user_id) VALUES (NEW.id);

  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Sync request status when assignments change
CREATE OR REPLACE FUNCTION public.sync_request_status()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_primary public.response_status;
  v_alternate public.response_status;
  v_current_status public.request_status;
BEGIN
  SELECT status INTO v_current_status FROM public.blood_requests WHERE id = NEW.request_id;
  IF v_current_status IN ('fulfilled','cancelled') THEN RETURN NEW; END IF;

  SELECT response_status INTO v_primary FROM public.donor_assignments
    WHERE request_id = NEW.request_id AND role = 'primary';
  SELECT response_status INTO v_alternate FROM public.donor_assignments
    WHERE request_id = NEW.request_id AND role = 'alternate';

  -- Both accepted -> confirmed
  IF v_primary = 'accepted' AND v_alternate = 'accepted' THEN
    UPDATE public.blood_requests SET status = 'confirmed' WHERE id = NEW.request_id;
  ELSE
    -- Otherwise keep open so cron can promote / re-assign
    UPDATE public.blood_requests SET status = 'open' WHERE id = NEW.request_id AND status = 'confirmed';
  END IF;

  -- If primary declined/unable, promote alternate to primary (if alternate hasn't refused)
  IF NEW.role = 'primary' AND NEW.response_status IN ('declined','unable','expired') THEN
    IF v_alternate IS NOT NULL AND v_alternate NOT IN ('declined','unable','expired') THEN
      -- swap: delete old primary first, then promote alternate
      DELETE FROM public.donor_assignments WHERE request_id = NEW.request_id AND role = 'primary';
      UPDATE public.donor_assignments
        SET role = 'primary',
            response_deadline = now() + interval '30 minutes'
        WHERE request_id = NEW.request_id AND role = 'alternate';
    END IF;
  END IF;

  RETURN NEW;
END; $$;

CREATE TRIGGER trg_sync_request_status
  AFTER INSERT OR UPDATE OF response_status ON public.donor_assignments
  FOR EACH ROW EXECUTE FUNCTION public.sync_request_status();

-- =========================================
-- REALTIME
-- =========================================
ALTER TABLE public.donor_assignments REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.blood_requests REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.donor_assignments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.blood_requests;