-- Create notification preferences table
CREATE TABLE public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  device_offline_email BOOLEAN DEFAULT true,
  device_enrolled_email BOOLEAN DEFAULT true,
  screenshot_captured_email BOOLEAN DEFAULT false,
  token_used_email BOOLEAN DEFAULT true,
  weekly_report_email BOOLEAN DEFAULT true,
  offline_threshold_minutes INTEGER DEFAULT 15,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(org_id, user_id)
);

-- Enable RLS
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Users can view their own preferences
CREATE POLICY "Users can view own notification preferences"
ON public.notification_preferences
FOR SELECT
USING (user_id = auth.uid());

-- Users can insert their own preferences
CREATE POLICY "Users can insert own notification preferences"
ON public.notification_preferences
FOR INSERT
WITH CHECK (user_id = auth.uid() AND org_id = get_user_org_id(auth.uid()));

-- Users can update their own preferences
CREATE POLICY "Users can update own notification preferences"
ON public.notification_preferences
FOR UPDATE
USING (user_id = auth.uid());

-- Admins can view all preferences in their org (for sending alerts)
CREATE POLICY "Admins can view org notification preferences"
ON public.notification_preferences
FOR SELECT
USING (org_id = get_user_org_id(auth.uid()) AND has_role(auth.uid(), 'admin'));

-- Create updated_at trigger
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();