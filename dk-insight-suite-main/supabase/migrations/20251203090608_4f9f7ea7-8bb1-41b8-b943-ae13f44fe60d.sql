-- Create enum for device status
CREATE TYPE public.device_status AS ENUM ('online', 'idle', 'offline');

-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'it', 'employee');

-- Organizations table
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  domain TEXT,
  screenshot_interval_sec INTEGER DEFAULT 300,
  idle_threshold_sec INTEGER DEFAULT 300,
  working_hours TEXT DEFAULT '09:00-18:00',
  retention_days INTEGER DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User profiles table (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  org_id UUID REFERENCES public.organizations(id),
  email TEXT NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User roles table (separate for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'employee',
  UNIQUE (user_id, role)
);

-- Devices table
CREATE TABLE public.devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.organizations(id),
  hostname TEXT NOT NULL,
  device_type TEXT DEFAULT 'Desktop',
  os TEXT,
  ip_address TEXT,
  agent_version TEXT,
  agent_token TEXT UNIQUE,
  last_seen TIMESTAMPTZ,
  status device_status DEFAULT 'offline',
  location TEXT,
  assigned_user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Sessions table (user sessions on device)
CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID REFERENCES public.devices(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  session_start TIMESTAMPTZ DEFAULT now(),
  session_end TIMESTAMPTZ,
  active_seconds INTEGER DEFAULT 0,
  idle_seconds INTEGER DEFAULT 0
);

-- Screenshots table
CREATE TABLE public.screenshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID REFERENCES public.devices(id) ON DELETE CASCADE NOT NULL,
  org_id UUID REFERENCES public.organizations(id),
  file_path TEXT NOT NULL,
  captured_at TIMESTAMPTZ NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT now(),
  session_id UUID REFERENCES public.sessions(id),
  meta JSONB DEFAULT '{}'::jsonb
);

-- Telemetry events table
CREATE TABLE public.telemetry_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID REFERENCES public.devices(id) ON DELETE CASCADE,
  org_id UUID REFERENCES public.organizations(id),
  event_type TEXT NOT NULL,
  event_time TIMESTAMPTZ DEFAULT now(),
  details JSONB DEFAULT '{}'::jsonb
);

-- Enrollment tokens table (one-time tokens for device enrollment)
CREATE TABLE public.enrollment_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.organizations(id) NOT NULL,
  token TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  used_at TIMESTAMPTZ,
  used_by_device_id UUID REFERENCES public.devices(id),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Audit logs table
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.organizations(id),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.screenshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telemetry_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollment_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to get user's org_id
CREATE OR REPLACE FUNCTION public.get_user_org_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT org_id FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

-- RLS Policies for organizations
CREATE POLICY "Users can view their org" ON public.organizations
  FOR SELECT USING (id = public.get_user_org_id(auth.uid()));

CREATE POLICY "Admins can update their org" ON public.organizations
  FOR UPDATE USING (id = public.get_user_org_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'));

-- RLS Policies for profiles
CREATE POLICY "Users can view profiles in their org" ON public.profiles
  FOR SELECT USING (org_id = public.get_user_org_id(auth.uid()));

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- RLS Policies for user_roles
CREATE POLICY "Users can view roles in their org" ON public.user_roles
  FOR SELECT USING (
    user_id IN (SELECT user_id FROM public.profiles WHERE org_id = public.get_user_org_id(auth.uid()))
  );

-- RLS Policies for devices
CREATE POLICY "Users can view devices in their org" ON public.devices
  FOR SELECT USING (org_id = public.get_user_org_id(auth.uid()));

CREATE POLICY "Admins/IT can insert devices" ON public.devices
  FOR INSERT WITH CHECK (
    org_id = public.get_user_org_id(auth.uid()) AND 
    (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'it'))
  );

CREATE POLICY "Admins/IT can update devices" ON public.devices
  FOR UPDATE USING (
    org_id = public.get_user_org_id(auth.uid()) AND 
    (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'it'))
  );

-- RLS Policies for sessions
CREATE POLICY "Users can view sessions in their org" ON public.sessions
  FOR SELECT USING (
    device_id IN (SELECT id FROM public.devices WHERE org_id = public.get_user_org_id(auth.uid()))
  );

-- RLS Policies for screenshots
CREATE POLICY "Admin/IT can view screenshots in their org" ON public.screenshots
  FOR SELECT USING (
    org_id = public.get_user_org_id(auth.uid()) AND
    (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'it'))
  );

-- RLS Policies for telemetry_events
CREATE POLICY "Admin/IT can view telemetry in their org" ON public.telemetry_events
  FOR SELECT USING (
    org_id = public.get_user_org_id(auth.uid()) AND
    (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'it'))
  );

-- RLS Policies for enrollment_tokens
CREATE POLICY "Admin/IT can manage enrollment tokens" ON public.enrollment_tokens
  FOR ALL USING (
    org_id = public.get_user_org_id(auth.uid()) AND
    (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'it'))
  );

-- RLS Policies for audit_logs
CREATE POLICY "Admin can view audit logs" ON public.audit_logs
  FOR SELECT USING (
    org_id = public.get_user_org_id(auth.uid()) AND
    public.has_role(auth.uid(), 'admin')
  );

-- Create storage bucket for screenshots
INSERT INTO storage.buckets (id, name, public) VALUES ('screenshots', 'screenshots', false);

-- Storage policies for screenshots bucket
CREATE POLICY "Admins/IT can view screenshots" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'screenshots' AND
    (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'it'))
  );

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'display_name');
  RETURN NEW;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update device status based on last_seen
CREATE OR REPLACE FUNCTION public.update_device_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.last_seen IS NOT NULL THEN
    IF NEW.last_seen > NOW() - INTERVAL '5 minutes' THEN
      NEW.status := 'online';
    ELSIF NEW.last_seen > NOW() - INTERVAL '15 minutes' THEN
      NEW.status := 'idle';
    ELSE
      NEW.status := 'offline';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_device_status_trigger
  BEFORE UPDATE ON public.devices
  FOR EACH ROW EXECUTE FUNCTION public.update_device_status();

-- Create indexes for better query performance
CREATE INDEX idx_devices_org_id ON public.devices(org_id);
CREATE INDEX idx_devices_status ON public.devices(status);
CREATE INDEX idx_screenshots_device_id ON public.screenshots(device_id);
CREATE INDEX idx_screenshots_captured_at ON public.screenshots(captured_at);
CREATE INDEX idx_telemetry_device_id ON public.telemetry_events(device_id);
CREATE INDEX idx_telemetry_event_time ON public.telemetry_events(event_time);
CREATE INDEX idx_sessions_device_id ON public.sessions(device_id);