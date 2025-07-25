"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { User } from "@supabase/supabase-js"

type Profile = {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: "instructor" | "learner"
  bio: string | null
  points: number
}

type AuthContextType = {
  user: User | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function Providers({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [supabase] = useState(() => createClientComponentClient())

  useEffect(() => {
    // Check if environment variables are available
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error("Missing Supabase environment variables")
      setLoading(false)
      return
    }

    const getUser = async () => {
      try {
        console.log("Getting initial user...")

        // First try to get the session
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          console.error("Error getting session:", sessionError)
          setLoading(false)
          return
        }

        if (session?.user) {
          console.log("Session found, user:", session.user.id)
          setUser(session.user)
          await fetchProfile(session.user.id)
        } else {
          console.log("No active session found")
          setUser(null)
          setProfile(null)
          setLoading(false)
        }
      } catch (error) {
        console.error("Unexpected error in getUser:", error)
        setUser(null)
        setProfile(null)
        setLoading(false)
      }
    }

    const fetchProfile = async (userId: string, retries = 0) => {
      try {
        console.log(`Fetching profile for user ${userId}, attempt ${retries + 1}`)

        // First, check if multiple profiles exist for this user
        const { data: profiles, error: countError } = await supabase.from("profiles").select("*").eq("id", userId)

        if (countError) {
          console.error("Profile count error:", countError)
          if (retries < 3) {
            console.log("Retrying profile fetch...")
            setTimeout(() => fetchProfile(userId, retries + 1), 1000)
            return
          }
          setLoading(false)
          return
        }

        console.log(`Found ${profiles?.length || 0} profiles for user ${userId}`)

        if (!profiles || profiles.length === 0) {
          // No profile found, try to create one
          if (retries < 3) {
            console.log("No profile found, retrying...")
            setTimeout(() => fetchProfile(userId, retries + 1), 1000)
            return
          }

          // Try to create profile manually as last resort
          console.log("Creating profile manually...")
          try {
            const { data: userData } = await supabase.auth.getUser()
            if (userData.user) {
              const { data: newProfile, error: createError } = await supabase
                .from("profiles")
                .insert({
                  id: userId,
                  email: userData.user.email!,
                  full_name: userData.user.user_metadata?.full_name || userData.user.user_metadata?.name || "",
                  role: (userData.user.user_metadata?.role || "learner") as "instructor" | "learner",
                  avatar_url: userData.user.user_metadata?.avatar_url,
                  points: 0,
                })
                .select()
                .single()

              if (createError) {
                console.error("Manual profile creation failed:", createError)
              } else {
                console.log("Manual profile creation successful:", newProfile)
                setProfile(newProfile)
              }
            }
          } catch (createErr) {
            console.error("Error creating profile manually:", createErr)
          }

          setLoading(false)
          return
        }

        if (profiles.length > 1) {
          // Multiple profiles found - this shouldn't happen, use the first one and log warning
          console.warn(`Multiple profiles found for user ${userId}, using the first one`)
          setProfile(profiles[0])
        } else {
          // Exactly one profile found - this is the expected case
          setProfile(profiles[0])
        }

        console.log("Profile fetch successful:", profiles[0])
        setLoading(false)
      } catch (error) {
        console.error("Unexpected error fetching profile:", error)
        setLoading(false)
      }
    }

    getUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state change:", { event, user: session?.user?.id })

      if (event === "SIGNED_OUT") {
        setUser(null)
        setProfile(null)
        setLoading(false)
        return
      }

      if (session?.user) {
        console.log("User session found, fetching profile...")
        setUser(session.user)
        await fetchProfile(session.user.id)
      } else {
        console.log("No user session")
        setUser(null)
        setProfile(null)
        setLoading(false)
      }
    })

    return () => {
      console.log("Cleaning up auth subscription")
      subscription.unsubscribe()
    }
  }, [supabase])

  const signOut = async () => {
    try {
      console.log("Signing out...")
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error("Sign out error:", error)
      } else {
        console.log("Sign out successful")
        setUser(null)
        setProfile(null)
      }
    } catch (error) {
      console.error("Unexpected sign out error:", error)
    } finally {
      setLoading(false)
    }
  }

  return <AuthContext.Provider value={{ user, profile, loading, signOut }}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
