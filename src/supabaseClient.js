import { createClient } from '@supabase/supabase-js';

// Clean Supabase setup variables that can be replaced or updated later
let supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || "https://mzoxyjtvpinvqgffiehh.supabase.co";
let supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || "sb_publishable_y_vALGWKmf2pSVtKpsSgZQ_0BbcOouA";

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

export let supabase = createClient(supabaseUrl, supabaseAnonKey, clientOptions);

// Dynamic reinitialization helper to align with the server's runtime environment variables
export async function alignSupabaseConfig() {
  try {
    const res = await fetch('/api/config');
    if (res.ok) {
      const config = await res.json();
      if (config.supabaseUrl && config.supabaseAnonKey) {
        if (config.supabaseUrl !== supabaseUrl || config.supabaseAnonKey !== supabaseAnonKey) {
          console.log("🔄 Dynamic Supabase sync: updating client endpoint to match runtime server configuration:", config.supabaseUrl);
          supabaseUrl = config.supabaseUrl;
          supabaseAnonKey = config.supabaseAnonKey;
          supabase = createClient(supabaseUrl, supabaseAnonKey, clientOptions);
        }
      }
    }
  } catch (err) {
    console.warn("⚠️ Dynamic Supabase config alignment inactive:", err);
  }
}
