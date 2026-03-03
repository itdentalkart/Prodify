
-- Create licenses table
CREATE TABLE public.licenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  total_device_licenses integer NOT NULL DEFAULT 0,
  used_device_licenses integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(org_id)
);

ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage all licenses"
ON public.licenses FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can view own license"
ON public.licenses FOR SELECT TO authenticated
USING (org_id = public.get_user_org_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'));

-- Super admin policies for existing tables
CREATE POLICY "Super admins can view all orgs"
ON public.organizations FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can update all orgs"
ON public.organizations FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can delete orgs"
ON public.organizations FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can view all profiles"
ON public.profiles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can view all devices"
ON public.devices FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can view all enrollment tokens"
ON public.enrollment_tokens FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can view all audit logs"
ON public.audit_logs FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

-- License check function
CREATE OR REPLACE FUNCTION public.check_device_license(p_org_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.licenses
    WHERE org_id = p_org_id AND status = 'active' AND used_device_licenses < total_device_licenses
  )
$$;

-- Auto license count triggers
CREATE OR REPLACE FUNCTION public.increment_used_licenses()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.licenses SET used_device_licenses = used_device_licenses + 1, updated_at = now() WHERE org_id = NEW.org_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.decrement_used_licenses()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.licenses SET used_device_licenses = GREATEST(0, used_device_licenses - 1), updated_at = now() WHERE org_id = OLD.org_id;
  RETURN OLD;
END;
$$;

CREATE TRIGGER on_device_created_update_license AFTER INSERT ON public.devices FOR EACH ROW EXECUTE FUNCTION public.increment_used_licenses();
CREATE TRIGGER on_device_deleted_update_license AFTER DELETE ON public.devices FOR EACH ROW EXECUTE FUNCTION public.decrement_used_licenses();

-- Updated handle_new_user - auto-create org on signup with company_name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  new_org_id uuid;
  company_name text;
BEGIN
  company_name := NEW.raw_user_meta_data->>'company_name';
  IF company_name IS NOT NULL AND company_name != '' THEN
    INSERT INTO public.organizations (name) VALUES (company_name) RETURNING id INTO new_org_id;
    INSERT INTO public.profiles (user_id, email, display_name, org_id) VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'display_name', new_org_id);
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
    INSERT INTO public.licenses (org_id, total_device_licenses, used_device_licenses, status) VALUES (new_org_id, 0, 0, 'active');
  ELSE
    INSERT INTO public.profiles (user_id, email, display_name) VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'display_name');
  END IF;
  RETURN NEW;
END;
$$;

-- Updated_at trigger for licenses
CREATE TRIGGER update_licenses_updated_at BEFORE UPDATE ON public.licenses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
