"use client"

import type React from "react"

import { useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { BookOpen, Mail, GraduationCap, Users, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [role, setRole] = useState<"learner" | "instructor">("learner")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  // Set default role from URL params
  useState(() => {
    const roleParam = searchParams.get("role")
    if (roleParam === "instructor") {
      setRole("instructor")
    }
  })

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      console.log("Attempting to sign up with:", { email, fullName, role })

      // Sign up the user with email confirmation
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        },
      })

      console.log("Sign up response:", { data, error: signUpError })

      if (signUpError) {
        console.error("Sign up error:", signUpError)
        setError(signUpError.message)
        toast({
          title: "Sign Up Error",
          description: signUpError.message,
          variant: "destructive",
        })
      } else if (data.user) {
        console.log("Sign up successful, user:", data.user.id)

        // Check if email confirmation is required
        if (data.user && !data.session) {
          // Email confirmation required
          toast({
            title: "Check your email",
            description: "We've sent you a confirmation link. Please check your email to verify your account.",
          })
          router.push("/auth/verify-email")
        } else {
          // User is automatically signed in (email confirmation disabled)
          toast({
            title: "Success",
            description: "Account created successfully!",
          })
          router.push("/dashboard")
        }
      }
    } catch (error) {
      console.error("Unexpected error:", error)
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred"
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    try {
      console.log("Attempting Google sign up with role:", role)
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?role=${role}&next=/dashboard`,
        },
      })

      console.log("Google sign up response:", { data, error })

      if (error) {
        console.error("Google sign up error:", error)
        setError(error.message)
        toast({
          title: "Google Sign Up Error",
          description: error.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Google sign up unexpected error:", error)
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred"
      setError(errorMessage)
    }
  }

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
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Create your account</CardTitle>
            <CardDescription className="text-center">
              Join thousands of learners and instructors on SkillForge
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {error}
                  {error.includes("Database error") && (
                    <div className="mt-2 text-sm">
                      This might be a temporary issue. Please try again or{" "}
                      <Link href="/debug" className="underline">
                        check the debug page
                      </Link>{" "}
                      for more information.
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-3">
              <Label>I want to:</Label>
              <RadioGroup value={role} onValueChange={(value) => setRole(value as "learner" | "instructor")}>
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                  <RadioGroupItem value="learner" id="learner" />
                  <Label htmlFor="learner" className="flex items-center space-x-2 cursor-pointer flex-1">
                    <GraduationCap className="w-5 h-5 text-blue-600" />
                    <div>
                      <div className="font-medium">Learn new skills</div>
                      <div className="text-sm text-gray-500">Access courses and earn certificates</div>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                  <RadioGroupItem value="instructor" id="instructor" />
                  <Label htmlFor="instructor" className="flex items-center space-x-2 cursor-pointer flex-1">
                    <Users className="w-5 h-5 text-green-600" />
                    <div>
                      <div className="font-medium">Teach and share knowledge</div>
                      <div className="text-sm text-gray-500">Create courses and build your audience</div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <Button variant="outline" className="w-full bg-transparent" onClick={handleGoogleSignUp}>
              <Mail className="mr-2 h-4 w-4" />
              Continue with Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
              </div>
            </div>

            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a password (min 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={loading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating account..." : "Create Account"}
              </Button>
            </form>

            <div className="text-center text-sm">
              Already have an account?{" "}
              <Link href="/auth/signin" className="text-blue-600 hover:underline">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
