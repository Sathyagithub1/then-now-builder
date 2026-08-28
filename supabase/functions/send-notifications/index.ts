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
 * Fetch the given app_settings keys and return them as a plain key/value map.
 */
async function fetchAppSettings(
  supabase: ReturnType<typeof createClient>,
  keys: string[]
): Promise<Record<string, string | null>> {
  const { data } = await supabase
    .from("app_settings")
    .select("key, value")
    .in("key", keys);

  const result: Record<string, string | null> = {};
  if (data) {
    for (const setting of data) {
      result[setting.key] = setting.value;
    }
  }
  return result;
}

/**
 * Fetch legacy SMS secret values from the app_settings table, keyed by setting name.
 */
function fetchSecretSettings(
  supabase: ReturnType<typeof createClient>
): Promise<Record<string, string | null>> {
  return fetchAppSettings(supabase, [
    "MSG91_AUTH_KEY",
    "TWILIO_ACCOUNT_SID",
    "TWILIO_AUTH_TOKEN",
  ]);
}

/**
 * Resolve the sensitive SMS credentials, preferring Supabase secrets (env vars)
 * and falling back to legacy values stored in app_settings.
 */
async function resolveSecretCredentials(
  supabase: ReturnType<typeof createClient>
): Promise<{ msg91AuthKey: string | null; twilioAccountSid: string | null; twilioAuthToken: string | null }> {
  let msg91AuthKey = Deno.env.get("MSG91_AUTH_KEY") || null;
  let twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID") || null;
  let twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN") || null;

  // If secrets not in environment, fall back to database (legacy support)
  if (!msg91AuthKey || !twilioAccountSid) {
    const secretSettings = await fetchSecretSettings(supabase);
    msg91AuthKey = msg91AuthKey || secretSettings.MSG91_AUTH_KEY || null;
    twilioAccountSid = twilioAccountSid || secretSettings.TWILIO_ACCOUNT_SID || null;
    twilioAuthToken = twilioAuthToken || secretSettings.TWILIO_AUTH_TOKEN || null;
  }

  return { msg91AuthKey, twilioAccountSid, twilioAuthToken };
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
  // Get non-sensitive settings from database
  const settings = await fetchAppSettings(supabase, [
    "SMS_ENABLED",
    "SMS_PROVIDER",
    "MSG91_SENDER_ID",
    "MSG91_TEMPLATE_ID",
    "TWILIO_ENABLED",
    "TWILIO_PHONE_NUMBER",
  ]);

  // Resolve sensitive credentials (env secrets preferred, DB fallback)
  const { msg91AuthKey, twilioAccountSid, twilioAuthToken } =
    await resolveSecretCredentials(supabase);

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

// Maps a notification type to the notification_settings field that gates it.
const NOTIFICATION_TYPE_SETTING: Record<string, string> = {
  new_message: "new_message",
  order_status: "order_status_change",
  quote_received: "quote_received",
  quote_response: "quote_response",
  new_review: "new_review",
  payment_update: "payment_updates",
};

/**
 * Decide whether an SMS should be sent for a notification, based on the
 * user's notification_settings. When no settings row exists, default to sending.
 */
function shouldSendNotification(
  notification: Notification,
  userSettings: Record<string, unknown> | null
): boolean {
  if (!userSettings) return true;
  if (!userSettings.sms_enabled) return false;

  const settingKey = NOTIFICATION_TYPE_SETTING[notification.type];
  if (settingKey && !userSettings[settingKey]) return false;

  return true;
}

/**
 * Send an SMS for a notification using the configured provider.
 * Returns null when no provider is configured (caller marks it "logged").
 */
async function dispatchSMS(
  notification: Notification,
  credentials: Awaited<ReturnType<typeof getSMSCredentials>>
): Promise<{ success: boolean; error?: string } | null> {
  const useTwilio =
    credentials.smsProvider === "twilio" &&
    credentials.twilioEnabled &&
    credentials.twilioAccountSid &&
    credentials.twilioAuthToken &&
    credentials.twilioPhoneNumber;

  if (useTwilio) {
    return await sendTwilioSMS(
      notification.phone_number,
      `${notification.title}: ${notification.message}`,
      credentials.twilioAccountSid!,
      credentials.twilioAuthToken!,
      credentials.twilioPhoneNumber!
    );
  }

  if (credentials.msg91AuthKey) {
    return await sendMSG91SMS(
      notification.phone_number,
      notification.title,
      notification.message,
      credentials.msg91AuthKey,
      credentials.msg91TemplateId,
      credentials.msg91SenderId
    );
  }

  return null;
}

/**
 * Process a single pending notification: check preferences, send the SMS,
 * and update the notification row. Returns the per-notification result.
 */
async function processNotification(
  supabase: ReturnType<typeof createClient>,
  notification: Notification,
  credentials: Awaited<ReturnType<typeof getSMSCredentials>>
): Promise<{ id: string; success: boolean; error?: string }> {
  try {
    // Check user's notification preferences
    const { data: userSettings } = await supabase
      .from("notification_settings")
      .select("*")
      .eq("user_id", notification.user_id)
      .single();

    if (!shouldSendNotification(notification, userSettings)) {
      await supabase
        .from("notifications")
        .update({ status: "skipped", sent_at: new Date().toISOString() })
        .eq("id", notification.id);

      return { id: notification.id, success: true, error: "User disabled this notification type" };
    }

    if (!notification.phone_number) {
      await supabase
        .from("notifications")
        .update({ status: "failed", error_message: "Missing phone number", sent_at: new Date().toISOString() })
        .eq("id", notification.id);

      return { id: notification.id, success: false, error: "Missing phone number" };
    }

    const smsResult = await dispatchSMS(notification, credentials);

    if (smsResult === null) {
      // No SMS provider configured - mark as logged
      await supabase
        .from("notifications")
        .update({ status: "logged", sent_at: new Date().toISOString(), error_message: "No SMS provider configured" })
        .eq("id", notification.id);

      return { id: notification.id, success: true, error: "No SMS provider configured" };
    }

    if (smsResult.success) {
      await supabase
        .from("notifications")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", notification.id);

      return { id: notification.id, success: true };
    }

    await supabase
      .from("notifications")
      .update({ status: "failed", error_message: smsResult.error, sent_at: new Date().toISOString() })
      .eq("id", notification.id);

    return { id: notification.id, success: false, error: smsResult.error };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    await supabase
      .from("notifications")
      .update({ status: "failed", error_message: errorMessage, sent_at: new Date().toISOString() })
      .eq("id", notification.id);

    return { id: notification.id, success: false, error: errorMessage };
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
      const result = await processNotification(supabase, notification, credentials);
      results.push(result);
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
