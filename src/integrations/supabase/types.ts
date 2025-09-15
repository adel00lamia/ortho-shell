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
      companies: {
        Row: {
          created_at: string
          domain: string | null
          id: string
          logo_url: string | null
          name: string
          primary_color: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          domain?: string | null
          id?: string
          logo_url?: string | null
          name: string
          primary_color?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          domain?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          primary_color?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_id: string | null
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          role: Database["public"]["Enums"]["app_role"] | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          first_name?: string | null
          id: string
          last_name?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      training_diagnostics: {
        Row: {
          ai_recommendations: Json | null
          budget_range: string | null
          company_id: string
          company_size: string | null
          completed_at: string | null
          constraints: string[] | null
          created_at: string | null
          created_by: string
          current_skills: Json | null
          id: string
          industry: string | null
          priorities: string[] | null
          target_skills: Json | null
          updated_at: string | null
        }
        Insert: {
          ai_recommendations?: Json | null
          budget_range?: string | null
          company_id: string
          company_size?: string | null
          completed_at?: string | null
          constraints?: string[] | null
          created_at?: string | null
          created_by: string
          current_skills?: Json | null
          id?: string
          industry?: string | null
          priorities?: string[] | null
          target_skills?: Json | null
          updated_at?: string | null
        }
        Update: {
          ai_recommendations?: Json | null
          budget_range?: string | null
          company_id?: string
          company_size?: string | null
          completed_at?: string | null
          constraints?: string[] | null
          created_at?: string | null
          created_by?: string
          current_skills?: Json | null
          id?: string
          industry?: string | null
          priorities?: string[] | null
          target_skills?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_diagnostics_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_diagnostics_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      training_modules: {
        Row: {
          ai_generated: boolean | null
          completed: boolean | null
          completion_rate: number | null
          content: Json | null
          content_type: string | null
          created_at: string | null
          description: string | null
          duration_hours: number | null
          id: string
          skills_covered: string[] | null
          target_audience: string[] | null
          title: string
          training_plan_id: string
          updated_at: string | null
        }
        Insert: {
          ai_generated?: boolean | null
          completed?: boolean | null
          completion_rate?: number | null
          content?: Json | null
          content_type?: string | null
          created_at?: string | null
          description?: string | null
          duration_hours?: number | null
          id?: string
          skills_covered?: string[] | null
          target_audience?: string[] | null
          title: string
          training_plan_id: string
          updated_at?: string | null
        }
        Update: {
          ai_generated?: boolean | null
          completed?: boolean | null
          completion_rate?: number | null
          content?: Json | null
          content_type?: string | null
          created_at?: string | null
          description?: string | null
          duration_hours?: number | null
          id?: string
          skills_covered?: string[] | null
          target_audience?: string[] | null
          title?: string
          training_plan_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_modules_training_plan_id_fkey"
            columns: ["training_plan_id"]
            isOneToOne: false
            referencedRelation: "training_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      training_plans: {
        Row: {
          ai_generated: boolean | null
          budget: number | null
          company_id: string
          created_at: string | null
          created_by: string
          description: string | null
          diagnostic_data: Json | null
          duration_months: number | null
          giac_approved: boolean | null
          id: string
          kpis: Json | null
          modules: Json | null
          objectives: string[] | null
          ofppt_compliant: boolean | null
          status: Database["public"]["Enums"]["training_status"] | null
          target_skills: string[] | null
          title: string
          type: Database["public"]["Enums"]["training_type"] | null
          updated_at: string | null
        }
        Insert: {
          ai_generated?: boolean | null
          budget?: number | null
          company_id: string
          created_at?: string | null
          created_by: string
          description?: string | null
          diagnostic_data?: Json | null
          duration_months?: number | null
          giac_approved?: boolean | null
          id?: string
          kpis?: Json | null
          modules?: Json | null
          objectives?: string[] | null
          ofppt_compliant?: boolean | null
          status?: Database["public"]["Enums"]["training_status"] | null
          target_skills?: string[] | null
          title: string
          type?: Database["public"]["Enums"]["training_type"] | null
          updated_at?: string | null
        }
        Update: {
          ai_generated?: boolean | null
          budget?: number | null
          company_id?: string
          created_at?: string | null
          created_by?: string
          description?: string | null
          diagnostic_data?: Json | null
          duration_months?: number | null
          giac_approved?: boolean | null
          id?: string
          kpis?: Json | null
          modules?: Json | null
          objectives?: string[] | null
          ofppt_compliant?: boolean | null
          status?: Database["public"]["Enums"]["training_status"] | null
          target_skills?: string[] | null
          title?: string
          type?: Database["public"]["Enums"]["training_type"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_plans_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_plans_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      app_role: "admin" | "hr_manager" | "employee"
      training_status: "draft" | "active" | "completed" | "cancelled"
      training_type: "internal" | "external" | "mixed"
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
      app_role: ["admin", "hr_manager", "employee"],
      training_status: ["draft", "active", "completed", "cancelled"],
      training_type: ["internal", "external", "mixed"],
    },
  },
} as const
