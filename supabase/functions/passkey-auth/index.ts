// @ts-nocheck
// Supabase Edge Function: passkey-auth
// Verifies a passkey credential_id exists for a user,
// then generates a sign-in token using the service_role key.
// This lets the client establish a real session without sending any email.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { credential_id } = await req.json();

    if (!credential_id || typeof credential_id !== "string") {
      return new Response(JSON.stringify({ error: "credential_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service_role to access auth.users (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Step 1: Look up the passkey credential
    const { data: passkey, error: pkError } = await supabaseAdmin
      .from("user_passkeys")
      .select("user_id, device_nickname")
      .eq("credential_id", credential_id)
      .maybeSingle();

    if (pkError || !passkey) {
      return new Response(JSON.stringify({ error: "No account found for this passkey" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 2: Get the user's email from auth.users via admin API
    const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(
      passkey.user_id
    );

    if (userError || !user?.email) {
      return new Response(JSON.stringify({ error: "Could not resolve user account" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 3: Generate a magic link token (but don't send the email — we return it directly)
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: user.email,
      options: {
        redirectTo: "/",
      },
    });

    if (linkError || !linkData?.properties?.hashed_token) {
      console.error("generateLink error:", linkError);
      return new Response(JSON.stringify({ error: "Failed to generate sign-in token" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 4: Update last_used_at on the passkey record
    await supabaseAdmin
      .from("user_passkeys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("credential_id", credential_id);

    // Return the token + email to the client so it can call verifyOtp directly
    return new Response(
      JSON.stringify({
        email: user.email,
        token: linkData.properties.hashed_token,
        type: "magiclink",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("passkey-auth error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
