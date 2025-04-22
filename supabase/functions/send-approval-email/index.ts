
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
    const { email, full_name, id } = await req.json();

    if (!email) {
      throw new Error("Email is required");
    }

    // Simple email content - in production, you would use a proper email service like SendGrid or Resend
    console.log(`Sending approval email to ${email} for venue owner ${full_name} (${id})`);

    // Here you would integrate with an email service like SendGrid or Resend
    // For now, we're just logging the email content

    return new Response(
      JSON.stringify({
        success: true,
        message: `Approval email would be sent to ${email}`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error sending approval email:", error);
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
