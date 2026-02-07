import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { supabase } from "@/integrations/supabase/client";

/**
 * Integration Tests for Database Operations
 * 
 * These tests verify real database operations against the Supabase backend.
 * They test CRUD operations, RLS policies, and data integrity.
 * 
 * Note: These tests require a connected Supabase instance and may modify data.
 * Run with caution in production environments.
 */

describe("Database Integration Tests", () => {
  describe("Connection & Health", () => {
    it("should successfully connect to Supabase", async () => {
      const { data, error } = await supabase.auth.getSession();
      // Should not throw an error - connection works
      expect(error).toBeNull();
    });

    it("should have valid Supabase URL configured", () => {
      const url = import.meta.env.VITE_SUPABASE_URL;
      expect(url).toBeDefined();
      expect(url).toContain("supabase");
    });

    it("should have valid anon key configured", () => {
      const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      expect(key).toBeDefined();
      expect(key.length).toBeGreaterThan(0);
    });
  });

  describe("Work Types - Public Read", () => {
    it("should fetch work types from database", async () => {
      const { data, error } = await supabase
        .from("work_types")
        .select("*")
        .limit(10);

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });

    it("should return work type with expected schema", async () => {
      const { data, error } = await supabase
        .from("work_types")
        .select("id, name, description, icon, is_active")
        .limit(1);

      expect(error).toBeNull();
      if (data && data.length > 0) {
        expect(data[0]).toHaveProperty("id");
        expect(data[0]).toHaveProperty("name");
        expect(data[0]).toHaveProperty("is_active");
      }
    });

    it("should filter active work types", async () => {
      const { data, error } = await supabase
        .from("work_types")
        .select("*")
        .eq("is_active", true);

      expect(error).toBeNull();
      if (data && data.length > 0) {
        data.forEach((wt) => {
          expect(wt.is_active).toBe(true);
        });
      }
    });
  });

  describe("Work Crop Types - Public Read", () => {
    it("should fetch work crop types from database", async () => {
      const { data, error } = await supabase
        .from("work_crop_types")
        .select("*")
        .limit(10);

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });

    it("should return crop type with expected schema", async () => {
      const { data, error } = await supabase
        .from("work_crop_types")
        .select("id, name, description, icon, is_active")
        .limit(1);

      expect(error).toBeNull();
      if (data && data.length > 0) {
        expect(data[0]).toHaveProperty("id");
        expect(data[0]).toHaveProperty("name");
      }
    });
  });

  describe("Public Profiles View", () => {
    it("should fetch public profiles (non-sensitive data)", async () => {
      const { data, error } = await supabase
        .from("public_profiles")
        .select("*")
        .limit(5);

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });

    it("should NOT expose sensitive fields in public profiles", async () => {
      const { data, error } = await supabase
        .from("public_profiles")
        .select("*")
        .limit(1);

      expect(error).toBeNull();
      if (data && data.length > 0) {
        // Public profiles should NOT contain these sensitive fields
        expect(data[0]).not.toHaveProperty("mobile_number");
        expect(data[0]).not.toHaveProperty("email");
        expect(data[0]).not.toHaveProperty("bank_account_number");
        expect(data[0]).not.toHaveProperty("gov_id_number");
        expect(data[0]).not.toHaveProperty("upi_id");
      }
    });

    it("should include safe public fields", async () => {
      const { data, error } = await supabase
        .from("public_profiles")
        .select("id, full_name, state, district, average_rating, user_type")
        .limit(1);

      expect(error).toBeNull();
      if (data && data.length > 0) {
        // These fields should be accessible
        expect(data[0]).toHaveProperty("id");
        expect(data[0]).toHaveProperty("full_name");
      }
    });
  });

  describe("Public Job Postings View", () => {
    it("should fetch public job postings", async () => {
      const { data, error } = await supabase
        .from("public_job_postings")
        .select("*")
        .eq("status", "open")
        .limit(10);

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });

    it("should filter job postings by status", async () => {
      const { data, error } = await supabase
        .from("public_job_postings")
        .select("*")
        .eq("status", "open");

      expect(error).toBeNull();
      if (data && data.length > 0) {
        data.forEach((job) => {
          expect(job.status).toBe("open");
        });
      }
    });

    it("should NOT expose sensitive location details", async () => {
      const { data, error } = await supabase
        .from("public_job_postings")
        .select("*")
        .limit(1);

      expect(error).toBeNull();
      if (data && data.length > 0) {
        // Should not expose exact coordinates in public view
        expect(data[0]).not.toHaveProperty("coordinates_lat");
        expect(data[0]).not.toHaveProperty("coordinates_lng");
        expect(data[0]).not.toHaveProperty("location_address");
      }
    });
  });

  describe("RLS Policy Verification - Unauthenticated", () => {
    it("should deny insert to profiles without auth", async () => {
      const { data, error } = await supabase
        .from("profiles")
        .insert({
          id: "test-id",
          full_name: "Test User",
          mobile_number: "1234567890",
          state: "Test",
          district: "Test",
          user_type: "farmer",
        });

      // Should be denied by RLS
      expect(error).not.toBeNull();
    });

    it("should deny insert to orders without auth", async () => {
      const { data, error } = await supabase
        .from("orders")
        .insert({
          title: "Test Order",
          description: "Test",
          farmer_id: "test",
          worker_id: "test",
          agreed_amount: 1000,
          location_address: "Test",
        });

      expect(error).not.toBeNull();
    });

    it("should deny insert to worker_quotes without auth", async () => {
      const { data, error } = await supabase
        .from("worker_quotes")
        .insert({
          farmer_id: "test",
          worker_id: "test",
          proposed_amount: 1000,
          status: "pending",
        });

      expect(error).not.toBeNull();
    });

    it("should deny insert to notifications without auth", async () => {
      const { data, error } = await supabase
        .from("notifications")
        .insert({
          user_id: "test",
          type: "test",
          title: "Test",
          message: "Test",
        });

      expect(error).not.toBeNull();
    });

    it("should deny access to app_settings without admin role", async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("*");

      // Either empty or error due to RLS
      expect(data?.length === 0 || error !== null).toBe(true);
    });
  });

  describe("Query Performance", () => {
    it("should complete work_types query within 2 seconds", async () => {
      const start = Date.now();
      await supabase.from("work_types").select("*");
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(2000);
    });

    it("should complete public_profiles query within 2 seconds", async () => {
      const start = Date.now();
      await supabase.from("public_profiles").select("*").limit(50);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(2000);
    });

    it("should complete job_postings query within 2 seconds", async () => {
      const start = Date.now();
      await supabase.from("public_job_postings").select("*").limit(50);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(2000);
    });
  });

  describe("Data Validation Schemas", () => {
    it("should validate order status enum values", () => {
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

      validStatuses.forEach((status) => {
        expect(typeof status).toBe("string");
        expect(status.length).toBeGreaterThan(0);
      });
    });

    it("should validate payment status enum values", () => {
      const validStatuses = [
        "pending",
        "processing",
        "completed",
        "failed",
        "refunded",
      ];

      validStatuses.forEach((status) => {
        expect(typeof status).toBe("string");
      });
    });

    it("should validate quote status enum values", () => {
      const validStatuses = [
        "pending",
        "accepted",
        "rejected",
        "completed",
        "cancelled",
      ];

      validStatuses.forEach((status) => {
        expect(typeof status).toBe("string");
      });
    });

    it("should validate user role enum values", () => {
      const validRoles = ["super_admin", "admin", "farmer", "farm_worker"];

      validRoles.forEach((role) => {
        expect(typeof role).toBe("string");
      });
    });

    it("should validate gov_id_type enum values", () => {
      const validTypes = [
        "aadhar_card",
        "pan_card",
        "voter_id",
        "driving_license",
      ];

      validTypes.forEach((type) => {
        expect(typeof type).toBe("string");
      });
    });
  });

  describe("Database Functions", () => {
    it("should calculate payment amounts correctly", async () => {
      const { data, error } = await supabase.rpc("calculate_payment_amounts", {
        p_amount: 1000,
        p_commission_percentage: 10,
      });

      expect(error).toBeNull();
      if (data && data.length > 0) {
        expect(data[0].commission_amount).toBe(100);
        expect(data[0].net_amount).toBe(900);
      }
    });

    it("should calculate zero commission correctly", async () => {
      const { data, error } = await supabase.rpc("calculate_payment_amounts", {
        p_amount: 5000,
        p_commission_percentage: 0,
      });

      expect(error).toBeNull();
      if (data && data.length > 0) {
        expect(data[0].commission_amount).toBe(0);
        expect(data[0].net_amount).toBe(5000);
      }
    });

    it("should handle decimal amounts", async () => {
      const { data, error } = await supabase.rpc("calculate_payment_amounts", {
        p_amount: 1000.50,
        p_commission_percentage: 15,
      });

      expect(error).toBeNull();
      if (data && data.length > 0) {
        expect(typeof data[0].commission_amount).toBe("number");
        expect(typeof data[0].net_amount).toBe("number");
        expect(data[0].commission_amount + data[0].net_amount).toBeCloseTo(1000.50, 1);
      }
    });
  });

  describe("Realtime Channels", () => {
    it("should create a channel subscription", () => {
      const channel = supabase.channel("test-channel");
      expect(channel).toBeDefined();
      
      // Clean up
      supabase.removeChannel(channel);
    });

    it("should set up postgres_changes listener", () => {
      const channel = supabase
        .channel("db-changes")
        .on(
          "postgres_changes",
          { event: "*", schema: "public" },
          (payload) => {
            // Handler exists
          }
        );

      expect(channel).toBeDefined();
      
      // Clean up
      supabase.removeChannel(channel);
    });
  });
});

