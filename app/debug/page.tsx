"use client"

import { useAuth } from "@/components/providers"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle } from "lucide-react"

export default function DebugPage() {
  const { user, profile, loading } = useAuth()
  const [supabaseStatus, setSupabaseStatus] = useState<any>(null)
  const [envCheck, setEnvCheck] = useState<any>({})
  const [dbCheck, setDbCheck] = useState<any>({})
  const supabase = createClientComponentClient()

  useEffect(() => {
    // Check environment variables
    const envStatus = {
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      supabaseUrlValue: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 50) + "...",
      supabaseKeyValue: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 50) + "...",
    }
    setEnvCheck(envStatus)

    const checkDatabase = async () => {
      const checks = {
        profiles: false,
        categories: false,
        courses: false,
        badges: false,
        trigger: false,
        duplicateProfiles: false,
      }

      try {
        // Check if tables exist
        const { data: profilesData, error: profilesError } = await supabase.from("profiles").select("count").limit(1)
        checks.profiles = !profilesError

        const { data: categoriesData, error: categoriesError } = await supabase
          .from("categories")
          .select("count")
          .limit(1)
        checks.categories = !categoriesError

        const { data: coursesData, error: coursesError } = await supabase.from("courses").select("count").limit(1)
        checks.courses = !coursesError

        const { data: badgesData, error: badgesError } = await supabase.from("badges").select("count").limit(1)
        checks.badges = !badgesError

        // Check if trigger function exists (this will fail if not accessible, which is expected)
        try {
          const { data: triggerData } = await supabase.rpc("handle_new_user")
          checks.trigger = false // This should fail normally
        } catch (e) {
          // Expected to fail, trigger exists if we get a specific error
          checks.trigger = true
        }

        setDbCheck(checks)
      } catch (error) {
        console.error("Database check error:", error)
        setDbCheck(checks)
      }
    }

    const checkDuplicateProfiles = async () => {
      try {
        const { data: duplicates, error } = await supabase.rpc("check_duplicate_profiles").single()

        if (!error && duplicates) {
          setDbCheck((prev) => ({ ...prev, duplicateProfiles: duplicates.count === 0 }))
        }
      } catch (error) {
        // RPC might not exist, that's okay
        console.log("Duplicate check RPC not available")
      }
    }

    const checkSupabase = async () => {
      try {
        // Test basic connection
        const { data, error } = await supabase.from("profiles").select("count").limit(1)
        setSupabaseStatus({
          connected: true,
          error: null,
          data: data ? "Query successful" : "No data",
          details: error ? error.message : "Connection successful",
        })
      } catch (error) {
        setSupabaseStatus({
          connected: false,
          error: error.message,
          details: "Failed to connect to Supabase",
        })
      }
    }

    if (envStatus.supabaseUrl && envStatus.supabaseKey) {
      checkSupabase()
      checkDatabase()
      checkDuplicateProfiles()
    } else {
      setSupabaseStatus({
        connected: false,
        error: "Missing environment variables",
        details: "NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY not set",
      })
    }
  }, [supabase])

  const testSignUp = async () => {
    try {
      const testEmail = `test-${Date.now()}@example.com`
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: "testpassword123",
        options: {
          data: {
            full_name: "Test User",
            role: "learner",
          },
        },
      })
      console.log("Test signup result:", { data, error })

      if (error) {
        alert(`Signup test failed: ${error.message}`)
      } else {
        alert("Signup test successful! Check console for details.")
      }
    } catch (error) {
      console.error("Test signup error:", error)
      alert(`Signup test error: ${error.message}`)
    }
  }

  const testProfileCreation = async () => {
    if (!user) {
      alert("Please sign in first to test profile creation")
      return
    }

    try {
      const { data, error } = await supabase.from("profiles").insert({
        id: user.id,
        email: user.email!,
        full_name: "Test Profile",
        role: "learner",
        points: 0,
      })

      console.log("Profile creation test:", { data, error })
      alert(`Profile creation test: ${error ? error.message : "Success"}`)
    } catch (error) {
      console.error("Profile creation test error:", error)
      alert(`Profile creation test error: ${error.message}`)
    }
  }

  return (
    <div className="container mx-auto p-8 space-y-6">
      <h1 className="text-3xl font-bold">Debug Information</h1>

      {/* Environment Variables */}
      <Card>
        <CardHeader>
          <CardTitle>Environment Variables</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              {envCheck.supabaseUrl ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              <span className="font-medium">NEXT_PUBLIC_SUPABASE_URL:</span>
              <span className={envCheck.supabaseUrl ? "text-green-600" : "text-red-600"}>
                {envCheck.supabaseUrl ? "Set" : "Missing"}
              </span>
              {envCheck.supabaseUrl && <span className="text-gray-500 text-sm">({envCheck.supabaseUrlValue})</span>}
            </div>
            <div className="flex items-center space-x-2">
              {envCheck.supabaseKey ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              <span className="font-medium">NEXT_PUBLIC_SUPABASE_ANON_KEY:</span>
              <span className={envCheck.supabaseKey ? "text-green-600" : "text-red-600"}>
                {envCheck.supabaseKey ? "Set" : "Missing"}
              </span>
              {envCheck.supabaseKey && <span className="text-gray-500 text-sm">({envCheck.supabaseKeyValue})</span>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Database Tables Check */}
      <Card>
        <CardHeader>
          <CardTitle>Database Tables</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(dbCheck).map(([table, exists]) => (
              <div key={table} className="flex items-center space-x-2">
                {exists ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
                <span className="font-medium capitalize">{table}:</span>
                <span className={exists ? "text-green-600" : "text-red-600"}>{exists ? "Exists" : "Missing"}</span>
              </div>
            ))}
          </div>

          {Object.values(dbCheck).some((v) => !v) && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Some database tables are missing. Please run the database setup scripts:
                <br />
                <code className="block mt-2 p-2 bg-gray-100 rounded text-sm">
                  01-create-tables.sql
                  <br />
                  02-create-functions.sql
                  <br />
                  03-seed-data.sql
                  <br />
                  05-fix-profile-trigger.sql
                </code>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Auth State */}
        <Card>
          <CardHeader>
            <CardTitle>Auth State</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p>
                <strong>Loading:</strong> {loading ? "Yes" : "No"}
              </p>
              <p>
                <strong>User:</strong> {user ? "Authenticated" : "Not authenticated"}
              </p>
              <p>
                <strong>Profile:</strong> {profile ? "Loaded" : "Not loaded"}
              </p>
              {user && (
                <div className="mt-4 p-4 bg-gray-100 rounded">
                  <p>
                    <strong>User ID:</strong> {user.id}
                  </p>
                  <p>
                    <strong>Email:</strong> {user.email}
                  </p>
                  <p>
                    <strong>Email Confirmed:</strong> {user.email_confirmed_at ? "Yes" : "No"}
                  </p>
                </div>
              )}
              {profile && (
                <div className="mt-4 p-4 bg-gray-100 rounded">
                  <p>
                    <strong>Profile ID:</strong> {profile.id}
                  </p>
                  <p>
                    <strong>Name:</strong> {profile.full_name}
                  </p>
                  <p>
                    <strong>Role:</strong> {profile.role}
                  </p>
                  <p>
                    <strong>Points:</strong> {profile.points}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Supabase Connection */}
        <Card>
          <CardHeader>
            <CardTitle>Supabase Connection</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                {supabaseStatus?.connected ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
                <span>
                  <strong>Status:</strong> {supabaseStatus?.connected ? "Connected" : "Disconnected"}
                </span>
              </div>
              {supabaseStatus?.error && (
                <p className="text-red-600">
                  <strong>Error:</strong> {supabaseStatus.error}
                </p>
              )}
              {supabaseStatus?.details && (
                <p className="text-gray-600">
                  <strong>Details:</strong> {supabaseStatus.details}
                </p>
              )}
              <div className="mt-4 space-x-2">
                <Button onClick={testSignUp} variant="outline" size="sm">
                  Test Signup
                </Button>
                <Button onClick={testProfileCreation} variant="outline" size="sm">
                  Test Profile Creation
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
