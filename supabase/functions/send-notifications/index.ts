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

interface AppSetting {
  key: string;
  value: string | null;
}

async function getAppSettings(supabase: ReturnType<typeof createClient>): Promise<Record<string, string | null>> {
  const { data } = await supabase
    .from("app_settings")
    .select("key, value");
  
  const settings: Record<string, string | null> = {};
  if (data) {
    for (const setting of data as AppSetting[]) {
      settings[setting.key] = setting.value;
    }
  }
  return settings;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get settings from database
    const settings = await getAppSettings(supabase);
    
    const msg91AuthKey = settings.MSG91_AUTH_KEY;
    const msg91SenderId = settings.MSG91_SENDER_ID || "FARMCH";
    const msg91TemplateId = settings.MSG91_TEMPLATE_ID;
    const smsEnabled = settings.SMS_ENABLED === "true";

    // Check if SMS is enabled and MSG91 is configured
    if (!smsEnabled) {
      return new Response(
        JSON.stringify({ message: "SMS notifications are disabled" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!msg91AuthKey) {
      console.log("MSG91 not configured - notifications will be logged only");
    }

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
        const { data: userSettings } = await supabase
          .from("notification_settings")
          .select("*")
          .eq("user_id", notification.user_id)
          .single();

        // Check if this notification type is enabled
        let shouldSend = true;
        if (userSettings) {
          if (!userSettings.sms_enabled) shouldSend = false;
          if (notification.type === "new_message" && !userSettings.new_message) shouldSend = false;
          if (notification.type === "order_status" && !userSettings.order_status_change) shouldSend = false;
          if (notification.type === "quote_received" && !userSettings.quote_received) shouldSend = false;
          if (notification.type === "quote_response" && !userSettings.quote_response) shouldSend = false;
          if (notification.type === "new_review" && !userSettings.new_review) shouldSend = false;
          if (notification.type === "payment_update" && !userSettings.payment_updates) shouldSend = false;
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
          // No MSG91 configured - just mark as logged
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
