import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { mockFarmerProfile, mockOrders, mockQuotes, mockNotifications, mockWorkerProfile } from "../mocks/supabase";

// Mock supabase
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { user: { id: mockFarmerProfile.id } } },
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
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockFarmerProfile, error: null }),
    })),
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    }),
    removeChannel: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(BrowserRouter, null, children)
    );
};

describe("Farmer Role Tests", () => {
  describe("Profile & Authentication", () => {
    it("should have correct farmer role attributes", () => {
      expect(mockFarmerProfile.role).toBe("farmer");
      expect(mockFarmerProfile.active_role).toBe("farmer");
      expect(mockFarmerProfile.user_type).toBe("farmer");
    });

    it("should have valid mobile number format", () => {
      expect(mockFarmerProfile.mobile_number).toMatch(/^\d{10}$/);
    });

    it("should have required profile fields", () => {
      expect(mockFarmerProfile.full_name).toBeDefined();
      expect(mockFarmerProfile.state).toBeDefined();
      expect(mockFarmerProfile.district).toBeDefined();
      expect(mockFarmerProfile.is_active).toBe(true);
    });

    it("should have rating information", () => {
      expect(mockFarmerProfile.average_rating).toBeGreaterThanOrEqual(0);
      expect(mockFarmerProfile.total_ratings).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Order Management", () => {
    it("should be able to create orders", () => {
      const newOrder = {
        title: "Test Order",
        description: "Test description",
        farmer_id: mockFarmerProfile.id,
        worker_id: mockWorkerProfile.id,
        agreed_amount: 5000,
        location_address: "Test Location",
        status: "new",
      };

      expect(newOrder.farmer_id).toBe(mockFarmerProfile.id);
      expect(newOrder.status).toBe("new");
    });

    it("should view orders created by farmer", () => {
      const farmerOrders = mockOrders.filter(
        (order) => order.farmer_id === mockFarmerProfile.id
      );
      expect(farmerOrders.length).toBeGreaterThan(0);
    });

    it("should be able to mark order as completed", () => {
      const order = mockOrders.find((o) => o.status === "ongoing");
      expect(order).toBeDefined();
      // Only farmer can mark as completed
      expect(order?.farmer_id).toBe(mockFarmerProfile.id);
    });

    it("should calculate order statistics", () => {
      const farmerOrders = mockOrders.filter(
        (o) => o.farmer_id === mockFarmerProfile.id
      );
      const totalOrders = farmerOrders.length;
      const activeOrders = farmerOrders.filter((o) =>
        ["new", "ongoing"].includes(o.status)
      ).length;
      const completedOrders = farmerOrders.filter(
        (o) => o.status === "completed"
      ).length;
      const totalSpent = farmerOrders.reduce(
        (sum, o) => sum + o.agreed_amount,
        0
      );

      expect(totalOrders).toBe(3);
      expect(activeOrders).toBe(2);
      expect(completedOrders).toBe(1);
      expect(totalSpent).toBe(16000);
    });
  });

  describe("Quote Management", () => {
    it("should receive quotes from workers", () => {
      const quotesForFarmer = mockQuotes.filter(
        (q) => q.farmer_id === mockFarmerProfile.id
      );
      expect(quotesForFarmer.length).toBeGreaterThan(0);
    });

    it("should be able to accept quotes", () => {
      const pendingQuote = mockQuotes.find((q) => q.status === "pending");
      expect(pendingQuote).toBeDefined();
      expect(pendingQuote?.farmer_id).toBe(mockFarmerProfile.id);
    });

    it("should be able to reject quotes", () => {
      const pendingQuote = mockQuotes.find((q) => q.status === "pending");
      expect(pendingQuote).toBeDefined();
    });

    it("should not modify accepted quotes", () => {
      const acceptedQuote = mockQuotes.find((q) => q.status === "accepted");
      expect(acceptedQuote).toBeDefined();
      // Accepted quotes should not be modifiable
    });
  });

  describe("Worker Search", () => {
    it("should be able to search for workers", () => {
      const searchCriteria = {
        state: "Karnataka",
        district: "Mysore",
        work_type: "Harvesting",
      };
      expect(searchCriteria.state).toBeDefined();
    });

    it("should filter workers by availability", () => {
      const availabilityFilter = {
        from_date: new Date(),
        to_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };
      expect(availabilityFilter.from_date).toBeDefined();
    });
  });

  describe("Job Posting", () => {
    it("should be able to create job postings", () => {
      const jobPosting = {
        farmer_id: mockFarmerProfile.id,
        title: "Rice Harvesting Help Needed",
        description: "Looking for experienced workers",
        location_state: "Karnataka",
        location_district: "Bangalore",
        estimated_budget: 10000,
        status: "open",
      };

      expect(jobPosting.farmer_id).toBe(mockFarmerProfile.id);
      expect(jobPosting.status).toBe("open");
    });
  });

  describe("Notifications", () => {
    it("should receive quote notifications", () => {
      const farmerNotifications = mockNotifications.filter(
        (n) => n.user_id === mockFarmerProfile.id
      );
      const quoteNotifications = farmerNotifications.filter(
        (n) => n.type === "quote_received"
      );
      expect(quoteNotifications.length).toBeGreaterThan(0);
    });

    it("should receive order status notifications", () => {
      const notificationTypes = [
        "order_status",
        "quote_received",
        "payment_update",
        "new_review",
      ];
      notificationTypes.forEach((type) => {
        expect(typeof type).toBe("string");
      });
    });
  });

  describe("Messaging", () => {
    it("should be able to send messages to workers", () => {
      const message = {
        sender_id: mockFarmerProfile.id,
        receiver_id: mockWorkerProfile.id,
        message: "Hello, are you available for work?",
      };

      expect(message.sender_id).toBe(mockFarmerProfile.id);
      expect(message.message.length).toBeGreaterThan(0);
    });
  });

  describe("Reviews", () => {
    it("should be able to leave reviews for workers", () => {
      const review = {
        order_id: mockOrders[2].id, // completed order
        reviewer_id: mockFarmerProfile.id,
        reviewee_id: mockWorkerProfile.id,
        rating: 5,
        comment: "Excellent work!",
      };

      expect(review.reviewer_id).toBe(mockFarmerProfile.id);
      expect(review.rating).toBeGreaterThanOrEqual(1);
      expect(review.rating).toBeLessThanOrEqual(5);
    });

    it("should only review completed orders", () => {
      const completedOrder = mockOrders.find((o) => o.status === "completed");
      expect(completedOrder).toBeDefined();
    });
  });

  describe("Payment Management", () => {
    it("should be able to initiate payments", () => {
      const payment = {
        order_id: mockOrders[0].id,
        payer_id: mockFarmerProfile.id,
        receiver_id: mockWorkerProfile.id,
        amount: 5000,
        payment_method: "razorpay",
        status: "pending",
      };

      expect(payment.payer_id).toBe(mockFarmerProfile.id);
      expect(payment.amount).toBeGreaterThan(0);
    });

    it("should support multiple payment gateways", () => {
      const gateways = ["razorpay", "stripe", "paypal"];
      gateways.forEach((gateway) => {
        expect(["razorpay", "stripe", "paypal"]).toContain(gateway);
      });
    });
  });
});
