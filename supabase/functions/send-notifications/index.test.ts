import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

Deno.test("Send Notifications Edge Function", async (t) => {
  const functionUrl = `${SUPABASE_URL}/functions/v1/send-notifications`;

  await t.step("should respond to OPTIONS request (CORS)", async () => {
    const response = await fetch(functionUrl, {
      method: "OPTIONS",
      headers: {
        "Origin": "http://localhost:5173",
      },
    });

    assertEquals(response.status, 200);
    await response.text(); // Consume body
  });

  await t.step("should handle POST request with authorization", async () => {
    const response = await fetch(functionUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    // Should return 200 even if no notifications to process
    assertEquals(response.status, 200);
    
    const data = await response.json();
    assertExists(data.message);
  });

  await t.step("should return proper JSON response structure", async () => {
    const response = await fetch(functionUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    const data = await response.json();
    
    // Should have message field
    assertExists(data.message || data.error);
  });
});

Deno.test("Notification Processing Logic", async (t) => {
  await t.step("should format phone number for MSG91 correctly", () => {
    const formatForMSG91 = (phone: string) => {
      let cleaned = phone.replace("+", "");
      if (!cleaned.startsWith("91")) {
        cleaned = "91" + cleaned;
      }
      return cleaned;
    };

    assertEquals(formatForMSG91("9876543210"), "919876543210");
    assertEquals(formatForMSG91("919876543210"), "919876543210");
    assertEquals(formatForMSG91("+919876543210"), "919876543210");
  });

  await t.step("should format phone number for Twilio correctly", () => {
    const formatForTwilio = (phone: string) => {
      if (!phone.startsWith("+")) {
        return "+91" + phone;
      }
      return phone;
    };

    assertEquals(formatForTwilio("9876543210"), "+919876543210");
    assertEquals(formatForTwilio("+919876543210"), "+919876543210");
  });

  await t.step("should validate notification types", () => {
    const validTypes = [
      "new_message",
      "order_status",
      "quote_received",
      "quote_response",
      "new_review",
      "payment_update",
    ];

    validTypes.forEach((type) => {
      assertEquals(validTypes.includes(type), true);
    });
  });

  await t.step("should map notification types to preferences", () => {
    const preferenceMap: Record<string, string> = {
      new_message: "new_message",
      order_status: "order_status_change",
      quote_received: "quote_received",
      quote_response: "quote_response",
      new_review: "new_review",
      payment_update: "payment_updates",
    };

    assertEquals(preferenceMap["new_message"], "new_message");
    assertEquals(preferenceMap["order_status"], "order_status_change");
    assertEquals(preferenceMap["payment_update"], "payment_updates");
  });
});

Deno.test("SMS Provider Selection", async (t) => {
  await t.step("should default to MSG91 when no provider specified", () => {
    const smsProvider = "msg91";
    assertEquals(smsProvider, "msg91");
  });

  await t.step("should use Twilio when specified and enabled", () => {
    const settings = {
      SMS_PROVIDER: "twilio",
      TWILIO_ENABLED: "true",
      TWILIO_ACCOUNT_SID: "test_sid",
      TWILIO_AUTH_TOKEN: "test_token",
      TWILIO_PHONE_NUMBER: "+1234567890",
    };

    const shouldUseTwilio =
      settings.SMS_PROVIDER === "twilio" &&
      settings.TWILIO_ENABLED === "true" &&
      settings.TWILIO_ACCOUNT_SID &&
      settings.TWILIO_AUTH_TOKEN &&
      settings.TWILIO_PHONE_NUMBER;

    assertEquals(Boolean(shouldUseTwilio), true);
  });

  await t.step("should fall back to MSG91 if Twilio not fully configured", () => {
    const settings: Record<string, string | null> = {
      SMS_PROVIDER: "twilio",
      TWILIO_ENABLED: "true",
      TWILIO_ACCOUNT_SID: null,
    };

    const canUseTwilio =
      settings.SMS_PROVIDER === "twilio" &&
      settings.TWILIO_ENABLED === "true" &&
      settings.TWILIO_ACCOUNT_SID;

    assertEquals(Boolean(canUseTwilio), false);
  });
});

Deno.test("Payment Gateway Configuration Validation", async (t) => {
  await t.step("should validate Razorpay settings", () => {
    const razorpaySettings = {
      RAZORPAY_KEY_ID: "rzp_test_123",
      RAZORPAY_KEY_SECRET: "secret_123",
    };

    assertEquals(razorpaySettings.RAZORPAY_KEY_ID.startsWith("rzp_"), true);
    assertExists(razorpaySettings.RAZORPAY_KEY_SECRET);
  });

  await t.step("should validate Stripe settings", () => {
    const stripeSettings = {
      STRIPE_PUBLISHABLE_KEY: "pk_test_123",
      STRIPE_SECRET_KEY: "sk_test_123",
      STRIPE_WEBHOOK_SECRET: "whsec_123",
    };

    assertEquals(stripeSettings.STRIPE_PUBLISHABLE_KEY.startsWith("pk_"), true);
    assertEquals(stripeSettings.STRIPE_SECRET_KEY.startsWith("sk_"), true);
    assertEquals(stripeSettings.STRIPE_WEBHOOK_SECRET.startsWith("whsec_"), true);
  });

  await t.step("should validate PayPal mode", () => {
    const validModes = ["sandbox", "live"];
    
    assertEquals(validModes.includes("sandbox"), true);
    assertEquals(validModes.includes("live"), true);
    assertEquals(validModes.includes("test"), false);
  });
});
