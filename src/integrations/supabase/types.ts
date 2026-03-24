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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      application_status_history: {
        Row: {
          changed_by: string
          created_at: string
          id: string
          new_status: string
          note: string | null
          old_status: string | null
          provider_profile_id: string
        }
        Insert: {
          changed_by: string
          created_at?: string
          id?: string
          new_status: string
          note?: string | null
          old_status?: string | null
          provider_profile_id: string
        }
        Update: {
          changed_by?: string
          created_at?: string
          id?: string
          new_status?: string
          note?: string | null
          old_status?: string | null
          provider_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_status_history_provider_profile_id_fkey"
            columns: ["provider_profile_id"]
            isOneToOne: false
            referencedRelation: "provider_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          customer_user_id: string
          id: string
          job_id: string
          provider_user_id: string
        }
        Insert: {
          created_at?: string
          customer_user_id: string
          id?: string
          job_id: string
          provider_user_id: string
        }
        Update: {
          created_at?: string
          customer_user_id?: string
          id?: string
          job_id?: string
          provider_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_favourites: {
        Row: {
          created_at: string
          customer_user_id: string
          id: string
          provider_user_id: string
        }
        Insert: {
          created_at?: string
          customer_user_id: string
          id?: string
          provider_user_id: string
        }
        Update: {
          created_at?: string
          customer_user_id?: string
          id?: string
          provider_user_id?: string
        }
        Relationships: []
      }
      customer_recommendations: {
        Row: {
          created_at: string
          customer_name: string | null
          customer_postcode: string | null
          id: string
          message: string | null
          photo_urls: string[] | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          customer_name?: string | null
          customer_postcode?: string | null
          id?: string
          message?: string | null
          photo_urls?: string[] | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          customer_name?: string | null
          customer_postcode?: string | null
          id?: string
          message?: string | null
          photo_urls?: string[] | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      dispute_messages: {
        Row: {
          body: string
          created_at: string
          dispute_id: string
          id: string
          is_admin_only: boolean
          sender_user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          dispute_id: string
          id?: string
          is_admin_only?: boolean
          sender_user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          dispute_id?: string
          id?: string
          is_admin_only?: boolean
          sender_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dispute_messages_dispute_id_fkey"
            columns: ["dispute_id"]
            isOneToOne: false
            referencedRelation: "job_disputes"
            referencedColumns: ["id"]
          },
        ]
      }
      escrow_payments: {
        Row: {
          amount: number
          created_at: string
          customer_user_id: string
          id: string
          job_id: string
          milestone_id: string | null
          platform_fee: number
          provider_payout: number
          provider_user_id: string
          status: string
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          stripe_transfer_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          customer_user_id: string
          id?: string
          job_id: string
          milestone_id?: string | null
          platform_fee?: number
          provider_payout?: number
          provider_user_id: string
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_transfer_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          customer_user_id?: string
          id?: string
          job_id?: string
          milestone_id?: string | null
          platform_fee?: number
          provider_payout?: number
          provider_user_id?: string
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_transfer_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "escrow_payments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escrow_payments_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "job_milestones"
            referencedColumns: ["id"]
          },
        ]
      }
      job_disputes: {
        Row: {
          created_at: string
          id: string
          job_id: string
          raised_by: string
          reason: string
          status: Database["public"]["Enums"]["dispute_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_id: string
          raised_by: string
          reason: string
          status?: Database["public"]["Enums"]["dispute_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string
          raised_by?: string
          reason?: string
          status?: Database["public"]["Enums"]["dispute_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_disputes_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_invitations: {
        Row: {
          created_at: string
          customer_user_id: string
          id: string
          job_id: string
          provider_user_id: string
          status: string
        }
        Insert: {
          created_at?: string
          customer_user_id: string
          id?: string
          job_id: string
          provider_user_id: string
          status?: string
        }
        Update: {
          created_at?: string
          customer_user_id?: string
          id?: string
          job_id?: string
          provider_user_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_invitations_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_media: {
        Row: {
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          id: string
          job_id: string
          uploaded_at: string
          user_id: string
        }
        Insert: {
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          id?: string
          job_id: string
          uploaded_at?: string
          user_id: string
        }
        Update: {
          file_name?: string
          file_size?: number
          file_type?: string
          file_url?: string
          id?: string
          job_id?: string
          uploaded_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_media_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_milestones: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string
          flag_count: number
          id: string
          is_auto: boolean
          job_id: string
          payment_amount: number | null
          sort_order: number
          status: Database["public"]["Enums"]["milestone_status"]
          title: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by: string
          flag_count?: number
          id?: string
          is_auto?: boolean
          job_id: string
          payment_amount?: number | null
          sort_order?: number
          status?: Database["public"]["Enums"]["milestone_status"]
          title: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string
          flag_count?: number
          id?: string
          is_auto?: boolean
          job_id?: string
          payment_amount?: number | null
          sort_order?: number
          status?: Database["public"]["Enums"]["milestone_status"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_milestones_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          agreed_price: number | null
          budget: string | null
          category: string
          created_at: string
          customer_user_id: string
          description: string
          id: string
          milestones_confirmed: boolean
          postcode_district: string
          provider_id: string | null
          questionnaire_answers: Json | null
          quote_count: number
          scheduled_end: string | null
          scheduled_start: string | null
          status: Database["public"]["Enums"]["job_status"]
          timeline: string | null
          title: string
          updated_at: string
        }
        Insert: {
          agreed_price?: number | null
          budget?: string | null
          category: string
          created_at?: string
          customer_user_id: string
          description: string
          id?: string
          milestones_confirmed?: boolean
          postcode_district: string
          provider_id?: string | null
          questionnaire_answers?: Json | null
          quote_count?: number
          scheduled_end?: string | null
          scheduled_start?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          timeline?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          agreed_price?: number | null
          budget?: string | null
          category?: string
          created_at?: string
          customer_user_id?: string
          description?: string
          id?: string
          milestones_confirmed?: boolean
          postcode_district?: string
          provider_id?: string | null
          questionnaire_answers?: Json | null
          quote_count?: number
          scheduled_end?: string | null
          scheduled_start?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          timeline?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      legal_pages: {
        Row: {
          audience: string
          content: string
          id: string
          slug: string
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          audience: string
          content?: string
          id?: string
          slug: string
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          audience?: string
          content?: string
          id?: string
          slug?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      message_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          id: string
          message_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          id?: string
          message_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number
          file_type?: string
          file_url?: string
          id?: string
          message_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          id: string
          message_type: string
          metadata: Json | null
          read_at: string | null
          sender_user_id: string
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          id?: string
          message_type?: string
          metadata?: Json | null
          read_at?: string | null
          sender_user_id: string
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          message_type?: string
          metadata?: Json | null
          read_at?: string | null
          sender_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      milestone_comments: {
        Row: {
          action: string
          body: string | null
          created_at: string
          id: string
          milestone_id: string
          user_id: string
        }
        Insert: {
          action: string
          body?: string | null
          created_at?: string
          id?: string
          milestone_id: string
          user_id: string
        }
        Update: {
          action?: string
          body?: string | null
          created_at?: string
          id?: string
          milestone_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "milestone_comments_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "job_milestones"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payout_requests: {
        Row: {
          admin_note: string | null
          amount: number
          created_at: string
          id: string
          net_amount: number
          platform_fee: number
          provider_user_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["payout_status"]
          updated_at: string
        }
        Insert: {
          admin_note?: string | null
          amount: number
          created_at?: string
          id?: string
          net_amount?: number
          platform_fee?: number
          provider_user_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["payout_status"]
          updated_at?: string
        }
        Update: {
          admin_note?: string | null
          amount?: number
          created_at?: string
          id?: string
          net_amount?: number
          platform_fee?: number
          provider_user_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["payout_status"]
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address_line_1: string | null
          avatar_url: string | null
          city: string | null
          created_at: string
          email: string | null
          first_name: string | null
          full_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          postcode: string | null
          updated_at: string
        }
        Insert: {
          address_line_1?: string | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id: string
          last_name?: string | null
          phone?: string | null
          postcode?: string | null
          updated_at?: string
        }
        Update: {
          address_line_1?: string | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          postcode?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      provider_bank_details: {
        Row: {
          account_name: string
          account_number: string
          created_at: string
          id: string
          provider_user_id: string
          sort_code: string
          updated_at: string
        }
        Insert: {
          account_name: string
          account_number: string
          created_at?: string
          id?: string
          provider_user_id: string
          sort_code: string
          updated_at?: string
        }
        Update: {
          account_name?: string
          account_number?: string
          created_at?: string
          id?: string
          provider_user_id?: string
          sort_code?: string
          updated_at?: string
        }
        Relationships: []
      }
      provider_documents: {
        Row: {
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          id: string
          provider_profile_id: string
          uploaded_at: string
          user_id: string
        }
        Insert: {
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          id?: string
          provider_profile_id: string
          uploaded_at?: string
          user_id: string
        }
        Update: {
          file_name?: string
          file_size?: number
          file_type?: string
          file_url?: string
          id?: string
          provider_profile_id?: string
          uploaded_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_documents_provider_profile_id_fkey"
            columns: ["provider_profile_id"]
            isOneToOne: false
            referencedRelation: "provider_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_portfolio_images: {
        Row: {
          caption: string | null
          created_at: string
          file_name: string
          file_url: string
          id: string
          project_id: string
          sort_order: number
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          file_name: string
          file_url: string
          id?: string
          project_id: string
          sort_order?: number
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          file_name?: string
          file_url?: string
          id?: string
          project_id?: string
          sort_order?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_portfolio_images_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "provider_portfolio_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_portfolio_projects: {
        Row: {
          created_at: string
          description: string | null
          id: string
          provider_profile_id: string
          sort_order: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          provider_profile_id: string
          sort_order?: number
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          provider_profile_id?: string
          sort_order?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_portfolio_projects_provider_profile_id_fkey"
            columns: ["provider_profile_id"]
            isOneToOne: false
            referencedRelation: "provider_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_profiles: {
        Row: {
          about_work: string | null
          accreditations: string[] | null
          additional_categories: string[] | null
          admin_note: string | null
          banner_url: string | null
          business_address: string
          business_description: string | null
          business_name: string
          contact_first_name: string
          contact_last_name: string
          created_at: string
          email_notifications_enabled: boolean
          id: string
          logo_url: string | null
          operating_areas: string[] | null
          pending_additional_categories: string[] | null
          pending_operating_areas: string[] | null
          pending_trade_category: string | null
          phone: string
          platform_fee_percent: number
          postcode: string
          public_bio: string | null
          qualifications_certifications: string | null
          status: Database["public"]["Enums"]["provider_status"]
          supporting_documents: string[] | null
          trade_category: string
          updated_at: string
          user_id: string
          years_experience: string | null
        }
        Insert: {
          about_work?: string | null
          accreditations?: string[] | null
          additional_categories?: string[] | null
          admin_note?: string | null
          banner_url?: string | null
          business_address: string
          business_description?: string | null
          business_name: string
          contact_first_name: string
          contact_last_name: string
          created_at?: string
          email_notifications_enabled?: boolean
          id?: string
          logo_url?: string | null
          operating_areas?: string[] | null
          pending_additional_categories?: string[] | null
          pending_operating_areas?: string[] | null
          pending_trade_category?: string | null
          phone: string
          platform_fee_percent?: number
          postcode: string
          public_bio?: string | null
          qualifications_certifications?: string | null
          status?: Database["public"]["Enums"]["provider_status"]
          supporting_documents?: string[] | null
          trade_category?: string
          updated_at?: string
          user_id: string
          years_experience?: string | null
        }
        Update: {
          about_work?: string | null
          accreditations?: string[] | null
          additional_categories?: string[] | null
          admin_note?: string | null
          banner_url?: string | null
          business_address?: string
          business_description?: string | null
          business_name?: string
          contact_first_name?: string
          contact_last_name?: string
          created_at?: string
          email_notifications_enabled?: boolean
          id?: string
          logo_url?: string | null
          operating_areas?: string[] | null
          pending_additional_categories?: string[] | null
          pending_operating_areas?: string[] | null
          pending_trade_category?: string | null
          phone?: string
          platform_fee_percent?: number
          postcode?: string
          public_bio?: string | null
          qualifications_certifications?: string | null
          status?: Database["public"]["Enums"]["provider_status"]
          supporting_documents?: string[] | null
          trade_category?: string
          updated_at?: string
          user_id?: string
          years_experience?: string | null
        }
        Relationships: []
      }
      provider_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          job_id: string | null
          milestone_id: string | null
          payout_request_id: string | null
          provider_user_id: string
          type: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          job_id?: string | null
          milestone_id?: string | null
          payout_request_id?: string | null
          provider_user_id: string
          type: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          job_id?: string | null
          milestone_id?: string | null
          payout_request_id?: string | null
          provider_user_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_transactions_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_transactions_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "job_milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_transactions_payout_request_id_fkey"
            columns: ["payout_request_id"]
            isOneToOne: false
            referencedRelation: "payout_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          availability: string | null
          created_at: string
          estimated_duration: string | null
          id: string
          job_id: string
          message: string | null
          price_max: number
          price_min: number
          provider_user_id: string
          reminder_48h_sent_at: string | null
          reminder_sent_at: string | null
          status: Database["public"]["Enums"]["quote_status"]
          updated_at: string
        }
        Insert: {
          availability?: string | null
          created_at?: string
          estimated_duration?: string | null
          id?: string
          job_id: string
          message?: string | null
          price_max: number
          price_min: number
          provider_user_id: string
          reminder_48h_sent_at?: string | null
          reminder_sent_at?: string | null
          status?: Database["public"]["Enums"]["quote_status"]
          updated_at?: string
        }
        Update: {
          availability?: string | null
          created_at?: string
          estimated_duration?: string | null
          id?: string
          job_id?: string
          message?: string | null
          price_max?: number
          price_min?: number
          provider_user_id?: string
          reminder_48h_sent_at?: string | null
          reminder_sent_at?: string | null
          status?: Database["public"]["Enums"]["quote_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotes_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          communication_rating: number
          created_at: string
          id: string
          job_id: string
          overall_rating: number | null
          quality_rating: number
          reliability_rating: number
          reviewee_user_id: string
          reviewer_role: string
          reviewer_user_id: string
          value_rating: number
        }
        Insert: {
          comment?: string | null
          communication_rating: number
          created_at?: string
          id?: string
          job_id: string
          overall_rating?: number | null
          quality_rating: number
          reliability_rating: number
          reviewee_user_id: string
          reviewer_role: string
          reviewer_user_id: string
          value_rating: number
        }
        Update: {
          comment?: string | null
          communication_rating?: number
          created_at?: string
          id?: string
          job_id?: string
          overall_rating?: number | null
          quality_rating?: number
          reliability_rating?: number
          reviewee_user_id?: string
          reviewer_role?: string
          reviewer_user_id?: string
          value_rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "reviews_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_change_requests: {
        Row: {
          created_at: string
          id: string
          job_id: string
          proposed_end: string
          proposed_start: string
          requested_by: string
          resolved_at: string | null
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_id: string
          proposed_end: string
          proposed_start: string
          requested_by: string
          resolved_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string
          proposed_end?: string
          proposed_start?: string
          requested_by?: string
          resolved_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_change_requests_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      support_ticket_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          is_internal_note: boolean
          sender_user_id: string
          ticket_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_internal_note?: boolean
          sender_user_id: string
          ticket_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_internal_note?: boolean
          sender_user_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          created_at: string
          description: string
          id: string
          status: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          status?: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          status?: Database["public"]["Enums"]["ticket_status"]
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      trade_categories: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      _supabase_anon_key: { Args: never; Returns: string }
      _supabase_url: { Args: never; Returns: string }
      count_providers_in_slot: {
        Args: { _category: string; _postcode: string }
        Returns: number
      }
      get_job_provider_id: { Args: { _job_id: string }; Returns: string }
      get_job_status: { Args: { _job_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_job_customer: {
        Args: { _job_id: string; _user_id: string }
        Returns: boolean
      }
      is_job_participant: {
        Args: { _job_id: string; _user_id: string }
        Returns: boolean
      }
      is_job_provider: {
        Args: { _job_id: string; _user_id: string }
        Returns: boolean
      }
      is_job_within_message_window: {
        Args: { _job_id: string }
        Returns: boolean
      }
      is_valid_message_update: {
        Args: {
          _body: string
          _conversation_id: string
          _created_at: string
          _id: string
          _message_type: string
          _sender_user_id: string
        }
        Returns: boolean
      }
      provider_has_declined_quote: {
        Args: { _job_id: string; _user_id: string }
        Returns: boolean
      }
      provider_is_eligible: {
        Args: { _category: string; _postcode: string; _user_id: string }
        Returns: boolean
      }
      provider_is_invited: {
        Args: { _job_id: string; _user_id: string }
        Returns: boolean
      }
      resubmit_provider_application: {
        Args: { _user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "customer" | "provider" | "admin"
      dispute_status: "open" | "under_review" | "resolved" | "closed"
      job_status:
        | "open"
        | "quoted"
        | "quotes_closed"
        | "accepted"
        | "in_progress"
        | "completed"
        | "cancelled"
      milestone_status: "pending" | "completed" | "accepted" | "flagged"
      payout_status: "pending" | "approved" | "rejected"
      provider_status:
        | "pending"
        | "active"
        | "suspended"
        | "pending_review"
        | "denied"
        | "changes_requested"
      quote_status: "pending" | "accepted" | "declined" | "withdrawn"
      ticket_status: "open" | "in_progress" | "resolved" | "closed"
      trade_category:
        | "plumbing"
        | "electrical"
        | "carpentry"
        | "painting_decorating"
        | "roofing"
        | "landscaping"
        | "plastering"
        | "tiling"
        | "gas_heating"
        | "locksmith"
        | "cleaning"
        | "general_maintenance"
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
      app_role: ["customer", "provider", "admin"],
      dispute_status: ["open", "under_review", "resolved", "closed"],
      job_status: [
        "open",
        "quoted",
        "quotes_closed",
        "accepted",
        "in_progress",
        "completed",
        "cancelled",
      ],
      milestone_status: ["pending", "completed", "accepted", "flagged"],
      payout_status: ["pending", "approved", "rejected"],
      provider_status: [
        "pending",
        "active",
        "suspended",
        "pending_review",
        "denied",
        "changes_requested",
      ],
      quote_status: ["pending", "accepted", "declined", "withdrawn"],
      ticket_status: ["open", "in_progress", "resolved", "closed"],
      trade_category: [
        "plumbing",
        "electrical",
        "carpentry",
        "painting_decorating",
        "roofing",
        "landscaping",
        "plastering",
        "tiling",
        "gas_heating",
        "locksmith",
        "cleaning",
        "general_maintenance",
        "other",
      ],
    },
  },
} as const
