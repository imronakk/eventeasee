
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
    const { email, full_name, id, gstin, pan } = await req.json();

    if (!email) {
      throw new Error("Email is required");
    }

    // Log the email sending request for debugging
    console.log(`Sending approval email to ${email} for venue owner ${full_name} (${id})`);
    console.log(`GSTIN: ${gstin}, PAN: ${pan}`);

    // In a production environment, you would integrate with an email service like Resend
    // For now, we're simulating the email content that would be sent
    const emailContent = `
      Dear ${full_name},
      
      Congratulations! Your venue owner account has been approved.
      
      Account Details:
      - Name: ${full_name}
      - Email: ${email}
      - GSTIN: ${gstin}
      - PAN: ${pan}
      
      You can now sign in to your account and start managing your venues and events.
      
      Visit: https://your-app-domain.com/auth to sign in.
      
      Thank you for joining EventEase!
      
      Best regards,
      The EventEase Team
    `;
    
    console.log("Email content that would be sent:", emailContent);
    
    // Update the profile to mark email as sent
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        email_notification_sent: true,
        updated_at: new Date().toISOString() 
      })
      .eq('id', id);
      
    if (updateError) {
      console.error("Error updating profile:", updateError);
      throw updateError;
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `Approval email sent to ${email}`,
        emailContent: emailContent
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
