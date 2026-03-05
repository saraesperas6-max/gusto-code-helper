import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ACCEPTED_IDS = [
  "National ID",
  "Philippine Passport",
  "Driver's License",
  "SSS Card",
  "UMID Card",
  "Postal ID",
  "Senior Citizen's ID Card",
];

const MAX_BASE64_SIZE = 7 * 1024 * 1024; // ~5MB image as base64
const ALLOWED_MIME_PREFIXES = ['data:image/jpeg', 'data:image/png', 'data:image/webp', 'data:image/gif'];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return new Response(JSON.stringify({ valid: false, error: "No image provided" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Server-side size validation
    if (typeof imageBase64 !== 'string' || imageBase64.length > MAX_BASE64_SIZE) {
      return new Response(JSON.stringify({ valid: false, error: "File too large (max 5MB)" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Server-side mime type validation
    if (!imageBase64.startsWith('data:image/')) {
      return new Response(JSON.stringify({ valid: false, error: "Invalid image format" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const hasValidType = ALLOWED_MIME_PREFIXES.some(prefix => imageBase64.startsWith(prefix));
    if (!hasValidType) {
      return new Response(JSON.stringify({ valid: false, error: "Unsupported image type. Use JPEG, PNG, WebP, or GIF." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an ID document validator. Analyze the uploaded image and determine if it is one of these accepted Philippine government-issued IDs: ${ACCEPTED_IDS.join(", ")}.

Respond ONLY with valid JSON in this exact format:
{"valid": true, "idType": "National ID"} — if it matches one of the accepted IDs
{"valid": false, "reason": "brief reason"} — if it does not match

Be strict: the image must clearly show a government-issued ID card/document. Reject selfies, random photos, screenshots of IDs that are clearly not original, or any non-ID document.`,
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: imageBase64 },
              },
              {
                type: "text",
                text: "Is this a valid Philippine government-issued ID? Respond with JSON only.",
              },
            ],
          },
        ],
        temperature: 0,
        max_tokens: 200,
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Parse the JSON from the AI response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ valid: false, reason: "Could not verify the document." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error validating ID:", error);
    return new Response(JSON.stringify({ valid: false, reason: "Validation service error. Please try again." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
