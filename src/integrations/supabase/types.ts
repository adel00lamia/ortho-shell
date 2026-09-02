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
      company_employees: {
        Row: {
          company_id: string
          contract_type: string | null
          created_at: string
          created_by: string
          department: string | null
          email: string | null
          full_name: string
          hire_date: string | null
          id: string
          matricule: string | null
          phone: string | null
          position: string | null
          status: string
          updated_at: string
        }
        Insert: {
          company_id: string
          contract_type?: string | null
          created_at?: string
          created_by: string
          department?: string | null
          email?: string | null
          full_name: string
          hire_date?: string | null
          id?: string
          matricule?: string | null
          phone?: string | null
          position?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          contract_type?: string | null
          created_at?: string
          created_by?: string
          department?: string | null
          email?: string | null
          full_name?: string
          hire_date?: string | null
          id?: string
          matricule?: string | null
          phone?: string | null
          position?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_employees_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
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
      diagnostic_impact_measurements: {
        Row: {
          action_id: string | null
          actual_value: number | null
          baseline_value: number | null
          company_id: string
          created_at: string
          diagnostic_id: string
          direction: string
          id: string
          kpi_name: string
          measured_at: string | null
          notes: string | null
          target_value: number | null
          unit: string | null
          updated_at: string
        }
        Insert: {
          action_id?: string | null
          actual_value?: number | null
          baseline_value?: number | null
          company_id: string
          created_at?: string
          diagnostic_id: string
          direction?: string
          id?: string
          kpi_name: string
          measured_at?: string | null
          notes?: string | null
          target_value?: number | null
          unit?: string | null
          updated_at?: string
        }
        Update: {
          action_id?: string | null
          actual_value?: number | null
          baseline_value?: number | null
          company_id?: string
          created_at?: string
          diagnostic_id?: string
          direction?: string
          id?: string
          kpi_name?: string
          measured_at?: string | null
          notes?: string | null
          target_value?: number | null
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "diagnostic_impact_measurements_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "root_cause_actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnostic_impact_measurements_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnostic_impact_measurements_diagnostic_id_fkey"
            columns: ["diagnostic_id"]
            isOneToOne: false
            referencedRelation: "root_cause_diagnostics"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnostic_kpi_readings: {
        Row: {
          created_at: string
          id: string
          kpi_id: string
          measured_at: string
          note: string | null
          value: number
        }
        Insert: {
          created_at?: string
          id?: string
          kpi_id: string
          measured_at?: string
          note?: string | null
          value: number
        }
        Update: {
          created_at?: string
          id?: string
          kpi_id?: string
          measured_at?: string
          note?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "diagnostic_kpi_readings_kpi_id_fkey"
            columns: ["kpi_id"]
            isOneToOne: false
            referencedRelation: "diagnostic_participant_kpis"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnostic_participant_kpis: {
        Row: {
          baseline_value: number | null
          created_at: string
          direction: string
          id: string
          name: string
          participant_id: string
          source: string
          target_value: number | null
          unit: string | null
          updated_at: string
        }
        Insert: {
          baseline_value?: number | null
          created_at?: string
          direction?: string
          id?: string
          name: string
          participant_id: string
          source?: string
          target_value?: number | null
          unit?: string | null
          updated_at?: string
        }
        Update: {
          baseline_value?: number | null
          created_at?: string
          direction?: string
          id?: string
          name?: string
          participant_id?: string
          source?: string
          target_value?: number | null
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "diagnostic_participant_kpis_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "diagnostic_participants"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnostic_participant_modules: {
        Row: {
          created_at: string
          id: string
          module_id: string
          participant_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          module_id: string
          participant_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          module_id?: string
          participant_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "diagnostic_participant_modules_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "diagnostic_participants"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnostic_participants: {
        Row: {
          access_code: string | null
          answers: Json
          company: string | null
          company_size: string | null
          contact_consent: boolean
          contact_email: string | null
          contact_whatsapp: string | null
          created_at: string
          dimension_scores: Json
          domain: string
          first_name: string | null
          hr_function: string
          id: string
          job_title: string | null
          locale: string
          opportunity_score: number
          profile_label: string | null
          profile_level: string | null
          recommended_modules: Json
          sector: string | null
          seniority: string | null
          session_id: string | null
          team_size: string | null
          top_frictions: Json
          top_use_cases: Json
        }
        Insert: {
          access_code?: string | null
          answers?: Json
          company?: string | null
          company_size?: string | null
          contact_consent?: boolean
          contact_email?: string | null
          contact_whatsapp?: string | null
          created_at?: string
          dimension_scores?: Json
          domain?: string
          first_name?: string | null
          hr_function: string
          id?: string
          job_title?: string | null
          locale?: string
          opportunity_score?: number
          profile_label?: string | null
          profile_level?: string | null
          recommended_modules?: Json
          sector?: string | null
          seniority?: string | null
          session_id?: string | null
          team_size?: string | null
          top_frictions?: Json
          top_use_cases?: Json
        }
        Update: {
          access_code?: string | null
          answers?: Json
          company?: string | null
          company_size?: string | null
          contact_consent?: boolean
          contact_email?: string | null
          contact_whatsapp?: string | null
          created_at?: string
          dimension_scores?: Json
          domain?: string
          first_name?: string | null
          hr_function?: string
          id?: string
          job_title?: string | null
          locale?: string
          opportunity_score?: number
          profile_label?: string | null
          profile_level?: string | null
          recommended_modules?: Json
          sector?: string | null
          seniority?: string | null
          session_id?: string | null
          team_size?: string | null
          top_frictions?: Json
          top_use_cases?: Json
        }
        Relationships: [
          {
            foreignKeyName: "diagnostic_participants_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "diagnostic_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnostic_sessions: {
        Row: {
          city: string | null
          code: string
          created_at: string
          domain: string
          event_date: string | null
          id: string
          is_open: boolean
          owner_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          city?: string | null
          code: string
          created_at?: string
          domain?: string
          event_date?: string | null
          id?: string
          is_open?: boolean
          owner_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          city?: string | null
          code?: string
          created_at?: string
          domain?: string
          event_date?: string | null
          id?: string
          is_open?: boolean
          owner_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      employee_skills: {
        Row: {
          assessed_at: string
          company_id: string
          current_level: number
          employee_email: string | null
          employee_name: string
          id: string
          notes: string | null
          skill_id: string
          target_level: number
        }
        Insert: {
          assessed_at?: string
          company_id: string
          current_level?: number
          employee_email?: string | null
          employee_name: string
          id?: string
          notes?: string | null
          skill_id: string
          target_level?: number
        }
        Update: {
          assessed_at?: string
          company_id?: string
          current_level?: number
          employee_email?: string | null
          employee_name?: string
          id?: string
          notes?: string | null
          skill_id?: string
          target_level?: number
        }
        Relationships: [
          {
            foreignKeyName: "employee_skills_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_chat_messages: {
        Row: {
          company_id: string
          content: string
          created_at: string
          id: string
          role: string
          sources: Json | null
          user_id: string
        }
        Insert: {
          company_id: string
          content: string
          created_at?: string
          id?: string
          role: string
          sources?: Json | null
          user_id: string
        }
        Update: {
          company_id?: string
          content?: string
          created_at?: string
          id?: string
          role?: string
          sources?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_chat_messages_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_knowledge_articles: {
        Row: {
          category: string
          company_id: string
          content: string
          created_at: string
          created_by: string
          id: string
          is_public: boolean | null
          source_type: string
          source_url: string | null
          summary: string | null
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          company_id: string
          content: string
          created_at?: string
          created_by: string
          id?: string
          is_public?: boolean | null
          source_type?: string
          source_url?: string | null
          summary?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          company_id?: string
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          is_public?: boolean | null
          source_type?: string
          source_url?: string | null
          summary?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_knowledge_articles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      inferred_skills: {
        Row: {
          company_id: string
          confidence: number
          created_at: string
          id: string
          inferred_from: string
          skill_id: string
          user_id: string
        }
        Insert: {
          company_id: string
          confidence?: number
          created_at?: string
          id?: string
          inferred_from: string
          skill_id: string
          user_id: string
        }
        Update: {
          company_id?: string
          confidence?: number
          created_at?: string
          id?: string
          inferred_from?: string
          skill_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inferred_skills_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inferred_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      ingenierie_actions: {
        Row: {
          company_id: string
          content_outline: string | null
          cost_ht: number | null
          created_at: string
          dossier_id: string
          duration_days: number | null
          duration_hours: number | null
          id: string
          is_planned: boolean
          location: string | null
          objectives: string[] | null
          participant_count: number | null
          planned_end_date: string | null
          planned_start_date: string | null
          provider_name: string | null
          provider_type: string | null
          reimbursement_rate: number | null
          sort_order: number
          source_need_type: string | null
          target_population: string | null
          title: string
          updated_at: string
        }
        Insert: {
          company_id: string
          content_outline?: string | null
          cost_ht?: number | null
          created_at?: string
          dossier_id: string
          duration_days?: number | null
          duration_hours?: number | null
          id?: string
          is_planned?: boolean
          location?: string | null
          objectives?: string[] | null
          participant_count?: number | null
          planned_end_date?: string | null
          planned_start_date?: string | null
          provider_name?: string | null
          provider_type?: string | null
          reimbursement_rate?: number | null
          sort_order?: number
          source_need_type?: string | null
          target_population?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          content_outline?: string | null
          cost_ht?: number | null
          created_at?: string
          dossier_id?: string
          duration_days?: number | null
          duration_hours?: number | null
          id?: string
          is_planned?: boolean
          location?: string | null
          objectives?: string[] | null
          participant_count?: number | null
          planned_end_date?: string | null
          planned_start_date?: string | null
          provider_name?: string | null
          provider_type?: string | null
          reimbursement_rate?: number | null
          sort_order?: number
          source_need_type?: string | null
          target_population?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ingenierie_actions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingenierie_actions_dossier_id_fkey"
            columns: ["dossier_id"]
            isOneToOne: false
            referencedRelation: "ingenierie_de_formation"
            referencedColumns: ["id"]
          },
        ]
      }
      ingenierie_de_formation: {
        Row: {
          company_id: string
          completed_steps: number[] | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          created_by: string | null
          csf_attestation_url: string | null
          current_step: number
          estimated_reimbursement: number | null
          exercise_year: number
          followed_strategic_diagnostic: boolean
          giac_attestation_url: string | null
          giac_sector: string | null
          gross_annual_payroll: number | null
          id: string
          if_number: string | null
          linked_training_plan_id: string | null
          needs_collective: Json | null
          needs_individual: Json | null
          needs_strategic: Json | null
          status: string
          swot_data: Json | null
          tfp_amount: number | null
          updated_at: string
        }
        Insert: {
          company_id: string
          completed_steps?: number[] | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          csf_attestation_url?: string | null
          current_step?: number
          estimated_reimbursement?: number | null
          exercise_year?: number
          followed_strategic_diagnostic?: boolean
          giac_attestation_url?: string | null
          giac_sector?: string | null
          gross_annual_payroll?: number | null
          id?: string
          if_number?: string | null
          linked_training_plan_id?: string | null
          needs_collective?: Json | null
          needs_individual?: Json | null
          needs_strategic?: Json | null
          status?: string
          swot_data?: Json | null
          tfp_amount?: number | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          completed_steps?: number[] | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          csf_attestation_url?: string | null
          current_step?: number
          estimated_reimbursement?: number | null
          exercise_year?: number
          followed_strategic_diagnostic?: boolean
          giac_attestation_url?: string | null
          giac_sector?: string | null
          gross_annual_payroll?: number | null
          id?: string
          if_number?: string | null
          linked_training_plan_id?: string | null
          needs_collective?: Json | null
          needs_individual?: Json | null
          needs_strategic?: Json | null
          status?: string
          swot_data?: Json | null
          tfp_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ingenierie_de_formation_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      job_applications: {
        Row: {
          applied_at: string
          company_id: string
          id: string
          job_description_id: string
          match_score: number
          status: string
          user_id: string
        }
        Insert: {
          applied_at?: string
          company_id: string
          id?: string
          job_description_id: string
          match_score?: number
          status?: string
          user_id: string
        }
        Update: {
          applied_at?: string
          company_id?: string
          id?: string
          job_description_id?: string
          match_score?: number
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_applications_job_description_id_fkey"
            columns: ["job_description_id"]
            isOneToOne: false
            referencedRelation: "job_descriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      job_descriptions: {
        Row: {
          closes_at: string | null
          company_id: string
          competencies: Json | null
          created_at: string | null
          created_by: string | null
          department: string | null
          description: string | null
          employment_type: string
          id: string
          is_open: boolean
          level: string | null
          preferred_skills: Json | null
          required_skills: Json | null
          responsibilities: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          closes_at?: string | null
          company_id: string
          competencies?: Json | null
          created_at?: string | null
          created_by?: string | null
          department?: string | null
          description?: string | null
          employment_type?: string
          id?: string
          is_open?: boolean
          level?: string | null
          preferred_skills?: Json | null
          required_skills?: Json | null
          responsibilities?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          closes_at?: string | null
          company_id?: string
          competencies?: Json | null
          created_at?: string | null
          created_by?: string | null
          department?: string | null
          description?: string | null
          employment_type?: string
          id?: string
          is_open?: boolean
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
          succession_candidates: Json | null
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
          succession_candidates?: Json | null
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
          succession_candidates?: Json | null
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
          skill_declaration_text: string | null
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
          skill_declaration_text?: string | null
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
          skill_declaration_text?: string | null
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
      root_cause_actions: {
        Row: {
          action_type: string
          company_id: string
          created_at: string
          description: string | null
          diagnostic_id: string
          due_date: string | null
          effort: string | null
          estimated_cost_mad: number | null
          expected_impact: string | null
          headcount: number | null
          id: string
          is_training: boolean
          owner_name: string | null
          priority: string
          rationale: string | null
          sort_order: number
          status: string
          target_population: string | null
          title: string
          updated_at: string
        }
        Insert: {
          action_type?: string
          company_id: string
          created_at?: string
          description?: string | null
          diagnostic_id: string
          due_date?: string | null
          effort?: string | null
          estimated_cost_mad?: number | null
          expected_impact?: string | null
          headcount?: number | null
          id?: string
          is_training?: boolean
          owner_name?: string | null
          priority?: string
          rationale?: string | null
          sort_order?: number
          status?: string
          target_population?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          action_type?: string
          company_id?: string
          created_at?: string
          description?: string | null
          diagnostic_id?: string
          due_date?: string | null
          effort?: string | null
          estimated_cost_mad?: number | null
          expected_impact?: string | null
          headcount?: number | null
          id?: string
          is_training?: boolean
          owner_name?: string | null
          priority?: string
          rationale?: string | null
          sort_order?: number
          status?: string
          target_population?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "root_cause_actions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "root_cause_actions_diagnostic_id_fkey"
            columns: ["diagnostic_id"]
            isOneToOne: false
            referencedRelation: "root_cause_diagnostics"
            referencedColumns: ["id"]
          },
        ]
      }
      root_cause_diagnostics: {
        Row: {
          affected_population: string | null
          ai_confidence: number | null
          ai_summary: string | null
          ai_verdict: string | null
          avoided_training_cost_mad: number | null
          business_kpis: Json
          cause_breakdown: Json
          company_id: string
          created_at: string
          created_by: string
          department: string | null
          diagnosed_at: string | null
          estimated_training_cost_mad: number | null
          evidence_sources: Json
          headcount_affected: number | null
          id: string
          linked_training_plan_id: string | null
          problem_description: string
          source_channel: string
          status: string
          symptoms: string[]
          title: string
          training_fit_score: number | null
          updated_at: string
        }
        Insert: {
          affected_population?: string | null
          ai_confidence?: number | null
          ai_summary?: string | null
          ai_verdict?: string | null
          avoided_training_cost_mad?: number | null
          business_kpis?: Json
          cause_breakdown?: Json
          company_id: string
          created_at?: string
          created_by?: string
          department?: string | null
          diagnosed_at?: string | null
          estimated_training_cost_mad?: number | null
          evidence_sources?: Json
          headcount_affected?: number | null
          id?: string
          linked_training_plan_id?: string | null
          problem_description?: string
          source_channel?: string
          status?: string
          symptoms?: string[]
          title: string
          training_fit_score?: number | null
          updated_at?: string
        }
        Update: {
          affected_population?: string | null
          ai_confidence?: number | null
          ai_summary?: string | null
          ai_verdict?: string | null
          avoided_training_cost_mad?: number | null
          business_kpis?: Json
          cause_breakdown?: Json
          company_id?: string
          created_at?: string
          created_by?: string
          department?: string | null
          diagnosed_at?: string | null
          estimated_training_cost_mad?: number | null
          evidence_sources?: Json
          headcount_affected?: number | null
          id?: string
          linked_training_plan_id?: string | null
          problem_description?: string
          source_channel?: string
          status?: string
          symptoms?: string[]
          title?: string
          training_fit_score?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "root_cause_diagnostics_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "root_cause_diagnostics_linked_training_plan_id_fkey"
            columns: ["linked_training_plan_id"]
            isOneToOne: false
            referencedRelation: "training_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_categories: {
        Row: {
          company_id: string
          created_at: string
          icon: string
          id: string
          name_en: string
          name_fr: string
          ofppt_sector_code: string | null
          sort_order: number
        }
        Insert: {
          company_id: string
          created_at?: string
          icon?: string
          id?: string
          name_en: string
          name_fr: string
          ofppt_sector_code?: string | null
          sort_order?: number
        }
        Update: {
          company_id?: string
          created_at?: string
          icon?: string
          id?: string
          name_en?: string
          name_fr?: string
          ofppt_sector_code?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "skill_categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      skills: {
        Row: {
          category_id: string
          company_id: string
          created_at: string
          description: string | null
          id: string
          max_level: number
          name_en: string
          name_fr: string
        }
        Insert: {
          category_id: string
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          max_level?: number
          name_en: string
          name_fr: string
        }
        Update: {
          category_id?: string
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          max_level?: number
          name_en?: string
          name_fr?: string
        }
        Relationships: [
          {
            foreignKeyName: "skills_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "skill_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skills_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
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
      student_profiles: {
        Row: {
          bio: string | null
          company_id: string | null
          created_at: string
          cv_data: Json
          cv_url: string | null
          education: Json
          email: string | null
          experiences: Json
          field_of_study: string | null
          full_name: string | null
          graduation_year: number | null
          id: string
          interests: string[]
          interview_history: Json
          languages: Json
          phone: string | null
          school: string | null
          soft_skills: Json
          technical_skills: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          bio?: string | null
          company_id?: string | null
          created_at?: string
          cv_data?: Json
          cv_url?: string | null
          education?: Json
          email?: string | null
          experiences?: Json
          field_of_study?: string | null
          full_name?: string | null
          graduation_year?: number | null
          id?: string
          interests?: string[]
          interview_history?: Json
          languages?: Json
          phone?: string | null
          school?: string | null
          soft_skills?: Json
          technical_skills?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          bio?: string | null
          company_id?: string | null
          created_at?: string
          cv_data?: Json
          cv_url?: string | null
          education?: Json
          email?: string | null
          experiences?: Json
          field_of_study?: string | null
          full_name?: string | null
          graduation_year?: number | null
          id?: string
          interests?: string[]
          interview_history?: Json
          languages?: Json
          phone?: string | null
          school?: string | null
          soft_skills?: Json
          technical_skills?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      student_soft_skill_progress: {
        Row: {
          company_id: string | null
          completed_lessons: number[]
          created_at: string
          id: string
          level: number
          skill_key: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id?: string | null
          completed_lessons?: number[]
          created_at?: string
          id?: string
          level?: number
          skill_key: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string | null
          completed_lessons?: number[]
          created_at?: string
          id?: string
          level?: number
          skill_key?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      portal_add_kpi: {
        Args: {
          _baseline?: number
          _code: string
          _direction?: string
          _name: string
          _source?: string
          _target?: number
          _unit?: string
        }
        Returns: string
      }
      portal_add_reading: {
        Args: {
          _code: string
          _kpi_id: string
          _measured_at?: string
          _note?: string
          _value: number
        }
        Returns: string
      }
      portal_cohort_stats: { Args: { _code: string }; Returns: Json }
      portal_delete_kpi: {
        Args: { _code: string; _kpi_id: string }
        Returns: undefined
      }
      portal_delete_reading: {
        Args: { _code: string; _reading_id: string }
        Returns: undefined
      }
      portal_get_participant: { Args: { _code: string }; Returns: Json }
      portal_participant_id: { Args: { _code: string }; Returns: string }
      portal_set_module_status: {
        Args: { _code: string; _module_id: string; _status: string }
        Returns: undefined
      }
      seed_default_skills: {
        Args: { p_company_id: string }
        Returns: undefined
      }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
