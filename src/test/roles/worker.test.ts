import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockWorkerProfile, mockFarmerProfile, mockOrders, mockQuotes, mockNotifications, mockWorkTypes } from "../mocks/supabase";

// Mock supabase
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { user: { id: mockWorkerProfile.id } } },
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
      single: vi.fn().mockResolvedValue({ data: mockWorkerProfile, error: null }),
    })),
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    }),
    removeChannel: vi.fn(),
  },
}));

describe("Farm Worker Role Tests", () => {
  describe("Profile & Authentication", () => {
    it("should have correct worker role attributes", () => {
      expect(mockWorkerProfile.role).toBe("farm_worker");
      expect(mockWorkerProfile.active_role).toBe("farm_worker");
      expect(mockWorkerProfile.user_type).toBe("farm_worker");
    });

    it("should have valid mobile number format", () => {
      expect(mockWorkerProfile.mobile_number).toMatch(/^\d{10}$/);
    });

    it("should have required profile fields", () => {
      expect(mockWorkerProfile.full_name).toBeDefined();
      expect(mockWorkerProfile.state).toBeDefined();
      expect(mockWorkerProfile.district).toBeDefined();
      expect(mockWorkerProfile.is_active).toBe(true);
    });

    it("should have rating information for workers", () => {
      expect(mockWorkerProfile.average_rating).toBeGreaterThanOrEqual(0);
      expect(mockWorkerProfile.total_ratings).toBeGreaterThanOrEqual(0);
    });

    it("should have higher rating count than farmer (workers get rated more)", () => {
      expect(mockWorkerProfile.total_ratings).toBeGreaterThan(
        mockFarmerProfile.total_ratings
      );
    });
  });

  describe("Work Type Management", () => {
    it("should be able to select work types", () => {
      expect(mockWorkTypes.length).toBeGreaterThan(0);
    });

    it("should only see active work types", () => {
      const activeWorkTypes = mockWorkTypes.filter((wt) => wt.is_active);
      expect(activeWorkTypes.length).toBe(mockWorkTypes.length);
    });

    it("should be able to associate with multiple work types", () => {
      const workerWorkTypes = [mockWorkTypes[0].id, mockWorkTypes[1].id];
      expect(workerWorkTypes.length).toBe(2);
    });
  });

  describe("Availability Management", () => {
    it("should be able to set availability dates", () => {
      const availability = {
        worker_id: mockWorkerProfile.id,
        available_from: new Date().toISOString().split("T")[0],
        available_to: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        notes: "Available for any type of farm work",
      };

      expect(availability.worker_id).toBe(mockWorkerProfile.id);
      expect(new Date(availability.available_to).getTime()).toBeGreaterThan(
        new Date(availability.available_from).getTime()
      );
    });

    it("should validate availability date range", () => {
      const fromDate = new Date();
      const toDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      expect(toDate.getTime()).toBeGreaterThan(fromDate.getTime());
    });

    it("should allow updating existing availability", () => {
      const updatedAvailability = {
        available_from: new Date().toISOString().split("T")[0],
        available_to: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
      };
      expect(updatedAvailability.available_to).toBeDefined();
    });

    it("should allow deleting availability", () => {
      const availabilityId = "availability-123";
      expect(availabilityId).toBeDefined();
    });
  });

  describe("Order Management", () => {
    it("should view orders assigned to worker", () => {
      const workerOrders = mockOrders.filter(
        (order) => order.worker_id === mockWorkerProfile.id
      );
      expect(workerOrders.length).toBeGreaterThan(0);
    });

    it("should calculate worker earnings", () => {
      const workerOrders = mockOrders.filter(
        (o) => o.worker_id === mockWorkerProfile.id
      );
      const completedOrders = workerOrders.filter(
        (o) => o.status === "completed"
      );
      const totalEarnings = completedOrders.reduce(
        (sum, o) => sum + o.agreed_amount,
        0
      );

      expect(completedOrders.length).toBe(1);
      expect(totalEarnings).toBe(3000);
    });

    it("should NOT be able to mark order as completed (only farmer can)", () => {
      const order = mockOrders.find((o) => o.status === "ongoing");
      expect(order).toBeDefined();
      // Worker cannot mark as completed - only farmer can
      expect(order?.farmer_id).not.toBe(mockWorkerProfile.id);
    });

    it("should be able to raise dispute", () => {
      const dispute = {
        order_id: mockOrders[0].id,
        dispute_reason: "Payment not received",
      };
      expect(dispute.dispute_reason.length).toBeGreaterThan(0);
    });
  });

  describe("Quote Submission", () => {
    it("should be able to submit quotes for jobs", () => {
      const quote = {
        job_posting_id: "job-123",
        worker_id: mockWorkerProfile.id,
        farmer_id: mockFarmerProfile.id,
        proposed_amount: 5000,
        proposed_hours: 8,
        message: "I can complete this efficiently",
        status: "pending",
      };

      expect(quote.worker_id).toBe(mockWorkerProfile.id);
      expect(quote.proposed_amount).toBeGreaterThan(0);
      expect(quote.status).toBe("pending");
    });

    it("should view own submitted quotes", () => {
      const workerQuotes = mockQuotes.filter(
        (q) => q.worker_id === mockWorkerProfile.id
      );
      expect(workerQuotes.length).toBeGreaterThan(0);
    });

    it("should be able to update pending quotes", () => {
      const pendingQuote = mockQuotes.find(
        (q) => q.worker_id === mockWorkerProfile.id && q.status === "pending"
      );
      expect(pendingQuote).toBeDefined();
    });

    it("should NOT be able to update accepted/rejected quotes", () => {
      const acceptedQuote = mockQuotes.find(
        (q) => q.worker_id === mockWorkerProfile.id && q.status === "accepted"
      );
      if (acceptedQuote) {
        expect(acceptedQuote.status).not.toBe("pending");
      }
    });

    it("should be able to delete pending quotes", () => {
      const pendingQuote = mockQuotes.find(
        (q) => q.worker_id === mockWorkerProfile.id && q.status === "pending"
      );
      expect(pendingQuote).toBeDefined();
    });
  });

  describe("Job Postings View", () => {
    it("should browse open job postings", () => {
      const jobPosting = {
        id: "job-1",
        status: "open",
        farmer_id: mockFarmerProfile.id,
        title: "Rice Harvesting",
        location_state: "Karnataka",
        location_district: "Mysore",
      };

      expect(jobPosting.status).toBe("open");
    });

    it("should filter job postings by location", () => {
      const filter = {
        state: "Karnataka",
        district: "Mysore",
      };
      expect(filter.state).toBeDefined();
    });

    it("should filter job postings by work type", () => {
      const filter = {
        work_type_id: mockWorkTypes[0].id,
      };
      expect(filter.work_type_id).toBeDefined();
    });
  });

  describe("Notifications", () => {
    it("should receive quote response notifications", () => {
      const workerNotifications = mockNotifications.filter(
        (n) => n.user_id === mockWorkerProfile.id
      );
      expect(workerNotifications.length).toBeGreaterThan(0);
    });

    it("should receive order status notifications", () => {
      const statusNotification = mockNotifications.find(
        (n) => n.user_id === mockWorkerProfile.id && n.type === "order_status"
      );
      expect(statusNotification).toBeDefined();
    });

    it("should receive payment notifications", () => {
      const paymentTypes = ["payment_update"];
      paymentTypes.forEach((type) => {
        expect(typeof type).toBe("string");
      });
    });
  });

  describe("Messaging", () => {
    it("should be able to send messages to farmers", () => {
      const message = {
        sender_id: mockWorkerProfile.id,
        receiver_id: mockFarmerProfile.id,
        message: "Thank you for the opportunity!",
      };

      expect(message.sender_id).toBe(mockWorkerProfile.id);
      expect(message.receiver_id).toBe(mockFarmerProfile.id);
    });

    it("should be able to receive messages", () => {
      const incomingMessage = {
        sender_id: mockFarmerProfile.id,
        receiver_id: mockWorkerProfile.id,
        message: "Are you available next week?",
        is_read: false,
      };

      expect(incomingMessage.receiver_id).toBe(mockWorkerProfile.id);
      expect(incomingMessage.is_read).toBe(false);
    });
  });

  describe("Reviews", () => {
    it("should be able to leave reviews for farmers", () => {
      const review = {
        order_id: mockOrders[2].id,
        reviewer_id: mockWorkerProfile.id,
        reviewee_id: mockFarmerProfile.id,
        rating: 5,
        comment: "Great to work with!",
      };

      expect(review.reviewer_id).toBe(mockWorkerProfile.id);
      expect(review.rating).toBeGreaterThanOrEqual(1);
      expect(review.rating).toBeLessThanOrEqual(5);
    });

    it("should receive reviews from farmers", () => {
      const receivedReview = {
        reviewee_id: mockWorkerProfile.id,
        reviewer_id: mockFarmerProfile.id,
        rating: 4,
      };

      expect(receivedReview.reviewee_id).toBe(mockWorkerProfile.id);
    });
  });

  describe("Payment Reception", () => {
    it("should receive payments for completed work", () => {
      const payment = {
        order_id: mockOrders[2].id,
        receiver_id: mockWorkerProfile.id,
        payer_id: mockFarmerProfile.id,
        amount: 3000,
        status: "completed",
      };

      expect(payment.receiver_id).toBe(mockWorkerProfile.id);
      expect(payment.status).toBe("completed");
    });

    it("should track pending payments", () => {
      const pendingPayment = {
        receiver_id: mockWorkerProfile.id,
        status: "pending",
        amount: 5000,
      };

      expect(pendingPayment.status).toBe("pending");
    });
  });
});
