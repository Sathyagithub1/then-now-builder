import { vi } from "vitest";

// Mock user profiles for different roles
export const mockFarmerProfile = {
  id: "farmer-123",
  full_name: "Test Farmer",
  mobile_number: "9876543210",
  role: "farmer",
  active_role: "farmer",
  user_type: "farmer",
  state: "Karnataka",
  district: "Bangalore",
  is_active: true,
  kyc_verified: true,
  average_rating: 4.5,
  total_ratings: 10,
  created_at: new Date().toISOString(),
};

export const mockWorkerProfile = {
  id: "worker-456",
  full_name: "Test Worker",
  mobile_number: "9876543211",
  role: "farm_worker",
  active_role: "farm_worker",
  user_type: "farm_worker",
  state: "Karnataka",
  district: "Mysore",
  is_active: true,
  kyc_verified: true,
  average_rating: 4.8,
  total_ratings: 25,
  created_at: new Date().toISOString(),
};

export const mockAdminProfile = {
  id: "admin-789",
  full_name: "Test Admin",
  mobile_number: "9876543212",
  role: "admin",
  active_role: "admin",
  user_type: "admin",
  state: "Karnataka",
  district: "Bangalore",
  is_active: true,
  kyc_verified: true,
  average_rating: null,
  total_ratings: 0,
  created_at: new Date().toISOString(),
};

export const mockSuperAdminProfile = {
  id: "superadmin-000",
  full_name: "Super Admin",
  mobile_number: "9876543200",
  role: "super_admin",
  active_role: "super_admin",
  user_type: "super_admin",
  state: "Karnataka",
  district: "Bangalore",
  is_active: true,
  kyc_verified: true,
  average_rating: null,
  total_ratings: 0,
  created_at: new Date().toISOString(),
};

// Mock orders
export const mockOrders = [
  {
    id: "order-1",
    title: "Rice Harvesting",
    description: "Need help harvesting rice fields",
    farmer_id: "farmer-123",
    worker_id: "worker-456",
    status: "new",
    agreed_amount: 5000,
    location_address: "Farm Plot 23, Bangalore",
    created_at: new Date().toISOString(),
  },
  {
    id: "order-2",
    title: "Wheat Planting",
    description: "Planting wheat in 5 acres",
    farmer_id: "farmer-123",
    worker_id: "worker-456",
    status: "ongoing",
    agreed_amount: 8000,
    location_address: "Farm Plot 45, Mysore",
    created_at: new Date().toISOString(),
  },
  {
    id: "order-3",
    title: "Completed Work",
    description: "Irrigation work completed",
    farmer_id: "farmer-123",
    worker_id: "worker-456",
    status: "completed",
    agreed_amount: 3000,
    location_address: "Farm Plot 10, Bangalore",
    created_at: new Date().toISOString(),
  },
];

// Mock quotes
export const mockQuotes = [
  {
    id: "quote-1",
    job_posting_id: "job-1",
    worker_id: "worker-456",
    farmer_id: "farmer-123",
    proposed_amount: 4500,
    proposed_hours: 8,
    message: "I can complete this work efficiently",
    status: "pending",
    created_at: new Date().toISOString(),
  },
  {
    id: "quote-2",
    job_posting_id: "job-2",
    worker_id: "worker-456",
    farmer_id: "farmer-123",
    proposed_amount: 7000,
    proposed_hours: 12,
    message: "Experienced in this type of work",
    status: "accepted",
    created_at: new Date().toISOString(),
  },
];

// Mock notifications
export const mockNotifications = [
  {
    id: "notif-1",
    user_id: "farmer-123",
    type: "quote_received",
    title: "New Quote Received",
    message: "Test Worker sent you a quote for ₹4500",
    status: "pending",
    created_at: new Date().toISOString(),
  },
  {
    id: "notif-2",
    user_id: "worker-456",
    type: "order_status",
    title: "Order Update",
    message: "Order status changed to ongoing",
    status: "sent",
    created_at: new Date().toISOString(),
  },
];

// Mock app settings (payment secrets are now managed via Cloud env vars, not stored in DB)
export const mockAppSettings = [
  { id: "1", key: "MSG91_AUTH_KEY", value: "test-key", description: "MSG91 Auth Key", is_encrypted: true },
  { id: "2", key: "MSG91_SENDER_ID", value: "FARMCH", description: "MSG91 Sender ID", is_encrypted: false },
  { id: "3", key: "SMS_ENABLED", value: "true", description: "SMS Enabled", is_encrypted: false },
  { id: "4", key: "SMS_PROVIDER", value: "msg91", description: "SMS Provider", is_encrypted: false },
  { id: "5", key: "COMMISSION_PERCENTAGE", value: "10", description: "Commission %", is_encrypted: false },
];

// Mock work types
export const mockWorkTypes = [
  { id: "wt-1", name: "Harvesting", description: "Crop harvesting work", icon: "🌾", is_active: true },
  { id: "wt-2", name: "Planting", description: "Seed planting work", icon: "🌱", is_active: true },
  { id: "wt-3", name: "Irrigation", description: "Water management", icon: "💧", is_active: true },
];

// Create mock supabase client
export const createMockSupabase = (userProfile: typeof mockFarmerProfile | null = null) => {
  const mockSession = userProfile ? {
    user: { id: userProfile.id, email: `${userProfile.mobile_number}@farmerchain.app` },
    access_token: "mock-token",
  } : null;

  return {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: mockSession }, error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: { session: mockSession }, error: null }),
      signUp: vi.fn().mockResolvedValue({ data: { user: mockSession?.user }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
    from: vi.fn((table: string) => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: userProfile, error: null }),
      then: vi.fn(),
    })),
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    }),
    removeChannel: vi.fn(),
  };
};
