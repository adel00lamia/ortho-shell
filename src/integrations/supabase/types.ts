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
      assessment_reports: {
        Row: {
          ai_generated: boolean | null
          company_id: string
          created_at: string
          created_by: string
          id: string
          maturity_score: number | null
          report_data: Json
          report_type: string
          title: string
          updated_at: string
        }
        Insert: {
          ai_generated?: boolean | null
          company_id: string
          created_at?: string
          created_by: string
          id?: string
          maturity_score?: number | null
          report_data?: Json
          report_type?: string
          title: string
          updated_at?: string
        }
        Update: {
          ai_generated?: boolean | null
          company_id?: string
          created_at?: string
          created_by?: string
          id?: string
          maturity_score?: number | null
          report_data?: Json
          report_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_reports_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address: string | null
          city: string | null
          cnss_number: string | null
          company_size: string | null
          contact_email: string | null
          created_at: string
          domain: string | null
          employee_count: number | null
          ice_number: string | null
          id: string
          industry: string | null
          logo_url: string | null
          name: string
          org_chart_url: string | null
          phone: string | null
          primary_color: string | null
          profile_completed: boolean | null
          rc_number: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          cnss_number?: string | null
          company_size?: string | null
          contact_email?: string | null
          created_at?: string
          domain?: string | null
          employee_count?: number | null
          ice_number?: string | null
          id?: string
          industry?: string | null
          logo_url?: string | null
          name: string
          org_chart_url?: string | null
          phone?: string | null
          primary_color?: string | null
          profile_completed?: boolean | null
          rc_number?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          cnss_number?: string | null
          company_size?: string | null
          contact_email?: string | null
          created_at?: string
          domain?: string | null
          employee_count?: number | null
          ice_number?: string | null
          id?: string
          industry?: string | null
          logo_url?: string | null
          name?: string
          org_chart_url?: string | null
          phone?: string | null
          primary_color?: string | null
          profile_completed?: boolean | null
          rc_number?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      discussions: {
        Row: {
          id: string
          company_id: string
          user_id: string
          module_id: string | null
          plan_id: string | null
          parent_id: string | null
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          user_id: string
          module_id?: string | null
          plan_id?: string | null
          parent_id?: string | null
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          user_id?: string
          module_id?: string | null
          plan_id?: string | null
          parent_id?: string | null
          content?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      reactions: {
        Row: {
          id: string
          discussion_id: string
          user_id: string
          emoji: string
          created_at: string
        }
        Insert: {
          id?: string
          discussion_id: string
          user_id: string
          emoji: string
          created_at?: string
        }
        Update: {
          id?: string
          discussion_id?: string
          user_id?: string
          emoji?: string
          created_at?: string
        }
        Relationships: []
      }
      departments: {
        Row: {
          budget: number | null
          company_id: string
          created_at: string
          description: string | null
          employee_count: number
          head_employee_email: string | null
          head_employee_name: string | null
          id: string
          level: number
          location: string | null
          name: string
          parent_department_id: string | null
          updated_at: string
        }
        Insert: {
          budget?: number | null
          company_id: string
          created_at?: string
          description?: string | null
          employee_count?: number
          head_employee_email?: string | null
          head_employee_name?: string | null
          id?: string
          level?: number
          location?: string | null
          name: string
          parent_department_id?: string | null
          updated_at?: string
        }
        Update: {
          budget?: number | null
          company_id?: string
          created_at?: string
          description?: string | null
          employee_count?: number
          head_employee_email?: string | null
          head_employee_name?: string | null
          id?: string
          level?: number
          location?: string | null
          name?: string
          parent_department_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "departments_parent_department_id_fkey"
            columns: ["parent_department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_skills: {
        Row: {
          id: string
          company_id: string
          employee_name: string
          employee_email: string | null
          skill_id: string
          current_level: number
          target_level: number
          assessed_at: string
          assessed_by: string | null
          notes: string | null
        }
        Insert: {
          id?: string
          company_id: string
          employee_name: string
          employee_email?: string | null
          skill_id: string
          current_level?: number
          target_level?: number
          assessed_at?: string
          assessed_by?: string | null
          notes?: string | null
        }
        Update: {
          id?: string
          company_id?: string
          employee_name?: string
          employee_email?: string | null
          skill_id?: string
          current_level?: number
          target_level?: number
          assessed_at?: string
          assessed_by?: string | null
          notes?: string | null
        }
        Relationships: []
      }
      job_descriptions: {
        Row: {
          company_id: string
          competencies: Json | null
          created_at: string | null
          created_by: string | null
          department: string | null
          description: string | null
          id: string
          level: string | null
          preferred_skills: Json | null
          required_skills: Json | null
          responsibilities: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          company_id: string
          competencies?: Json | null
          created_at?: string | null
          created_by?: string | null
          department?: string | null
          description?: string | null
          id?: string
          level?: string | null
          preferred_skills?: Json | null
          required_skills?: Json | null
          responsibilities?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          competencies?: Json | null
          created_at?: string | null
          created_by?: string | null
          department?: string | null
          description?: string | null
          id?: string
          level?: string | null
          preferred_skills?: Json | null
          required_skills?: Json | null
          responsibilities?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      learner_module_progress: {
        Row: {
          completed_at: string | null
          completed_slides: number[]
          id: string
          last_activity_at: string
          module_id: string
          quiz_answers: Json
          quiz_score: number | null
          started_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          completed_slides?: number[]
          id?: string
          last_activity_at?: string
          module_id: string
          quiz_answers?: Json
          quiz_score?: number | null
          started_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          completed_slides?: number[]
          id?: string
          last_activity_at?: string
          module_id?: string
          quiz_answers?: Json
          quiz_score?: number | null
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learner_module_progress_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "training_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      ofppt_dossier_documents: {
        Row: {
          document_type: Database["public"]["Enums"]["ofppt_document_type"]
          dossier_id: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          notes: string | null
          uploaded_at: string
          uploaded_by: string
        }
        Insert: {
          document_type: Database["public"]["Enums"]["ofppt_document_type"]
          dossier_id: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          notes?: string | null
          uploaded_at?: string
          uploaded_by: string
        }
        Update: {
          document_type?: Database["public"]["Enums"]["ofppt_document_type"]
          dossier_id?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          notes?: string | null
          uploaded_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "ofppt_dossier_documents_dossier_id_fkey"
            columns: ["dossier_id"]
            isOneToOne: false
            referencedRelation: "ofppt_reimbursement_dossiers"
            referencedColumns: ["id"]
          },
        ]
      }
      ofppt_reimbursement_dossiers: {
        Row: {
          approval_date: string | null
          company_id: string
          cost_per_hour_per_person: number | null
          created_at: string
          created_by: string
          exercise_year: number
          id: string
          notes: string | null
          reimbursement_amount: number | null
          reimbursement_date: string | null
          status: Database["public"]["Enums"]["ofppt_dossier_status"]
          submission_date: string | null
          title: string
          total_amount: number | null
          total_hours: number | null
          total_participants: number | null
          training_plan_id: string | null
          updated_at: string
        }
        Insert: {
          approval_date?: string | null
          company_id: string
          cost_per_hour_per_person?: number | null
          created_at?: string
          created_by: string
          exercise_year?: number
          id?: string
          notes?: string | null
          reimbursement_amount?: number | null
          reimbursement_date?: string | null
          status?: Database["public"]["Enums"]["ofppt_dossier_status"]
          submission_date?: string | null
          title: string
          total_amount?: number | null
          total_hours?: number | null
          total_participants?: number | null
          training_plan_id?: string | null
          updated_at?: string
        }
        Update: {
          approval_date?: string | null
          company_id?: string
          cost_per_hour_per_person?: number | null
          created_at?: string
          created_by?: string
          exercise_year?: number
          id?: string
          notes?: string | null
          reimbursement_amount?: number | null
          reimbursement_date?: string | null
          status?: Database["public"]["Enums"]["ofppt_dossier_status"]
          submission_date?: string | null
          title?: string
          total_amount?: number | null
          total_hours?: number | null
          total_participants?: number | null
          training_plan_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ofppt_reimbursement_dossiers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ofppt_reimbursement_dossiers_training_plan_id_fkey"
            columns: ["training_plan_id"]
            isOneToOne: false
            referencedRelation: "training_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_evaluation_access_logs: {
        Row: {
          accessed_at: string
          accessed_by: string
          action: string
          evaluation_id: string
          id: string
          ip_address: string | null
          user_agent: string | null
        }
        Insert: {
          accessed_at?: string
          accessed_by: string
          action: string
          evaluation_id: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Update: {
          accessed_at?: string
          accessed_by?: string
          action?: string
          evaluation_id?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "performance_evaluation_access_logs_evaluation_id_fkey"
            columns: ["evaluation_id"]
            isOneToOne: false
            referencedRelation: "performance_evaluations"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_evaluations: {
        Row: {
          areas_for_improvement: string[] | null
          career_goals: string | null
          company_id: string
          competency_scores: Json | null
          created_at: string | null
          created_by: string | null
          department: string | null
          employee_email: string | null
          employee_name: string
          evaluation_date: string | null
          evaluation_period: string | null
          id: string
          job_description_id: string | null
          notes: string | null
          overall_rating: number | null
          resume_summary: Json | null
          resume_url: string | null
          skills_analysis: Json | null
          strengths: string[] | null
          training_recommendations: string[] | null
          updated_at: string | null
        }
        Insert: {
          areas_for_improvement?: string[] | null
          career_goals?: string | null
          company_id: string
          competency_scores?: Json | null
          created_at?: string | null
          created_by?: string | null
          department?: string | null
          employee_email?: string | null
          employee_name: string
          evaluation_date?: string | null
          evaluation_period?: string | null
          id?: string
          job_description_id?: string | null
          notes?: string | null
          overall_rating?: number | null
          resume_summary?: Json | null
          resume_url?: string | null
          skills_analysis?: Json | null
          strengths?: string[] | null
          training_recommendations?: string[] | null
          updated_at?: string | null
        }
        Update: {
          areas_for_improvement?: string[] | null
          career_goals?: string | null
          company_id?: string
          competency_scores?: Json | null
          created_at?: string | null
          created_by?: string | null
          department?: string | null
          employee_email?: string | null
          employee_name?: string
          evaluation_date?: string | null
          evaluation_period?: string | null
          id?: string
          job_description_id?: string | null
          notes?: string | null
          overall_rating?: number | null
          resume_summary?: Json | null
          resume_url?: string | null
          skills_analysis?: Json | null
          strengths?: string[] | null
          training_recommendations?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "performance_evaluations_job_description_id_fkey"
            columns: ["job_description_id"]
            isOneToOne: false
            referencedRelation: "job_descriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          parent_id: string | null
          plan_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          parent_id?: string | null
          plan_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          parent_id?: string | null
          plan_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "plan_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_comments_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "training_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_shares: {
        Row: {
          access_level: string
          created_at: string
          expires_at: string | null
          id: string
          plan_id: string
          share_token: string
          shared_by: string
          shared_with_email: string
        }
        Insert: {
          access_level?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          plan_id: string
          share_token?: string
          shared_by: string
          shared_with_email: string
        }
        Update: {
          access_level?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          plan_id?: string
          share_token?: string
          shared_by?: string
          shared_with_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_shares_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "training_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_templates: {
        Row: {
          configuration: Json
          created_at: string
          description: string | null
          id: string
          is_public: boolean | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          configuration: Json
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          configuration?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      plan_versions: {
        Row: {
          change_notes: string | null
          created_at: string
          created_by: string | null
          id: string
          plan_data: Json
          plan_id: string
          version_number: number
        }
        Insert: {
          change_notes?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          plan_data: Json
          plan_id: string
          version_number: number
        }
        Update: {
          change_notes?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          plan_data?: Json
          plan_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "plan_versions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "training_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      positions: {
        Row: {
          company_id: string
          created_at: string
          current_holder_email: string | null
          current_holder_name: string | null
          department_id: string | null
          id: string
          is_critical: boolean | null
          job_description_id: string | null
          level: string | null
          match_score: number | null
          notes: string | null
          reports_to_position_id: string | null
          reskill_candidate: boolean | null
          skills_current: Json | null
          skills_required: Json | null
          status: string
          title: string
          updated_at: string
          upskill_potential: boolean | null
        }
        Insert: {
          company_id: string
          created_at?: string
          current_holder_email?: string | null
          current_holder_name?: string | null
          department_id?: string | null
          id?: string
          is_critical?: boolean | null
          job_description_id?: string | null
          level?: string | null
          match_score?: number | null
          notes?: string | null
          reports_to_position_id?: string | null
          reskill_candidate?: boolean | null
          skills_current?: Json | null
          skills_required?: Json | null
          status?: string
          title: string
          updated_at?: string
          upskill_potential?: boolean | null
        }
        Update: {
          company_id?: string
          created_at?: string
          current_holder_email?: string | null
          current_holder_name?: string | null
          department_id?: string | null
          id?: string
          is_critical?: boolean | null
          job_description_id?: string | null
          level?: string | null
          match_score?: number | null
          notes?: string | null
          reports_to_position_id?: string | null
          reskill_candidate?: boolean | null
          skills_current?: Json | null
          skills_required?: Json | null
          status?: string
          title?: string
          updated_at?: string
          upskill_potential?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "positions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "positions_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "positions_job_description_id_fkey"
            columns: ["job_description_id"]
            isOneToOne: false
            referencedRelation: "job_descriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "positions_reports_to_position_id_fkey"
            columns: ["reports_to_position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
        ]
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
      skill_categories: {
        Row: {
          id: string
          company_id: string
          name_fr: string
          name_en: string
          ofppt_sector_code: string | null
          icon: string
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          name_fr: string
          name_en: string
          ofppt_sector_code?: string | null
          icon?: string
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          name_fr?: string
          name_en?: string
          ofppt_sector_code?: string | null
          icon?: string
          sort_order?: number
          created_at?: string
        }
        Relationships: []
      }
      skills: {
        Row: {
          id: string
          company_id: string
          category_id: string
          name_fr: string
          name_en: string
          description: string | null
          max_level: number
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          category_id: string
          name_fr: string
          name_en: string
          description?: string | null
          max_level?: number
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          category_id?: string
          name_fr?: string
          name_en?: string
          description?: string | null
          max_level?: number
          created_at?: string
        }
        Relationships: []
      }
      skills_catalog: {
        Row: {
          category: string
          company_id: string
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          category?: string
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          category?: string
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "skills_catalog_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string
          id: string
          interval: string
          plan: string
          seats: number
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end: string
          id?: string
          interval: string
          plan: string
          seats?: number
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string
          id?: string
          interval?: string
          plan?: string
          seats?: number
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      training_diagnostic_employees: {
        Row: {
          created_at: string | null
          current_competencies: Json | null
          diagnostic_id: string
          employee_name: string
          id: string
          job_description_id: string | null
          performance_evaluation_id: string | null
          priority: string | null
          target_competencies: Json | null
        }
        Insert: {
          created_at?: string | null
          current_competencies?: Json | null
          diagnostic_id: string
          employee_name: string
          id?: string
          job_description_id?: string | null
          performance_evaluation_id?: string | null
          priority?: string | null
          target_competencies?: Json | null
        }
        Update: {
          created_at?: string | null
          current_competencies?: Json | null
          diagnostic_id?: string
          employee_name?: string
          id?: string
          job_description_id?: string | null
          performance_evaluation_id?: string | null
          priority?: string | null
          target_competencies?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "training_diagnostic_employees_job_description_id_fkey"
            columns: ["job_description_id"]
            isOneToOne: false
            referencedRelation: "job_descriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_diagnostic_employees_performance_evaluation_id_fkey"
            columns: ["performance_evaluation_id"]
            isOneToOne: false
            referencedRelation: "performance_evaluations"
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
          scorm_url: string | null
          scorm_version: string | null
          scorm_entry_point: string | null
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
          scorm_url?: string | null
          scorm_version?: string | null
          scorm_entry_point?: string | null
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
          scorm_url?: string | null
          scorm_version?: string | null
          scorm_entry_point?: string | null
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
      xapi_events: {
        Row: {
          id: string
          company_id: string
          user_id: string
          module_id: string | null
          verb: string
          object_type: string
          object_id: string | null
          result_score: number | null
          result_success: boolean | null
          result_duration: string | null
          result_response: string | null
          context_data: Json
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          user_id: string
          module_id?: string | null
          verb: string
          object_type: string
          object_id?: string | null
          result_score?: number | null
          result_success?: boolean | null
          result_duration?: string | null
          result_response?: string | null
          context_data?: Json
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          user_id?: string
          module_id?: string | null
          verb?: string
          object_type?: string
          object_id?: string | null
          result_score?: number | null
          result_success?: boolean | null
          result_duration?: string | null
          result_response?: string | null
          context_data?: Json
          created_at?: string
        }
        Relationships: []
      }
      trainer_stripe_accounts: {
        Row: {
          id: string
          user_id: string
          stripe_account_id: string
          charges_enabled: boolean
          payouts_enabled: boolean
          onboarding_complete: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          stripe_account_id: string
          charges_enabled?: boolean
          payouts_enabled?: boolean
          onboarding_complete?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          stripe_account_id?: string
          charges_enabled?: boolean
          payouts_enabled?: boolean
          onboarding_complete?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          company_id: string | null
          type: string
          title: string
          body: string | null
          link: string | null
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          company_id?: string | null
          type: string
          title: string
          body?: string | null
          link?: string | null
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          company_id?: string | null
          type?: string
          title?: string
          body?: string | null
          link?: string | null
          read?: boolean
          created_at?: string
        }
        Relationships: []
      }
      marketplace_listings: {
        Row: {
          id: string
          seller_id: string
          module_id: string | null
          title: string
          description: string | null
          short_description: string | null
          price_cents: number
          currency: string
          category: string
          tags: string[]
          cover_image_url: string | null
          preview_url: string | null
          status: string
          platform_fee_percent: number
          rating_avg: number
          rating_count: number
          purchase_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          seller_id: string
          module_id?: string | null
          title: string
          description?: string | null
          short_description?: string | null
          price_cents: number
          currency?: string
          category: string
          tags?: string[]
          cover_image_url?: string | null
          preview_url?: string | null
          status?: string
          platform_fee_percent?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          description?: string | null
          short_description?: string | null
          price_cents?: number
          currency?: string
          category?: string
          tags?: string[]
          cover_image_url?: string | null
          preview_url?: string | null
          status?: string
          platform_fee_percent?: number
          updated_at?: string
        }
        Relationships: []
      }
      marketplace_purchases: {
        Row: {
          id: string
          listing_id: string
          buyer_id: string
          company_id: string | null
          stripe_payment_intent_id: string | null
          stripe_transfer_id: string | null
          amount_cents: number
          platform_fee_cents: number
          seller_payout_cents: number
          currency: string
          status: string
          purchased_at: string
        }
        Insert: {
          id?: string
          listing_id: string
          buyer_id: string
          company_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_transfer_id?: string | null
          amount_cents: number
          platform_fee_cents: number
          seller_payout_cents: number
          currency?: string
          status?: string
          purchased_at?: string
        }
        Update: {
          stripe_payment_intent_id?: string | null
          stripe_transfer_id?: string | null
          status?: string
        }
        Relationships: []
      }
      marketplace_reviews: {
        Row: {
          id: string
          listing_id: string
          reviewer_id: string
          purchase_id: string
          rating: number
          title: string | null
          body: string | null
          created_at: string
        }
        Insert: {
          id?: string
          listing_id: string
          reviewer_id: string
          purchase_id: string
          rating: number
          title?: string | null
          body?: string | null
          created_at?: string
        }
        Update: {
          rating?: number
          title?: string | null
          body?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_company_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_or_hr: { Args: { _user_id: string }; Returns: boolean }
      mark_all_notifications_read: { Args: { p_user_id: string }; Returns: undefined }
      generate_referral_code: { Args: Record<string, never>; Returns: string }
      get_current_user_company_id: { Args: Record<string, never>; Returns: string }
    }
    Enums: {
      app_role: "admin" | "hr_manager" | "employee" | "trainer"
      ofppt_document_type:
        | "modele_1_recap_actions"
        | "modele_2_contrat_csf"
        | "modele_3_avis_annulation"
        | "modele_4_facture"
        | "modele_5_liste_presence"
        | "modele_6_attestation_realisation"
        | "modele_7_synthese_besoins"
        | "modele_8_delegation_pouvoirs"
        | "modele_9_contrat_formation_groupee"
        | "modele_10_liste_presence_fg"
        | "other"
      ofppt_dossier_status:
        | "draft"
        | "submitted"
        | "under_review"
        | "approved"
        | "rejected"
        | "reimbursed"
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
      app_role: ["admin", "hr_manager", "employee", "trainer"],
      ofppt_document_type: [
        "modele_1_recap_actions",
        "modele_2_contrat_csf",
        "modele_3_avis_annulation",
        "modele_4_facture",
        "modele_5_liste_presence",
        "modele_6_attestation_realisation",
        "modele_7_synthese_besoins",
        "modele_8_delegation_pouvoirs",
        "modele_9_contrat_formation_groupee",
        "modele_10_liste_presence_fg",
        "other",
      ],
      ofppt_dossier_status: [
        "draft",
        "submitted",
        "under_review",
        "approved",
        "rejected",
        "reimbursed",
      ],
      training_status: ["draft", "active", "completed", "cancelled"],
      training_type: ["internal", "external", "mixed"],
    },
  },
} as const
