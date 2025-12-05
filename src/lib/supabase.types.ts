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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      attendance_logs: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          note: string | null
          school_id: string
          status: string
          student_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          school_id: string
          status: string
          student_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          school_id?: string
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_logs_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_logs_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools_live"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_logs_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "v_schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_logs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_logs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students_live"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_logs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_student_risk"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "attendance_logs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_student_risk_mv"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "attendance_logs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_students"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string | null
          actor: string | null
          after: Json | null
          at: string | null
          before: Json | null
          id: number
          row_id: string | null
          table_name: string | null
        }
        Insert: {
          action?: string | null
          actor?: string | null
          after?: Json | null
          at?: string | null
          before?: Json | null
          id?: number
          row_id?: string | null
          table_name?: string | null
        }
        Update: {
          action?: string | null
          actor?: string | null
          after?: Json | null
          at?: string | null
          before?: Json | null
          id?: number
          row_id?: string | null
          table_name?: string | null
        }
        Relationships: []
      }
      behavior_contracts: {
        Row: {
          created_at: string
          created_by: string | null
          end_date: string | null
          goals: Json | null
          id: string
          school_id: string
          start_date: string
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          goals?: Json | null
          id?: string
          school_id: string
          start_date: string
          status: string
          student_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          goals?: Json | null
          id?: string
          school_id?: string
          start_date?: string
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "behavior_contracts_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "behavior_contracts_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools_live"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "behavior_contracts_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "v_schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "behavior_contracts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "behavior_contracts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students_live"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "behavior_contracts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_student_risk"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "behavior_contracts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_student_risk_mv"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "behavior_contracts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_students"
            referencedColumns: ["id"]
          },
        ]
      }
      behavior_logs: {
        Row: {
          category: string | null
          class_id: string | null
          created_at: string
          created_by: string | null
          details: string | null
          id: string
          incident: string
          level: string | null
          occurred_at: string
          outcome: string | null
          room: string | null
          school_id: string
          severity: string
          student_id: string
          summary: string | null
        }
        Insert: {
          category?: string | null
          class_id?: string | null
          created_at?: string
          created_by?: string | null
          details?: string | null
          id?: string
          incident: string
          level?: string | null
          occurred_at?: string
          outcome?: string | null
          room?: string | null
          school_id: string
          severity: string
          student_id: string
          summary?: string | null
        }
        Update: {
          category?: string | null
          class_id?: string | null
          created_at?: string
          created_by?: string | null
          details?: string | null
          id?: string
          incident?: string
          level?: string | null
          occurred_at?: string
          outcome?: string | null
          room?: string | null
          school_id?: string
          severity?: string
          student_id?: string
          summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "behavior_logs_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "behavior_logs_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes_live"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "behavior_logs_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "v_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "behavior_logs_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "behavior_logs_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools_live"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "behavior_logs_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "v_schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "behavior_logs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "behavior_logs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students_live"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "behavior_logs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_student_risk"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "behavior_logs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_student_risk_mv"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "behavior_logs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_students"
            referencedColumns: ["id"]
          },
        ]
      }
      class_teachers: {
        Row: {
          active: boolean
          class_id: string
          id: string
          teacher_profile_id: string
          user_id: string | null
        }
        Insert: {
          active?: boolean
          class_id: string
          id?: string
          teacher_profile_id: string
          user_id?: string | null
        }
        Update: {
          active?: boolean
          class_id?: string
          id?: string
          teacher_profile_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "class_teachers_class_fk"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_teachers_class_fk"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes_live"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_teachers_class_fk"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "v_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_teachers_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_teachers_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes_live"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_teachers_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "v_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_teachers_teacher_profile_id_fkey"
            columns: ["teacher_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          grade_level: number | null
          homeroom: boolean
          homeroom_teacher: string | null
          id: string
          is_live: boolean | null
          name: string
          name_norm: string | null
          revision: number
          room: string | null
          school_id: string
          search_tsv: unknown
          term: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          grade_level?: number | null
          homeroom?: boolean
          homeroom_teacher?: string | null
          id?: string
          is_live?: boolean | null
          name: string
          name_norm?: string | null
          revision?: number
          room?: string | null
          school_id: string
          search_tsv?: unknown
          term?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          grade_level?: number | null
          homeroom?: boolean
          homeroom_teacher?: string | null
          id?: string
          is_live?: boolean | null
          name?: string
          name_norm?: string | null
          revision?: number
          room?: string | null
          school_id?: string
          search_tsv?: unknown
          term?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classes_school_fk"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_school_fk"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools_live"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_school_fk"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "v_schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools_live"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "v_schools"
            referencedColumns: ["id"]
          },
        ]
      }
      cron_ping: {
        Row: {
          ts: string | null
        }
        Insert: {
          ts?: string | null
        }
        Update: {
          ts?: string | null
        }
        Relationships: []
      }
      enrollments: {
        Row: {
          class_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          enrolled_at: string | null
          id: string
          left_at: string | null
          revision: number
          school_id: string
          student_id: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          class_id: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          enrolled_at?: string | null
          id?: string
          left_at?: string | null
          revision?: number
          school_id: string
          student_id: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          class_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          enrolled_at?: string | null
          id?: string
          left_at?: string | null
          revision?: number
          school_id?: string
          student_id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_class_fk"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_class_fk"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes_live"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_class_fk"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "v_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes_live"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "v_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_school_fk"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_school_fk"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools_live"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_school_fk"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "v_schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools_live"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "v_schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_student_fk"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_student_fk"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students_live"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_student_fk"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_student_risk"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "enrollments_student_fk"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_student_risk_mv"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "enrollments_student_fk"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students_live"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_student_risk"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_student_risk_mv"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_students"
            referencedColumns: ["id"]
          },
        ]
      }
      guardians: {
        Row: {
          created_at: string | null
          email: string
          full_name: string
          id: string
          phone: string | null
          school_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name: string
          id: string
          phone?: string | null
          school_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          school_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_guardians_school"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_guardians_school"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools_live"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_guardians_school"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "v_schools"
            referencedColumns: ["id"]
          },
        ]
      }
      job_log: {
        Row: {
          finished_at: string | null
          id: number
          jobname: string
          message: string | null
          started_at: string
          status: string
        }
        Insert: {
          finished_at?: string | null
          id?: number
          jobname: string
          message?: string | null
          started_at?: string
          status: string
        }
        Update: {
          finished_at?: string | null
          id?: number
          jobname?: string
          message?: string | null
          started_at?: string
          status?: string
        }
        Relationships: []
      }
      merge_audit: {
        Row: {
          actor: string | null
          details: Json | null
          entity: string | null
          id: number
          keep_id: string
          lose_id: string
          merged_at: string | null
        }
        Insert: {
          actor?: string | null
          details?: Json | null
          entity?: string | null
          id?: number
          keep_id: string
          lose_id: string
          merged_at?: string | null
        }
        Update: {
          actor?: string | null
          details?: Json | null
          entity?: string | null
          id?: number
          keep_id?: string
          lose_id?: string
          merged_at?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          id: number
          inserted_at: string
          room_id: string
          user_id: string
        }
        Insert: {
          content: string
          id?: number
          inserted_at?: string
          room_id: string
          user_id: string
        }
        Update: {
          content?: string
          id?: number
          inserted_at?: string
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_comms: {
        Row: {
          channels: string[]
          created_at: string
          id: string
          message: string
          student_id: string
          topic: string
        }
        Insert: {
          channels?: string[]
          created_at?: string
          id?: string
          message: string
          student_id: string
          topic: string
        }
        Update: {
          channels?: string[]
          created_at?: string
          id?: string
          message?: string
          student_id?: string
          topic?: string
        }
        Relationships: []
      }
      participation_logs: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          level: string
          note: string | null
          school_id: string
          student_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          level: string
          note?: string | null
          school_id: string
          student_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          level?: string
          note?: string | null
          school_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "participation_logs_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participation_logs_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools_live"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participation_logs_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "v_schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participation_logs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participation_logs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students_live"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participation_logs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_student_risk"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "participation_logs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_student_risk_mv"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "participation_logs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_students"
            referencedColumns: ["id"]
          },
        ]
      }
      positive_logs: {
        Row: {
          code: string | null
          created_at: string
          created_by: string | null
          id: string
          note: string | null
          school_id: string
          stars: number
          student_id: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          school_id: string
          stars?: number
          student_id: string
        }
        Update: {
          code?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          school_id?: string
          stars?: number
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "positive_logs_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "positive_logs_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools_live"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "positive_logs_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "v_schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "positive_logs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "positive_logs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students_live"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "positive_logs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_student_risk"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "positive_logs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_student_risk_mv"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "positive_logs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_students"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["role_user"]
          school_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["role_user"]
          school_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["role_user"]
          school_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_profiles_school"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_profiles_school"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools_live"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_profiles_school"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "v_schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools_live"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "v_schools"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          class_id: string | null
          created_at: string
          created_by: string | null
          file_path: string
          id: string
          school_id: string
          student_id: string
          week_start: string
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          created_by?: string | null
          file_path: string
          id?: string
          school_id: string
          student_id: string
          week_start: string
        }
        Update: {
          class_id?: string | null
          created_at?: string
          created_by?: string | null
          file_path?: string
          id?: string
          school_id?: string
          student_id?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes_live"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "v_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools_live"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "v_schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students_live"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_student_risk"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "reports_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_student_risk_mv"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "reports_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_students"
            referencedColumns: ["id"]
          },
        ]
      }
      restorative_logs: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          outcome: string | null
          participants: string | null
          practice: string
          school_id: string
          student_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          outcome?: string | null
          participants?: string | null
          practice: string
          school_id: string
          student_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          outcome?: string | null
          participants?: string | null
          practice?: string
          school_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "restorative_logs_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restorative_logs_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools_live"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restorative_logs_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "v_schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restorative_logs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restorative_logs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students_live"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restorative_logs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_student_risk"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "restorative_logs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_student_risk_mv"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "restorative_logs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_students"
            referencedColumns: ["id"]
          },
        ]
      }
      room_members: {
        Row: {
          inserted_at: string
          role: string
          room_id: string
          user_id: string
        }
        Insert: {
          inserted_at?: string
          role?: string
          room_id: string
          user_id: string
        }
        Update: {
          inserted_at?: string
          role?: string
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_members_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          created_by: string | null
          id: string
          inserted_at: string
          meeting_url: string | null
          name: string
          school_id: string
        }
        Insert: {
          created_by?: string | null
          id?: string
          inserted_at?: string
          meeting_url?: string | null
          name: string
          school_id: string
        }
        Update: {
          created_by?: string | null
          id?: string
          inserted_at?: string
          meeting_url?: string | null
          name?: string
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rooms_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rooms_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools_live"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rooms_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "v_schools"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          id: string
          is_live: boolean | null
          name: string
          name_norm: string | null
          revision: number
          search_tsv: unknown
          short_code: string | null
          timezone: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          is_live?: boolean | null
          name: string
          name_norm?: string | null
          revision?: number
          search_tsv?: unknown
          short_code?: string | null
          timezone?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          is_live?: boolean | null
          name?: string
          name_norm?: string | null
          revision?: number
          search_tsv?: unknown
          short_code?: string | null
          timezone?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      seating_moves: {
        Row: {
          created_at: string
          created_by: string | null
          from_seat: string | null
          id: string
          outcome: string | null
          reason: string | null
          school_id: string
          student_id: string
          to_seat: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          from_seat?: string | null
          id?: string
          outcome?: string | null
          reason?: string | null
          school_id: string
          student_id: string
          to_seat?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          from_seat?: string | null
          id?: string
          outcome?: string | null
          reason?: string | null
          school_id?: string
          student_id?: string
          to_seat?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seating_moves_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seating_moves_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools_live"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seating_moves_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "v_schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seating_moves_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seating_moves_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students_live"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seating_moves_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_student_risk"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "seating_moves_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_student_risk_mv"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "seating_moves_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_guardians: {
        Row: {
          consent: string | null
          guardian_id: string
          id: string
          relationship: string | null
          student_id: string
        }
        Insert: {
          consent?: string | null
          guardian_id: string
          id?: string
          relationship?: string | null
          student_id: string
        }
        Update: {
          consent?: string | null
          guardian_id?: string
          id?: string
          relationship?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_guardians_guardian_id_fkey"
            columns: ["guardian_id"]
            isOneToOne: false
            referencedRelation: "guardians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_guardians_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_guardians_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students_live"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_guardians_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_student_risk"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_guardians_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_student_risk_mv"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_guardians_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          class_id: string | null
          code: string | null
          code_norm: string | null
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          first_name: string | null
          full_name: string
          id: string
          is_live: boolean | null
          last_name: string | null
          revision: number
          risk_level: string | null
          risk_notes: string | null
          risk_updated_at: string | null
          school_id: string
          search_tsv: unknown
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          class_id?: string | null
          code?: string | null
          code_norm?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          first_name?: string | null
          full_name: string
          id?: string
          is_live?: boolean | null
          last_name?: string | null
          revision?: number
          risk_level?: string | null
          risk_notes?: string | null
          risk_updated_at?: string | null
          school_id: string
          search_tsv?: unknown
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          class_id?: string | null
          code?: string | null
          code_norm?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          first_name?: string | null
          full_name?: string
          id?: string
          is_live?: boolean | null
          last_name?: string | null
          revision?: number
          risk_level?: string | null
          risk_notes?: string | null
          risk_updated_at?: string | null
          school_id?: string
          search_tsv?: unknown
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_students_class"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_students_class"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes_live"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_students_class"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "v_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_school_fk"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_school_fk"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools_live"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_school_fk"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "v_schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools_live"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "v_schools"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_schools: {
        Row: {
          created_at: string | null
          role: string
          school_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          role?: string
          school_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          role?: string
          school_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_schools_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_schools_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools_live"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_schools_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "v_schools"
            referencedColumns: ["id"]
          },
        ]
      }
      visual_cue_logs: {
        Row: {
          created_at: string
          created_by: string | null
          cue: string
          id: string
          response: string | null
          school_id: string
          student_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          cue: string
          id?: string
          response?: string | null
          school_id: string
          student_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          cue?: string
          id?: string
          response?: string | null
          school_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visual_cue_logs_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visual_cue_logs_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools_live"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visual_cue_logs_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "v_schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visual_cue_logs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visual_cue_logs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students_live"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visual_cue_logs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_student_risk"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "visual_cue_logs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_student_risk_mv"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "visual_cue_logs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_students"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      classes_live: {
        Row: {
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          grade_level: number | null
          homeroom: boolean | null
          id: string | null
          is_live: boolean | null
          name: string | null
          name_norm: string | null
          school_id: string | null
          term: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          grade_level?: number | null
          homeroom?: boolean | null
          id?: string | null
          is_live?: boolean | null
          name?: string | null
          name_norm?: string | null
          school_id?: string | null
          term?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          grade_level?: number | null
          homeroom?: boolean | null
          id?: string | null
          is_live?: boolean | null
          name?: string | null
          name_norm?: string | null
          school_id?: string | null
          term?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classes_school_fk"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_school_fk"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools_live"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_school_fk"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "v_schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools_live"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "v_schools"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments_live: {
        Row: {
          class_id: string | null
          created_by: string | null
          deleted_at: string | null
          enrolled_at: string | null
          id: string | null
          left_at: string | null
          school_id: string | null
          student_id: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          class_id?: string | null
          created_by?: string | null
          deleted_at?: string | null
          enrolled_at?: string | null
          id?: string | null
          left_at?: string | null
          school_id?: string | null
          student_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          class_id?: string | null
          created_by?: string | null
          deleted_at?: string | null
          enrolled_at?: string | null
          id?: string | null
          left_at?: string | null
          school_id?: string | null
          student_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_class_fk"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_class_fk"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes_live"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_class_fk"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "v_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes_live"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "v_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_school_fk"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_school_fk"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools_live"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_school_fk"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "v_schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools_live"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "v_schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_student_fk"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_student_fk"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students_live"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_student_fk"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_student_risk"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "enrollments_student_fk"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_student_risk_mv"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "enrollments_student_fk"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students_live"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_student_risk"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_student_risk_mv"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_students"
            referencedColumns: ["id"]
          },
        ]
      }
      health_flags: {
        Row: {
          area: string | null
          key: string | null
          n: number | null
        }
        Relationships: []
      }
      participation: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string | null
          level: string | null
          note: string | null
          school_id: string | null
          student_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string | null
          level?: string | null
          note?: string | null
          school_id?: string | null
          student_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string | null
          level?: string | null
          note?: string | null
          school_id?: string | null
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "participation_logs_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participation_logs_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools_live"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participation_logs_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "v_schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participation_logs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participation_logs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students_live"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participation_logs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_student_risk"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "participation_logs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_student_risk_mv"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "participation_logs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_students"
            referencedColumns: ["id"]
          },
        ]
      }
      schools_live: {
        Row: {
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          id: string | null
          is_live: boolean | null
          name: string | null
          name_norm: string | null
          short_code: string | null
          timezone: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          id?: string | null
          is_live?: boolean | null
          name?: string | null
          name_norm?: string | null
          short_code?: string | null
          timezone?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          id?: string | null
          is_live?: boolean | null
          name?: string | null
          name_norm?: string | null
          short_code?: string | null
          timezone?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      students_live: {
        Row: {
          class_id: string | null
          code: string | null
          code_norm: string | null
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          first_name: string | null
          full_name: string | null
          id: string | null
          is_live: boolean | null
          last_name: string | null
          school_id: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          class_id?: string | null
          code?: string | null
          code_norm?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string | null
          is_live?: boolean | null
          last_name?: string | null
          school_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          class_id?: string | null
          code?: string | null
          code_norm?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string | null
          is_live?: boolean | null
          last_name?: string | null
          school_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_students_class"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_students_class"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes_live"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_students_class"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "v_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_school_fk"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_school_fk"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools_live"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_school_fk"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "v_schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools_live"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "v_schools"
            referencedColumns: ["id"]
          },
        ]
      }
      v_classes: {
        Row: {
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          grade_level: number | null
          homeroom: boolean | null
          id: string | null
          is_live: boolean | null
          name: string | null
          name_norm: string | null
          revision: number | null
          school_id: string | null
          search_tsv: unknown
          term: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          grade_level?: number | null
          homeroom?: boolean | null
          id?: string | null
          is_live?: boolean | null
          name?: string | null
          name_norm?: string | null
          revision?: number | null
          school_id?: string | null
          search_tsv?: unknown
          term?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          grade_level?: number | null
          homeroom?: boolean | null
          id?: string | null
          is_live?: boolean | null
          name?: string | null
          name_norm?: string | null
          revision?: number | null
          school_id?: string | null
          search_tsv?: unknown
          term?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classes_school_fk"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_school_fk"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools_live"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_school_fk"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "v_schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools_live"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "v_schools"
            referencedColumns: ["id"]
          },
        ]
      }
      v_cron_latest: {
        Row: {
          active: boolean | null
          database: string | null
          end_time: string | null
          jobid: number | null
          jobname: string | null
          return_message: string | null
          schedule: string | null
          start_time: string | null
          status: string | null
          username: string | null
        }
        Relationships: []
      }
      v_enrollments: {
        Row: {
          class_id: string | null
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          enrolled_at: string | null
          id: string | null
          left_at: string | null
          revision: number | null
          school_id: string | null
          student_id: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          class_id?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          enrolled_at?: string | null
          id?: string | null
          left_at?: string | null
          revision?: number | null
          school_id?: string | null
          student_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          class_id?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          enrolled_at?: string | null
          id?: string | null
          left_at?: string | null
          revision?: number | null
          school_id?: string | null
          student_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_class_fk"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_class_fk"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes_live"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_class_fk"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "v_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes_live"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "v_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_school_fk"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_school_fk"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools_live"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_school_fk"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "v_schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools_live"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "v_schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_student_fk"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_student_fk"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students_live"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_student_fk"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_student_risk"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "enrollments_student_fk"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_student_risk_mv"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "enrollments_student_fk"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students_live"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_student_risk"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_student_risk_mv"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_students"
            referencedColumns: ["id"]
          },
        ]
      }
      v_latest_student_report: {
        Row: {
          class_id: string | null
          created_at: string | null
          file_path: string | null
          school_id: string | null
          student_id: string | null
          week_start: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes_live"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "v_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools_live"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "v_schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students_live"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_student_risk"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "reports_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_student_risk_mv"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "reports_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_students"
            referencedColumns: ["id"]
          },
        ]
      }
      v_schools: {
        Row: {
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          id: string | null
          is_live: boolean | null
          name: string | null
          name_norm: string | null
          revision: number | null
          search_tsv: unknown
          short_code: string | null
          timezone: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          id?: string | null
          is_live?: boolean | null
          name?: string | null
          name_norm?: string | null
          revision?: number | null
          search_tsv?: unknown
          short_code?: string | null
          timezone?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          id?: string | null
          is_live?: boolean | null
          name?: string | null
          name_norm?: string | null
          revision?: number | null
          search_tsv?: unknown
          short_code?: string | null
          timezone?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      v_student_risk: {
        Row: {
          class_id: string | null
          class_name: string | null
          low_participation: number | null
          recent_incidents: number | null
          recent_stars: number | null
          school_id: string | null
          student_id: string | null
          student_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_students_class"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_students_class"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes_live"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_students_class"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "v_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_school_fk"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_school_fk"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools_live"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_school_fk"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "v_schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools_live"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "v_schools"
            referencedColumns: ["id"]
          },
        ]
      }
      v_student_risk_mv: {
        Row: {
          class_id: string | null
          class_name: string | null
          low_participation: number | null
          recent_incidents: number | null
          recent_stars: number | null
          school_id: string | null
          student_id: string | null
          student_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_students_class"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_students_class"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes_live"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_students_class"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "v_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_school_fk"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_school_fk"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools_live"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_school_fk"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "v_schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools_live"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "v_schools"
            referencedColumns: ["id"]
          },
        ]
      }
      v_students: {
        Row: {
          class_id: string | null
          code: string | null
          code_norm: string | null
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          first_name: string | null
          full_name: string | null
          id: string | null
          is_live: boolean | null
          last_name: string | null
          revision: number | null
          school_id: string | null
          search_tsv: unknown
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          class_id?: string | null
          code?: string | null
          code_norm?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string | null
          is_live?: boolean | null
          last_name?: string | null
          revision?: number | null
          school_id?: string | null
          search_tsv?: unknown
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          class_id?: string | null
          code?: string | null
          code_norm?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string | null
          is_live?: boolean | null
          last_name?: string | null
          revision?: number | null
          school_id?: string | null
          search_tsv?: unknown
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_students_class"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_students_class"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes_live"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_students_class"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "v_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_school_fk"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_school_fk"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools_live"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_school_fk"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "v_schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools_live"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "v_schools"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      _set_profile_role: {
        Args: { p_role: string; p_user_id: string }
        Returns: undefined
      }
      actor_can_access_school: {
        Args: { _school: string; _uid: string }
        Returns: boolean
      }
      admin_hard_delete: {
        Args: { _id: string; _table: string }
        Returns: undefined
      }
      admin_restore: {
        Args: { _id: string; _table: string }
        Returns: undefined
      }
      admin_soft_delete: {
        Args: { _id: string; _table: string }
        Returns: undefined
      }
      apply_merge_classes: { Args: never; Returns: undefined }
      apply_merge_schools: { Args: never; Returns: undefined }
      apply_merge_students: { Args: never; Returns: undefined }
      assert_admin: { Args: never; Returns: undefined }
      can_edit_log: { Args: { created: string }; Returns: boolean }
      can_read_report_object: { Args: { obj_name: string }; Returns: boolean }
      can_view_report: { Args: { p_student: string }; Returns: boolean }
      current_actor: { Args: never; Returns: string }
      current_profile_id: { Args: never; Returns: string }
      current_user_role: { Args: never; Returns: string }
      default_school_id: { Args: never; Returns: string }
      enroll_once: {
        Args: { _class: string; _student: string }
        Returns: string
      }
      ensure_auth_user: {
        Args: { p_email: string; p_full_name: string }
        Returns: string
      }
      ensure_profile_for: {
        Args: { _role?: Database["public"]["Enums"]["role_user"]; _uid: string }
        Returns: string
      }
      generate_weekly_reports: { Args: never; Returns: undefined }
      grant_me_school_access: {
        Args: { _role?: string; _school: string }
        Returns: undefined
      }
      guardian_can_read_student: {
        Args: { p_student: string }
        Returns: boolean
      }
      has_class_access: { Args: { target_class: string }; Returns: boolean }
      is_admin:
        | { Args: { _uid: string }; Returns: boolean }
        | { Args: never; Returns: boolean }
      is_guardian_of_student: {
        Args: { target_student: string }
        Returns: boolean
      }
      is_parent: { Args: never; Returns: boolean }
      is_service_role: { Args: never; Returns: boolean }
      is_sub: { Args: never; Returns: boolean }
      is_teacher: { Args: never; Returns: boolean }
      job_log_retention:
        | { Args: { p_keep?: unknown }; Returns: undefined }
        | { Args: never; Returns: undefined }
      latest_report_path: { Args: { p_student: string }; Returns: string }
      merge_class: {
        Args: { _keep: string; _lose: string }
        Returns: undefined
      }
      merge_school: {
        Args: { _keep: string; _lose: string }
        Returns: undefined
      }
      merge_student: {
        Args: { _keep: string; _lose: string }
        Returns: undefined
      }
      norm_code: { Args: { _s: string }; Returns: string }
      norm_text: { Args: { _s: string }; Returns: string }
      path_student_id: { Args: { p_path: string }; Returns: string }
      pick_accessible_school: { Args: { _uid: string }; Returns: string }
      plan_merge_classes: {
        Args: never
        Returns: {
          keep_cnt: number
          keep_id: string
          lose_cnt: number
          lose_id: string
          name_norm: string
          school_id: string
        }[]
      }
      plan_merge_schools: {
        Args: never
        Returns: {
          keep_children: number
          keep_id: string
          lose_children: number
          lose_id: string
          name_norm: string
        }[]
      }
      plan_merge_students: {
        Args: never
        Returns: {
          code_norm: string
          keep_cnt: number
          keep_id: string
          lose_cnt: number
          lose_id: string
          school_id: string
        }[]
      }
      put_class: { Args: { _name: string; _school: string }; Returns: string }
      put_enrollment: {
        Args: { _class: string; _school: string; _student: string }
        Returns: string
      }
      put_school: { Args: { _name: string }; Returns: string }
      put_student: {
        Args: { _code: string; _full_name: string; _school: string }
        Returns: string
      }
      refresh_student_risk_mv: { Args: never; Returns: undefined }
      report_path_for_week: {
        Args: { p_student: string; p_week_start: string }
        Returns: string
      }
      restore_class: { Args: { _id: string }; Returns: undefined }
      restore_school: { Args: { _id: string }; Returns: undefined }
      restore_student: { Args: { _id: string }; Returns: undefined }
      risk_scan: {
        Args: { limit_n?: number }
        Returns: {
          class_id: string
          class_name: string
          low_participation: number
          recent_incidents: number
          recent_stars: number
          school_id: string
          student_id: string
          student_name: string
        }[]
      }
      risk_scan_for_class: {
        Args: { limit_n?: number; p_class_id: string }
        Returns: {
          class_id: string | null
          class_name: string | null
          low_participation: number | null
          recent_incidents: number | null
          recent_stars: number | null
          school_id: string | null
          student_id: string | null
          student_name: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "v_student_risk"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      search_classes:
        | {
            Args: {
              _limit?: number
              _offset?: number
              _q?: string
              _school: string
              _uid: string
            }
            Returns: {
              id: string
              name: string
              school_id: string
              score: number
            }[]
          }
        | {
            Args: { _limit?: number; _q: string; _school: string }
            Returns: {
              id: string
              name: string
            }[]
          }
        | {
            Args: {
              _actor_id: string
              _limit: number
              _offset: number
              _q: string
            }
            Returns: {
              created_at: string | null
              created_by: string | null
              deleted_at: string | null
              grade_level: number | null
              homeroom: boolean
              homeroom_teacher: string | null
              id: string
              is_live: boolean | null
              name: string
              name_norm: string | null
              revision: number
              room: string | null
              school_id: string
              search_tsv: unknown
              term: string
              updated_at: string | null
              updated_by: string | null
            }[]
            SetofOptions: {
              from: "*"
              to: "classes"
              isOneToOne: false
              isSetofReturn: true
            }
          }
      search_classes_me: {
        Args: {
          _limit?: number
          _offset?: number
          _q?: string
          _school?: string
        }
        Returns: {
          id: string
          name: string
          school_id: string
          score: number
        }[]
      }
      search_schools: {
        Args: { _limit?: number; _offset?: number; _q?: string; _uid: string }
        Returns: {
          id: string
          name: string
          score: number
        }[]
      }
      search_schools_me: {
        Args: { _limit?: number; _offset?: number; _q?: string }
        Returns: {
          id: string
          name: string
          score: number
        }[]
      }
      search_students:
        | {
            Args: { _limit?: number; _q: string; _school: string }
            Returns: {
              code: string
              full_name: string
              id: string
              score: number
            }[]
          }
        | {
            Args: {
              _limit?: number
              _offset?: number
              _q?: string
              _school: string
              _uid: string
            }
            Returns: {
              code: string
              full_name: string
              id: string
              school_id: string
              score: number
            }[]
          }
        | {
            Args: {
              _actor_id: string
              _limit: number
              _offset: number
              _q: string
            }
            Returns: {
              class_id: string | null
              code: string | null
              code_norm: string | null
              created_at: string | null
              created_by: string | null
              deleted_at: string | null
              first_name: string | null
              full_name: string
              id: string
              is_live: boolean | null
              last_name: string | null
              revision: number
              risk_level: string | null
              risk_notes: string | null
              risk_updated_at: string | null
              school_id: string
              search_tsv: unknown
              updated_at: string | null
              updated_by: string | null
            }[]
            SetofOptions: {
              from: "*"
              to: "students"
              isOneToOne: false
              isSetofReturn: true
            }
          }
      search_students_me: {
        Args: {
          _limit?: number
          _offset?: number
          _q?: string
          _school?: string
        }
        Returns: {
          code: string
          full_name: string
          id: string
          school_id: string
          score: number
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      soft_delete_class: { Args: { _id: string }; Returns: undefined }
      soft_delete_school: { Args: { _id: string }; Returns: undefined }
      soft_delete_student: { Args: { _id: string }; Returns: undefined }
      teaches_student: { Args: { target_student: string }; Returns: boolean }
      try_uuid: { Args: { p: string }; Returns: string }
      unaccent: { Args: { "": string }; Returns: string }
      unaccent_imm: { Args: { "": string }; Returns: string }
      window_start: { Args: { p_days?: number }; Returns: string }
    }
    Enums: {
      role_user: "admin" | "teacher" | "sub" | "guardian" | "student" | "parent"
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
      role_user: ["admin", "teacher", "sub", "guardian", "student", "parent"],
    },
  },
} as const
