
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://wkautvkfdldsnnclucto.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrYXV0dmtmZGxkc25uY2x1Y3RvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE1MjcyMDcsImV4cCI6MjA1NzEwMzIwN30.bRCJYPXcgI9KxW0Csb1bsz9YR-QhQ-U5ZRkBXdMQmms";

// Create a single instance of the Supabase client with proper storage options
export const supabase = createClient<Database>(
  SUPABASE_URL, 
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: true, // Ensure sessions persist across page reloads
      storageKey: 'musicapp-auth-storage', // Use a custom key for storage
      autoRefreshToken: true, // Automatically refresh tokens
    },
    global: {
      fetch: (...args) => fetch(...args) // Properly spread the args to fix TypeScript error
    }
  }
);
