import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // --- Authentication & Authorization ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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

    // --- Secrets ---
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const { requestId, status, residentEmail, residentName, certificateType, denialReason, type } = await req.json();

    if (!residentEmail || !residentName) {
      throw new Error("Missing required fields: residentEmail, residentName");
    }

    // Validate recipient email exists in profiles table
    const { data: profileData } = await adminClient
      .from("profiles")
      .select("email")
      .eq("email", residentEmail)
      .single();

    if (!profileData) {
      return new Response(
        JSON.stringify({ success: false, error: "Recipient email not found in system" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let subject: string;
    let htmlBody: string;

    if (type === "resident-approved") {
      subject = "Your Resident Account Has Been Approved";
      htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #16a34a;">Account Approved ✅</h2>
          <p>Dear <strong>${residentName}</strong>,</p>
          <p>We are pleased to inform you that your resident account has been <strong>approved</strong> by the Barangay Administration.</p>
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0; color: #166534;">You now have full access to the Barangay Resident Portal. You can log in to request certificates and access other services.</p>
          </div>
          <p>Thank you,<br/>Barangay Administration</p>
        </div>
      `;
    } else if (status === "Approved") {
      if (!requestId || !certificateType) throw new Error("Missing required fields for certificate notification");
      subject = `Your ${certificateType} Request Has Been Approved`;
      htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #16a34a;">Certificate Request Approved ✅</h2>
          <p>Dear <strong>${residentName}</strong>,</p>
          <p>We are pleased to inform you that your request for <strong>${certificateType}</strong> has been <strong>approved</strong>.</p>
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0 0 8px 0; color: #166534;"><strong>⚠️ Important:</strong> Please claim your certificate at the Barangay Hall within <strong>3 days</strong>. 
            Failure to claim within this period will result in your request being automatically declined.</p>
          </div>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0 0 8px 0; font-weight: bold; color: #1e293b;">💰 Payment Schedule:</p>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 6px 0; color: #334155;">Documentary Stamp</td>
                <td style="padding: 6px 0; text-align: right; color: #334155;">₱30.00</td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 6px 0; color: #334155;">Residency</td>
                <td style="padding: 6px 0; text-align: right; color: #334155;">₱200.00</td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 6px 0; color: #334155;">Low Income</td>
                <td style="padding: 6px 0; text-align: right; color: #334155;">₱100.00</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #334155;">Clearance</td>
                <td style="padding: 6px 0; text-align: right; color: #334155;">₱100.00</td>
              </tr>
            </table>
            <p style="margin: 12px 0 0 0; color: #475569; font-size: 13px;">🕘 <strong>Office Hours:</strong> 9:00 AM – 4:00 PM</p>
          </div>
          <p>Thank you,<br/>Barangay Administration</p>
        </div>
      `;
    } else if (status === "Denied") {
      if (!requestId || !certificateType) throw new Error("Missing required fields for certificate notification");
      subject = `Your ${certificateType} Request Has Been Denied`;
      htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #dc2626;">Certificate Request Denied ❌</h2>
          <p>Dear <strong>${residentName}</strong>,</p>
          <p>We regret to inform you that your request for <strong>${certificateType}</strong> has been <strong>denied</strong>.</p>
          ${denialReason ? `
          <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0; color: #991b1b;"><strong>Reason:</strong> ${denialReason}</p>
          </div>` : ''}
          <p>If you believe this is an error, please visit the Barangay Hall for assistance.</p>
          <p>Thank you,<br/>Barangay Administration</p>
        </div>
      `;
    } else {
      throw new Error(`Unsupported notification type`);
    }

    // Send email via Resend
    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Barangay System <onboarding@resend.dev>",
        to: [residentEmail],
        subject,
        html: htmlBody,
      }),
    });

    const emailData = await emailRes.json();

    if (!emailRes.ok) {
      console.error("Resend error:", emailData);
      return new Response(
        JSON.stringify({ success: false, error: "Email sending failed" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, emailId: emailData.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "An error occurred processing the notification" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
