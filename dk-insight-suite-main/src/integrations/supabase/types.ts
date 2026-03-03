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
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: string | null
          org_id: string | null
          resource_id: string | null
          resource_type: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          org_id?: string | null
          resource_id?: string | null
          resource_type?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          org_id?: string | null
          resource_id?: string | null
          resource_type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      devices: {
        Row: {
          agent_token: string | null
          agent_version: string | null
          assigned_user_id: string | null
          created_at: string | null
          device_type: string | null
          hostname: string
          id: string
          ip_address: string | null
          last_seen: string | null
          location: string | null
          org_id: string | null
          os: string | null
          status: Database["public"]["Enums"]["device_status"] | null
        }
        Insert: {
          agent_token?: string | null
          agent_version?: string | null
          assigned_user_id?: string | null
          created_at?: string | null
          device_type?: string | null
          hostname: string
          id?: string
          ip_address?: string | null
          last_seen?: string | null
          location?: string | null
          org_id?: string | null
          os?: string | null
          status?: Database["public"]["Enums"]["device_status"] | null
        }
        Update: {
          agent_token?: string | null
          agent_version?: string | null
          assigned_user_id?: string | null
          created_at?: string | null
          device_type?: string | null
          hostname?: string
          id?: string
          ip_address?: string | null
          last_seen?: string | null
          location?: string | null
          org_id?: string | null
          os?: string | null
          status?: Database["public"]["Enums"]["device_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "devices_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollment_tokens: {
        Row: {
          created_at: string | null
          created_by: string | null
          expires_at: string
          id: string
          org_id: string
          token: string
          used_at: string | null
          used_by_device_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          expires_at: string
          id?: string
          org_id: string
          token: string
          used_at?: string | null
          used_by_device_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          expires_at?: string
          id?: string
          org_id?: string
          token?: string
          used_at?: string | null
          used_by_device_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enrollment_tokens_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollment_tokens_used_by_device_id_fkey"
            columns: ["used_by_device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      licenses: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          org_id: string
          status: string
          total_device_licenses: number
          updated_at: string | null
          used_device_licenses: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          org_id: string
          status?: string
          total_device_licenses?: number
          updated_at?: string | null
          used_device_licenses?: number
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          org_id?: string
          status?: string
          total_device_licenses?: number
          updated_at?: string | null
          used_device_licenses?: number
        }
        Relationships: [
          {
            foreignKeyName: "licenses_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string | null
          device_enrolled_email: boolean | null
          device_offline_email: boolean | null
          id: string
          offline_threshold_minutes: number | null
          org_id: string
          screenshot_captured_email: boolean | null
          token_used_email: boolean | null
          updated_at: string | null
          user_id: string
          weekly_report_email: boolean | null
        }
        Insert: {
          created_at?: string | null
          device_enrolled_email?: boolean | null
          device_offline_email?: boolean | null
          id?: string
          offline_threshold_minutes?: number | null
          org_id: string
          screenshot_captured_email?: boolean | null
          token_used_email?: boolean | null
          updated_at?: string | null
          user_id: string
          weekly_report_email?: boolean | null
        }
        Update: {
          created_at?: string | null
          device_enrolled_email?: boolean | null
          device_offline_email?: boolean | null
          id?: string
          offline_threshold_minutes?: number | null
          org_id?: string
          screenshot_captured_email?: boolean | null
          token_used_email?: boolean | null
          updated_at?: string | null
          user_id?: string
          weekly_report_email?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string | null
          domain: string | null
          id: string
          idle_threshold_sec: number | null
          name: string
          retention_days: number | null
          screenshot_interval_sec: number | null
          working_hours: string | null
        }
        Insert: {
          created_at?: string | null
          domain?: string | null
          id?: string
          idle_threshold_sec?: number | null
          name: string
          retention_days?: number | null
          screenshot_interval_sec?: number | null
          working_hours?: string | null
        }
        Update: {
          created_at?: string | null
          domain?: string | null
          id?: string
          idle_threshold_sec?: number | null
          name?: string
          retention_days?: number | null
          screenshot_interval_sec?: number | null
          working_hours?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          display_name: string | null
          email: string
          id: string
          org_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          email: string
          id?: string
          org_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          email?: string
          id?: string
          org_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      screenshots: {
        Row: {
          captured_at: string
          device_id: string
          file_path: string
          id: string
          meta: Json | null
          org_id: string | null
          session_id: string | null
          uploaded_at: string | null
        }
        Insert: {
          captured_at: string
          device_id: string
          file_path: string
          id?: string
          meta?: Json | null
          org_id?: string | null
          session_id?: string | null
          uploaded_at?: string | null
        }
        Update: {
          captured_at?: string
          device_id?: string
          file_path?: string
          id?: string
          meta?: Json | null
          org_id?: string | null
          session_id?: string | null
          uploaded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "screenshots_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "screenshots_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "screenshots_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          active_seconds: number | null
          device_id: string
          id: string
          idle_seconds: number | null
          session_end: string | null
          session_start: string | null
          user_id: string | null
        }
        Insert: {
          active_seconds?: number | null
          device_id: string
          id?: string
          idle_seconds?: number | null
          session_end?: string | null
          session_start?: string | null
          user_id?: string | null
        }
        Update: {
          active_seconds?: number | null
          device_id?: string
          id?: string
          idle_seconds?: number | null
          session_end?: string | null
          session_start?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      telemetry_events: {
        Row: {
          details: Json | null
          device_id: string | null
          event_time: string | null
          event_type: string
          id: string
          org_id: string | null
        }
        Insert: {
          details?: Json | null
          device_id?: string | null
          event_time?: string | null
          event_type: string
          id?: string
          org_id?: string | null
        }
        Update: {
          details?: Json | null
          device_id?: string | null
          event_time?: string | null
          event_type?: string
          id?: string
          org_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "telemetry_events_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "telemetry_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      check_device_license: { Args: { p_org_id: string }; Returns: boolean }
      get_user_org_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { check_user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "it" | "employee" | "super_admin"
      device_status: "online" | "idle" | "offline"
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
      app_role: ["admin", "it", "employee", "super_admin"],
      device_status: ["online", "idle", "offline"],
    },
  },
} as const
