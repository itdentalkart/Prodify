// Supabase replaced by local API - this file kept for compatibility
import { createClient } from '@supabase/supabase-js';
export const supabase = createClient('http://localhost', 'dummy-key-not-used');
