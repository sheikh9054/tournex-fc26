import { createClient } from '@supabase/supabase-js';

// Clean Supabase setup variables that can be replaced or updated later
const SUPABASE_URL = "https://mzoxyjtvpinvqgffiehh.supabase.co";
const SUPABASE_PUBLIC_KEY = "sb_publishable_y_vALGWKmf2pSVtKpsSgZQ_0BbcOouA";

// Detect if environment variables are provided, falling back to the default config variables
const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || SUPABASE_URL;
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || SUPABASE_PUBLIC_KEY;

// Base config that safely handles iframe localStorage security restrictions
const clientOptions = {
  auth: {
    persistSession: false, // Turn off localStorage persisting to prevent iframe SecurityError
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
};

// If we are in a top-level tab and localStorage is accessible, we can optionally use standard persistence
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    // Only set standard persistence if we are not in a restrictive iframe context
    const isIframe = window.self !== window.top;
    if (!isIframe) {
      delete clientOptions.auth.persistSession;
      delete clientOptions.auth.autoRefreshToken;
      delete clientOptions.auth.detectSessionInUrl;
    }
  }
} catch (e) {
  // If accessing window.localStorage throws, we stay safe with persistSession: false
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, clientOptions);
