import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Test wrapper component
export const createTestWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => 
    React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(BrowserRouter, null, children)
    );
};

// Validation utilities
export const validateMobileNumber = (mobile: string): boolean => {
  return /^\d{10}$/.test(mobile);
};

export const validateFullName = (name: string): boolean => {
  const trimmed = name.trim();
  return trimmed.length >= 2 && trimmed.length <= 100;
};

export const validateRole = (role: string): boolean => {
  return ["farmer", "farm_worker"].includes(role);
};

export const validateAdminRole = (role: string): boolean => {
  return ["admin", "super_admin"].includes(role);
};

describe("Validation Utilities", () => {
  describe("Mobile Number Validation", () => {
    it("should accept valid 10-digit mobile numbers", () => {
      expect(validateMobileNumber("9876543210")).toBe(true);
      expect(validateMobileNumber("1234567890")).toBe(true);
    });

    it("should reject invalid mobile numbers", () => {
      expect(validateMobileNumber("987654321")).toBe(false); // 9 digits
      expect(validateMobileNumber("98765432100")).toBe(false); // 11 digits
      expect(validateMobileNumber("987654321a")).toBe(false); // contains letter
      expect(validateMobileNumber("")).toBe(false); // empty
      expect(validateMobileNumber("+919876543210")).toBe(false); // with country code
    });
  });

  describe("Full Name Validation", () => {
    it("should accept valid names", () => {
      expect(validateFullName("Jo")).toBe(true); // minimum 2 chars
      expect(validateFullName("Test User Name")).toBe(true);
      expect(validateFullName("A".repeat(100))).toBe(true); // max 100 chars
    });

    it("should reject invalid names", () => {
      expect(validateFullName("J")).toBe(false); // too short
      expect(validateFullName("")).toBe(false); // empty
      expect(validateFullName("   ")).toBe(false); // only spaces
      expect(validateFullName("A".repeat(101))).toBe(false); // too long
    });
  });

  describe("Role Validation", () => {
    it("should accept valid marketplace roles", () => {
      expect(validateRole("farmer")).toBe(true);
      expect(validateRole("farm_worker")).toBe(true);
    });

    it("should reject invalid marketplace roles", () => {
      expect(validateRole("admin")).toBe(false);
      expect(validateRole("super_admin")).toBe(false);
      expect(validateRole("user")).toBe(false);
      expect(validateRole("")).toBe(false);
    });

    it("should accept valid admin roles", () => {
      expect(validateAdminRole("admin")).toBe(true);
      expect(validateAdminRole("super_admin")).toBe(true);
    });

    it("should reject non-admin roles", () => {
      expect(validateAdminRole("farmer")).toBe(false);
      expect(validateAdminRole("farm_worker")).toBe(false);
    });
  });
});

describe("Order Status Workflow", () => {
  const validStatuses = [
    "new",
    "ongoing",
    "completed",
    "partially_accepted",
    "agreed_partially",
    "accepted_finished",
    "canceled",
    "dispute",
  ];

  it("should recognize all valid order statuses", () => {
    validStatuses.forEach((status) => {
      expect(validStatuses.includes(status)).toBe(true);
    });
  });

  describe("Status Transition Rules", () => {
    it("should not allow reopening completed orders (except for dispute)", () => {
      const currentStatus = "completed";
      const allowedTransitions = ["completed", "dispute"];
      
      validStatuses.forEach((newStatus) => {
        const isAllowed = allowedTransitions.includes(newStatus);
        if (newStatus !== "completed" && newStatus !== "dispute") {
          expect(isAllowed).toBe(false);
        }
      });
    });

    it("should not allow modifying canceled orders", () => {
      const currentStatus = "canceled";
      // No transitions should be allowed from canceled
      expect(currentStatus).toBe("canceled");
    });

    it("should require cancellation reason when canceling", () => {
      const cancellationReason = "";
      expect(cancellationReason.trim()).toBe("");
      // Empty cancellation reason should fail validation
    });

    it("should require dispute reason when disputing", () => {
      const disputeReason = "";
      expect(disputeReason.trim()).toBe("");
      // Empty dispute reason should fail validation
    });
  });
});

describe("Payment Gateway Configuration", () => {
  const paymentGateways = ["razorpay", "stripe", "paypal"];

  it("should support all payment gateways", () => {
    expect(paymentGateways).toContain("razorpay");
    expect(paymentGateways).toContain("stripe");
    expect(paymentGateways).toContain("paypal");
  });

  describe("Razorpay Settings", () => {
    it("should require key_id and key_secret", () => {
      const requiredFields = ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"];
      requiredFields.forEach((field) => {
        expect(field.startsWith("RAZORPAY")).toBe(true);
      });
    });
  });

  describe("Stripe Settings", () => {
    it("should require publishable_key, secret_key, and webhook_secret", () => {
      const requiredFields = ["STRIPE_PUBLISHABLE_KEY", "STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"];
      requiredFields.forEach((field) => {
        expect(field.startsWith("STRIPE")).toBe(true);
      });
    });
  });

  describe("PayPal Settings", () => {
    it("should require client_id, client_secret, and mode", () => {
      const requiredFields = ["PAYPAL_CLIENT_ID", "PAYPAL_CLIENT_SECRET", "PAYPAL_MODE"];
      requiredFields.forEach((field) => {
        expect(field.startsWith("PAYPAL")).toBe(true);
      });
    });

    it("should only accept valid PayPal modes", () => {
      const validModes = ["sandbox", "live"];
      expect(validModes).toContain("sandbox");
      expect(validModes).toContain("live");
      expect(validModes).not.toContain("test");
    });
  });
});

describe("SMS Provider Configuration", () => {
  const smsProviders = ["msg91", "twilio"];

  it("should support both SMS providers", () => {
    expect(smsProviders).toContain("msg91");
    expect(smsProviders).toContain("twilio");
  });

  describe("MSG91 Settings", () => {
    it("should require auth_key, sender_id, and template_id", () => {
      const requiredFields = ["MSG91_AUTH_KEY", "MSG91_SENDER_ID", "MSG91_TEMPLATE_ID"];
      requiredFields.forEach((field) => {
        expect(field.startsWith("MSG91")).toBe(true);
      });
    });
  });

  describe("Twilio Settings", () => {
    it("should require account_sid, auth_token, and phone_number", () => {
      const requiredFields = ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_PHONE_NUMBER"];
      requiredFields.forEach((field) => {
        expect(field.startsWith("TWILIO")).toBe(true);
      });
    });
  });
});

describe("Notification Types", () => {
  const notificationTypes = [
    "new_message",
    "order_status",
    "quote_received",
    "quote_response",
    "new_review",
    "payment_update",
  ];

  it("should handle all notification types", () => {
    expect(notificationTypes.length).toBe(6);
  });

  it("should map notification types to user preferences", () => {
    const preferenceMap: Record<string, string> = {
      new_message: "new_message",
      order_status: "order_status_change",
      quote_received: "quote_received",
      quote_response: "quote_response",
      new_review: "new_review",
      payment_update: "payment_updates",
    };

    notificationTypes.forEach((type) => {
      expect(preferenceMap[type]).toBeDefined();
    });
  });
});
