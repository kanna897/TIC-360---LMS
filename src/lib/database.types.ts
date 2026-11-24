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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json
          entity_id: string | null
          entity_type: string
          id: number
          ip_address: unknown
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          entity_id?: string | null
          entity_type: string
          id?: never
          ip_address?: unknown
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          entity_id?: string | null
          entity_type?: string
          id?: never
          ip_address?: unknown
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      batches: {
        Row: {
          academic_year: number
          course_id: number
          created_at: string
          end_date: string | null
          id: number
          name: string
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          academic_year: number
          course_id: number
          created_at?: string
          end_date?: string | null
          id?: never
          name: string
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          academic_year?: number
          course_id?: number
          created_at?: string
          end_date?: string | null
          id?: never
          name?: string
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "batches_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          code: string
          created_at: string
          description: string | null
          duration_months: number
          id: number
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          duration_months?: number
          id?: never
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          duration_months?: number
          id?: never
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      groups: {
        Row: {
          batch_id: number
          created_at: string
          id: number
          is_active: boolean
          name: string
        }
        Insert: {
          batch_id: number
          created_at?: string
          id?: never
          is_active?: boolean
          name: string
        }
        Update: {
          batch_id?: number
          created_at?: string
          id?: never
          is_active?: boolean
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "groups_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          created_at: string
          description: string | null
          id: number
          is_active: boolean
          sort_order: number
          subject_id: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: never
          is_active?: boolean
          sort_order?: number
          subject_id: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: never
          is_active?: boolean
          sort_order?: number
          subject_id?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "modules_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_status: string
          avatar_url: string | null
          created_at: string
          email: string
          first_login_completed_at: string | null
          full_name: string
          google_email: string | null
          id: string
          last_password_change_at: string | null
          must_change_password: boolean
          phone: string | null
          role: string
          temporary_password_expires_at: string | null
          updated_at: string
          username: string
        }
        Insert: {
          account_status?: string
          avatar_url?: string | null
          created_at?: string
          email: string
          first_login_completed_at?: string | null
          full_name: string
          google_email?: string | null
          id: string
          last_password_change_at?: string | null
          must_change_password?: boolean
          phone?: string | null
          role?: string
          temporary_password_expires_at?: string | null
          updated_at?: string
          username: string
        }
        Update: {
          account_status?: string
          avatar_url?: string | null
          created_at?: string
          email?: string
          first_login_completed_at?: string | null
          full_name?: string
          google_email?: string | null
          id?: string
          last_password_change_at?: string | null
          must_change_password?: boolean
          phone?: string | null
          role?: string
          temporary_password_expires_at?: string | null
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      specialisation_options: {
        Row: {
          code: string
          course_id: number
          created_at: string
          description: string | null
          id: number
          is_active: boolean
          name: string
        }
        Insert: {
          code: string
          course_id: number
          created_at?: string
          description?: string | null
          id?: never
          is_active?: boolean
          name: string
        }
        Update: {
          code?: string
          course_id?: number
          created_at?: string
          description?: string | null
          id?: never
          is_active?: boolean
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "specialisation_options_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      student_enrollments: {
        Row: {
          batch_id: number
          completed_at: string | null
          course_id: number
          created_at: string
          enrolled_at: string
          group_id: number
          id: number
          status: string
          student_id: number
          updated_at: string
        }
        Insert: {
          batch_id: number
          completed_at?: string | null
          course_id: number
          created_at?: string
          enrolled_at?: string
          group_id: number
          id?: never
          status?: string
          student_id: number
          updated_at?: string
        }
        Update: {
          batch_id?: number
          completed_at?: string | null
          course_id?: number
          created_at?: string
          enrolled_at?: string
          group_id?: number
          id?: never
          status?: string
          student_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_enrollments_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_enrollments_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_specialisations: {
        Row: {
          created_at: string
          id: number
          review_comment: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          specialisation_id: number
          status: string
          student_id: number
          submitted_at: string
        }
        Insert: {
          created_at?: string
          id?: never
          review_comment?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          specialisation_id: number
          status?: string
          student_id: number
          submitted_at?: string
        }
        Update: {
          created_at?: string
          id?: never
          review_comment?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          specialisation_id?: number
          status?: string
          student_id?: number
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_specialisations_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_specialisations_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_specialisations_specialisation_id_fkey"
            columns: ["specialisation_id"]
            isOneToOne: false
            referencedRelation: "specialisation_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_specialisations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          account_status: string
          contact_number: string | null
          created_at: string
          enrollment_date: string
          id: number
          profile_id: string
          updated_at: string
          ut_number: string
        }
        Insert: {
          account_status?: string
          contact_number?: string | null
          created_at?: string
          enrollment_date?: string
          id?: never
          profile_id: string
          updated_at?: string
          ut_number: string
        }
        Update: {
          account_status?: string
          contact_number?: string | null
          created_at?: string
          enrollment_date?: string
          id?: never
          profile_id?: string
          updated_at?: string
          ut_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          code: string
          course_id: number
          created_at: string
          description: string | null
          id: number
          is_active: boolean
          is_common: boolean
          name: string
          stage: number
          updated_at: string
        }
        Insert: {
          code: string
          course_id: number
          created_at?: string
          description?: string | null
          id?: never
          is_active?: boolean
          is_common?: boolean
          name: string
          stage: number
          updated_at?: string
        }
        Update: {
          code?: string
          course_id?: number
          created_at?: string
          description?: string | null
          id?: never
          is_active?: boolean
          is_common?: boolean
          name?: string
          stage?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subjects_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "system_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trainer_assignments: {
        Row: {
          batch_id: number
          created_at: string
          ends_on: string | null
          group_id: number | null
          id: number
          is_active: boolean
          starts_on: string
          subject_id: number
          trainer_id: number
        }
        Insert: {
          batch_id: number
          created_at?: string
          ends_on?: string | null
          group_id?: number | null
          id?: never
          is_active?: boolean
          starts_on?: string
          subject_id: number
          trainer_id: number
        }
        Update: {
          batch_id?: number
          created_at?: string
          ends_on?: string | null
          group_id?: number | null
          id?: never
          is_active?: boolean
          starts_on?: string
          subject_id?: number
          trainer_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "trainer_assignments_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trainer_assignments_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trainer_assignments_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trainer_assignments_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "trainers"
            referencedColumns: ["id"]
          },
        ]
      }
      trainers: {
        Row: {
          bio: string | null
          created_at: string
          employee_number: string | null
          id: number
          is_active: boolean
          profile_id: string
          updated_at: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          employee_number?: string | null
          id?: never
          is_active?: boolean
          profile_id: string
          updated_at?: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          employee_number?: string | null
          id?: never
          is_active?: boolean
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trainers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trainers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      user_profiles: {
        Row: {
          account_status: string | null
          avatar_url: string | null
          created_at: string | null
          department: string | null
          email: string | null
          first_login_completed_at: string | null
          full_name: string | null
          google_email: string | null
          id: string | null
          last_password_change_at: string | null
          must_change_password: boolean | null
          role: string | null
          student_id: string | null
          temporary_password_expires_at: string | null
          updated_at: string | null
          username: string | null
          ut_number: string | null
        }
        Insert: {
          account_status?: string | null
          avatar_url?: string | null
          created_at?: string | null
          department?: never
          email?: never
          first_login_completed_at?: string | null
          full_name?: string | null
          google_email?: string | null
          id?: string | null
          last_password_change_at?: string | null
          must_change_password?: boolean | null
          role?: string | null
          student_id?: never
          temporary_password_expires_at?: string | null
          updated_at?: string | null
          username?: never
          ut_number?: never
        }
        Update: {
          account_status?: string | null
          avatar_url?: string | null
          created_at?: string | null
          department?: never
          email?: never
          first_login_completed_at?: string | null
          full_name?: string | null
          google_email?: string | null
          id?: string | null
          last_password_change_at?: string | null
          must_change_password?: boolean | null
          role?: string | null
          student_id?: never
          temporary_password_expires_at?: string | null
          updated_at?: string | null
          username?: never
          ut_number?: never
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
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
    Enums: {},
  },
} as const

