import { createClient } from '@supabase/supabase-js';

// Fallback to prevent white-screen crash on module load
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder';

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    console.error('CRITICAL: Missing Supabase environment variables! Check Vercel Settings.');
    // We let it continue so the UI can at least render the error overlay
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        detectSessionInUrl: false, // We handle this manually in App.tsx to avoid race conditions
        persistSession: true,
    }
});
