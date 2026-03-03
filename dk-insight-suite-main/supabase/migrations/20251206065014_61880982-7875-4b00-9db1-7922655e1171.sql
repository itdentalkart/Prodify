-- Enable realtime for enrollment_tokens table
ALTER PUBLICATION supabase_realtime ADD TABLE public.enrollment_tokens;

-- Ensure full replica identity for proper change tracking
ALTER TABLE public.enrollment_tokens REPLICA IDENTITY FULL;