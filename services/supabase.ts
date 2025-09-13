
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jbbrygbjzccnvuuyrnqo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiYnJ5Z2JqemNjbnZ1dXlybnFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0NjM1MDQsImV4cCI6MjA2OTAzOTUwNH0.5jKSN0xyKmp9Qx9W3ECdBA46am5h-MnXmtZX6R815Qg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
