
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

const supabaseUrl = "https://wkautvkfdldsnnclucto.supabase.co";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Run this function every hour (in production you'd use a cron job or scheduled task)
serve(async (req) => {
  try {
    console.log("Running the venue owner approval check function");
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find venue owners with verification_status = 'approved' who haven't been notified yet
    // We can add a 'notified_at' column later to track this properly
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('user_type', 'venue_owner')
      .eq('verification_status', 'approved')
      .is('updated_at', null);  // This is just a placeholder - in production you'd track notification status

    if (error) throw error;

    console.log(`Found ${data?.length || 0} approved venue owners to process`);

    // Process any newly approved venue owners
    const emailPromises = data.map(async (profile) => {
      try {
        console.log(`Sending approval email to ${profile.email}`);
        
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
              full_name: profile.full_name
            }),
          }
        );
        
        const result = await emailResponse.json();
        
        if (result.success) {
          // Update the profile to indicate notification was sent
          // In production, you'd add a 'notified_at' timestamp column
          await supabase
            .from('profiles')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', profile.id);
            
          return { success: true, id: profile.id };
        } else {
          throw new Error(result.error || 'Email sending failed');
        }
      } catch (error) {
        console.error(`Error processing venue owner ${profile.id}:`, error);
        return { success: false, id: profile.id, error };
      }
    });
    
    const results = await Promise.all(emailPromises);
    
    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        results
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error in listen-for-approvals function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
