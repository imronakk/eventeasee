
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

const supabaseUrl = "https://wkautvkfdldsnnclucto.supabase.co";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    console.log("Running the venue owner approval check function");
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find venue owners with verification_status = 'approved' who haven't been notified yet
    // We'll use email_notification_sent field to track if notification was sent
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, gstin, pan, verification_status, updated_at')
      .eq('user_type', 'venue_owner')
      .eq('verification_status', 'approved')
      .or('email_notification_sent.is.null,email_notification_sent.eq.false');

    if (error) throw error;

    console.log(`Found ${data?.length || 0} approved venue owners to process`);
    
    if (!data || data.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No new approved venue owners to process"
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process newly approved venue owners
    const emailPromises = data.map(async (profile) => {
      try {
        console.log(`Sending approval email to ${profile.email} (${profile.id})`);
        
        // Call our email sending function
        const emailResponse = await fetch(
          `${supabaseUrl}/functions/v1/send-approval-email`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`
            },
            body: JSON.stringify({
              id: profile.id,
              email: profile.email,
              full_name: profile.full_name,
              gstin: profile.gstin,
              pan: profile.pan
            }),
          }
        );
        
        if (!emailResponse.ok) {
          const errorText = await emailResponse.text();
          throw new Error(`Failed to send email: ${errorText}`);
        }
        
        const result = await emailResponse.json();
        
        if (result.success) {
          // Mark the profile as notified
          await supabase
            .from('profiles')
            .update({ 
              email_notification_sent: true,
              updated_at: new Date().toISOString() 
            })
            .eq('id', profile.id);
            
          return { success: true, id: profile.id };
        } else {
          throw new Error(result.error || 'Email sending failed');
        }
      } catch (error) {
        console.error(`Error processing venue owner ${profile.id}:`, error);
        return { success: false, id: profile.id, error: error.message };
      }
    });
    
    const results = await Promise.all(emailPromises);
    
    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error in listen-for-approvals function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
