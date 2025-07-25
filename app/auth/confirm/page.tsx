"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function ConfirmPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        // Get the current session to see if user is already confirmed
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          console.error("Session error:", sessionError)
          setStatus("error")
          setMessage("Failed to verify session")
          return
        }

        if (session?.user) {
          console.log("User session found:", session.user.id)

          if (session.user.email_confirmed_at) {
            console.log("Email already confirmed")
            setStatus("success")
            setMessage("Email confirmed successfully!")

            // Redirect to dashboard after a short delay
            setTimeout(() => {
              router.push("/dashboard")
            }, 2000)
          } else {
            console.log("Email not yet confirmed")
            setStatus("error")
            setMessage("Email verification is still pending. Please check your email and click the confirmation link.")
          }
        } else {
          console.log("No session found")
          setStatus("error")
          setMessage("No active session found. Please sign in again.")
        }
      } catch (error) {
        console.error("Confirmation error:", error)
        setStatus("error")
        setMessage("An unexpected error occurred during email confirmation")
      }
    }

    confirmEmail()
  }, [supabase, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link href="/" className="flex items-center justify-center space-x-2 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold">SkillForge</span>
          </Link>
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              {status === "loading" && (
                <div className="bg-blue-100 w-full h-full rounded-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
              )}
              {status === "success" && (
                <div className="bg-green-100 w-full h-full rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              )}
              {status === "error" && (
                <div className="bg-red-100 w-full h-full rounded-full flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
              )}
            </div>
            <CardTitle className="text-2xl">
              {status === "loading" && "Confirming your email..."}
              {status === "success" && "Email confirmed!"}
              {status === "error" && "Confirmation needed"}
            </CardTitle>
            <CardDescription>
              {status === "loading" && "Please wait while we verify your email address."}
              {status === "success" && "Your email has been successfully verified. Redirecting to dashboard..."}
              {status === "error" && message}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {status === "error" && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  If you haven't received the confirmation email, please check your spam folder or try signing up again.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col space-y-2">
              {status === "success" && (
                <Link href="/dashboard">
                  <Button className="w-full">Go to Dashboard</Button>
                </Link>
              )}

              {status === "error" && (
                <>
                  <Link href="/auth/signin">
                    <Button className="w-full">Try Signing In</Button>
                  </Link>
                  <Link href="/auth/signup">
                    <Button variant="outline" className="w-full bg-transparent">
                      Sign Up Again
                    </Button>
                  </Link>
                </>
              )}

              <Link href="/">
                <Button variant="ghost" className="w-full">
                  Back to Home
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
