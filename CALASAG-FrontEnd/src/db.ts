import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('Initializing Supabase client');
console.log('Supabase URL:', supabaseUrl || 'undefined');
console.log(
  'Supabase Key:',
  supabaseKey ? 'present (length: ' + supabaseKey.length + ')' : 'undefined'
);

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase URL or Anon Key in environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,        // ✅ keep the user logged in
    autoRefreshToken: true,      // ✅ refresh JWT automatically
    detectSessionInUrl: true,    // ✅ handle magic links / redirects
  },
});

// Test connectivity immediately after initialization
console.log('Testing Supabase client initialization');
supabase
  .from('users')
  .select('user_id')
  .limit(1)
  .then(({ data, error }) => {
    console.log('Initial Supabase test query:', { data, error });
    if (error) {
      console.error('Initial test query failed - full error:', error);
    }
  })
  .catch((err) => {
    console.error('Initial Supabase test error:', err);
  });

export const testSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('users').select('user_id').limit(1);
    console.log('Supabase test query:', data, error);
    if (error) {
      console.error('Test query failed - full error:', error);
    }
    return { data, error };
  } catch (err) {
    console.error('Test query error:', err);
    throw err;
  }
};
