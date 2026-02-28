import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate: only allow requests with a valid Bearer token (anon key from pg_cron)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the token belongs to a valid user or is the anon key used by pg_cron
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const token = authHeader.replace("Bearer ", "");

    // Allow the anon key (used by pg_cron/pg_net) or verify as authenticated admin
    if (token !== anonKey) {
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user } } = await userClient.auth.getUser();
      if (!user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const adminClient = createClient(supabaseUrl, serviceRoleKey);
      const { data: roleData } = await adminClient
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .single();
      if (!roleData) {
        return new Response(JSON.stringify({ error: "Forbidden: admin only" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Find approved requests that have passed their claim deadline
    const now = new Date().toISOString();
    const { data: expiredRequests, error: fetchError } = await supabase
      .from("certificate_requests")
      .select("id, resident_id, certificate_type")
      .eq("status", "Approved")
      .not("claim_deadline", "is", null)
      .lt("claim_deadline", now)
      .is("deleted_at", null);

    if (fetchError) throw fetchError;

    if (!expiredRequests || expiredRequests.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No expired requests", count: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Auto-decline each expired request
    const ids = expiredRequests.map((r: any) => r.id);
    const { error: updateError } = await supabase
      .from("certificate_requests")
      .update({
        status: "Denied",
        denial_reason: "Automatically declined: Certificate was not claimed within the 3-day deadline.",
        date_processed: now,
      })
      .in("id", ids);

    if (updateError) throw updateError;

    // Send notification emails for auto-declined requests
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (RESEND_API_KEY) {
      for (const r of expiredRequests) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("email, first_name, last_name")
          .eq("user_id", r.resident_id)
          .single();

        if (profile) {
          const safeName = escapeHtml(`${profile.first_name} ${profile.last_name}`);
          const safeCertType = escapeHtml(r.certificate_type);
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from: "Barangay System <onboarding@resend.dev>",
              to: [profile.email],
              subject: `Your ${safeCertType} Request Has Been Auto-Declined`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h2 style="color: #dc2626;">Certificate Request Auto-Declined ⏰</h2>
                  <p>Dear <strong>${safeName}</strong>,</p>
                  <p>Your request for <strong>${safeCertType}</strong> has been automatically declined because it was not claimed within the 3-day deadline.</p>
                  <p>Please submit a new request if you still need this certificate.</p>
                  <p>Thank you,<br/>Barangay Administration</p>
                </div>
              `,
            }),
          });
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: `Auto-declined ${ids.length} expired request(s)`, count: ids.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "An error occurred processing expired requests" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
