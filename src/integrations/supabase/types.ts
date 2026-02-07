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
      app_settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_encrypted: boolean | null
          key: string
          updated_at: string | null
          updated_by: string | null
          value: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_encrypted?: boolean | null
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_encrypted?: boolean | null
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: string | null
        }
        Relationships: []
      }
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
            foreignKeyName: "chat_messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
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
          {
            foreignKeyName: "commission_history_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_alerts: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          search_criteria: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          search_criteria: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          search_criteria?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      job_postings: {
        Row: {
          coordinates_lat: number | null
          coordinates_lng: number | null
          created_at: string | null
          description: string
          end_date: string | null
          estimated_budget: number | null
          estimated_duration: string | null
          farmer_id: string
          id: string
          location_address: string | null
          location_district: string
          location_state: string
          start_date: string | null
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          work_crop_type_id: string | null
          work_type_id: string | null
        }
        Insert: {
          coordinates_lat?: number | null
          coordinates_lng?: number | null
          created_at?: string | null
          description: string
          end_date?: string | null
          estimated_budget?: number | null
          estimated_duration?: string | null
          farmer_id: string
          id?: string
          location_address?: string | null
          location_district: string
          location_state: string
          start_date?: string | null
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          work_crop_type_id?: string | null
          work_type_id?: string | null
        }
        Update: {
          coordinates_lat?: number | null
          coordinates_lng?: number | null
          created_at?: string | null
          description?: string
          end_date?: string | null
          estimated_budget?: number | null
          estimated_duration?: string | null
          farmer_id?: string
          id?: string
          location_address?: string | null
          location_district?: string
          location_state?: string
          start_date?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          work_crop_type_id?: string | null
          work_type_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_postings_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_postings_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_postings_work_crop_type_id_fkey"
            columns: ["work_crop_type_id"]
            isOneToOne: false
            referencedRelation: "work_crop_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_postings_work_type_id_fkey"
            columns: ["work_type_id"]
            isOneToOne: false
            referencedRelation: "work_types"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_settings: {
        Row: {
          created_at: string | null
          id: string
          new_message: boolean | null
          new_review: boolean | null
          order_status_change: boolean | null
          payment_updates: boolean | null
          quote_received: boolean | null
          quote_response: boolean | null
          sms_enabled: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          new_message?: boolean | null
          new_review?: boolean | null
          order_status_change?: boolean | null
          payment_updates?: boolean | null
          quote_received?: boolean | null
          quote_response?: boolean | null
          sms_enabled?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          new_message?: boolean | null
          new_review?: boolean | null
          order_status_change?: boolean | null
          payment_updates?: boolean | null
          quote_received?: boolean | null
          quote_response?: boolean | null
          sms_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          message: string
          metadata: Json | null
          phone_number: string | null
          sent_at: string | null
          status: string | null
          title: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          message: string
          metadata?: Json | null
          phone_number?: string | null
          sent_at?: string | null
          status?: string | null
          title: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          phone_number?: string | null
          sent_at?: string | null
          status?: string | null
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
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
            foreignKeyName: "order_payments_payer_id_fkey"
            columns: ["payer_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_payments_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_payments_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
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
          rating_type: string | null
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
          rating_type?: string | null
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
          rating_type?: string | null
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
            foreignKeyName: "order_reviews_reviewee_id_fkey"
            columns: ["reviewee_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
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
            foreignKeyName: "orders_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
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
          {
            foreignKeyName: "orders_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_transactions: {
        Row: {
          amount: number
          commission_amount: number
          commission_percentage: number
          created_at: string | null
          failure_reason: string | null
          gateway_order_id: string | null
          gateway_payment_id: string | null
          gateway_signature: string | null
          held_at: string | null
          id: string
          metadata: Json | null
          net_amount: number
          order_id: string
          payer_id: string
          payment_gateway: string
          quote_id: string | null
          receiver_id: string
          refunded_at: string | null
          released_at: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          commission_amount?: number
          commission_percentage?: number
          created_at?: string | null
          failure_reason?: string | null
          gateway_order_id?: string | null
          gateway_payment_id?: string | null
          gateway_signature?: string | null
          held_at?: string | null
          id?: string
          metadata?: Json | null
          net_amount: number
          order_id: string
          payer_id: string
          payment_gateway: string
          quote_id?: string | null
          receiver_id: string
          refunded_at?: string | null
          released_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          commission_amount?: number
          commission_percentage?: number
          created_at?: string | null
          failure_reason?: string | null
          gateway_order_id?: string | null
          gateway_payment_id?: string | null
          gateway_signature?: string | null
          held_at?: string | null
          id?: string
          metadata?: Json | null
          net_amount?: number
          order_id?: string
          payer_id?: string
          payment_gateway?: string
          quote_id?: string | null
          receiver_id?: string
          refunded_at?: string | null
          released_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "worker_quotes"
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
            foreignKeyName: "payments_payer_id_fkey"
            columns: ["payer_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
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
          {
            foreignKeyName: "payments_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active_role: Database["public"]["Enums"]["user_role"] | null
          address: string | null
          avatar_url: string | null
          average_rating: number | null
          bank_account_holder_name: string | null
          bank_account_number: string | null
          bank_ifsc_code: string | null
          bio: string | null
          coordinates_lat: number | null
          coordinates_lng: number | null
          country: string | null
          created_at: string | null
          district: string
          election_card_number: string | null
          email: string | null
          full_name: string
          gov_id_number: string | null
          gov_id_type: Database["public"]["Enums"]["gov_id_type"] | null
          id: string
          is_active: boolean | null
          kyc_verified: boolean | null
          latitude: number | null
          longitude: number | null
          mobile_number: string
          passport_number: string | null
          preferred_language: string | null
          ration_card_number: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          state: string
          total_ratings: number | null
          updated_at: string | null
          upi_id: string | null
          user_type: string
        }
        Insert: {
          active_role?: Database["public"]["Enums"]["user_role"] | null
          address?: string | null
          avatar_url?: string | null
          average_rating?: number | null
          bank_account_holder_name?: string | null
          bank_account_number?: string | null
          bank_ifsc_code?: string | null
          bio?: string | null
          coordinates_lat?: number | null
          coordinates_lng?: number | null
          country?: string | null
          created_at?: string | null
          district: string
          election_card_number?: string | null
          email?: string | null
          full_name: string
          gov_id_number?: string | null
          gov_id_type?: Database["public"]["Enums"]["gov_id_type"] | null
          id: string
          is_active?: boolean | null
          kyc_verified?: boolean | null
          latitude?: number | null
          longitude?: number | null
          mobile_number: string
          passport_number?: string | null
          preferred_language?: string | null
          ration_card_number?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          state: string
          total_ratings?: number | null
          updated_at?: string | null
          upi_id?: string | null
          user_type: string
        }
        Update: {
          active_role?: Database["public"]["Enums"]["user_role"] | null
          address?: string | null
          avatar_url?: string | null
          average_rating?: number | null
          bank_account_holder_name?: string | null
          bank_account_number?: string | null
          bank_ifsc_code?: string | null
          bio?: string | null
          coordinates_lat?: number | null
          coordinates_lng?: number | null
          country?: string | null
          created_at?: string | null
          district?: string
          election_card_number?: string | null
          email?: string | null
          full_name?: string
          gov_id_number?: string | null
          gov_id_type?: Database["public"]["Enums"]["gov_id_type"] | null
          id?: string
          is_active?: boolean | null
          kyc_verified?: boolean | null
          latitude?: number | null
          longitude?: number | null
          mobile_number?: string
          passport_number?: string | null
          preferred_language?: string | null
          ration_card_number?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          state?: string
          total_ratings?: number | null
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
            foreignKeyName: "quotes_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
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
            foreignKeyName: "quotes_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
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
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
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
      saved_searches: {
        Row: {
          created_at: string | null
          id: string
          location_district: string | null
          location_state: string | null
          radius_km: number | null
          search_name: string
          user_id: string
          work_crop_type_ids: string[] | null
          work_type_ids: string[] | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          location_district?: string | null
          location_state?: string | null
          radius_km?: number | null
          search_name: string
          user_id: string
          work_crop_type_ids?: string[] | null
          work_type_ids?: string[] | null
        }
        Update: {
          created_at?: string | null
          id?: string
          location_district?: string | null
          location_state?: string | null
          radius_km?: number | null
          search_name?: string
          user_id?: string
          work_crop_type_ids?: string[] | null
          work_type_ids?: string[] | null
        }
        Relationships: []
      }
      search_history: {
        Row: {
          created_at: string | null
          id: string
          search_filters: Json | null
          search_query: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          search_filters?: Json | null
          search_query: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          search_filters?: Json | null
          search_query?: string
          user_id?: string
        }
        Relationships: []
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
          {
            foreignKeyName: "services_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      translations: {
        Row: {
          context: string | null
          created_at: string | null
          id: string
          key: string
          language_code: string
          updated_at: string | null
          value: string
        }
        Insert: {
          context?: string | null
          created_at?: string | null
          id?: string
          key: string
          language_code: string
          updated_at?: string | null
          value: string
        }
        Update: {
          context?: string | null
          created_at?: string | null
          id?: string
          key?: string
          language_code?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_work_types: {
        Row: {
          created_at: string | null
          id: string
          user_id: string
          work_crop_type_id: string
          work_type_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          user_id: string
          work_crop_type_id: string
          work_type_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          user_id?: string
          work_crop_type_id?: string
          work_type_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_work_types_work_crop_type_id_fkey"
            columns: ["work_crop_type_id"]
            isOneToOne: false
            referencedRelation: "work_crop_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_work_types_work_type_id_fkey"
            columns: ["work_type_id"]
            isOneToOne: false
            referencedRelation: "work_types"
            referencedColumns: ["id"]
          },
        ]
      }
      work_crop_types: {
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
      work_types: {
        Row: {
          commission_rate: number | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
          work_crop_type_id: string | null
        }
        Insert: {
          commission_rate?: number | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
          work_crop_type_id?: string | null
        }
        Update: {
          commission_rate?: number | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
          work_crop_type_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "work_types_work_crop_type_id_fkey"
            columns: ["work_crop_type_id"]
            isOneToOne: false
            referencedRelation: "work_crop_types"
            referencedColumns: ["id"]
          },
        ]
      }
      worker_availability: {
        Row: {
          available_from: string
          available_to: string
          created_at: string | null
          id: string
          notes: string | null
          updated_at: string | null
          worker_id: string
        }
        Insert: {
          available_from: string
          available_to: string
          created_at?: string | null
          id?: string
          notes?: string | null
          updated_at?: string | null
          worker_id: string
        }
        Update: {
          available_from?: string
          available_to?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          updated_at?: string | null
          worker_id?: string
        }
        Relationships: []
      }
      worker_quotes: {
        Row: {
          created_at: string | null
          farmer_id: string
          id: string
          job_posting_id: string | null
          message: string | null
          order_id: string | null
          proposed_amount: number
          proposed_hours: number | null
          status: string
          updated_at: string | null
          valid_until: string | null
          worker_id: string
        }
        Insert: {
          created_at?: string | null
          farmer_id: string
          id?: string
          job_posting_id?: string | null
          message?: string | null
          order_id?: string | null
          proposed_amount: number
          proposed_hours?: number | null
          status?: string
          updated_at?: string | null
          valid_until?: string | null
          worker_id: string
        }
        Update: {
          created_at?: string | null
          farmer_id?: string
          id?: string
          job_posting_id?: string | null
          message?: string | null
          order_id?: string | null
          proposed_amount?: number
          proposed_hours?: number | null
          status?: string
          updated_at?: string | null
          valid_until?: string | null
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worker_quotes_job_posting_id_fkey"
            columns: ["job_posting_id"]
            isOneToOne: false
            referencedRelation: "job_postings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "worker_quotes_job_posting_id_fkey"
            columns: ["job_posting_id"]
            isOneToOne: false
            referencedRelation: "public_job_postings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "worker_quotes_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      public_job_postings: {
        Row: {
          created_at: string | null
          description: string | null
          end_date: string | null
          estimated_budget: number | null
          estimated_duration: string | null
          farmer_id: string | null
          id: string | null
          location_district: string | null
          location_state: string | null
          start_date: string | null
          status: string | null
          tags: string[] | null
          title: string | null
          updated_at: string | null
          work_crop_type_id: string | null
          work_type_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          estimated_budget?: number | null
          estimated_duration?: string | null
          farmer_id?: string | null
          id?: string | null
          location_district?: string | null
          location_state?: string | null
          start_date?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
          work_crop_type_id?: string | null
          work_type_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          estimated_budget?: number | null
          estimated_duration?: string | null
          farmer_id?: string | null
          id?: string | null
          location_district?: string | null
          location_state?: string | null
          start_date?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
          work_crop_type_id?: string | null
          work_type_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_postings_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_postings_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_postings_work_crop_type_id_fkey"
            columns: ["work_crop_type_id"]
            isOneToOne: false
            referencedRelation: "work_crop_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_postings_work_type_id_fkey"
            columns: ["work_type_id"]
            isOneToOne: false
            referencedRelation: "work_types"
            referencedColumns: ["id"]
          },
        ]
      }
      public_profiles: {
        Row: {
          active_role: Database["public"]["Enums"]["user_role"] | null
          avatar_url: string | null
          average_rating: number | null
          bio: string | null
          country: string | null
          created_at: string | null
          district: string | null
          full_name: string | null
          id: string | null
          is_active: boolean | null
          kyc_verified: boolean | null
          role: Database["public"]["Enums"]["user_role"] | null
          state: string | null
          total_ratings: number | null
          user_type: string | null
        }
        Insert: {
          active_role?: Database["public"]["Enums"]["user_role"] | null
          avatar_url?: string | null
          average_rating?: number | null
          bio?: string | null
          country?: string | null
          created_at?: string | null
          district?: string | null
          full_name?: string | null
          id?: string | null
          is_active?: boolean | null
          kyc_verified?: boolean | null
          role?: Database["public"]["Enums"]["user_role"] | null
          state?: string | null
          total_ratings?: number | null
          user_type?: string | null
        }
        Update: {
          active_role?: Database["public"]["Enums"]["user_role"] | null
          avatar_url?: string | null
          average_rating?: number | null
          bio?: string | null
          country?: string | null
          created_at?: string | null
          district?: string | null
          full_name?: string | null
          id?: string | null
          is_active?: boolean | null
          kyc_verified?: boolean | null
          role?: Database["public"]["Enums"]["user_role"] | null
          state?: string | null
          total_ratings?: number | null
          user_type?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_payment_amounts: {
        Args: { p_amount: number; p_commission_percentage: number }
        Returns: {
          commission_amount: number
          net_amount: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
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
