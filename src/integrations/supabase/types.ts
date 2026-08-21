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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      blog_posts: {
        Row: {
          author: string | null
          body: string
          cover_image: string | null
          created_at: string
          display_order: number
          excerpt: string | null
          id: string
          is_published: boolean
          published_at: string | null
          slug: string
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          author?: string | null
          body?: string
          cover_image?: string | null
          created_at?: string
          display_order?: number
          excerpt?: string | null
          id?: string
          is_published?: boolean
          published_at?: string | null
          slug: string
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          author?: string | null
          body?: string
          cover_image?: string | null
          created_at?: string
          display_order?: number
          excerpt?: string | null
          id?: string
          is_published?: boolean
          published_at?: string | null
          slug?: string
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          company: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string | null
          preferred_date: string
          preferred_time: string
          project_details: string | null
          service_id: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          phone?: string | null
          preferred_date: string
          preferred_time: string
          project_details?: string | null
          service_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          preferred_date?: string
          preferred_time?: string
          project_details?: string | null
          service_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      case_studies: {
        Row: {
          challenge: string | null
          client: string
          cover_image: string | null
          created_at: string
          display_order: number
          gallery_images: string[]
          id: string
          industry: string
          is_featured: boolean
          results: string | null
          slug: string
          solution: string | null
          title: string
          updated_at: string
        }
        Insert: {
          challenge?: string | null
          client: string
          cover_image?: string | null
          created_at?: string
          display_order?: number
          gallery_images?: string[]
          id?: string
          industry: string
          is_featured?: boolean
          results?: string | null
          slug: string
          solution?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          challenge?: string | null
          client?: string
          cover_image?: string | null
          created_at?: string
          display_order?: number
          gallery_images?: string[]
          id?: string
          industry?: string
          is_featured?: boolean
          results?: string | null
          slug?: string
          solution?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          created_at: string
          email: string
          id: string
          is_read: boolean
          message: string
          name: string
          phone: string | null
          subject: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_read?: boolean
          message: string
          name: string
          phone?: string | null
          subject?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_read?: boolean
          message?: string
          name?: string
          phone?: string | null
          subject?: string | null
        }
        Relationships: []
      }
      delivery_zones: {
        Row: {
          created_at: string
          display_order: number
          eta_days: string | null
          fee: number
          free_above_amount: number | null
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          eta_days?: string | null
          fee?: number
          free_above_amount?: number | null
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          created_at?: string
          display_order?: number
          eta_days?: string | null
          fee?: number
          free_above_amount?: number | null
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      document_counters: {
        Row: {
          counter: number
          scope: string
        }
        Insert: {
          counter?: number
          scope: string
        }
        Update: {
          counter?: number
          scope?: string
        }
        Relationships: []
      }
      invoice_items: {
        Row: {
          created_at: string
          description_snapshot: string | null
          id: string
          invoice_id: string
          is_on_request: boolean
          item_type: string
          line_total: number
          quantity: number
          ref_id: string | null
          title_snapshot: string
          unit_price: number
        }
        Insert: {
          created_at?: string
          description_snapshot?: string | null
          id?: string
          invoice_id: string
          is_on_request?: boolean
          item_type?: string
          line_total?: number
          quantity?: number
          ref_id?: string | null
          title_snapshot: string
          unit_price?: number
        }
        Update: {
          created_at?: string
          description_snapshot?: string | null
          id?: string
          invoice_id?: string
          is_on_request?: boolean
          item_type?: string
          line_total?: number
          quantity?: number
          ref_id?: string | null
          title_snapshot?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_paid: number
          company: string | null
          created_at: string
          currency: string
          delivery_address: string | null
          delivery_choice: string | null
          deposit_amount: number
          deposit_percent: number
          discount: number
          due_date: string | null
          email: string
          fulfilment_status: string
          full_name: string
          id: string
          invoice_number: string
          notes: string | null
          payment_terms: string
          phone: string | null
          public_token: string
          quote_id: string | null
          status: string
          subtotal: number
          total: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount_paid?: number
          company?: string | null
          created_at?: string
          currency?: string
          delivery_address?: string | null
          delivery_choice?: string | null
          deposit_amount?: number
          deposit_percent?: number
          discount?: number
          due_date?: string | null
          email: string
          fulfilment_status?: string
          full_name: string
          id?: string
          invoice_number: string
          notes?: string | null
          payment_terms?: string
          phone?: string | null
          public_token: string
          quote_id?: string | null
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount_paid?: number
          company?: string | null
          created_at?: string
          currency?: string
          delivery_address?: string | null
          delivery_choice?: string | null
          deposit_amount?: number
          deposit_percent?: number
          discount?: number
          due_date?: string | null
          email?: string
          fulfilment_status?: string
          full_name?: string
          id?: string
          invoice_number?: string
          notes?: string | null
          payment_terms?: string
          phone?: string | null
          public_token?: string
          quote_id?: string | null
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          anon_id: string | null
          created_at: string
          email: string | null
          id: string
          interest: string | null
          metadata: Json | null
          name: string | null
          phone: string | null
          source: string
        }
        Insert: {
          anon_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          interest?: string | null
          metadata?: Json | null
          name?: string | null
          phone?: string | null
          source?: string
        }
        Update: {
          anon_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          interest?: string | null
          metadata?: Json | null
          name?: string | null
          phone?: string | null
          source?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          price_snapshot: number
          product_id: string | null
          quantity: number
          title_snapshot: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          price_snapshot: number
          product_id?: string | null
          quantity?: number
          title_snapshot: string
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          price_snapshot?: number
          product_id?: string | null
          quantity?: number
          title_snapshot?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          city: string | null
          country: string
          created_at: string
          currency: string
          customer_email: string
          customer_name: string
          customer_phone: string
          delivery_address: string
          delivery_method: string
          delivery_status: string
          delivery_zone_id: string | null
          id: string
          notes: string | null
          payment_provider: string | null
          payment_ref: string | null
          payment_status: string
          shipping_fee: number
          state: string | null
          status: string
          subtotal: number
          total: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          city?: string | null
          country?: string
          created_at?: string
          currency?: string
          customer_email: string
          customer_name: string
          customer_phone: string
          delivery_address: string
          delivery_method?: string
          delivery_status?: string
          delivery_zone_id?: string | null
          id?: string
          notes?: string | null
          payment_provider?: string | null
          payment_ref?: string | null
          payment_status?: string
          shipping_fee?: number
          state?: string | null
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          city?: string | null
          country?: string
          created_at?: string
          currency?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string
          delivery_address?: string
          delivery_method?: string
          delivery_status?: string
          delivery_zone_id?: string | null
          id?: string
          notes?: string | null
          payment_provider?: string | null
          payment_ref?: string | null
          payment_status?: string
          shipping_fee?: number
          state?: string | null
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_delivery_zone_id_fkey"
            columns: ["delivery_zone_id"]
            isOneToOne: false
            referencedRelation: "delivery_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      outbound_messages: {
        Row: {
          body: string
          channel: string
          created_at: string
          error: string | null
          id: string
          related_id: string | null
          related_type: string | null
          sent_at: string | null
          status: string
          subject: string | null
          template: string
          to_address: string
        }
        Insert: {
          body: string
          channel?: string
          created_at?: string
          error?: string | null
          id?: string
          related_id?: string | null
          related_type?: string | null
          sent_at?: string | null
          status?: string
          subject?: string | null
          template: string
          to_address: string
        }
        Update: {
          body?: string
          channel?: string
          created_at?: string
          error?: string | null
          id?: string
          related_id?: string | null
          related_type?: string | null
          sent_at?: string | null
          status?: string
          subject?: string | null
          template?: string
          to_address?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          confirmed_at: string | null
          created_at: string
          id: string
          invoice_id: string
          kind: string
          method: string
          recorded_by: string | null
          reference: string | null
          status: string
        }
        Insert: {
          amount: number
          confirmed_at?: string | null
          created_at?: string
          id?: string
          invoice_id: string
          kind?: string
          method?: string
          recorded_by?: string | null
          reference?: string | null
          status?: string
        }
        Update: {
          amount?: number
          confirmed_at?: string | null
          created_at?: string
          id?: string
          invoice_id?: string
          kind?: string
          method?: string
          recorded_by?: string | null
          reference?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          created_at: string
          display_order: number
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category_id: string | null
          compare_at_price: number | null
          created_at: string
          currency: string
          description: string | null
          display_order: number
          id: string
          images: string[]
          is_active: boolean
          is_featured: boolean
          price: number
          slug: string
          stock: number
          title: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          compare_at_price?: number | null
          created_at?: string
          currency?: string
          description?: string | null
          display_order?: number
          id?: string
          images?: string[]
          is_active?: boolean
          is_featured?: boolean
          price?: number
          slug: string
          stock?: number
          title: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          compare_at_price?: number | null
          created_at?: string
          currency?: string
          description?: string | null
          display_order?: number
          id?: string
          images?: string[]
          is_active?: boolean
          is_featured?: boolean
          price?: number
          slug?: string
          stock?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          created_at: string
          display_name: string | null
          id: string
          phone: string | null
          phone_verified: boolean
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          phone?: string | null
          phone_verified?: boolean
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          phone?: string | null
          phone_verified?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      quote_items: {
        Row: {
          created_at: string
          description_snapshot: string | null
          id: string
          is_on_request: boolean
          item_type: string
          line_total: number
          quantity: number
          quote_id: string
          ref_id: string | null
          title_snapshot: string
          unit_price: number
        }
        Insert: {
          created_at?: string
          description_snapshot?: string | null
          id?: string
          is_on_request?: boolean
          item_type?: string
          line_total?: number
          quantity?: number
          quote_id: string
          ref_id?: string | null
          title_snapshot: string
          unit_price?: number
        }
        Update: {
          created_at?: string
          description_snapshot?: string | null
          id?: string
          is_on_request?: boolean
          item_type?: string
          line_total?: number
          quantity?: number
          quote_id?: string
          ref_id?: string | null
          title_snapshot?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "quote_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          company: string | null
          created_at: string
          currency: string
          email: string
          full_name: string
          has_custom_items: boolean
          id: string
          notes: string | null
          phone: string | null
          preferred_contact: string
          public_token: string
          quote_number: string
          status: string
          subtotal: number
          total: number
          updated_at: string
          user_id: string | null
          valid_until: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string
          currency?: string
          email: string
          full_name: string
          has_custom_items?: boolean
          id?: string
          notes?: string | null
          phone?: string | null
          preferred_contact?: string
          public_token: string
          quote_number: string
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string | null
          valid_until?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string
          currency?: string
          email?: string
          full_name?: string
          has_custom_items?: boolean
          id?: string
          notes?: string | null
          phone?: string | null
          preferred_contact?: string
          public_token?: string
          quote_number?: string
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      receipts: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          id: string
          invoice_id: string
          method: string
          payment_id: string | null
          public_token: string
          receipt_number: string
        }
        Insert: {
          amount: number
          balance_after?: number
          created_at?: string
          id?: string
          invoice_id: string
          method?: string
          payment_id?: string | null
          public_token: string
          receipt_number: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          id?: string
          invoice_id?: string
          method?: string
          payment_id?: string | null
          public_token?: string
          receipt_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "receipts_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipts_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          created_at: string
          description: string
          display_order: number
          features: string[]
          icon: string
          id: string
          is_active: boolean
          price_max: number | null
          price_min: number | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          display_order?: number
          features?: string[]
          icon: string
          id?: string
          is_active?: boolean
          price_max?: number | null
          price_min?: number | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          display_order?: number
          features?: string[]
          icon?: string
          id?: string
          is_active?: boolean
          price_max?: number | null
          price_min?: number | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      studio_images: {
        Row: {
          alt: string | null
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          url: string
        }
        Insert: {
          alt?: string | null
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          url: string
        }
        Update: {
          alt?: string | null
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          url?: string
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          avatar_url: string | null
          company: string
          created_at: string
          display_order: number
          id: string
          is_published: boolean
          name: string
          quote: string
          rating: number
          role: string
        }
        Insert: {
          avatar_url?: string | null
          company: string
          created_at?: string
          display_order?: number
          id?: string
          is_published?: boolean
          name: string
          quote: string
          rating?: number
          role: string
        }
        Update: {
          avatar_url?: string | null
          company?: string
          created_at?: string
          display_order?: number
          id?: string
          is_published?: boolean
          name?: string
          quote?: string
          rating?: number
          role?: string
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
      visitor_events: {
        Row: {
          anon_id: string
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
          path: string | null
          referrer: string | null
          session_id: string | null
          target: string | null
          user_agent: string | null
        }
        Insert: {
          anon_id: string
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
          path?: string | null
          referrer?: string | null
          session_id?: string | null
          target?: string | null
          user_agent?: string | null
        }
        Update: {
          anon_id?: string
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          path?: string | null
          referrer?: string | null
          session_id?: string | null
          target?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      next_document_number: { Args: { _prefix: string }; Returns: string }
    }
    Enums: {
      app_role: "admin" | "customer" | "staff" | "super_admin"
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
      app_role: ["admin", "customer", "staff", "super_admin"],
    },
  },
} as const
