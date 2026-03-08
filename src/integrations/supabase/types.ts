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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          created_at: string
          description: string
          exercise: string | null
          icon: string | null
          id: string
          title: string
          type: string
          unlocked_at: string
          user_id: string
          value: number | null
        }
        Insert: {
          created_at?: string
          description: string
          exercise?: string | null
          icon?: string | null
          id?: string
          title: string
          type: string
          unlocked_at?: string
          user_id: string
          value?: number | null
        }
        Update: {
          created_at?: string
          description?: string
          exercise?: string | null
          icon?: string | null
          id?: string
          title?: string
          type?: string
          unlocked_at?: string
          user_id?: string
          value?: number | null
        }
        Relationships: []
      }
      ai_recommendations: {
        Row: {
          created_at: string
          description: string
          exercise: string | null
          id: string
          status: string
          suggested_change: Json | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          exercise?: string | null
          id?: string
          status?: string
          suggested_change?: Json | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          exercise?: string | null
          id?: string
          status?: string
          suggested_change?: Json | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      current_lifts: {
        Row: {
          created_at: string
          exercise: string
          id: string
          is_pr: boolean | null
          recorded_at: string
          reps: number
          user_id: string
          weight: number
        }
        Insert: {
          created_at?: string
          exercise: string
          id?: string
          is_pr?: boolean | null
          recorded_at?: string
          reps?: number
          user_id: string
          weight: number
        }
        Update: {
          created_at?: string
          exercise?: string
          id?: string
          is_pr?: boolean | null
          recorded_at?: string
          reps?: number
          user_id?: string
          weight?: number
        }
        Relationships: []
      }
      exercises: {
        Row: {
          common_mistakes: string | null
          created_at: string
          id: string
          instructions: string | null
          movement_pattern: string | null
          name: string
          primary_muscle: string
          video_url: string | null
        }
        Insert: {
          common_mistakes?: string | null
          created_at?: string
          id?: string
          instructions?: string | null
          movement_pattern?: string | null
          name: string
          primary_muscle: string
          video_url?: string | null
        }
        Update: {
          common_mistakes?: string | null
          created_at?: string
          id?: string
          instructions?: string | null
          movement_pattern?: string | null
          name?: string
          primary_muscle?: string
          video_url?: string | null
        }
        Relationships: []
      }
      performed_sets: {
        Row: {
          completed: boolean
          created_at: string
          estimated_1rm: number | null
          exercise_name: string
          id: string
          planned_set_id: string | null
          reps_completed: number | null
          rir_reported: number | null
          set_number: number
          user_id: string
          weight_used: number | null
          workout_log_id: string | null
        }
        Insert: {
          completed?: boolean
          created_at?: string
          estimated_1rm?: number | null
          exercise_name: string
          id?: string
          planned_set_id?: string | null
          reps_completed?: number | null
          rir_reported?: number | null
          set_number?: number
          user_id: string
          weight_used?: number | null
          workout_log_id?: string | null
        }
        Update: {
          completed?: boolean
          created_at?: string
          estimated_1rm?: number | null
          exercise_name?: string
          id?: string
          planned_set_id?: string | null
          reps_completed?: number | null
          rir_reported?: number | null
          set_number?: number
          user_id?: string
          weight_used?: number | null
          workout_log_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "performed_sets_planned_set_id_fkey"
            columns: ["planned_set_id"]
            isOneToOne: false
            referencedRelation: "planned_sets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performed_sets_workout_log_id_fkey"
            columns: ["workout_log_id"]
            isOneToOne: false
            referencedRelation: "workout_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      personal_records: {
        Row: {
          created_at: string
          estimated_1rm: number
          exercise_name: string
          id: string
          pr_type: string
          recorded_at: string
          reps: number
          user_id: string
          weight: number
        }
        Insert: {
          created_at?: string
          estimated_1rm: number
          exercise_name: string
          id?: string
          pr_type?: string
          recorded_at?: string
          reps?: number
          user_id: string
          weight: number
        }
        Update: {
          created_at?: string
          estimated_1rm?: number
          exercise_name?: string
          id?: string
          pr_type?: string
          recorded_at?: string
          reps?: number
          user_id?: string
          weight?: number
        }
        Relationships: []
      }
      planned_sets: {
        Row: {
          created_at: string
          id: string
          is_backoff: boolean
          is_top_set: boolean
          load_percentage: number | null
          notes: string | null
          rest_seconds: number | null
          set_number: number
          target_reps: number
          target_rir: number | null
          target_sets: number
          target_weight: number | null
          workout_exercise_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_backoff?: boolean
          is_top_set?: boolean
          load_percentage?: number | null
          notes?: string | null
          rest_seconds?: number | null
          set_number?: number
          target_reps: number
          target_rir?: number | null
          target_sets?: number
          target_weight?: number | null
          workout_exercise_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_backoff?: boolean
          is_top_set?: boolean
          load_percentage?: number | null
          notes?: string | null
          rest_seconds?: number | null
          set_number?: number
          target_reps?: number
          target_rir?: number | null
          target_sets?: number
          target_weight?: number | null
          workout_exercise_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "planned_sets_workout_exercise_id_fkey"
            columns: ["workout_exercise_id"]
            isOneToOne: false
            referencedRelation: "workout_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          body_weight: number | null
          created_at: string
          display_name: string | null
          email: string | null
          goals: string | null
          id: string
          target_bench: string | null
          target_deadlift: string | null
          target_squat: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          body_weight?: number | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          goals?: string | null
          id?: string
          target_bench?: string | null
          target_deadlift?: string | null
          target_squat?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          body_weight?: number | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          goals?: string | null
          id?: string
          target_bench?: string | null
          target_deadlift?: string | null
          target_squat?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      set_logs: {
        Row: {
          actual_reps: number | null
          actual_rir: number | null
          actual_weight: number | null
          completed: boolean | null
          created_at: string
          exercise_name: string
          id: string
          notes: string | null
          set_number: number
          set_type: string
          target_reps: number | null
          target_rir: number | null
          target_weight: number | null
          user_id: string
          workout_log_id: string
        }
        Insert: {
          actual_reps?: number | null
          actual_rir?: number | null
          actual_weight?: number | null
          completed?: boolean | null
          created_at?: string
          exercise_name: string
          id?: string
          notes?: string | null
          set_number: number
          set_type?: string
          target_reps?: number | null
          target_rir?: number | null
          target_weight?: number | null
          user_id: string
          workout_log_id: string
        }
        Update: {
          actual_reps?: number | null
          actual_rir?: number | null
          actual_weight?: number | null
          completed?: boolean | null
          created_at?: string
          exercise_name?: string
          id?: string
          notes?: string | null
          set_number?: number
          set_type?: string
          target_reps?: number | null
          target_rir?: number | null
          target_weight?: number | null
          user_id?: string
          workout_log_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "set_logs_workout_log_id_fkey"
            columns: ["workout_log_id"]
            isOneToOne: false
            referencedRelation: "workout_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      training_blocks: {
        Row: {
          block_type: string
          created_at: string
          end_week: number
          goal: string | null
          id: string
          name: string
          order_index: number
          program_id: string
          start_week: number
        }
        Insert: {
          block_type?: string
          created_at?: string
          end_week: number
          goal?: string | null
          id?: string
          name: string
          order_index?: number
          program_id: string
          start_week: number
        }
        Update: {
          block_type?: string
          created_at?: string
          end_week?: number
          goal?: string | null
          id?: string
          name?: string
          order_index?: number
          program_id?: string
          start_week?: number
        }
        Relationships: [
          {
            foreignKeyName: "training_blocks_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "training_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      training_days: {
        Row: {
          created_at: string
          day_name: string
          day_of_week: string | null
          focus: string | null
          id: string
          order_index: number
          week_id: string
        }
        Insert: {
          created_at?: string
          day_name: string
          day_of_week?: string | null
          focus?: string | null
          id?: string
          order_index?: number
          week_id: string
        }
        Update: {
          created_at?: string
          day_name?: string
          day_of_week?: string | null
          focus?: string | null
          id?: string
          order_index?: number
          week_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_days_week_id_fkey"
            columns: ["week_id"]
            isOneToOne: false
            referencedRelation: "training_weeks"
            referencedColumns: ["id"]
          },
        ]
      }
      training_programs: {
        Row: {
          created_at: string
          days_per_week: number
          description: string | null
          duration_weeks: number
          id: string
          is_active: boolean
          name: string
          program_type: string
          start_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          days_per_week?: number
          description?: string | null
          duration_weeks?: number
          id?: string
          is_active?: boolean
          name: string
          program_type?: string
          start_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          days_per_week?: number
          description?: string | null
          duration_weeks?: number
          id?: string
          is_active?: boolean
          name?: string
          program_type?: string
          start_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      training_weeks: {
        Row: {
          block_id: string
          created_at: string
          id: string
          week_number: number
        }
        Insert: {
          block_id: string
          created_at?: string
          id?: string
          week_number: number
        }
        Update: {
          block_id?: string
          created_at?: string
          id?: string
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "training_weeks_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "training_blocks"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_exercises: {
        Row: {
          category: string
          created_at: string
          day_id: string
          exercise_id: string | null
          exercise_name: string
          id: string
          muscle_group: string | null
          order_index: number
        }
        Insert: {
          category?: string
          created_at?: string
          day_id: string
          exercise_id?: string | null
          exercise_name: string
          id?: string
          muscle_group?: string | null
          order_index?: number
        }
        Update: {
          category?: string
          created_at?: string
          day_id?: string
          exercise_id?: string | null
          exercise_name?: string
          id?: string
          muscle_group?: string | null
          order_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "workout_exercises_day_id_fkey"
            columns: ["day_id"]
            isOneToOne: false
            referencedRelation: "training_days"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_logs: {
        Row: {
          body_weight: number | null
          completed_at: string | null
          created_at: string
          day_index: number
          day_name: string
          fatigue: number | null
          id: string
          notes: string | null
          program_week: number
          started_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          body_weight?: number | null
          completed_at?: string | null
          created_at?: string
          day_index: number
          day_name: string
          fatigue?: number | null
          id?: string
          notes?: string | null
          program_week: number
          started_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          body_weight?: number | null
          completed_at?: string | null
          created_at?: string
          day_index?: number
          day_name?: string
          fatigue?: number | null
          id?: string
          notes?: string | null
          program_week?: number
          started_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      workout_notes: {
        Row: {
          body_weight: number | null
          created_at: string
          fatigue_level: number | null
          id: string
          notes: string | null
          user_id: string
          workout_log_id: string | null
        }
        Insert: {
          body_weight?: number | null
          created_at?: string
          fatigue_level?: number | null
          id?: string
          notes?: string | null
          user_id: string
          workout_log_id?: string | null
        }
        Update: {
          body_weight?: number | null
          created_at?: string
          fatigue_level?: number | null
          id?: string
          notes?: string | null
          user_id?: string
          workout_log_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_notes_workout_log_id_fkey"
            columns: ["workout_log_id"]
            isOneToOne: false
            referencedRelation: "workout_logs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_leaderboard: {
        Args: {
          lift_name: string
          weight_class_max?: number
          weight_class_min?: number
        }
        Returns: {
          body_weight: number
          display_name: string
          estimated_1rm: number
          exercise: string
          recorded_at: string
          reps: number
          weight: number
        }[]
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
