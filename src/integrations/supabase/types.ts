export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      chat_messages: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          order_id: string | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          order_id?: string | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          order_id?: string | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_history: {
        Row: {
          created_at: string | null
          created_by: string | null
          effective_from: string | null
          id: string
          percentage: number
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          effective_from?: string | null
          id?: string
          percentage: number
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          effective_from?: string | null
          id?: string
          percentage?: number
        }
        Relationships: [
          {
            foreignKeyName: "commission_history_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      order_payments: {
        Row: {
          amount: number
          commission_amount: number | null
          created_at: string | null
          id: string
          order_id: string
          paid_at: string | null
          payer_id: string
          payment_method: string
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          receiver_id: string
          status: string | null
          transaction_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          commission_amount?: number | null
          created_at?: string | null
          id?: string
          order_id: string
          paid_at?: string | null
          payer_id: string
          payment_method: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          receiver_id: string
          status?: string | null
          transaction_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          commission_amount?: number | null
          created_at?: string | null
          id?: string
          order_id?: string
          paid_at?: string | null
          payer_id?: string
          payment_method?: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          receiver_id?: string
          status?: string | null
          transaction_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_payments_payer_id_fkey"
            columns: ["payer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_payments_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      order_reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          order_id: string
          rating: number
          reviewee_id: string
          reviewer_id: string
          updated_at: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          order_id: string
          rating: number
          reviewee_id: string
          reviewer_id: string
          updated_at?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          order_id?: string
          rating?: number
          reviewee_id?: string
          reviewer_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_reviews_reviewee_id_fkey"
            columns: ["reviewee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          agreed_amount: number
          cancellation_reason: string | null
          commission_amount: number | null
          commission_percentage: number | null
          created_at: string | null
          description: string
          dispute_reason: string | null
          end_date: string | null
          estimated_hours: number | null
          farmer_id: string
          id: string
          location_address: string
          location_lat: number | null
          location_lng: number | null
          notes: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["order_status"] | null
          title: string
          updated_at: string | null
          work_type_id: string | null
          worker_id: string
        }
        Insert: {
          agreed_amount: number
          cancellation_reason?: string | null
          commission_amount?: number | null
          commission_percentage?: number | null
          created_at?: string | null
          description: string
          dispute_reason?: string | null
          end_date?: string | null
          estimated_hours?: number | null
          farmer_id: string
          id?: string
          location_address: string
          location_lat?: number | null
          location_lng?: number | null
          notes?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          title: string
          updated_at?: string | null
          work_type_id?: string | null
          worker_id: string
        }
        Update: {
          agreed_amount?: number
          cancellation_reason?: string | null
          commission_amount?: number | null
          commission_percentage?: number | null
          created_at?: string | null
          description?: string
          dispute_reason?: string | null
          end_date?: string | null
          estimated_hours?: number | null
          farmer_id?: string
          id?: string
          location_address?: string
          location_lat?: number | null
          location_lng?: number | null
          notes?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          title?: string
          updated_at?: string | null
          work_type_id?: string | null
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_work_type_id_fkey"
            columns: ["work_type_id"]
            isOneToOne: false
            referencedRelation: "work_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          payer_id: string
          payment_method: string | null
          quote_id: string
          receiver_id: string
          status: Database["public"]["Enums"]["payment_status"] | null
          transaction_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          payer_id: string
          payment_method?: string | null
          quote_id: string
          receiver_id: string
          status?: Database["public"]["Enums"]["payment_status"] | null
          transaction_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          payer_id?: string
          payment_method?: string | null
          quote_id?: string
          receiver_id?: string
          status?: Database["public"]["Enums"]["payment_status"] | null
          transaction_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_payer_id_fkey"
            columns: ["payer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bank_account_holder_name: string | null
          bank_account_number: string | null
          bank_ifsc_code: string | null
          bio: string | null
          country: string | null
          created_at: string | null
          district: string
          full_name: string
          gov_id_number: string | null
          gov_id_type: Database["public"]["Enums"]["gov_id_type"] | null
          id: string
          is_active: boolean | null
          kyc_verified: boolean | null
          latitude: number | null
          longitude: number | null
          mobile_number: string
          role: Database["public"]["Enums"]["user_role"] | null
          state: string
          updated_at: string | null
          upi_id: string | null
          user_type: string
        }
        Insert: {
          avatar_url?: string | null
          bank_account_holder_name?: string | null
          bank_account_number?: string | null
          bank_ifsc_code?: string | null
          bio?: string | null
          country?: string | null
          created_at?: string | null
          district: string
          full_name: string
          gov_id_number?: string | null
          gov_id_type?: Database["public"]["Enums"]["gov_id_type"] | null
          id: string
          is_active?: boolean | null
          kyc_verified?: boolean | null
          latitude?: number | null
          longitude?: number | null
          mobile_number: string
          role?: Database["public"]["Enums"]["user_role"] | null
          state: string
          updated_at?: string | null
          upi_id?: string | null
          user_type: string
        }
        Update: {
          avatar_url?: string | null
          bank_account_holder_name?: string | null
          bank_account_number?: string | null
          bank_ifsc_code?: string | null
          bio?: string | null
          country?: string | null
          created_at?: string | null
          district?: string
          full_name?: string
          gov_id_number?: string | null
          gov_id_type?: Database["public"]["Enums"]["gov_id_type"] | null
          id?: string
          is_active?: boolean | null
          kyc_verified?: boolean | null
          latitude?: number | null
          longitude?: number | null
          mobile_number?: string
          role?: Database["public"]["Enums"]["user_role"] | null
          state?: string
          updated_at?: string | null
          upi_id?: string | null
          user_type?: string
        }
        Relationships: []
      }
      quotes: {
        Row: {
          created_at: string | null
          description: string
          estimated_duration: string | null
          id: string
          notes: string | null
          proposed_price: number
          provider_id: string
          requester_id: string
          service_id: string
          status: Database["public"]["Enums"]["quote_status"] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          estimated_duration?: string | null
          id?: string
          notes?: string | null
          proposed_price: number
          provider_id: string
          requester_id: string
          service_id: string
          status?: Database["public"]["Enums"]["quote_status"] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          estimated_duration?: string | null
          id?: string
          notes?: string | null
          proposed_price?: number
          provider_id?: string
          requester_id?: string
          service_id?: string
          status?: Database["public"]["Enums"]["quote_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          rating: number
          reviewer_id: string
          service_id: string
          updated_at: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          rating: number
          reviewer_id: string
          service_id: string
          updated_at?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          rating?: number
          reviewer_id?: string
          service_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          category: Database["public"]["Enums"]["service_category"]
          created_at: string | null
          description: string
          id: string
          images: string[] | null
          is_active: boolean | null
          latitude: number | null
          location_district: string
          location_state: string
          longitude: number | null
          price_per_unit: number | null
          title: string
          unit: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category: Database["public"]["Enums"]["service_category"]
          created_at?: string | null
          description: string
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          latitude?: number | null
          location_district: string
          location_state: string
          longitude?: number | null
          price_per_unit?: number | null
          title: string
          unit?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["service_category"]
          created_at?: string | null
          description?: string
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          latitude?: number | null
          location_district?: string
          location_state?: string
          longitude?: number | null
          price_per_unit?: number | null
          title?: string
          unit?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      work_types: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      gov_id_type: "aadhar_card" | "pan_card" | "voter_id" | "driving_license"
      order_status:
        | "new"
        | "ongoing"
        | "completed"
        | "partially_accepted"
        | "agreed_partially"
        | "accepted_finished"
        | "canceled"
        | "dispute"
      payment_status:
        | "pending"
        | "processing"
        | "completed"
        | "failed"
        | "refunded"
      quote_status:
        | "pending"
        | "accepted"
        | "rejected"
        | "completed"
        | "cancelled"
      service_category:
        | "harvest"
        | "planting"
        | "irrigation"
        | "pest_control"
        | "transportation"
        | "equipment_rental"
        | "consulting"
        | "other"
      user_role: "super_admin" | "admin" | "farmer" | "farm_worker"
      user_type: "employee" | "employer"
      work_category:
        | "harvesting"
        | "plowing"
        | "irrigation"
        | "pesticide_spray"
        | "planting"
        | "weeding"
        | "other"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      gov_id_type: ["aadhar_card", "pan_card", "voter_id", "driving_license"],
      order_status: [
        "new",
        "ongoing",
        "completed",
        "partially_accepted",
        "agreed_partially",
        "accepted_finished",
        "canceled",
        "dispute",
      ],
      payment_status: [
        "pending",
        "processing",
        "completed",
        "failed",
        "refunded",
      ],
      quote_status: [
        "pending",
        "accepted",
        "rejected",
        "completed",
        "cancelled",
      ],
      service_category: [
        "harvest",
        "planting",
        "irrigation",
        "pest_control",
        "transportation",
        "equipment_rental",
        "consulting",
        "other",
      ],
      user_role: ["super_admin", "admin", "farmer", "farm_worker"],
      user_type: ["employee", "employer"],
      work_category: [
        "harvesting",
        "plowing",
        "irrigation",
        "pesticide_spray",
        "planting",
        "weeding",
        "other",
      ],
    },
  },
} as const
