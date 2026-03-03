-- Enable realtime for devices table
ALTER PUBLICATION supabase_realtime ADD TABLE public.devices;

-- Enable realtime for sessions table
ALTER PUBLICATION supabase_realtime ADD TABLE public.sessions;