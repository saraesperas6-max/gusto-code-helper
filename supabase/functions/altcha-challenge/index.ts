import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createChallenge, verifySolution } from "https://esm.sh/altcha-lib@0.5.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Use env var or generate a stable key per instance
const hmacKey = Deno.env.get('ALTCHA_HMAC_KEY') || crypto.randomUUID();

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // GET = create challenge, POST = verify solution
    if (req.method === 'GET') {
      const challenge = await createChallenge({
        hmacKey,
        maxNumber: 50000,
      });

      return new Response(JSON.stringify(challenge), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'POST') {
      const { payload } = await req.json();
      if (!payload) {
        return new Response(JSON.stringify({ ok: false, error: 'Missing payload' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const ok = await verifySolution(payload, hmacKey);

      return new Response(JSON.stringify({ ok }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: 'Server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
