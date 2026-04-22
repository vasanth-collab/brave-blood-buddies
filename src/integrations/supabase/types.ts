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
      blood_requests: {
        Row: {
          blood_group: Database["public"]["Enums"]["blood_group"]
          contact_phone: string
          created_at: string
          current_radius_km: number
          hospital_name: string
          id: string
          latitude: number | null
          location: string
          longitude: number | null
          notes: string
          pincode: string
          requester_id: string
          requester_name: string
          status: Database["public"]["Enums"]["request_status"]
          units_needed: number
          updated_at: string
          urgency: Database["public"]["Enums"]["urgency_level"]
        }
        Insert: {
          blood_group: Database["public"]["Enums"]["blood_group"]
          contact_phone: string
          created_at?: string
          current_radius_km?: number
          hospital_name: string
          id?: string
          latitude?: number | null
          location: string
          longitude?: number | null
          notes?: string
          pincode: string
          requester_id: string
          requester_name: string
          status?: Database["public"]["Enums"]["request_status"]
          units_needed?: number
          updated_at?: string
          urgency?: Database["public"]["Enums"]["urgency_level"]
        }
        Update: {
          blood_group?: Database["public"]["Enums"]["blood_group"]
          contact_phone?: string
          created_at?: string
          current_radius_km?: number
          hospital_name?: string
          id?: string
          latitude?: number | null
          location?: string
          longitude?: number | null
          notes?: string
          pincode?: string
          requester_id?: string
          requester_name?: string
          status?: Database["public"]["Enums"]["request_status"]
          units_needed?: number
          updated_at?: string
          urgency?: Database["public"]["Enums"]["urgency_level"]
        }
        Relationships: []
      }
      donor_assignments: {
        Row: {
          assigned_at: string
          distance_km: number | null
          donor_id: string
          id: string
          request_id: string
          responded_at: string | null
          response_deadline: string
          response_status: Database["public"]["Enums"]["response_status"]
          role: Database["public"]["Enums"]["donor_role"]
        }
        Insert: {
          assigned_at?: string
          distance_km?: number | null
          donor_id: string
          id?: string
          request_id: string
          responded_at?: string | null
          response_deadline?: string
          response_status?: Database["public"]["Enums"]["response_status"]
          role: Database["public"]["Enums"]["donor_role"]
        }
        Update: {
          assigned_at?: string
          distance_km?: number | null
          donor_id?: string
          id?: string
          request_id?: string
          responded_at?: string | null
          response_deadline?: string
          response_status?: Database["public"]["Enums"]["response_status"]
          role?: Database["public"]["Enums"]["donor_role"]
        }
        Relationships: [
          {
            foreignKeyName: "donor_assignments_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "blood_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      donor_details: {
        Row: {
          is_available: boolean
          last_active_date: string
          last_donation_date: string | null
          reliability_score: number
          total_donations: number
          total_requests: number
          total_responses: number
          updated_at: string
          user_id: string
        }
        Insert: {
          is_available?: boolean
          last_active_date?: string
          last_donation_date?: string | null
          reliability_score?: number
          total_donations?: number
          total_requests?: number
          total_responses?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          is_available?: boolean
          last_active_date?: string
          last_donation_date?: string | null
          reliability_score?: number
          total_donations?: number
          total_requests?: number
          total_responses?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          blood_group: Database["public"]["Enums"]["blood_group"] | null
          created_at: string
          email: string
          id: string
          is_verified: boolean
          latitude: number | null
          location: string
          longitude: number | null
          name: string
          phone: string
          pincode: string
          updated_at: string
        }
        Insert: {
          blood_group?: Database["public"]["Enums"]["blood_group"] | null
          created_at?: string
          email?: string
          id: string
          is_verified?: boolean
          latitude?: number | null
          location?: string
          longitude?: number | null
          name?: string
          phone?: string
          pincode?: string
          updated_at?: string
        }
        Update: {
          blood_group?: Database["public"]["Enums"]["blood_group"] | null
          created_at?: string
          email?: string
          id?: string
          is_verified?: boolean
          latitude?: number | null
          location?: string
          longitude?: number | null
          name?: string
          phone?: string
          pincode?: string
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "donor" | "requester"
      blood_group: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-"
      donor_role: "primary" | "alternate"
      request_status: "open" | "confirmed" | "fulfilled" | "cancelled"
      response_status:
        | "pending"
        | "accepted"
        | "declined"
        | "unable"
        | "expired"
      urgency_level: "normal" | "urgent" | "critical"
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
      app_role: ["admin", "donor", "requester"],
      blood_group: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
      donor_role: ["primary", "alternate"],
      request_status: ["open", "confirmed", "fulfilled", "cancelled"],
      response_status: ["pending", "accepted", "declined", "unable", "expired"],
      urgency_level: ["normal", "urgent", "critical"],
    },
  },
} as const