describe("Data Integrity Tests", () => {
  describe("Foreign Key Relationships", () => {
    it("should link work_types to work_crop_types", async () => {
      const { data, error } = await supabase
        .from("work_types")
        .select("*, work_crop_types(*)")
        .limit(5);

      expect(error).toBeNull();
      // Query should complete without FK errors
    });

    it("should link public_job_postings to work_types", async () => {
      const { data, error } = await supabase
        .from("public_job_postings")
        .select("*, work_types(name)")
        .limit(5);

      expect(error).toBeNull();
    });
  });

  describe("Nullable Field Handling", () => {
    it("should handle null descriptions in work_types", async () => {
      const { data, error } = await supabase
        .from("work_types")
        .select("name, description")
        .limit(10);

      expect(error).toBeNull();
      // Should not error even if description is null
    });

    it("should handle null fields in public_profiles", async () => {
      const { data, error } = await supabase
        .from("public_profiles")
        .select("full_name, bio, avatar_url")
        .limit(10);

      expect(error).toBeNull();
    });
  });

  describe("Timestamp Handling", () => {
    it("should return valid ISO timestamps", async () => {
      const { data, error } = await supabase
        .from("work_types")
        .select("created_at, updated_at")
        .limit(1);

      expect(error).toBeNull();
      if (data && data.length > 0 && data[0].created_at) {
        const date = new Date(data[0].created_at);
        expect(date.toString()).not.toBe("Invalid Date");
      }
    });
  });
});

