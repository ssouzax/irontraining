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
      achievement_levels: {
        Row: {
          achievement_key: string
          category: string
          created_at: string
          description: string
          icon: string | null
          id: string
          is_seasonal: boolean
          is_secret: boolean
          level_name: string
          level_number: number
          parent_achievement_key: string | null
          rarity: string
          requirement_type: string
          requirement_value: number
          season_id: number | null
          title: string
          total_users: number
          tree_id: string | null
          tree_order: number | null
          unlock_count: number
        }
        Insert: {
          achievement_key: string
          category?: string
          created_at?: string
          description: string
          icon?: string | null
          id?: string
          is_seasonal?: boolean
          is_secret?: boolean
          level_name: string
          level_number?: number
          parent_achievement_key?: string | null
          rarity?: string
          requirement_type: string
          requirement_value: number
          season_id?: number | null
          title: string
          total_users?: number
          tree_id?: string | null
          tree_order?: number | null
          unlock_count?: number
        }
        Update: {
          achievement_key?: string
          category?: string
          created_at?: string
          description?: string
          icon?: string | null
          id?: string
          is_seasonal?: boolean
          is_secret?: boolean
          level_name?: string
          level_number?: number
          parent_achievement_key?: string | null
          rarity?: string
          requirement_type?: string
          requirement_value?: number
          season_id?: number | null
          title?: string
          total_users?: number
          tree_id?: string | null
          tree_order?: number | null
          unlock_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "achievement_levels_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
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
      avatar_config: {
        Row: {
          animation_type: string | null
          avatar_tier: string
          badge_overlay: string | null
          frame_style: string | null
          glow_color: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          animation_type?: string | null
          avatar_tier?: string
          badge_overlay?: string | null
          frame_style?: string | null
          glow_color?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          animation_type?: string | null
          avatar_tier?: string
          badge_overlay?: string | null
          frame_style?: string | null
          glow_color?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bar_velocity_logs: {
        Row: {
          created_at: string
          estimated_rir: number | null
          exercise_name: string
          id: string
          mean_velocity: number
          peak_velocity: number
          power_output: number
          reps: number
          rom_percentage: number
          session_date: string
          set_number: number
          time_under_tension: number
          user_id: string
          weight: number
        }
        Insert: {
          created_at?: string
          estimated_rir?: number | null
          exercise_name: string
          id?: string
          mean_velocity?: number
          peak_velocity?: number
          power_output?: number
          reps?: number
          rom_percentage?: number
          session_date?: string
          set_number?: number
          time_under_tension?: number
          user_id: string
          weight?: number
        }
        Update: {
          created_at?: string
          estimated_rir?: number | null
          exercise_name?: string
          id?: string
          mean_velocity?: number
          peak_velocity?: number
          power_output?: number
          reps?: number
          rom_percentage?: number
          session_date?: string
          set_number?: number
          time_under_tension?: number
          user_id?: string
          weight?: number
        }
        Relationships: []
      }
      brands: {
        Row: {
          category: string | null
          contact_email: string | null
          contact_name: string | null
          contact_whatsapp: string | null
          created_at: string
          deal_description: string | null
          deal_type: string | null
          deal_value_cents: number | null
          id: string
          logo_url: string | null
          name: string
          notes: string | null
          status: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          category?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_whatsapp?: string | null
          created_at?: string
          deal_description?: string | null
          deal_type?: string | null
          deal_value_cents?: number | null
          id?: string
          logo_url?: string | null
          name: string
          notes?: string | null
          status?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          category?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_whatsapp?: string | null
          created_at?: string
          deal_description?: string | null
          deal_type?: string | null
          deal_value_cents?: number | null
          id?: string
          logo_url?: string | null
          name?: string
          notes?: string | null
          status?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      challenge_entries: {
        Row: {
          challenge_id: string
          created_at: string
          id: string
          user_id: string
          value: number
        }
        Insert: {
          challenge_id: string
          created_at?: string
          id?: string
          user_id: string
          value?: number
        }
        Update: {
          challenge_id?: string
          created_at?: string
          id?: string
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "challenge_entries_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "daily_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      city_strength_metrics: {
        Row: {
          city: string
          country: string | null
          date: string
          id: string
          intensity_score: number
          pr_count: number
          top_lift: number
          top_lift_type: string | null
          total_volume: number
        }
        Insert: {
          city: string
          country?: string | null
          date?: string
          id?: string
          intensity_score?: number
          pr_count?: number
          top_lift?: number
          top_lift_type?: string | null
          total_volume?: number
        }
        Update: {
          city?: string
          country?: string | null
          date?: string
          id?: string
          intensity_score?: number
          pr_count?: number
          top_lift?: number
          top_lift_type?: string | null
          total_volume?: number
        }
        Relationships: []
      }
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          parent_comment_id: string | null
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          parent_comment_id?: string | null
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          parent_comment_id?: string | null
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      content_purchases: {
        Row: {
          content_id: string
          id: string
          price_cents: number
          purchased_at: string
          user_id: string
        }
        Insert: {
          content_id: string
          id?: string
          price_cents?: number
          purchased_at?: string
          user_id: string
        }
        Update: {
          content_id?: string
          id?: string
          price_cents?: number
          purchased_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_purchases_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "premium_content"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          id: string
          last_read_at: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          last_read_at?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          last_read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
        }
        Insert: {
          created_at?: string
          id?: string
        }
        Update: {
          created_at?: string
          id?: string
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
      daily_challenges: {
        Row: {
          challenge_date: string
          challenge_type: string
          created_at: string
          exercise_name: string
          gym_id: string | null
          id: string
        }
        Insert: {
          challenge_date?: string
          challenge_type?: string
          created_at?: string
          exercise_name: string
          gym_id?: string | null
          id?: string
        }
        Update: {
          challenge_date?: string
          challenge_type?: string
          created_at?: string
          exercise_name?: string
          gym_id?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_challenges_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_goals: {
        Row: {
          completed: boolean
          created_at: string
          current_value: number
          exercise_name: string | null
          goal_date: string
          goal_type: string
          id: string
          target_unit: string
          target_value: number
          user_id: string
          xp_reward: number
        }
        Insert: {
          completed?: boolean
          created_at?: string
          current_value?: number
          exercise_name?: string | null
          goal_date?: string
          goal_type?: string
          id?: string
          target_unit?: string
          target_value?: number
          user_id: string
          xp_reward?: number
        }
        Update: {
          completed?: boolean
          created_at?: string
          current_value?: number
          exercise_name?: string | null
          goal_date?: string
          goal_type?: string
          id?: string
          target_unit?: string
          target_value?: number
          user_id?: string
          xp_reward?: number
        }
        Relationships: []
      }
      diet_profiles: {
        Row: {
          activity_level: string | null
          age: number | null
          arm_cm: number | null
          chest_cm: number | null
          created_at: string
          diet_restrictions: string | null
          foods_at_home: string | null
          foods_easy_to_buy: string | null
          goal: string | null
          health_conditions: string | null
          height_cm: number | null
          hip_cm: number | null
          id: string
          meals_per_day: number | null
          supplement_notes: string | null
          thigh_cm: number | null
          updated_at: string
          user_id: string
          uses_supplements: boolean | null
          waist_cm: number | null
          water_liters_per_day: number | null
          weight_kg: number | null
        }
        Insert: {
          activity_level?: string | null
          age?: number | null
          arm_cm?: number | null
          chest_cm?: number | null
          created_at?: string
          diet_restrictions?: string | null
          foods_at_home?: string | null
          foods_easy_to_buy?: string | null
          goal?: string | null
          health_conditions?: string | null
          height_cm?: number | null
          hip_cm?: number | null
          id?: string
          meals_per_day?: number | null
          supplement_notes?: string | null
          thigh_cm?: number | null
          updated_at?: string
          user_id: string
          uses_supplements?: boolean | null
          waist_cm?: number | null
          water_liters_per_day?: number | null
          weight_kg?: number | null
        }
        Update: {
          activity_level?: string | null
          age?: number | null
          arm_cm?: number | null
          chest_cm?: number | null
          created_at?: string
          diet_restrictions?: string | null
          foods_at_home?: string | null
          foods_easy_to_buy?: string | null
          goal?: string | null
          health_conditions?: string | null
          height_cm?: number | null
          hip_cm?: number | null
          id?: string
          meals_per_day?: number | null
          supplement_notes?: string | null
          thigh_cm?: number | null
          updated_at?: string
          user_id?: string
          uses_supplements?: boolean | null
          waist_cm?: number | null
          water_liters_per_day?: number | null
          weight_kg?: number | null
        }
        Relationships: []
      }
      event_participation: {
        Row: {
          challenges_completed: number
          event_id: string
          id: string
          joined_at: string
          points_earned: number
          user_id: string
        }
        Insert: {
          challenges_completed?: number
          event_id: string
          id?: string
          joined_at?: string
          points_earned?: number
          user_id: string
        }
        Update: {
          challenges_completed?: number
          event_id?: string
          id?: string
          joined_at?: string
          points_earned?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_participation_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "seasonal_events"
            referencedColumns: ["id"]
          },
        ]
      }
      execution_grades: {
        Row: {
          created_at: string
          exercise_name: string
          grade: string
          grade_score: number
          id: string
          notes: string | null
          posture_score: number | null
          rom_score: number | null
          session_date: string
          set_number: number
          stability_score: number | null
          tempo_score: number | null
          user_id: string
          xp_bonus: number
        }
        Insert: {
          created_at?: string
          exercise_name: string
          grade?: string
          grade_score?: number
          id?: string
          notes?: string | null
          posture_score?: number | null
          rom_score?: number | null
          session_date?: string
          set_number?: number
          stability_score?: number | null
          tempo_score?: number | null
          user_id: string
          xp_bonus?: number
        }
        Update: {
          created_at?: string
          exercise_name?: string
          grade?: string
          grade_score?: number
          id?: string
          notes?: string | null
          posture_score?: number | null
          rom_score?: number | null
          session_date?: string
          set_number?: number
          stability_score?: number | null
          tempo_score?: number | null
          user_id?: string
          xp_bonus?: number
        }
        Relationships: []
      }
      exercise_rankings: {
        Row: {
          bodyweight: number
          created_at: string
          dots_score: number
          estimated_1rm: number
          exercise_name: string
          gym_id: string | null
          id: string
          reps: number
          updated_at: string
          user_id: string
          weight: number
        }
        Insert: {
          bodyweight?: number
          created_at?: string
          dots_score?: number
          estimated_1rm?: number
          exercise_name: string
          gym_id?: string | null
          id?: string
          reps?: number
          updated_at?: string
          user_id: string
          weight?: number
        }
        Update: {
          bodyweight?: number
          created_at?: string
          dots_score?: number
          estimated_1rm?: number
          exercise_name?: string
          gym_id?: string | null
          id?: string
          reps?: number
          updated_at?: string
          user_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "exercise_rankings_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
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
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          avatar_url: string | null
          cover_url: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_private: boolean
          member_count: number
          name: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          cover_url?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_private?: boolean
          member_count?: number
          name: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          cover_url?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_private?: boolean
          member_count?: number
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      gym_business_plans: {
        Row: {
          created_at: string
          description: string | null
          features: Json
          id: string
          is_active: boolean
          name: string
          price_cents: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          features?: Json
          id: string
          is_active?: boolean
          name: string
          price_cents?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          features?: Json
          id?: string
          is_active?: boolean
          name?: string
          price_cents?: number
        }
        Relationships: []
      }
      gym_checkins: {
        Row: {
          checked_in_at: string
          gym_id: string
          id: string
          streak_day: number
          user_id: string
          xp_awarded: number
        }
        Insert: {
          checked_in_at?: string
          gym_id: string
          id?: string
          streak_day?: number
          user_id: string
          xp_awarded?: number
        }
        Update: {
          checked_in_at?: string
          gym_id?: string
          id?: string
          streak_day?: number
          user_id?: string
          xp_awarded?: number
        }
        Relationships: [
          {
            foreignKeyName: "gym_checkins_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      gym_classes: {
        Row: {
          created_at: string
          description: string
          icon: string
          id: string
          key_metrics: string[]
          name: string
        }
        Insert: {
          created_at?: string
          description: string
          icon?: string
          id: string
          key_metrics?: string[]
          name: string
        }
        Update: {
          created_at?: string
          description?: string
          icon?: string
          id?: string
          key_metrics?: string[]
          name?: string
        }
        Relationships: []
      }
      gym_heatmap_metrics: {
        Row: {
          daily_pr_count: number
          daily_volume: number
          date: string
          gym_id: string
          id: string
          intensity_score: number
          top_bench: number
          top_deadlift: number
          top_squat: number
          top_total: number
        }
        Insert: {
          daily_pr_count?: number
          daily_volume?: number
          date?: string
          gym_id: string
          id?: string
          intensity_score?: number
          top_bench?: number
          top_deadlift?: number
          top_squat?: number
          top_total?: number
        }
        Update: {
          daily_pr_count?: number
          daily_volume?: number
          date?: string
          gym_id?: string
          id?: string
          intensity_score?: number
          top_bench?: number
          top_deadlift?: number
          top_squat?: number
          top_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "gym_heatmap_metrics_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      gym_leaderboards: {
        Row: {
          bodyweight: number
          dots_score: number
          estimated_1rm: number
          exercise_type: string
          gym_id: string
          id: string
          relative_strength: number | null
          updated_at: string
          user_id: string
          weight_lifted: number
        }
        Insert: {
          bodyweight?: number
          dots_score?: number
          estimated_1rm?: number
          exercise_type: string
          gym_id: string
          id?: string
          relative_strength?: number | null
          updated_at?: string
          user_id: string
          weight_lifted?: number
        }
        Update: {
          bodyweight?: number
          dots_score?: number
          estimated_1rm?: number
          exercise_type?: string
          gym_id?: string
          id?: string
          relative_strength?: number | null
          updated_at?: string
          user_id?: string
          weight_lifted?: number
        }
        Relationships: [
          {
            foreignKeyName: "gym_leaderboards_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      gym_live_activity: {
        Row: {
          activity_type: string
          created_at: string
          estimated_1rm: number
          exercise_name: string
          gym_id: string
          id: string
          message: string | null
          reps: number
          user_id: string
          weight: number
        }
        Insert: {
          activity_type?: string
          created_at?: string
          estimated_1rm?: number
          exercise_name: string
          gym_id: string
          id?: string
          message?: string | null
          reps?: number
          user_id: string
          weight?: number
        }
        Update: {
          activity_type?: string
          created_at?: string
          estimated_1rm?: number
          exercise_name?: string
          gym_id?: string
          id?: string
          message?: string | null
          reps?: number
          user_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "gym_live_activity_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      gym_members: {
        Row: {
          gym_id: string
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          gym_id: string
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          gym_id?: string
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gym_members_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      gym_points_log: {
        Row: {
          created_at: string
          gym_id: string
          id: string
          points: number
          reason: string
          user_id: string
        }
        Insert: {
          created_at?: string
          gym_id: string
          id?: string
          points?: number
          reason: string
          user_id: string
        }
        Update: {
          created_at?: string
          gym_id?: string
          id?: string
          points?: number
          reason?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gym_points_log_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      gym_promo_plans: {
        Row: {
          contact_email: string | null
          contact_name: string | null
          contact_whatsapp: string | null
          created_at: string
          description: string | null
          gym_id: string | null
          gym_name: string
          id: string
          monthly_value_cents: number | null
          notes: string | null
          plan_type: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          contact_email?: string | null
          contact_name?: string | null
          contact_whatsapp?: string | null
          created_at?: string
          description?: string | null
          gym_id?: string | null
          gym_name: string
          id?: string
          monthly_value_cents?: number | null
          notes?: string | null
          plan_type?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          contact_email?: string | null
          contact_name?: string | null
          contact_whatsapp?: string | null
          created_at?: string
          description?: string | null
          gym_id?: string | null
          gym_name?: string
          id?: string
          monthly_value_cents?: number | null
          notes?: string | null
          plan_type?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gym_promo_plans_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      gym_subscriptions: {
        Row: {
          created_at: string
          expires_at: string | null
          gym_id: string
          id: string
          plan_id: string
          started_at: string
          status: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          gym_id: string
          id?: string
          plan_id: string
          started_at?: string
          status?: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          gym_id?: string
          id?: string
          plan_id?: string
          started_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "gym_subscriptions_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gym_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "gym_business_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      gym_weekly_challenges: {
        Row: {
          bonus_awarded: boolean
          created_at: string
          gym_id: string
          id: string
          total_checkins: number
          week_end: string
          week_start: string
        }
        Insert: {
          bonus_awarded?: boolean
          created_at?: string
          gym_id: string
          id?: string
          total_checkins?: number
          week_end: string
          week_start: string
        }
        Update: {
          bonus_awarded?: boolean
          created_at?: string
          gym_id?: string
          id?: string
          total_checkins?: number
          week_end?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "gym_weekly_challenges_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      gyms: {
        Row: {
          address: string | null
          chain: string | null
          city: string | null
          country: string | null
          created_at: string
          created_by: string | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          tier: string
          total_points: number
          verified: boolean
        }
        Insert: {
          address?: string | null
          chain?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          tier?: string
          total_points?: number
          verified?: boolean
        }
        Update: {
          address?: string | null
          chain?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          tier?: string
          total_points?: number
          verified?: boolean
        }
        Relationships: []
      }
      influencer_coupons: {
        Row: {
          code: string
          created_at: string | null
          discount_percent: number | null
          expires_at: string | null
          id: string
          influencer_id: string
          is_active: boolean | null
          max_uses: number | null
          times_used: number | null
        }
        Insert: {
          code: string
          created_at?: string | null
          discount_percent?: number | null
          expires_at?: string | null
          id?: string
          influencer_id: string
          is_active?: boolean | null
          max_uses?: number | null
          times_used?: number | null
        }
        Update: {
          code?: string
          created_at?: string | null
          discount_percent?: number | null
          expires_at?: string | null
          id?: string
          influencer_id?: string
          is_active?: boolean | null
          max_uses?: number | null
          times_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "influencer_coupons_influencer_id_fkey"
            columns: ["influencer_id"]
            isOneToOne: false
            referencedRelation: "influencers"
            referencedColumns: ["id"]
          },
        ]
      }
      influencer_payouts: {
        Row: {
          amount_cents: number
          created_at: string | null
          id: string
          influencer_id: string
          paid_at: string | null
          period_end: string
          period_start: string
          status: string | null
        }
        Insert: {
          amount_cents: number
          created_at?: string | null
          id?: string
          influencer_id: string
          paid_at?: string | null
          period_end: string
          period_start: string
          status?: string | null
        }
        Update: {
          amount_cents?: number
          created_at?: string | null
          id?: string
          influencer_id?: string
          paid_at?: string | null
          period_end?: string
          period_start?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "influencer_payouts_influencer_id_fkey"
            columns: ["influencer_id"]
            isOneToOne: false
            referencedRelation: "influencers"
            referencedColumns: ["id"]
          },
        ]
      }
      influencer_referrals: {
        Row: {
          commission_cents: number | null
          commission_paid: boolean | null
          coupon_id: string | null
          created_at: string | null
          id: string
          influencer_id: string
          referred_user_id: string
          status: string | null
        }
        Insert: {
          commission_cents?: number | null
          commission_paid?: boolean | null
          coupon_id?: string | null
          created_at?: string | null
          id?: string
          influencer_id: string
          referred_user_id: string
          status?: string | null
        }
        Update: {
          commission_cents?: number | null
          commission_paid?: boolean | null
          coupon_id?: string | null
          created_at?: string | null
          id?: string
          influencer_id?: string
          referred_user_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "influencer_referrals_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "influencer_coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "influencer_referrals_influencer_id_fkey"
            columns: ["influencer_id"]
            isOneToOne: false
            referencedRelation: "influencers"
            referencedColumns: ["id"]
          },
        ]
      }
      influencers: {
        Row: {
          avatar_url: string | null
          commission_rate: number | null
          created_at: string
          deal_type: string | null
          email: string | null
          followers_count: number | null
          id: string
          instagram_handle: string | null
          is_verified: boolean | null
          kiwify_affiliate_id: string | null
          name: string
          niche: string | null
          notes: string | null
          referral_code: string | null
          status: string | null
          tiktok_handle: string | null
          total_referrals: number | null
          total_revenue_cents: number | null
          updated_at: string
          user_id: string | null
          whatsapp: string | null
          youtube_handle: string | null
        }
        Insert: {
          avatar_url?: string | null
          commission_rate?: number | null
          created_at?: string
          deal_type?: string | null
          email?: string | null
          followers_count?: number | null
          id?: string
          instagram_handle?: string | null
          is_verified?: boolean | null
          kiwify_affiliate_id?: string | null
          name: string
          niche?: string | null
          notes?: string | null
          referral_code?: string | null
          status?: string | null
          tiktok_handle?: string | null
          total_referrals?: number | null
          total_revenue_cents?: number | null
          updated_at?: string
          user_id?: string | null
          whatsapp?: string | null
          youtube_handle?: string | null
        }
        Update: {
          avatar_url?: string | null
          commission_rate?: number | null
          created_at?: string
          deal_type?: string | null
          email?: string | null
          followers_count?: number | null
          id?: string
          instagram_handle?: string | null
          is_verified?: boolean | null
          kiwify_affiliate_id?: string | null
          name?: string
          niche?: string | null
          notes?: string | null
          referral_code?: string | null
          status?: string | null
          tiktok_handle?: string | null
          total_referrals?: number | null
          total_revenue_cents?: number | null
          updated_at?: string
          user_id?: string | null
          whatsapp?: string | null
          youtube_handle?: string | null
        }
        Relationships: []
      }
      leaderboard_scores: {
        Row: {
          bench_pr: number | null
          bodyweight: number | null
          deadlift_pr: number | null
          dots_score: number | null
          id: string
          league: string | null
          league_points: number | null
          season: number | null
          squat_pr: number | null
          total: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bench_pr?: number | null
          bodyweight?: number | null
          deadlift_pr?: number | null
          dots_score?: number | null
          id?: string
          league?: string | null
          league_points?: number | null
          season?: number | null
          squat_pr?: number | null
          total?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bench_pr?: number | null
          bodyweight?: number | null
          deadlift_pr?: number | null
          dots_score?: number | null
          id?: string
          league?: string | null
          league_points?: number | null
          season?: number | null
          squat_pr?: number | null
          total?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string | null
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean
          media_type: string | null
          media_url: string | null
          sender_id: string
        }
        Insert: {
          content?: string | null
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          media_type?: string | null
          media_url?: string | null
          sender_id: string
        }
        Update: {
          content?: string | null
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          media_type?: string | null
          media_url?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_logs: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          gym_id: string | null
          id: string
          metadata: Json | null
          payment_type: string
          reference_id: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          amount_cents: number
          created_at?: string
          currency?: string
          gym_id?: string | null
          id?: string
          metadata?: Json | null
          payment_type: string
          reference_id?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          gym_id?: string | null
          id?: string
          metadata?: Json | null
          payment_type?: string
          reference_id?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_logs_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
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
      player_levels: {
        Row: {
          daily_xp: number
          id: string
          last_xp_date: string | null
          lifetime_xp: number
          player_level: number
          title: string | null
          total_xp: number
          updated_at: string
          user_id: string
        }
        Insert: {
          daily_xp?: number
          id?: string
          last_xp_date?: string | null
          lifetime_xp?: number
          player_level?: number
          title?: string | null
          total_xp?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          daily_xp?: number
          id?: string
          last_xp_date?: string | null
          lifetime_xp?: number
          player_level?: number
          title?: string | null
          total_xp?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      post_engagement: {
        Row: {
          boost_multiplier: number
          engagement_score: number
          id: string
          is_trending: boolean
          post_id: string
          updated_at: string
        }
        Insert: {
          boost_multiplier?: number
          engagement_score?: number
          id?: string
          is_trending?: boolean
          post_id: string
          updated_at?: string
        }
        Update: {
          boost_multiplier?: number
          engagement_score?: number
          id?: string
          is_trending?: boolean
          post_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_engagement_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: true
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          caption: string | null
          comments_count: number | null
          created_at: string
          estimated_1rm: number | null
          exercise_name: string | null
          id: string
          is_pr: boolean | null
          likes_count: number | null
          location: string | null
          media_type: string | null
          media_urls: string[] | null
          post_type: string
          reps: number | null
          user_id: string
          weight: number | null
          workout_log_id: string | null
        }
        Insert: {
          caption?: string | null
          comments_count?: number | null
          created_at?: string
          estimated_1rm?: number | null
          exercise_name?: string | null
          id?: string
          is_pr?: boolean | null
          likes_count?: number | null
          location?: string | null
          media_type?: string | null
          media_urls?: string[] | null
          post_type?: string
          reps?: number | null
          user_id: string
          weight?: number | null
          workout_log_id?: string | null
        }
        Update: {
          caption?: string | null
          comments_count?: number | null
          created_at?: string
          estimated_1rm?: number | null
          exercise_name?: string | null
          id?: string
          is_pr?: boolean | null
          likes_count?: number | null
          location?: string | null
          media_type?: string | null
          media_urls?: string[] | null
          post_type?: string
          reps?: number | null
          user_id?: string
          weight?: number | null
          workout_log_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_workout_log_id_fkey"
            columns: ["workout_log_id"]
            isOneToOne: false
            referencedRelation: "workout_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      power_scores: {
        Row: {
          consistency_component: number
          dots_component: number
          id: string
          last_updated: string
          power_score: number
          pr_frequency_component: number
          user_id: string
          volume_component: number
        }
        Insert: {
          consistency_component?: number
          dots_component?: number
          id?: string
          last_updated?: string
          power_score?: number
          pr_frequency_component?: number
          user_id: string
          volume_component?: number
        }
        Update: {
          consistency_component?: number
          dots_component?: number
          id?: string
          last_updated?: string
          power_score?: number
          pr_frequency_component?: number
          user_id?: string
          volume_component?: number
        }
        Relationships: []
      }
      premium_content: {
        Row: {
          author_name: string | null
          category: string
          content_type: string
          content_url: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          min_tier: string
          price_cents: number | null
          thumbnail_url: string | null
          title: string
        }
        Insert: {
          author_name?: string | null
          category?: string
          content_type?: string
          content_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          min_tier?: string
          price_cents?: number | null
          thumbnail_url?: string | null
          title: string
        }
        Update: {
          author_name?: string | null
          category?: string
          content_type?: string
          content_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          min_tier?: string
          price_cents?: number | null
          thumbnail_url?: string | null
          title?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          body_weight: number | null
          coach_personality: string | null
          cover_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          followers_count: number | null
          following_count: number | null
          goals: string | null
          gym_class: string | null
          gym_id: string | null
          gym_visibility: string | null
          id: string
          instagram_url: string | null
          location: string | null
          posts_count: number | null
          profile_public: boolean | null
          referral_coupon_used: string | null
          referred_by_influencer_id: string | null
          show_bodyweight: boolean | null
          show_prs: boolean | null
          target_bench: string | null
          target_deadlift: string | null
          target_squat: string | null
          tiktok_url: string | null
          updated_at: string
          user_id: string
          username: string | null
          website_url: string | null
          whatsapp: string | null
          youtube_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          body_weight?: number | null
          coach_personality?: string | null
          cover_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          followers_count?: number | null
          following_count?: number | null
          goals?: string | null
          gym_class?: string | null
          gym_id?: string | null
          gym_visibility?: string | null
          id?: string
          instagram_url?: string | null
          location?: string | null
          posts_count?: number | null
          profile_public?: boolean | null
          referral_coupon_used?: string | null
          referred_by_influencer_id?: string | null
          show_bodyweight?: boolean | null
          show_prs?: boolean | null
          target_bench?: string | null
          target_deadlift?: string | null
          target_squat?: string | null
          tiktok_url?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
          website_url?: string | null
          whatsapp?: string | null
          youtube_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          body_weight?: number | null
          coach_personality?: string | null
          cover_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          followers_count?: number | null
          following_count?: number | null
          goals?: string | null
          gym_class?: string | null
          gym_id?: string | null
          gym_visibility?: string | null
          id?: string
          instagram_url?: string | null
          location?: string | null
          posts_count?: number | null
          profile_public?: boolean | null
          referral_coupon_used?: string | null
          referred_by_influencer_id?: string | null
          show_bodyweight?: boolean | null
          show_prs?: boolean | null
          target_bench?: string | null
          target_deadlift?: string | null
          target_squat?: string | null
          tiktok_url?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
          website_url?: string | null
          whatsapp?: string | null
          youtube_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_referred_by_influencer_id_fkey"
            columns: ["referred_by_influencer_id"]
            isOneToOne: false
            referencedRelation: "influencers"
            referencedColumns: ["id"]
          },
        ]
      }
      rivals: {
        Row: {
          active: boolean
          created_at: string
          id: string
          rival_user_id: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          rival_user_id: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          rival_user_id?: string
          user_id?: string
        }
        Relationships: []
      }
      season_rewards: {
        Row: {
          badge_title: string | null
          created_at: string | null
          final_dots: number | null
          final_rank: number | null
          id: string
          league: string | null
          season_id: number
          user_id: string
        }
        Insert: {
          badge_title?: string | null
          created_at?: string | null
          final_dots?: number | null
          final_rank?: number | null
          id?: string
          league?: string | null
          season_id: number
          user_id: string
        }
        Update: {
          badge_title?: string | null
          created_at?: string | null
          final_dots?: number | null
          final_rank?: number | null
          id?: string
          league?: string | null
          season_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "season_rewards_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      seasonal_events: {
        Row: {
          created_at: string
          description: string | null
          end_date: string
          event_type: string
          icon: string | null
          id: string
          is_active: boolean
          name: string
          start_date: string
          theme_color: string | null
          xp_multiplier: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date: string
          event_type?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          start_date: string
          theme_color?: string | null
          xp_multiplier?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string
          event_type?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          start_date?: string
          theme_color?: string | null
          xp_multiplier?: number
        }
        Relationships: []
      }
      seasons: {
        Row: {
          created_at: string | null
          end_date: string
          id: number
          is_active: boolean | null
          name: string
          season_number: number
          start_date: string
        }
        Insert: {
          created_at?: string | null
          end_date: string
          id?: number
          is_active?: boolean | null
          name: string
          season_number: number
          start_date: string
        }
        Update: {
          created_at?: string | null
          end_date?: string
          id?: number
          is_active?: boolean | null
          name?: string
          season_number?: number
          start_date?: string
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
      shared_workout_activity: {
        Row: {
          activity_type: string
          created_at: string
          estimated_1rm: number | null
          exercise_name: string | null
          id: string
          message: string | null
          reps: number | null
          user_id: string
          weight: number | null
          workout_id: string
        }
        Insert: {
          activity_type?: string
          created_at?: string
          estimated_1rm?: number | null
          exercise_name?: string | null
          id?: string
          message?: string | null
          reps?: number | null
          user_id: string
          weight?: number | null
          workout_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          estimated_1rm?: number | null
          exercise_name?: string | null
          id?: string
          message?: string | null
          reps?: number | null
          user_id?: string
          weight?: number | null
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_workout_activity_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "shared_workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_workout_members: {
        Row: {
          id: string
          joined_at: string
          role: string
          user_id: string
          workout_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          role?: string
          user_id: string
          workout_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          role?: string
          user_id?: string
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_workout_members_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "shared_workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_workouts: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      shop_items: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_seasonal: boolean
          item_type: string
          metadata: Json | null
          name: string
          preview_url: string | null
          price_cents: number
          rarity: string
          season_id: number | null
          stock_limit: number | null
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_seasonal?: boolean
          item_type?: string
          metadata?: Json | null
          name: string
          preview_url?: string | null
          price_cents?: number
          rarity?: string
          season_id?: number | null
          stock_limit?: number | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_seasonal?: boolean
          item_type?: string
          metadata?: Json | null
          name?: string
          preview_url?: string | null
          price_cents?: number
          rarity?: string
          season_id?: number | null
          stock_limit?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "shop_items_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      specialist_plans: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          price_cents: number
          specialist_avatar_url: string | null
          specialist_bio: string | null
          specialist_name: string
          title: string
          updated_at: string
          whatsapp_contact: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          price_cents?: number
          specialist_avatar_url?: string | null
          specialist_bio?: string | null
          specialist_name: string
          title: string
          updated_at?: string
          whatsapp_contact?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          price_cents?: number
          specialist_avatar_url?: string | null
          specialist_bio?: string | null
          specialist_name?: string
          title?: string
          updated_at?: string
          whatsapp_contact?: string | null
        }
        Relationships: []
      }
      stories: {
        Row: {
          caption: string | null
          created_at: string
          expires_at: string
          id: string
          media_type: string
          media_url: string
          user_id: string
          views_count: number
        }
        Insert: {
          caption?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          media_type?: string
          media_url: string
          user_id: string
          views_count?: number
        }
        Update: {
          caption?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          media_type?: string
          media_url?: string
          user_id?: string
          views_count?: number
        }
        Relationships: []
      }
      story_views: {
        Row: {
          id: string
          story_id: string
          viewed_at: string
          viewer_id: string
        }
        Insert: {
          id?: string
          story_id: string
          viewed_at?: string
          viewer_id: string
        }
        Update: {
          id?: string
          story_id?: string
          viewed_at?: string
          viewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_views_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string
          currency: string
          description: string | null
          features: Json
          id: string
          interval: string
          is_active: boolean
          kiwify_product_id: string | null
          name: string
          price_cents: number
          tier: string
        }
        Insert: {
          created_at?: string
          currency?: string
          description?: string | null
          features?: Json
          id: string
          interval?: string
          is_active?: boolean
          kiwify_product_id?: string | null
          name: string
          price_cents?: number
          tier?: string
        }
        Update: {
          created_at?: string
          currency?: string
          description?: string | null
          features?: Json
          id?: string
          interval?: string
          is_active?: boolean
          kiwify_product_id?: string | null
          name?: string
          price_cents?: number
          tier?: string
        }
        Relationships: []
      }
      temporary_badges: {
        Row: {
          badge_title: string
          badge_type: string
          challenge_id: string | null
          created_at: string
          exercise_name: string | null
          expires_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_title: string
          badge_type: string
          challenge_id?: string | null
          created_at?: string
          exercise_name?: string | null
          expires_at: string
          id?: string
          user_id: string
        }
        Update: {
          badge_title?: string
          badge_type?: string
          challenge_id?: string | null
          created_at?: string
          exercise_name?: string | null
          expires_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "temporary_badges_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "daily_challenges"
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
      training_streaks: {
        Row: {
          current_streak: number
          id: string
          last_workout_date: string | null
          longest_streak: number
          program_streak: number
          updated_at: string
          user_id: string
          weekly_consistency_streak: number
        }
        Insert: {
          current_streak?: number
          id?: string
          last_workout_date?: string | null
          longest_streak?: number
          program_streak?: number
          updated_at?: string
          user_id: string
          weekly_consistency_streak?: number
        }
        Update: {
          current_streak?: number
          id?: string
          last_workout_date?: string | null
          longest_streak?: number
          program_streak?: number
          updated_at?: string
          user_id?: string
          weekly_consistency_streak?: number
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
      user_inventory: {
        Row: {
          equipped: boolean
          expires_at: string | null
          id: string
          item_id: string
          purchased_at: string
          user_id: string
        }
        Insert: {
          equipped?: boolean
          expires_at?: string | null
          id?: string
          item_id: string
          purchased_at?: string
          user_id: string
        }
        Update: {
          equipped?: boolean
          expires_at?: string | null
          id?: string
          item_id?: string
          purchased_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_inventory_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "shop_items"
            referencedColumns: ["id"]
          },
        ]
      }
      user_prs: {
        Row: {
          created_at: string
          display_order: number
          estimated_1rm: number
          exercise_name: string
          id: string
          reps: number
          updated_at: string
          user_id: string
          weight: number
        }
        Insert: {
          created_at?: string
          display_order?: number
          estimated_1rm?: number
          exercise_name: string
          id?: string
          reps?: number
          updated_at?: string
          user_id: string
          weight?: number
        }
        Update: {
          created_at?: string
          display_order?: number
          estimated_1rm?: number
          exercise_name?: string
          id?: string
          reps?: number
          updated_at?: string
          user_id?: string
          weight?: number
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
          role?: Database["public"]["Enums"]["app_role"]
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
      user_subscriptions: {
        Row: {
          canceled_at: string | null
          created_at: string
          expires_at: string | null
          id: string
          kiwify_customer_id: string | null
          kiwify_subscription_id: string | null
          plan_id: string
          started_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          canceled_at?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          kiwify_customer_id?: string | null
          kiwify_subscription_id?: string | null
          plan_id: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          canceled_at?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          kiwify_customer_id?: string | null
          kiwify_subscription_id?: string | null
          plan_id?: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      wearable_logs: {
        Row: {
          calories_burned: number | null
          created_at: string
          fatigue_score: number | null
          heart_rate: number | null
          hrv: number | null
          id: string
          logged_at: string
          readiness_score: number | null
          resting_hr: number | null
          session_type: string
          sleep_hours: number | null
          spo2: number | null
          user_id: string
        }
        Insert: {
          calories_burned?: number | null
          created_at?: string
          fatigue_score?: number | null
          heart_rate?: number | null
          hrv?: number | null
          id?: string
          logged_at?: string
          readiness_score?: number | null
          resting_hr?: number | null
          session_type?: string
          sleep_hours?: number | null
          spo2?: number | null
          user_id: string
        }
        Update: {
          calories_burned?: number | null
          created_at?: string
          fatigue_score?: number | null
          heart_rate?: number | null
          hrv?: number | null
          id?: string
          logged_at?: string
          readiness_score?: number | null
          resting_hr?: number | null
          session_type?: string
          sleep_hours?: number | null
          spo2?: number | null
          user_id?: string
        }
        Relationships: []
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
      calculate_dots: {
        Args: { bw_kg: number; is_male?: boolean; total_kg: number }
        Returns: number
      }
      find_potential_rivals: {
        Args: {
          bw_threshold?: number
          dots_threshold?: number
          target_user_id: string
        }
        Returns: {
          avatar_url: string
          bench_pr: number
          bodyweight: number
          deadlift_pr: number
          display_name: string
          dots_score: number
          squat_pr: number
          total: number
          user_id: string
          username: string
        }[]
      }
      get_dots_leaderboard: {
        Args: { max_bw?: number; min_bw?: number }
        Returns: {
          bench_pr: number
          bodyweight: number
          deadlift_pr: number
          display_name: string
          dots_score: number
          league: string
          league_points: number
          squat_pr: number
          total: number
          username: string
        }[]
      }
      get_exercise_leaderboard: {
        Args: { limit_count?: number; target_exercise: string }
        Returns: {
          avatar_url: string
          bodyweight: number
          display_name: string
          dots_score: number
          estimated_1rm: number
          exercise_name: string
          gym_name: string
          reps: number
          user_id: string
          username: string
          weight: number
        }[]
      }
      get_gym_heatmap: {
        Args: { days_back?: number }
        Returns: {
          city: string
          country: string
          gym_id: string
          gym_name: string
          intensity_score: number
          latitude: number
          longitude: number
          member_count: number
          top_bench: number
          top_deadlift: number
          top_squat: number
          total_prs: number
          total_volume: number
        }[]
      }
      get_gym_leaderboard: {
        Args: { target_exercise?: string; target_gym_id: string }
        Returns: {
          avatar_url: string
          bodyweight: number
          display_name: string
          dots_score: number
          estimated_1rm: number
          exercise_type: string
          relative_strength: number
          user_id: string
          username: string
          weight_lifted: number
        }[]
      }
      get_gym_rankings: {
        Args: { limit_count?: number }
        Returns: {
          city: string
          country: string
          gym_id: string
          gym_name: string
          member_count: number
          pr_count: number
          tier: string
          total_points: number
        }[]
      }
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
      get_power_score_leaderboard: {
        Args: never
        Returns: {
          avatar_url: string
          display_name: string
          last_updated: string
          power_score: number
          user_id: string
          username: string
        }[]
      }
      get_streak_leaderboard: {
        Args: { target_gym_id?: string }
        Returns: {
          avatar_url: string
          current_streak: number
          display_name: string
          gym_id: string
          gym_name: string
          longest_streak: number
          user_id: string
          username: string
          weekly_consistency_streak: number
        }[]
      }
      get_trending_posts: {
        Args: { limit_count?: number }
        Returns: {
          boost_multiplier: number
          caption: string
          comments_count: number
          created_at: string
          engagement_score: number
          estimated_1rm: number
          exercise_name: string
          is_pr: boolean
          likes_count: number
          media_urls: string[]
          post_id: string
          post_type: string
          reps: number
          user_id: string
          weight: number
        }[]
      }
      is_admin: { Args: { _user_id?: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
