import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  phone_number: string;
  status: string;
  metadata: Record<string, unknown>;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const msg91AuthKey = Deno.env.get("MSG91_AUTH_KEY");
    const msg91SenderId = Deno.env.get("MSG91_SENDER_ID") || "FARMCH";
    const msg91TemplateId = Deno.env.get("MSG91_TEMPLATE_ID");

    // Check if MSG91 is configured
    if (!msg91AuthKey) {
      console.log("MSG91 not configured - notifications will be logged only");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch pending notifications
    const { data: notifications, error: fetchError } = await supabase
      .from("notifications")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(50);

    if (fetchError) {
      throw fetchError;
    }

    if (!notifications || notifications.length === 0) {
      return new Response(
        JSON.stringify({ message: "No pending notifications" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: { id: string; success: boolean; error?: string }[] = [];

    for (const notification of notifications as Notification[]) {
      try {
        // Check user's notification preferences
        const { data: settings } = await supabase
          .from("notification_settings")
          .select("*")
          .eq("user_id", notification.user_id)
          .single();

        // Check if this notification type is enabled
        let shouldSend = true;
        if (settings) {
          if (!settings.sms_enabled) shouldSend = false;
          if (notification.type === "new_message" && !settings.new_message) shouldSend = false;
          if (notification.type === "order_status" && !settings.order_status_change) shouldSend = false;
          if (notification.type === "quote_received" && !settings.quote_received) shouldSend = false;
          if (notification.type === "quote_response" && !settings.quote_response) shouldSend = false;
          if (notification.type === "new_review" && !settings.new_review) shouldSend = false;
          if (notification.type === "payment_update" && !settings.payment_updates) shouldSend = false;
        }

        if (!shouldSend) {
          // Mark as skipped
          await supabase
            .from("notifications")
            .update({ status: "skipped", sent_at: new Date().toISOString() })
            .eq("id", notification.id);
          
          results.push({ id: notification.id, success: true, error: "User disabled this notification type" });
          continue;
        }

        // If MSG91 is configured, send the SMS
        if (msg91AuthKey && notification.phone_number) {
          const phoneNumber = notification.phone_number.startsWith("+91")
            ? notification.phone_number
            : `+91${notification.phone_number}`;

          // MSG91 Send OTP/SMS API
          const smsPayload = {
            flow_id: msg91TemplateId,
            sender: msg91SenderId,
            mobiles: phoneNumber.replace("+", ""),
            VAR1: notification.title,
            VAR2: notification.message,
          };

          const response = await fetch("https://control.msg91.com/api/v5/flow/", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              authkey: msg91AuthKey,
            },
            body: JSON.stringify(smsPayload),
          });

          const responseData = await response.json();

          if (response.ok && responseData.type === "success") {
            await supabase
              .from("notifications")
              .update({ status: "sent", sent_at: new Date().toISOString() })
              .eq("id", notification.id);
            
            results.push({ id: notification.id, success: true });
          } else {
            throw new Error(responseData.message || "Failed to send SMS");
          }
        } else {
          // No MSG91 configured - just mark as sent for logging purposes
          await supabase
            .from("notifications")
            .update({ 
              status: msg91AuthKey ? "failed" : "logged", 
              sent_at: new Date().toISOString(),
              error_message: msg91AuthKey ? "Missing phone number" : "MSG91 not configured"
            })
            .eq("id", notification.id);
          
          results.push({ 
            id: notification.id, 
            success: !msg91AuthKey,
            error: msg91AuthKey ? "Missing phone number" : undefined 
          });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        
        await supabase
          .from("notifications")
          .update({ 
            status: "failed", 
            error_message: errorMessage,
            sent_at: new Date().toISOString() 
          })
          .eq("id", notification.id);
        
        results.push({ id: notification.id, success: false, error: errorMessage });
      }
    }

    return new Response(
      JSON.stringify({ 
        message: `Processed ${results.length} notifications`,
        results 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
