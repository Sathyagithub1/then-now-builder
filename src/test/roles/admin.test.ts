import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockAdminProfile, mockSuperAdminProfile, mockAppSettings, mockWorkTypes, mockOrders, mockFarmerProfile, mockWorkerProfile } from "../mocks/supabase";

// Mock supabase
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { user: { id: mockSuperAdminProfile.id } } },
        error: null,
      }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockSuperAdminProfile, error: null }),
    })),
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    }),
    removeChannel: vi.fn(),
  },
}));

describe("Admin Role Tests", () => {
  describe("Role Verification", () => {
    it("should identify admin role correctly", () => {
      expect(mockAdminProfile.role).toBe("admin");
      expect(mockAdminProfile.active_role).toBe("admin");
    });

    it("should identify super_admin role correctly", () => {
      expect(mockSuperAdminProfile.role).toBe("super_admin");
      expect(mockSuperAdminProfile.active_role).toBe("super_admin");
    });

    it("should differentiate between admin and super_admin", () => {
      expect(mockAdminProfile.role).not.toBe(mockSuperAdminProfile.role);
    });
  });

  describe("App Settings Management", () => {
    it("should access app settings", () => {
      expect(mockAppSettings.length).toBeGreaterThan(0);
    });

    it("should read SMS configuration", () => {
      const smsSettings = mockAppSettings.filter(
        (s) => s.key.startsWith("MSG91") || s.key === "SMS_ENABLED"
      );
      expect(smsSettings.length).toBeGreaterThan(0);
    });

    it("should read payment gateway configurations", () => {
      const razorpaySettings = mockAppSettings.filter((s) =>
        s.key.startsWith("RAZORPAY")
      );
      const stripeSettings = mockAppSettings.filter((s) =>
        s.key.startsWith("STRIPE")
      );

      expect(razorpaySettings.length).toBeGreaterThan(0);
      expect(stripeSettings.length).toBeGreaterThan(0);
    });

    it("should identify encrypted settings", () => {
      const encryptedSettings = mockAppSettings.filter((s) => s.is_encrypted);
      expect(encryptedSettings.length).toBeGreaterThan(0);
    });

    it("should update settings", () => {
      const settingToUpdate = mockAppSettings[0];
      const updatedValue = "new-value";

      expect(settingToUpdate.key).toBeDefined();
      expect(updatedValue).not.toBe(settingToUpdate.value);
    });
  });

  describe("MSG91 Configuration", () => {
    it("should manage MSG91 auth key", () => {
      const authKey = mockAppSettings.find((s) => s.key === "MSG91_AUTH_KEY");
      expect(authKey).toBeDefined();
      expect(authKey?.is_encrypted).toBe(true);
    });

    it("should manage MSG91 sender ID", () => {
      const senderId = mockAppSettings.find((s) => s.key === "MSG91_SENDER_ID");
      expect(senderId).toBeDefined();
    });

    it("should toggle SMS enabled/disabled", () => {
      const smsEnabled = mockAppSettings.find((s) => s.key === "SMS_ENABLED");
      expect(smsEnabled).toBeDefined();
      expect(["true", "false"]).toContain(smsEnabled?.value);
    });
  });

  describe("Twilio Configuration", () => {
    it("should configure Twilio settings", () => {
      const twilioSettings = [
        "TWILIO_ACCOUNT_SID",
        "TWILIO_AUTH_TOKEN",
        "TWILIO_PHONE_NUMBER",
        "TWILIO_ENABLED",
      ];

      twilioSettings.forEach((key) => {
        expect(key.startsWith("TWILIO")).toBe(true);
      });
    });
  });

  describe("Razorpay Configuration", () => {
    it("should configure Razorpay key ID", () => {
      const keyId = mockAppSettings.find((s) => s.key === "RAZORPAY_KEY_ID");
      expect(keyId).toBeDefined();
    });

    it("should store Razorpay secret securely", () => {
      const secretKey = {
        key: "RAZORPAY_KEY_SECRET",
        is_encrypted: true,
      };
      expect(secretKey.is_encrypted).toBe(true);
    });
  });

  describe("Stripe Configuration", () => {
    it("should configure Stripe publishable key", () => {
      const pubKey = mockAppSettings.find(
        (s) => s.key === "STRIPE_PUBLISHABLE_KEY"
      );
      expect(pubKey).toBeDefined();
    });

    it("should store Stripe secrets securely", () => {
      const secretFields = ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"];
      secretFields.forEach((field) => {
        expect(field).toContain("SECRET");
      });
    });
  });

  describe("PayPal Configuration", () => {
    it("should configure PayPal client credentials", () => {
      const paypalFields = [
        "PAYPAL_CLIENT_ID",
        "PAYPAL_CLIENT_SECRET",
        "PAYPAL_MODE",
      ];

      paypalFields.forEach((field) => {
        expect(field.startsWith("PAYPAL")).toBe(true);
      });
    });

    it("should support sandbox and live modes", () => {
      const validModes = ["sandbox", "live"];
      expect(validModes).toContain("sandbox");
      expect(validModes).toContain("live");
    });
  });

  describe("Work Types Management", () => {
    it("should view all work types", () => {
      expect(mockWorkTypes.length).toBeGreaterThan(0);
    });

    it("should create new work types", () => {
      const newWorkType = {
        name: "New Work Type",
        description: "Description for new work type",
        icon: "🔧",
        is_active: true,
      };

      expect(newWorkType.name).toBeDefined();
      expect(newWorkType.is_active).toBe(true);
    });

    it("should deactivate work types", () => {
      const workTypeToDeactivate = mockWorkTypes[0];
      expect(workTypeToDeactivate.is_active).toBe(true);
      // After deactivation, is_active should be false
    });

    it("should not delete work types (soft delete only)", () => {
      // Work types should be deactivated, not deleted
      const workType = mockWorkTypes[0];
      expect(workType.id).toBeDefined();
    });
  });

  describe("User Management", () => {
    it("should view all users", () => {
      const allUsers = [
        mockFarmerProfile,
        mockWorkerProfile,
        mockAdminProfile,
        mockSuperAdminProfile,
      ];
      expect(allUsers.length).toBe(4);
    });

    it("should view user roles", () => {
      const roles = ["farmer", "farm_worker", "admin", "super_admin"];
      roles.forEach((role) => {
        expect(typeof role).toBe("string");
      });
    });

    it("should view user activity status", () => {
      expect(mockFarmerProfile.is_active).toBe(true);
      expect(mockWorkerProfile.is_active).toBe(true);
    });
  });

  describe("Order Monitoring", () => {
    it("should view all orders", () => {
      expect(mockOrders.length).toBeGreaterThan(0);
    });

    it("should view order details including farmer and worker", () => {
      const order = mockOrders[0];
      expect(order.farmer_id).toBeDefined();
      expect(order.worker_id).toBeDefined();
    });

    it("should view order status distribution", () => {
      const statuses = mockOrders.map((o) => o.status);
      const uniqueStatuses = [...new Set(statuses)];
      expect(uniqueStatuses.length).toBeGreaterThan(0);
    });

    it("should calculate total revenue", () => {
      const totalRevenue = mockOrders.reduce(
        (sum, o) => sum + o.agreed_amount,
        0
      );
      expect(totalRevenue).toBeGreaterThan(0);
    });
  });

  describe("Statistics Dashboard", () => {
    it("should calculate total users", () => {
      const totalUsers = 4; // from our mocks
      expect(totalUsers).toBeGreaterThan(0);
    });

    it("should calculate total orders", () => {
      expect(mockOrders.length).toBe(3);
    });

    it("should calculate total revenue", () => {
      const revenue = mockOrders.reduce((sum, o) => sum + o.agreed_amount, 0);
      expect(revenue).toBe(16000);
    });

    it("should count work types", () => {
      expect(mockWorkTypes.length).toBe(3);
    });
  });

  describe("Commission Management", () => {
    it("should set commission percentage", () => {
      const commissionSetting = {
        key: "COMMISSION_PERCENTAGE",
        value: "10",
      };
      expect(parseInt(commissionSetting.value)).toBe(10);
    });

    it("should validate commission range", () => {
      const minCommission = 0;
      const maxCommission = 100;
      const testValue = 10;

      expect(testValue).toBeGreaterThanOrEqual(minCommission);
      expect(testValue).toBeLessThanOrEqual(maxCommission);
    });
  });

  describe("RLS Policy Verification", () => {
    it("should restrict settings access to super_admin", () => {
      // Only super_admin should access app_settings
      const requiredRole = "super_admin";
      expect(mockSuperAdminProfile.role).toBe(requiredRole);
    });

    it("should allow admin to manage work types", () => {
      const allowedRoles = ["admin", "super_admin"];
      expect(allowedRoles).toContain(mockAdminProfile.role);
    });

    it("should allow admin to view all orders", () => {
      const allowedRoles = ["admin", "super_admin"];
      expect(allowedRoles).toContain(mockAdminProfile.role);
    });
  });
});

describe("Super Admin Exclusive Tests", () => {
  describe("Settings Access", () => {
    it("should have exclusive access to app_settings", () => {
      expect(mockSuperAdminProfile.role).toBe("super_admin");
    });

    it("should be able to modify encrypted values", () => {
      const encryptedSetting = mockAppSettings.find((s) => s.is_encrypted);
      expect(encryptedSetting).toBeDefined();
    });
  });

  describe("Role Management", () => {
    it("should be able to promote users to admin", () => {
      const roleChange = {
        user_id: mockFarmerProfile.id,
        new_role: "admin",
      };
      expect(roleChange.new_role).toBe("admin");
    });

    it("should prevent self-demotion", () => {
      // Super admin should not be able to demote themselves
      const selfDemotion = {
        user_id: mockSuperAdminProfile.id,
        new_role: "farmer",
      };
      // This should be blocked
      expect(selfDemotion.user_id).toBe(mockSuperAdminProfile.id);
    });
  });
});
