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
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
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
      gyms: {
        Row: {
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
          goals: string | null
          gym_class: string | null
          gym_id: string | null
          gym_visibility: string | null
          id: string
          instagram_url: string | null
          location: string | null
          profile_public: boolean | null
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
          goals?: string | null
          gym_class?: string | null
          gym_id?: string | null
          gym_visibility?: string | null
          id?: string
          instagram_url?: string | null
          location?: string | null
          profile_public?: boolean | null
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
          goals?: string | null
          gym_class?: string | null
          gym_id?: string | null
          gym_visibility?: string | null
          id?: string
          instagram_url?: string | null
          location?: string | null
          profile_public?: boolean | null
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
