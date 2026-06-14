import { createClient } from '@supabase/supabase-js';

// Clean Supabase setup variables that can be replaced or updated later
const SUPABASE_URL = "https://mzoxyjtvpinvqgffiehh.supabase.co";
const SUPABASE_PUBLIC_KEY = "sb_publishable_y_vALGWKmf2pSVtKpsSgZQ_0BbcOouA";

// Detect if environment variables are provided, falling back to the default config variables
const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || SUPABASE_URL;
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || SUPABASE_PUBLIC_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
