import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
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

/**
 * Validates the request is from an authorized source.
 * Accepts either:
 * 1. A valid cron secret in x-cron-secret header
 * 2. A valid admin JWT token in Authorization header
 */
async function validateRequest(
  req: Request,
  supabase: ReturnType<typeof createClient>
): Promise<{ authorized: boolean; error?: string }> {
  // Check for cron secret (for scheduled invocations)
  const cronSecret = req.headers.get("x-cron-secret");
  const expectedCronSecret = Deno.env.get("NOTIFICATION_CRON_SECRET");
  
  if (cronSecret && expectedCronSecret && cronSecret === expectedCronSecret) {
    return { authorized: true };
  }
  
  // Check for admin JWT token (for manual invocations)
  const authHeader = req.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.replace("Bearer ", "");
    
    try {
      const { data, error } = await supabase.auth.getUser(token);
      
      if (error || !data.user) {
        return { authorized: false, error: "Invalid authentication token" };
      }
      
      // Verify user is admin or super_admin
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id);
      
      const isAdmin = roles?.some(
        (r) => r.role === "admin" || r.role === "super_admin"
      );
      
      if (isAdmin) {
        return { authorized: true };
      }
      
      return { authorized: false, error: "Admin access required" };
    } catch {
      return { authorized: false, error: "Authentication failed" };
    }
  }
  
  return { authorized: false, error: "Missing authentication" };
}

/**
 * Get SMS credentials from Supabase secrets (environment variables).
 * Falls back to database settings for backwards compatibility.
 */
async function getSMSCredentials(
  supabase: ReturnType<typeof createClient>
): Promise<{
  smsEnabled: boolean;
  smsProvider: string;
  msg91AuthKey: string | null;
  msg91SenderId: string;
  msg91TemplateId: string | null;
  twilioEnabled: boolean;
  twilioAccountSid: string | null;
  twilioAuthToken: string | null;
  twilioPhoneNumber: string | null;
}> {
  // First, try to get credentials from Supabase secrets (more secure)
  const msg91AuthKeyEnv = Deno.env.get("MSG91_AUTH_KEY");
  const twilioAccountSidEnv = Deno.env.get("TWILIO_ACCOUNT_SID");
  const twilioAuthTokenEnv = Deno.env.get("TWILIO_AUTH_TOKEN");
  
  // Get non-sensitive settings from database
  const { data: settingsData } = await supabase
    .from("app_settings")
    .select("key, value")
    .in("key", [
      "SMS_ENABLED",
      "SMS_PROVIDER", 
      "MSG91_SENDER_ID",
      "MSG91_TEMPLATE_ID",
      "TWILIO_ENABLED",
      "TWILIO_PHONE_NUMBER",
    ]);
  
  const settings: Record<string, string | null> = {};
  if (settingsData) {
    for (const setting of settingsData) {
      settings[setting.key] = setting.value;
    }
  }
  
  // Use environment secrets if available, fallback to database
  let msg91AuthKey = msg91AuthKeyEnv || null;
  let twilioAccountSid = twilioAccountSidEnv || null;
  let twilioAuthToken = twilioAuthTokenEnv || null;
  
  // If secrets not in environment, fall back to database (legacy support)
  if (!msg91AuthKey || !twilioAccountSid) {
    const { data: secretSettings } = await supabase
      .from("app_settings")
      .select("key, value")
      .in("key", ["MSG91_AUTH_KEY", "TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN"]);
    
    if (secretSettings) {
      for (const setting of secretSettings) {
        if (setting.key === "MSG91_AUTH_KEY" && !msg91AuthKey) {
          msg91AuthKey = setting.value;
        }
        if (setting.key === "TWILIO_ACCOUNT_SID" && !twilioAccountSid) {
          twilioAccountSid = setting.value;
        }
        if (setting.key === "TWILIO_AUTH_TOKEN" && !twilioAuthToken) {
          twilioAuthToken = setting.value;
        }
      }
    }
  }
  
  return {
    smsEnabled: settings.SMS_ENABLED === "true",
    smsProvider: settings.SMS_PROVIDER || "msg91",
    msg91AuthKey,
    msg91SenderId: settings.MSG91_SENDER_ID || "FARMCH",
    msg91TemplateId: settings.MSG91_TEMPLATE_ID || null,
    twilioEnabled: settings.TWILIO_ENABLED === "true",
    twilioAccountSid,
    twilioAuthToken,
    twilioPhoneNumber: settings.TWILIO_PHONE_NUMBER || null,
  };
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

/**
 * Log function invocation for audit purposes
 */
async function logInvocation(
  supabase: ReturnType<typeof createClient>,
  source: string,
  status: string,
  details: Record<string, unknown>
): Promise<void> {
  try {
    await supabase.from("function_audit_logs").insert({
      function_name: "send-notifications",
      invocation_source: source,
      status,
      details,
      invoked_at: new Date().toISOString(),
    });
  } catch {
    // Audit logging should not fail the main operation
    console.error("Failed to log invocation");
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Validate authentication
    const authResult = await validateRequest(req, supabase);
    
    if (!authResult.authorized) {
      await logInvocation(supabase, "unauthorized", "rejected", { 
        error: authResult.error,
        ip: req.headers.get("x-forwarded-for") || "unknown"
      });
      
      return new Response(
        JSON.stringify({ error: authResult.error || "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get SMS credentials (prefer secrets over database)
    const credentials = await getSMSCredentials(supabase);
    
    if (!credentials.smsEnabled) {
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

    console.log(`Processing ${notifications.length} pending notifications via ${credentials.smsProvider}`);

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
        
        if (
          credentials.smsProvider === "twilio" && 
          credentials.twilioEnabled && 
          credentials.twilioAccountSid && 
          credentials.twilioAuthToken && 
          credentials.twilioPhoneNumber
        ) {
          smsResult = await sendTwilioSMS(
            notification.phone_number,
            `${notification.title}: ${notification.message}`,
            credentials.twilioAccountSid,
            credentials.twilioAuthToken,
            credentials.twilioPhoneNumber
          );
        } else if (credentials.msg91AuthKey) {
          smsResult = await sendMSG91SMS(
            notification.phone_number,
            notification.title,
            notification.message,
            credentials.msg91AuthKey,
            credentials.msg91TemplateId,
            credentials.msg91SenderId
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

    // Log successful invocation
    await logInvocation(supabase, "authorized", "success", { 
      processed: results.length,
      provider: credentials.smsProvider 
    });

    return new Response(
      JSON.stringify({ 
        message: `Processed ${results.length} notifications`,
        provider: credentials.smsProvider,
        results 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    await logInvocation(supabase, "unknown", "error", { error: errorMessage });
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
