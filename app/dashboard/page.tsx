"use client"

import { useAuth } from "@/components/providers"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import InstructorDashboard from "@/components/dashboard/instructor-dashboard"
import LearnerDashboard from "@/components/dashboard/learner-dashboard"
import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/signin")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  if (!user || !profile) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {profile.role === "instructor" ? <InstructorDashboard /> : <LearnerDashboard />}
    </div>
  )
}
