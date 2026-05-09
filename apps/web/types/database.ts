export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      delivery_points: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_illuminated: boolean | null
          lat: number
          lng: number
          name: string
          security_level: 'high' | 'medium' | 'low' | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_illuminated?: boolean | null
          lat: number
          lng: number
          name: string
          security_level?: 'high' | 'medium' | 'low' | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_illuminated?: boolean | null
          lat?: number
          lng?: number
          name?: string
          security_level?: 'high' | 'medium' | 'low' | null
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string | null
          id: string
          student_id: string
          vendor_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          student_id: string
          vendor_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          student_id?: string
          vendor_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          quantity: number
          subtotal: number | null
          unit_price: number
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          quantity: number
          subtotal?: number | null
          unit_price: number
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          subtotal?: number | null
          unit_price?: number
        }
        Relationships: []
      }
      orders: {
        Row: {
          created_at: string | null
          delivery_point_id: string | null
          estimated_minutes: number | null
          id: string
          notes: string | null
          payment_method: 'qr' | 'nequi' | 'daviplata' | 'card' | 'wallet'
          payment_status: 'pending' | 'paid' | 'failed' | 'refunded' | null
          status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled' | null
          student_id: string
          time_slot_id: string | null
          total_amount: number
          updated_at: string | null
          vendor_id: string
        }
        Insert: {
          created_at?: string | null
          delivery_point_id?: string | null
          estimated_minutes?: number | null
          id?: string
          notes?: string | null
          payment_method: 'qr' | 'nequi' | 'daviplata' | 'card' | 'wallet'
          payment_status?: 'pending' | 'paid' | 'failed' | 'refunded' | null
          status?: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled' | null
          student_id: string
          time_slot_id?: string | null
          total_amount: number
          updated_at?: string | null
          vendor_id: string
        }
        Update: {
          created_at?: string | null
          delivery_point_id?: string | null
          estimated_minutes?: number | null
          id?: string
          notes?: string | null
          payment_method?: 'qr' | 'nequi' | 'daviplata' | 'card' | 'wallet'
          payment_status?: 'pending' | 'paid' | 'failed' | 'refunded' | null
          status?: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled' | null
          student_id?: string
          time_slot_id?: string | null
          total_amount?: number
          updated_at?: string | null
          vendor_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          external_tx_id: string | null
          failure_reason: string | null
          id: string
          log_data: Json
          method: 'qr' | 'nequi' | 'daviplata' | 'card' | 'wallet'
          order_id: string
          status: 'pending' | 'paid' | 'failed' | 'refunded' | null
          student_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          external_tx_id?: string | null
          failure_reason?: string | null
          id?: string
          log_data?: Json
          method: 'qr' | 'nequi' | 'daviplata' | 'card' | 'wallet'
          order_id: string
          status?: 'pending' | 'paid' | 'failed' | 'refunded' | null
          student_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          external_tx_id?: string | null
          failure_reason?: string | null
          id?: string
          log_data?: Json
          method?: 'qr' | 'nequi' | 'daviplata' | 'card' | 'wallet'
          order_id?: string
          status?: 'pending' | 'paid' | 'failed' | 'refunded' | null
          student_id?: string
        }
        Relationships: []
      }
      product_images: {
        Row: {
          created_at: string | null
          id: string
          image_url: string
          order_index: number | null
          product_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url: string
          order_index?: number | null
          product_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string
          order_index?: number | null
          product_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          is_available: boolean | null
          name: string
          price: number
          stock_limit: number | null
          updated_at: string | null
          vendor_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_available?: boolean | null
          name: string
          price: number
          stock_limit?: number | null
          updated_at?: string | null
          vendor_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_available?: boolean | null
          name?: string
          price?: number
          stock_limit?: number | null
          updated_at?: string | null
          vendor_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          fcm_token: string | null
          full_name: string
          id: string
          is_active: boolean | null
          phone: string | null
          role: 'student' | 'vendor' | 'admin'
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          fcm_token?: string | null
          full_name: string
          id: string
          is_active?: boolean | null
          phone?: string | null
          role?: 'student' | 'vendor' | 'admin'
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          fcm_token?: string | null
          full_name?: string
          id?: string
          is_active?: boolean | null
          phone?: string | null
          role?: 'student' | 'vendor' | 'admin'
          updated_at?: string | null
        }
        Relationships: []
      }
      ratings: {
        Row: {
          avg_score: number | null
          comment: string | null
          created_at: string | null
          hygiene: number
          id: string
          order_id: string
          punctuality: number
          quality: number
          student_id: string
          vendor_id: string
        }
        Insert: {
          avg_score?: number | null
          comment?: string | null
          created_at?: string | null
          hygiene: number
          id?: string
          order_id: string
          punctuality: number
          quality: number
          student_id: string
          vendor_id: string
        }
        Update: {
          avg_score?: number | null
          comment?: string | null
          created_at?: string | null
          hygiene?: number
          id?: string
          order_id?: string
          punctuality?: number
          quality?: number
          student_id?: string
          vendor_id?: string
        }
        Relationships: []
      }
      students: {
        Row: {
          id: string
          university_id: string | null
          wallet_balance: number | null
        }
        Insert: {
          id: string
          university_id?: string | null
          wallet_balance?: number | null
        }
        Update: {
          id?: string
          university_id?: string | null
          wallet_balance?: number | null
        }
        Relationships: []
      }
      time_slots: {
        Row: {
          current_count: number | null
          date: string
          delivery_point_id: string
          id: string
          max_capacity: number | null
          slot_end: string
          slot_start: string
        }
        Insert: {
          current_count?: number | null
          date: string
          delivery_point_id: string
          id?: string
          max_capacity?: number | null
          slot_end: string
          slot_start: string
        }
        Update: {
          current_count?: number | null
          date?: string
          delivery_point_id?: string
          id?: string
          max_capacity?: number | null
          slot_end?: string
          slot_start?: string
        }
        Relationships: []
      }
      vendors: {
        Row: {
          business_name: string
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          id: string
          is_open: boolean | null
          location_lat: number | null
          location_lng: number | null
          rating_avg: number | null
          rating_count: number | null
          schedule_end: string | null
          schedule_start: string | null
        }
        Insert: {
          business_name: string
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          id: string
          is_open?: boolean | null
          location_lat?: number | null
          location_lng?: number | null
          rating_avg?: number | null
          rating_count?: number | null
          schedule_end?: string | null
          schedule_start?: string | null
        }
        Update: {
          business_name?: string
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_open?: boolean | null
          location_lat?: number | null
          location_lng?: number | null
          rating_avg?: number | null
          rating_count?: number | null
          schedule_end?: string | null
          schedule_start?: string | null
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string | null
          id: string
          reference: string | null
          student_id: string
          type: 'topup' | 'purchase' | 'refund'
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string | null
          id?: string
          reference?: string | null
          student_id: string
          type: 'topup' | 'purchase' | 'refund'
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string | null
          id?: string
          reference?: string | null
          student_id?: string
          type?: 'topup' | 'purchase' | 'refund'
        }
        Relationships: []
      }
      weekly_reports: {
        Row: {
          csv_url: string | null
          generated_at: string | null
          id: string
          pdf_url: string | null
          report_data: Json | null
          status: 'pending' | 'generated' | 'failed' | null
          top_product_id: string | null
          total_orders: number | null
          total_revenue: number | null
          vendor_id: string
          week_end: string
          week_start: string
        }
        Insert: {
          csv_url?: string | null
          generated_at?: string | null
          id?: string
          pdf_url?: string | null
          report_data?: Json | null
          status?: 'pending' | 'generated' | 'failed' | null
          top_product_id?: string | null
          total_orders?: number | null
          total_revenue?: number | null
          vendor_id: string
          week_end: string
          week_start: string
        }
        Update: {
          csv_url?: string | null
          generated_at?: string | null
          id?: string
          pdf_url?: string | null
          report_data?: Json | null
          status?: 'pending' | 'generated' | 'failed' | null
          top_product_id?: string | null
          total_orders?: number | null
          total_revenue?: number | null
          vendor_id?: string
          week_end?: string
          week_start?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_day_slots: { Args: { target_date: string }; Returns: undefined }
    }
    Enums: {
      auth_provider: 'email' | 'google' | 'apple' | 'microsoft'
      order_status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
      payment_method: 'qr' | 'nequi' | 'daviplata' | 'card' | 'wallet'
      payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
      report_status: 'pending' | 'generated' | 'failed'
      security_level: 'high' | 'medium' | 'low'
      user_role: 'student' | 'vendor' | 'admin'
      wallet_tx_type: 'topup' | 'purchase' | 'refund'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T]