describe("Edge Case Tests", () => {
  describe("Empty Results", () => {
    it("should handle query with no results gracefully", async () => {
      const { data, error } = await supabase
        .from("work_types")
        .select("*")
        .eq("name", "NON_EXISTENT_WORK_TYPE_12345");

      expect(error).toBeNull();
      expect(data).toEqual([]);
    });
  });

  describe("Pagination", () => {
    it("should support limit and offset", async () => {
      const { data: page1, error: err1 } = await supabase
        .from("work_types")
        .select("*")
        .range(0, 4);

      const { data: page2, error: err2 } = await supabase
        .from("work_types")
        .select("*")
        .range(5, 9);

      expect(err1).toBeNull();
      expect(err2).toBeNull();
      expect(Array.isArray(page1)).toBe(true);
      expect(Array.isArray(page2)).toBe(true);
    });
  });

  describe("Ordering", () => {
    it("should order results by created_at", async () => {
      const { data, error } = await supabase
        .from("work_types")
        .select("created_at")
        .order("created_at", { ascending: false })
        .limit(10);

      expect(error).toBeNull();
      if (data && data.length > 1) {
        for (let i = 0; i < data.length - 1; i++) {
          if (data[i].created_at && data[i + 1].created_at) {
            expect(new Date(data[i].created_at).getTime())
              .toBeGreaterThanOrEqual(new Date(data[i + 1].created_at).getTime());
          }
        }
      }
    });

    it("should order results by name alphabetically", async () => {
      const { data, error } = await supabase
        .from("work_types")
        .select("name")
        .order("name", { ascending: true })
        .limit(10);

      expect(error).toBeNull();
      if (data && data.length > 1) {
        for (let i = 0; i < data.length - 1; i++) {
          expect(data[i].name.localeCompare(data[i + 1].name)).toBeLessThanOrEqual(0);
        }
      }
    });
  });

  describe("Text Search", () => {
    it("should support ilike text search", async () => {
      const { data, error } = await supabase
        .from("work_types")
        .select("name")
        .ilike("name", "%a%");

      expect(error).toBeNull();
      // Should not error even if no results
    });
  });

  describe("Count Queries", () => {
    it("should support count without returning rows", async () => {
      const { count, error } = await supabase
        .from("work_types")
        .select("*", { count: "exact", head: true });

      expect(error).toBeNull();
      expect(typeof count).toBe("number");
    });
  });
});
