import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

async function sendMSG91SMS(
  phoneNumber: string,
  title: string,
  message: string,
  authKey: string,
  templateId: string | null,
  senderId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const formattedPhone = phoneNumber.startsWith("91") 
      ? phoneNumber 
      : phoneNumber.replace("+", "").startsWith("91") 
        ? phoneNumber.replace("+", "") 
        : `91${phoneNumber.replace("+", "")}`;
    
    const response = await fetch("https://control.msg91.com/api/v5/flow/", {
      method: "POST",
      headers: {
        "authkey": authKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        flow_id: templateId,
        sender: senderId,
        mobiles: formattedPhone,
        VAR1: title,
        VAR2: message,
      }),
    });

    const result = await response.json();
    
    if (response.ok && result.type === "success") {
      return { success: true };
    } else {
      return { success: false, error: result.message || "MSG91 API error" };
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "MSG91 request failed" };
  }
}

async function sendTwilioSMS(
  phoneNumber: string,
  message: string,
  accountSid: string,
  authToken: string,
  fromNumber: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const formattedPhone = phoneNumber.startsWith("+") ? phoneNumber : `+91${phoneNumber}`;
    
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Authorization": `Basic ${btoa(`${accountSid}:${authToken}`)}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: formattedPhone,
          From: fromNumber,
          Body: message,
        }),
      }
    );

    const result = await response.json();
    
    if (response.ok && result.sid) {
      return { success: true };
    } else {
      return { success: false, error: result.message || "Twilio API error" };
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Twilio request failed" };
  }
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
    
    const smsEnabled = settings.SMS_ENABLED === "true";
    const smsProvider = settings.SMS_PROVIDER || "msg91";
    
    // MSG91 settings
    const msg91AuthKey = settings.MSG91_AUTH_KEY;
    const msg91SenderId = settings.MSG91_SENDER_ID || "FARMCH";
    const msg91TemplateId = settings.MSG91_TEMPLATE_ID;
    
    // Twilio settings
    const twilioEnabled = settings.TWILIO_ENABLED === "true";
    const twilioAccountSid = settings.TWILIO_ACCOUNT_SID;
    const twilioAuthToken = settings.TWILIO_AUTH_TOKEN;
    const twilioPhoneNumber = settings.TWILIO_PHONE_NUMBER;

    // Check if SMS is enabled
    if (!smsEnabled) {
      return new Response(
        JSON.stringify({ message: "SMS notifications are disabled" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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

    console.log(`Processing ${notifications.length} pending notifications via ${smsProvider}`);

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
          await supabase
            .from("notifications")
            .update({ status: "skipped", sent_at: new Date().toISOString() })
            .eq("id", notification.id);
          
          results.push({ id: notification.id, success: true, error: "User disabled this notification type" });
          continue;
        }

        if (!notification.phone_number) {
          await supabase
            .from("notifications")
            .update({ status: "failed", error_message: "Missing phone number", sent_at: new Date().toISOString() })
            .eq("id", notification.id);
          
          results.push({ id: notification.id, success: false, error: "Missing phone number" });
          continue;
        }

        // Send SMS based on provider preference
        let smsResult: { success: boolean; error?: string };
        
        if (smsProvider === "twilio" && twilioEnabled && twilioAccountSid && twilioAuthToken && twilioPhoneNumber) {
          smsResult = await sendTwilioSMS(
            notification.phone_number,
            `${notification.title}: ${notification.message}`,
            twilioAccountSid,
            twilioAuthToken,
            twilioPhoneNumber
          );
        } else if (msg91AuthKey) {
          smsResult = await sendMSG91SMS(
            notification.phone_number,
            notification.title,
            notification.message,
            msg91AuthKey,
            msg91TemplateId,
            msg91SenderId
          );
        } else {
          // No SMS provider configured - mark as logged
          await supabase
            .from("notifications")
            .update({ status: "logged", sent_at: new Date().toISOString(), error_message: "No SMS provider configured" })
            .eq("id", notification.id);
          
          results.push({ id: notification.id, success: true, error: "No SMS provider configured" });
          continue;
        }

        if (smsResult.success) {
          await supabase
            .from("notifications")
            .update({ status: "sent", sent_at: new Date().toISOString() })
            .eq("id", notification.id);
          
          results.push({ id: notification.id, success: true });
        } else {
          await supabase
            .from("notifications")
            .update({ status: "failed", error_message: smsResult.error, sent_at: new Date().toISOString() })
            .eq("id", notification.id);
          
          results.push({ id: notification.id, success: false, error: smsResult.error });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        
        await supabase
          .from("notifications")
          .update({ status: "failed", error_message: errorMessage, sent_at: new Date().toISOString() })
          .eq("id", notification.id);
        
        results.push({ id: notification.id, success: false, error: errorMessage });
      }
    }

    return new Response(
      JSON.stringify({ 
        message: `Processed ${results.length} notifications`,
        provider: smsProvider,
        results 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
