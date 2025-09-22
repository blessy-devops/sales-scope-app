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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      anomaly_logs: {
        Row: {
          channel_id: string
          created_at: string
          current_value: number
          detected_at: string
          dismissed_at: string | null
          dismissed_by: string | null
          expected_value: number
          id: string
          message: string
          severity: string
          type: string
          updated_at: string
          variation_percentage: number
        }
        Insert: {
          channel_id: string
          created_at?: string
          current_value?: number
          detected_at?: string
          dismissed_at?: string | null
          dismissed_by?: string | null
          expected_value?: number
          id?: string
          message: string
          severity: string
          type: string
          updated_at?: string
          variation_percentage?: number
        }
        Update: {
          channel_id?: string
          created_at?: string
          current_value?: number
          detected_at?: string
          dismissed_at?: string | null
          dismissed_by?: string | null
          expected_value?: number
          id?: string
          message?: string
          severity?: string
          type?: string
          updated_at?: string
          variation_percentage?: number
        }
        Relationships: []
      }
      attendants: {
        Row: {
          created_at: string
          full_name: string
          id: string
          utm_identifier: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id?: string
          utm_identifier: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          utm_identifier?: string
        }
        Relationships: []
      }
      channels: {
        Row: {
          created_at: string | null
          icon_url: string | null
          id: string
          is_active: boolean
          name: string
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean
          name: string
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean
          name?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          address1: string | null
          address2: string | null
          city: string | null
          country: string | null
          created_at: string | null
          customer_id: number
          email: string | null
          first_name: string | null
          inserted_at: string | null
          last_name: string | null
          orders_count: number | null
          phone: string | null
          province: string | null
          total_spent: number | null
          updated_at: string | null
          zip: string | null
        }
        Insert: {
          address1?: string | null
          address2?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          customer_id: number
          email?: string | null
          first_name?: string | null
          inserted_at?: string | null
          last_name?: string | null
          orders_count?: number | null
          phone?: string | null
          province?: string | null
          total_spent?: number | null
          updated_at?: string | null
          zip?: string | null
        }
        Update: {
          address1?: string | null
          address2?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          customer_id?: number
          email?: string | null
          first_name?: string | null
          inserted_at?: string | null
          last_name?: string | null
          orders_count?: number | null
          phone?: string | null
          province?: string | null
          total_spent?: number | null
          updated_at?: string | null
          zip?: string | null
        }
        Relationships: []
      }
      daily_observations: {
        Row: {
          channel_id: string
          created_at: string
          created_by: string
          date: string
          id: string
          observation: string
          updated_at: string
        }
        Insert: {
          channel_id: string
          created_at?: string
          created_by: string
          date: string
          id?: string
          observation: string
          updated_at?: string
        }
        Update: {
          channel_id?: string
          created_at?: string
          created_by?: string
          date?: string
          id?: string
          observation?: string
          updated_at?: string
        }
        Relationships: []
      }
      daily_sales: {
        Row: {
          amount: number
          channel_id: string
          created_at: string | null
          id: string
          sale_date: string
          updated_at: string | null
        }
        Insert: {
          amount?: number
          channel_id: string
          created_at?: string | null
          id?: string
          sale_date: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          channel_id?: string
          created_at?: string | null
          id?: string
          sale_date?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_sales_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_settings: {
        Row: {
          id: number
          setting_key: string
          setting_value: string
          updated_at: string | null
        }
        Insert: {
          id?: number
          setting_key: string
          setting_value: string
          updated_at?: string | null
        }
        Update: {
          id?: number
          setting_key?: string
          setting_value?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ga4_daily_sessions: {
        Row: {
          avg_session_duration: number | null
          bounce_rate: number | null
          checkouts: number | null
          created_at: string | null
          direct_sessions: number | null
          id: string
          new_users: number | null
          organic_sessions: number | null
          page_views: number | null
          paid_sessions: number | null
          processed_at: string | null
          referral_sessions: number | null
          session_date: string
          sessions: number
          social_sessions: number | null
          updated_at: string | null
          users: number | null
        }
        Insert: {
          avg_session_duration?: number | null
          bounce_rate?: number | null
          checkouts?: number | null
          created_at?: string | null
          direct_sessions?: number | null
          id?: string
          new_users?: number | null
          organic_sessions?: number | null
          page_views?: number | null
          paid_sessions?: number | null
          processed_at?: string | null
          referral_sessions?: number | null
          session_date: string
          sessions: number
          social_sessions?: number | null
          updated_at?: string | null
          users?: number | null
        }
        Update: {
          avg_session_duration?: number | null
          bounce_rate?: number | null
          checkouts?: number | null
          created_at?: string | null
          direct_sessions?: number | null
          id?: string
          new_users?: number | null
          organic_sessions?: number | null
          page_views?: number | null
          paid_sessions?: number | null
          processed_at?: string | null
          referral_sessions?: number | null
          session_date?: string
          sessions?: number
          social_sessions?: number | null
          updated_at?: string | null
          users?: number | null
        }
        Relationships: []
      }
      instagram_metrics: {
        Row: {
          created_at: string | null
          followers_count: number
          id: number
          posts_count: number
          username: string
        }
        Insert: {
          created_at?: string | null
          followers_count: number
          id?: number
          posts_count: number
          username: string
        }
        Update: {
          created_at?: string | null
          followers_count?: number
          id?: number
          posts_count?: number
          username?: string
        }
        Relationships: []
      }
      line_items: {
        Row: {
          inserted_at: string | null
          line_item_id: number
          name: string | null
          order_id: number | null
          price: number | null
          product_id: number | null
          quantity: number | null
          sku: string | null
          title: string | null
          total_discount: number | null
          variant_id: number | null
          variant_title: string | null
          vendor: string | null
        }
        Insert: {
          inserted_at?: string | null
          line_item_id: number
          name?: string | null
          order_id?: number | null
          price?: number | null
          product_id?: number | null
          quantity?: number | null
          sku?: string | null
          title?: string | null
          total_discount?: number | null
          variant_id?: number | null
          variant_title?: string | null
          vendor?: string | null
        }
        Update: {
          inserted_at?: string | null
          line_item_id?: number
          name?: string | null
          order_id?: number | null
          price?: number | null
          product_id?: number | null
          quantity?: number | null
          sku?: string | null
          title?: string | null
          total_discount?: number | null
          variant_id?: number | null
          variant_title?: string | null
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "line_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["order_id"]
          },
        ]
      }
      monthly_goals: {
        Row: {
          created_at: string | null
          follower_goal: number | null
          id: number
          month: string
          sales_goal: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          follower_goal?: number | null
          id?: number
          month: string
          sales_goal?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          follower_goal?: number | null
          id?: number
          month?: string
          sales_goal?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      onboarding_steps: {
        Row: {
          display_name: string
          display_order: number
          slug: string
        }
        Insert: {
          display_name: string
          display_order: number
          slug: string
        }
        Update: {
          display_name?: string
          display_order?: number
          slug?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          cancelled_at: string | null
          created_at: string
          currency: string | null
          customer_id: number | null
          discount_codes: string[] | null
          financial_status: string | null
          fulfillment_status: string | null
          inserted_at: string | null
          order_id: number
          order_number: number
          payment_gateway_names: string[] | null
          shipping_price: number | null
          subtotal_price: number | null
          total_discounts: number | null
          total_price: number | null
          total_tax: number | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          cancelled_at?: string | null
          created_at: string
          currency?: string | null
          customer_id?: number | null
          discount_codes?: string[] | null
          financial_status?: string | null
          fulfillment_status?: string | null
          inserted_at?: string | null
          order_id: number
          order_number: number
          payment_gateway_names?: string[] | null
          shipping_price?: number | null
          subtotal_price?: number | null
          total_discounts?: number | null
          total_price?: number | null
          total_tax?: number | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          cancelled_at?: string | null
          created_at?: string
          currency?: string | null
          customer_id?: number | null
          discount_codes?: string[] | null
          financial_status?: string | null
          fulfillment_status?: string | null
          inserted_at?: string | null
          order_id?: number
          order_number?: number
          payment_gateway_names?: string[] | null
          shipping_price?: number | null
          subtotal_price?: number | null
          total_discounts?: number | null
          total_price?: number | null
          total_tax?: number | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      sales_targets: {
        Row: {
          channel_id: string
          created_at: string | null
          id: string
          month: number
          previous_amount: number | null
          target_amount: number
          updated_at: string | null
          year: number
        }
        Insert: {
          channel_id: string
          created_at?: string | null
          id?: string
          month: number
          previous_amount?: number | null
          target_amount?: number
          updated_at?: string | null
          year: number
        }
        Update: {
          channel_id?: string
          created_at?: string | null
          id?: string
          month?: number
          previous_amount?: number | null
          target_amount?: number
          updated_at?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_targets_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
        ]
      }
      shopify_orders_gold: {
        Row: {
          cancel_reason: string | null
          cancelled_at: string | null
          channel_bucket: string | null
          coupon_amount: number | null
          coupon_code: string | null
          coupon_type: string | null
          created_at: string | null
          customer_email: string | null
          customer_first_name: string | null
          customer_id: number | null
          customer_last_name: string | null
          customer_phone: string | null
          discount_codes: Json
          financial_status: string | null
          fulfillment_status: string | null
          id: number
          is_bundle: boolean | null
          items: Json
          items_count: number | null
          landing_site: string | null
          name: string | null
          order_number: number | null
          payment_auth_code: string | null
          payment_cc_brand: string | null
          payment_gateway: string | null
          payment_installments: number | null
          payment_method_bucket: string | null
          payment_method_code: string | null
          processed_at: string | null
          referring_site: string | null
          ship_city: string | null
          ship_country_code: string | null
          ship_province: string | null
          ship_province_code: string | null
          ship_zip: string | null
          shipping_amount: number | null
          shipping_lines: Json
          subtotal_price: number | null
          tags: string | null
          tax_id: string | null
          test: boolean | null
          total_discounts: number | null
          total_line_items_price: number | null
          total_price: number | null
          updated_at: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          cancel_reason?: string | null
          cancelled_at?: string | null
          channel_bucket?: string | null
          coupon_amount?: number | null
          coupon_code?: string | null
          coupon_type?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_first_name?: string | null
          customer_id?: number | null
          customer_last_name?: string | null
          customer_phone?: string | null
          discount_codes?: Json
          financial_status?: string | null
          fulfillment_status?: string | null
          id: number
          is_bundle?: boolean | null
          items?: Json
          items_count?: number | null
          landing_site?: string | null
          name?: string | null
          order_number?: number | null
          payment_auth_code?: string | null
          payment_cc_brand?: string | null
          payment_gateway?: string | null
          payment_installments?: number | null
          payment_method_bucket?: string | null
          payment_method_code?: string | null
          processed_at?: string | null
          referring_site?: string | null
          ship_city?: string | null
          ship_country_code?: string | null
          ship_province?: string | null
          ship_province_code?: string | null
          ship_zip?: string | null
          shipping_amount?: number | null
          shipping_lines?: Json
          subtotal_price?: number | null
          tags?: string | null
          tax_id?: string | null
          test?: boolean | null
          total_discounts?: number | null
          total_line_items_price?: number | null
          total_price?: number | null
          updated_at?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          cancel_reason?: string | null
          cancelled_at?: string | null
          channel_bucket?: string | null
          coupon_amount?: number | null
          coupon_code?: string | null
          coupon_type?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_first_name?: string | null
          customer_id?: number | null
          customer_last_name?: string | null
          customer_phone?: string | null
          discount_codes?: Json
          financial_status?: string | null
          fulfillment_status?: string | null
          id?: number
          is_bundle?: boolean | null
          items?: Json
          items_count?: number | null
          landing_site?: string | null
          name?: string | null
          order_number?: number | null
          payment_auth_code?: string | null
          payment_cc_brand?: string | null
          payment_gateway?: string | null
          payment_installments?: number | null
          payment_method_bucket?: string | null
          payment_method_code?: string | null
          processed_at?: string | null
          referring_site?: string | null
          ship_city?: string | null
          ship_country_code?: string | null
          ship_province?: string | null
          ship_province_code?: string | null
          ship_zip?: string | null
          shipping_amount?: number | null
          shipping_lines?: Json
          subtotal_price?: number | null
          tags?: string | null
          tax_id?: string | null
          test?: boolean | null
          total_discounts?: number | null
          total_line_items_price?: number | null
          total_price?: number | null
          updated_at?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: []
      }
      shopify_orders_ingest: {
        Row: {
          file_name: string
          id: number
          ingested_at: string
          payload: Json
        }
        Insert: {
          file_name: string
          id?: number
          ingested_at: string
          payload: Json
        }
        Update: {
          file_name?: string
          id?: number
          ingested_at?: string
          payload?: Json
        }
        Relationships: []
      }
      social_media_coupons: {
        Row: {
          coupon_code: string
          created_at: string | null
          description: string | null
          id: number
        }
        Insert: {
          coupon_code: string
          created_at?: string | null
          description?: string | null
          id?: number
        }
        Update: {
          coupon_code?: string
          created_at?: string | null
          description?: string | null
          id?: number
        }
        Relationships: []
      }
      social_media_sales: {
        Row: {
          coupon_code: string
          created_at: string | null
          id: number
          order_created_at: string
          order_id: string
          subtotal_price: number | null
          total_price: number
        }
        Insert: {
          coupon_code: string
          created_at?: string | null
          id?: number
          order_created_at: string
          order_id: string
          subtotal_price?: number | null
          total_price: number
        }
        Update: {
          coupon_code?: string
          created_at?: string | null
          id?: number
          order_created_at?: string
          order_id?: string
          subtotal_price?: number | null
          total_price?: number
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          id: string
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string | null
          value: string
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      target_history: {
        Row: {
          changed_at: string | null
          changed_by: string | null
          channel_id: string
          id: string
          month: number
          new_amount: number
          old_amount: number
          year: number
        }
        Insert: {
          changed_at?: string | null
          changed_by?: string | null
          channel_id: string
          id?: string
          month: number
          new_amount: number
          old_amount: number
          year: number
        }
        Update: {
          changed_at?: string | null
          changed_by?: string | null
          channel_id?: string
          id?: string
          month?: number
          new_amount?: number
          old_amount?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "target_history_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          created_at: string
          id: string
          preference_key: string
          preference_value: Json
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          preference_key: string
          preference_value: Json
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          preference_key?: string
          preference_value?: Json
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          created_at: string | null
          created_by: string | null
          email: string
          first_login: boolean | null
          full_name: string
          id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          email: string
          first_login?: boolean | null
          full_name: string
          id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          email?: string
          first_login?: boolean | null
          full_name?: string
          id?: string
        }
        Relationships: []
      }
    }
    Views: {
      daily_sales_summary: {
        Row: {
          avg_ticket: number | null
          channel_id: string | null
          channel_name: string | null
          channel_type: string | null
          data_source: string | null
          sale_date: string | null
          total_orders: number | null
          total_revenue: number | null
        }
        Relationships: []
      }
      monthly_channel_performance: {
        Row: {
          channel_id: string | null
          channel_name: string | null
          channel_type: string | null
          data_source: string | null
          days_with_sales: number | null
          month: number | null
          monthly_avg_ticket: number | null
          monthly_orders: number | null
          monthly_revenue: number | null
          year: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      compare_shopify_sales_debug: {
        Args: { target_date: string }
        Returns: {
          automatic_value: number
          difference: number
          difference_percent: number
          manual_value: number
          orders_count: number
        }[]
      }
      get_attendant_sales_by_period: {
        Args: { end_date: string; start_date: string }
        Returns: {
          attendant_name: string
          attendant_utm: string
          order_number: number
          sale_date: string
          total_revenue: number
          total_sales: number
        }[]
      }
      get_daily_sales_period: {
        Args: { end_date: string; start_date: string }
        Returns: {
          channel_id: string
          channel_name: string
          channel_type: string
          daily_avg_ticket: number
          daily_orders: number
          daily_revenue: number
          data_source: string
          sale_date: string
        }[]
      }
      get_dashboard_sales: {
        Args: { end_date: string; start_date: string }
        Returns: {
          amount: number
          channel_id: string
          sale_date: string
        }[]
      }
      get_dashboard_sales_data: {
        Args: { target_month?: number; target_year?: number }
        Returns: {
          channel_id: string
          channel_name: string
          channel_type: string
          current_daily_pace: number
          data_source: string
          days_passed: number
          days_with_sales: number
          metric_type: string
          monthly_avg_ticket: number
          monthly_orders: number
          monthly_revenue: number
          projected_monthly_total: number
          total_days_month: number
        }[]
      }
      get_shopify_orders_debug: {
        Args: { target_date: string }
        Returns: {
          created_at_sp: string
          financial_status: string
          id: number
          included_in_filter: boolean
          order_number: number
          total_price: number
        }[]
      }
      get_shopify_precise_sales: {
        Args: { end_date: string; start_date: string }
        Returns: {
          sale_date: string
          total_sales: number
        }[]
      }
      get_shopify_sales_period: {
        Args: { end_date: string; start_date: string }
        Returns: {
          cancelled_at: string
          created_at: string
          customer_id: number
          data_sp: string
          financial_status: string
          id: number
          items_count: number
          order_number: number
          payment_gateway: string
          shipping_amount: number
          subtotal_price: number
          test: boolean
          total_discounts: number
          total_price: number
        }[]
      }
      get_shopify_sales_summary: {
        Args: { end_date: string; start_date: string }
        Returns: {
          data: string
          receita_bruta: number
          receita_liquida: number
          ticket_medio: number
          total_pedidos: number
        }[]
      }
      get_social_media_sales_unified: {
        Args: { end_date: string; start_date: string }
        Returns: {
          sale_date: string
          source_table: string
          subtotal_price: number
          total_price: number
        }[]
      }
      note_attr: {
        Args: { attrs: Json; key: string }
        Returns: string
      }
      process_shopify_orders_gold_since: {
        Args: { since_ts?: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
