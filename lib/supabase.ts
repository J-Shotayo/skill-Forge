import { createClientComponentClient, createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

// Client-side Supabase client
export const createClient = () => {
  return createClientComponentClient({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  })
}

// Server-side Supabase client
export const createServerClient = async () => {
  const cookieStore = await cookies()
  return createServerComponentClient({
    cookies: () => cookieStore,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  })
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: "instructor" | "learner"
          bio: string | null
          points: number
          created_at: string
          updated_at: string
        }
      }
      courses: {
        Row: {
          id: string
          instructor_id: string
          category_id: string | null
          title: string
          description: string | null
          thumbnail_url: string | null
          price: number
          status: "draft" | "published" | "archived"
          duration_hours: number
          level: "beginner" | "intermediate" | "advanced" | null
          is_featured: boolean
          created_at: string
          updated_at: string
        }
      }
      lessons: {
        Row: {
          id: string
          course_id: string
          title: string
          description: string | null
          type: "video" | "text" | "quiz"
          video_url: string | null
          content: string | null
          duration_minutes: number
          order_index: number
          points_reward: number
          created_at: string
        }
      }
      enrollments: {
        Row: {
          id: string
          learner_id: string
          course_id: string
          status: "active" | "completed" | "dropped"
          progress_percentage: number
          enrolled_at: string
          completed_at: string | null
        }
      }
    }
  }
}
