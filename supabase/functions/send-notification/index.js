import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve((req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  // Configure a real mail provider before enabling delivery. The previous
  // implementation only logged email bodies but incorrectly reported success.
  return new Response(JSON.stringify({
    success: false,
    delivery_status: 'not_configured',
    error: 'Email delivery is not configured. The submission status can still be saved.',
  }), { status: 501, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
});
