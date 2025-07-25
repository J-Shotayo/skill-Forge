import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const next = requestUrl.searchParams.get("next") || "/dashboard"
  const role = requestUrl.searchParams.get("role") || "learner"

  console.log("Auth callback called with:", { code: !!code, next, role })

  if (code) {
    try {
      const cookieStore = await cookies()
      const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

      console.log("Exchanging code for session...")
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      console.log("Code exchange result:", {
        user: data?.user?.id,
        session: !!data?.session,
        error: error?.message,
      })

      if (error) {
        console.error("Code exchange error:", error)
        return NextResponse.redirect(new URL(`/auth/signin?error=${encodeURIComponent(error.message)}`, request.url))
      }

      if (data.user) {
        console.log("User authenticated, checking/creating profile...")

        // Wait a moment for the trigger to potentially create the profile
        await new Promise((resolve) => setTimeout(resolve, 1500))

        // Check if profile exists
        const { data: existingProfile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.user.id)

        console.log("Profile check result:", {
          profileExists: !!existingProfile?.length,
          profileCount: existingProfile?.length,
          profileError: profileError?.message,
        })

        // If no profile exists or multiple profiles, handle it
        if (!existingProfile || existingProfile.length === 0) {
          console.log("No profile found, creating one...")
          const { error: insertError } = await supabase.from("profiles").insert({
            id: data.user.id,
            email: data.user.email!,
            full_name: data.user.user_metadata.full_name || data.user.user_metadata.name || "",
            avatar_url: data.user.user_metadata.avatar_url,
            role: (data.user.user_metadata.role || role) as "learner" | "instructor",
            points: 0,
          })

          if (insertError) {
            console.error("Profile creation error:", insertError)
            // Don't fail the redirect, just log the error
          } else {
            console.log("Profile created successfully")
          }
        } else if (existingProfile.length > 1) {
          console.warn("Multiple profiles found, cleaning up...")
          // Keep the first profile, delete the rest
          const profileToKeep = existingProfile[0]
          const profilesToDelete = existingProfile.slice(1)

          for (const profile of profilesToDelete) {
            await supabase.from("profiles").delete().eq("id", profile.id).neq("created_at", profileToKeep.created_at)
          }
        }

        // Check if this is an email confirmation
        if (data.user.email_confirmed_at) {
          console.log("Email confirmed successfully")
        }
      }
    } catch (error) {
      console.error("Unexpected error in auth callback:", error)
      return NextResponse.redirect(new URL(`/auth/signin?error=unexpected_error`, request.url))
    }
  }

  console.log("Redirecting to:", next)
  return NextResponse.redirect(new URL(next, request.url))
}
