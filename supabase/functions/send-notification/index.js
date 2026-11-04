import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createNotificationHandler } from './handler.js';

const db = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'), {
  auth: { persistSession: false, autoRefreshToken: false },
});
Deno.serve(createNotificationHandler({ db, env: name => Deno.env.get(name) }));
