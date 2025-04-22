
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = "https://wkautvkfdldsnnclucto.supabase.co";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Poll for venue owners that were just approved
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, full_name")
      .eq("user_type", "venue_owner")
      .eq("verification_status", "approved")
      .order("updated_at", { ascending: false })
      .limit(10);

    if (error) throw error;

    // Process any newly approved venue owners
    const emailPromises = data.map(async (profile) => {
      try {
        // Call our email sending function
        const emailResponse = await fetch(
          `${supabaseUrl}/functions/v1/send-approval-email`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
              email: profile.email,
              full_name: profile.full_name,
              id: profile.id,
            }),
          }
        );

        if (!emailResponse.ok) {
          const errorText = await emailResponse.text();
          throw new Error(`Failed to send email: ${errorText}`);
        }

        return { id: profile.id, success: true };
      } catch (emailError) {
        console.error(`Error sending email to ${profile.email}:`, emailError);
        return { id: profile.id, success: false, error: emailError.message };
      }
    });

    const results = await Promise.all(emailPromises);

    return new Response(
      JSON.stringify({
        success: true,
        processed: results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error processing venue owner approvals:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
