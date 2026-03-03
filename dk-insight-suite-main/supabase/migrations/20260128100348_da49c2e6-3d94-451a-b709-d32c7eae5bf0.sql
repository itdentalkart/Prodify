-- Add DELETE policy for devices table so Admin/IT can delete devices
CREATE POLICY "Admins/IT can delete devices"
ON public.devices
FOR DELETE
USING (
  (org_id = get_user_org_id(auth.uid())) 
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'it'::app_role))
);

-- Also need INSERT policy for sessions (edge functions create sessions via service role, but adding for completeness)
-- And INSERT policy for telemetry_events for edge functions

-- Add DELETE policies for related data to properly cascade device deletions
CREATE POLICY "Admins/IT can delete screenshots"
ON public.screenshots
FOR DELETE
USING (
  (org_id = get_user_org_id(auth.uid())) 
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'it'::app_role))
);

CREATE POLICY "Admins/IT can delete sessions"
ON public.sessions
FOR DELETE
USING (
  device_id IN (
    SELECT id FROM devices 
    WHERE org_id = get_user_org_id(auth.uid())
  )
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'it'::app_role))
);

CREATE POLICY "Admins/IT can delete telemetry"
ON public.telemetry_events
FOR DELETE
USING (
  (org_id = get_user_org_id(auth.uid())) 
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'it'::app_role))
);