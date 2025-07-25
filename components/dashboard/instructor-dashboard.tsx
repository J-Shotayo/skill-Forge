"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/providers"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, BookOpen, Users, DollarSign, TrendingUp, Eye, Edit, Trash2, Star } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import DashboardLayout from "@/components/layout/dashboard-layout"

type Course = {
  id: string
  title: string
  description: string
  status: "draft" | "published" | "archived"
  price: number
  thumbnail_url: string | null
  created_at: string
  enrollments: { count: number }[]
}

export default function InstructorDashboard() {
  const { profile } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    totalRevenue: 0,
    publishedCourses: 0,
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    if (!profile) return

    try {
      // Fetch courses
      const { data: coursesData, error: coursesError } = await supabase
        .from("courses")
        .select(`
          *,
          enrollments (count)
        `)
        .eq("instructor_id", profile.id)
        .order("created_at", { ascending: false })

      if (coursesError) throw coursesError

      setCourses(coursesData || [])

      // Calculate stats
      const totalCourses = coursesData?.length || 0
      const publishedCourses = coursesData?.filter((c) => c.status === "published").length || 0
      const totalStudents = coursesData?.reduce((sum, course) => sum + (course.enrollments?.[0]?.count || 0), 0) || 0
      const totalRevenue =
        coursesData?.reduce((sum, course) => sum + course.price * (course.enrollments?.[0]?.count || 0), 0) || 0

      setStats({
        totalCourses,
        totalStudents,
        totalRevenue,
        publishedCourses,
      })
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const deleteCourse = async (courseId: string) => {
    if (!confirm("Are you sure you want to delete this course? This action cannot be undone.")) {
      return
    }

    try {
      const { error } = await supabase.from("courses").delete().eq("id", courseId)

      if (error) throw error

      setCourses(courses.filter((c) => c.id !== courseId))
      toast({
        title: "Success",
        description: "Course deleted successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete course",
        variant: "destructive",
      })
    }
  }

  const createSampleCourse = async () => {
    if (!profile) return

    try {
      const { data, error } = await supabase
        .from("courses")
        .insert({
          instructor_id: profile.id,
          title: "My First Course",
          description: "This is a sample course to get you started. Edit this course to add your own content.",
          price: 0,
          status: "draft",
          duration_hours: 5,
          level: "beginner",
        })
        .select()
        .single()

      if (error) throw error

      setCourses([data, ...courses])
      toast({
        title: "Success",
        description: "Sample course created! You can now edit it to add your content.",
      })
    } catch (error) {
      console.error("Error creating sample course:", error)
      toast({
        title: "Error",
        description: "Failed to create sample course",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Instructor Dashboard</h1>
            <p className="text-gray-600">Welcome back, {profile?.full_name || "Instructor"}!</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={createSampleCourse}>
              <Plus className="w-4 h-4 mr-2" />
              Create Sample Course
            </Button>
            <Link href="/instructor/courses/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Course
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCourses}</div>
              <p className="text-xs text-muted-foreground">{stats.publishedCourses} published</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStudents}</div>
              <p className="text-xs text-muted-foreground">Across all courses</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Lifetime earnings</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Rating</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <div className="flex items-center">
                  4.8
                  <Star className="w-4 h-4 ml-1 fill-yellow-400 text-yellow-400" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Based on reviews</p>
            </CardContent>
          </Card>
        </div>

        {/* Getting Started Guide */}
        {courses.length === 0 && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">Welcome to SkillForge!</h3>
                  <p className="text-blue-700 mb-4">
                    Ready to start teaching? Here's how to get started with your first course:
                  </p>
                  <div className="space-y-2 text-sm text-blue-600 mb-4">
                    <div className="flex items-center">
                      <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold mr-3">
                        1
                      </div>
                      Create your first course with a compelling title and description
                    </div>
                    <div className="flex items-center">
                      <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold mr-3">
                        2
                      </div>
                      Add lessons with videos, text content, and quizzes
                    </div>
                    <div className="flex items-center">
                      <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold mr-3">
                        3
                      </div>
                      Set your pricing and publish to start earning
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button onClick={createSampleCourse} variant="outline" className="bg-white">
                      Create Sample Course
                    </Button>
                    <Link href="/instructor/courses/new">
                      <Button className="bg-blue-600 hover:bg-blue-700">Start Creating</Button>
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Courses Management */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Courses ({courses.length})</TabsTrigger>
            <TabsTrigger value="published">
              Published ({courses.filter((c) => c.status === "published").length})
            </TabsTrigger>
            <TabsTrigger value="draft">Drafts ({courses.filter((c) => c.status === "draft").length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <div className="grid gap-4">
              {courses.map((course) => (
                <Card key={course.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <BookOpen className="w-8 h-8 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold">{course.title}</h3>
                          <p className="text-gray-600 text-sm line-clamp-2">{course.description}</p>
                          <div className="flex items-center space-x-2 mt-2">
                            <Badge variant={course.status === "published" ? "default" : "secondary"}>
                              {course.status}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {course.enrollments?.[0]?.count || 0} students
                            </span>
                            <span className="text-sm font-medium text-green-600">
                              {course.price === 0 ? "Free" : `$${course.price}`}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Link href={`/courses/${course.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </Link>
                        <Link href={`/instructor/courses/${course.id}/edit`}>
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                        </Link>
                        <Button variant="outline" size="sm" onClick={() => deleteCourse(course.id)}>
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="published">
            <div className="grid gap-4">
              {courses
                .filter((c) => c.status === "published")
                .map((course) => (
                  <Card key={course.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                            <BookOpen className="w-8 h-8 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold">{course.title}</h3>
                            <p className="text-gray-600 text-sm line-clamp-2">{course.description}</p>
                            <div className="flex items-center space-x-2 mt-2">
                              <Badge>Published</Badge>
                              <span className="text-sm text-gray-500">
                                {course.enrollments?.[0]?.count || 0} students
                              </span>
                              <span className="text-sm font-medium text-green-600">
                                {course.price === 0 ? "Free" : `$${course.price}`}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Link href={`/courses/${course.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          </Link>
                          <Link href={`/instructor/courses/${course.id}/edit`}>
                            <Button variant="outline" size="sm">
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

              {courses.filter((c) => c.status === "published").length === 0 && (
                <Card>
                  <CardContent className="p-12 text-center">
                    <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No published courses yet</h3>
                    <p className="text-gray-600 mb-4">
                      Create and publish your first course to start reaching students
                    </p>
                    <Button onClick={createSampleCourse}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Course
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="draft">
            <div className="grid gap-4">
              {courses
                .filter((c) => c.status === "draft")
                .map((course) => (
                  <Card key={course.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-16 bg-gradient-to-r from-gray-400 to-gray-600 rounded-lg flex items-center justify-center">
                            <BookOpen className="w-8 h-8 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold">{course.title}</h3>
                            <p className="text-gray-600 text-sm line-clamp-2">{course.description}</p>
                            <div className="flex items-center space-x-2 mt-2">
                              <Badge variant="secondary">Draft</Badge>
                              <span className="text-sm text-gray-500">Not published</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Link href={`/instructor/courses/${course.id}/edit`}>
                            <Button variant="outline" size="sm">
                              <Edit className="w-4 h-4 mr-1" />
                              Continue Editing
                            </Button>
                          </Link>
                          <Button variant="outline" size="sm" onClick={() => deleteCourse(course.id)}>
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

              {courses.filter((c) => c.status === "draft").length === 0 && (
                <Card>
                  <CardContent className="p-12 text-center">
                    <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No draft courses</h3>
                    <p className="text-gray-600 mb-4">
                      All your courses are published! Create a new one to get started.
                    </p>
                    <Button onClick={createSampleCourse}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create New Course
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
