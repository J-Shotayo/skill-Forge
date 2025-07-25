"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/providers"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge as UIBadge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen, Trophy, Target, Clock, Play, CheckCircle, Star, TrendingUp } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import DashboardLayout from "@/components/layout/dashboard-layout"

type Enrollment = {
  id: string
  progress_percentage: number
  status: "active" | "completed" | "dropped"
  enrolled_at: string
  completed_at: string | null
  courses: {
    id: string
    title: string
    description: string
    thumbnail_url: string | null
    instructor_id: string
    profiles: {
      full_name: string
    }
  }
}

type UserBadge = {
  id: string
  name: string
  description: string
  icon: string
  earned_at: string
}

export default function LearnerDashboard() {
  const { profile } = useAuth()
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [badges, setBadges] = useState<UserBadge[]>([])
  const [availableCourses, setAvailableCourses] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalCourses: 0,
    completedCourses: 0,
    totalPoints: 0,
    totalBadges: 0,
    learningStreak: 7,
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
      // Fetch enrollments
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from("enrollments")
        .select(`
          *,
          courses (
            id,
            title,
            description,
            thumbnail_url,
            instructor_id,
            profiles:instructor_id (full_name)
          )
        `)
        .eq("learner_id", profile.id)
        .order("enrolled_at", { ascending: false })

      if (enrollmentsError) throw enrollmentsError

      setEnrollments(enrollmentsData || [])

      // Fetch user badges
      const { data: badgesData, error: badgesError } = await supabase
        .from("user_badges")
        .select(`
          earned_at,
          badges (
            id,
            name,
            description,
            icon
          )
        `)
        .eq("user_id", profile.id)
        .order("earned_at", { ascending: false })

      if (badgesError) throw badgesError

      const userBadges =
        badgesData?.map((ub) => ({
          ...ub.badges,
          earned_at: ub.earned_at,
        })) || []

      setBadges(userBadges)

      // Fetch some available courses for recommendations
      const { data: coursesData } = await supabase
        .from("courses")
        .select(`
          *,
          profiles:instructor_id (full_name),
          categories (name)
        `)
        .eq("status", "published")
        .limit(3)

      setAvailableCourses(coursesData || [])

      // Calculate stats
      const totalCourses = enrollmentsData?.length || 0
      const completedCourses = enrollmentsData?.filter((e) => e.status === "completed").length || 0
      const totalPoints = profile.points || 0
      const totalBadges = userBadges.length

      setStats({
        totalCourses,
        completedCourses,
        totalPoints,
        totalBadges,
        learningStreak: 7, // This would be calculated based on actual learning activity
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

  const enrollInCourse = async (courseId: string) => {
    if (!profile) return

    try {
      const { error } = await supabase.from("enrollments").insert({
        learner_id: profile.id,
        course_id: courseId,
      })

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Already Enrolled",
            description: "You are already enrolled in this course",
            variant: "destructive",
          })
        } else {
          throw error
        }
      } else {
        toast({
          title: "Success",
          description: "Successfully enrolled in course!",
        })
        fetchDashboardData() // Refresh data
      }
    } catch (error) {
      console.error("Error enrolling in course:", error)
      toast({
        title: "Error",
        description: "Failed to enroll in course",
        variant: "destructive",
      })
    }
  }

  const continueCourse = (courseId: string) => {
    // Navigate to course learning page
    window.location.href = `/learn/${courseId}`
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
            <h1 className="text-3xl font-bold text-gray-900">Learning Dashboard</h1>
            <p className="text-gray-600">Welcome back, {profile?.full_name || "Learner"}! Keep learning and growing.</p>
          </div>
          <Link href="/courses">
            <Button>
              <BookOpen className="w-4 h-4 mr-2" />
              Browse Courses
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Enrolled Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCourses}</div>
              <p className="text-xs text-muted-foreground">{stats.completedCourses} completed</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Points</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPoints}</div>
              <p className="text-xs text-muted-foreground">Keep learning to earn more</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Badges Earned</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBadges}</div>
              <p className="text-xs text-muted-foreground">Achievements unlocked</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Learning Streak</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center">
                {stats.learningStreak}
                <span className="text-orange-500 ml-1">🔥</span>
              </div>
              <p className="text-xs text-muted-foreground">Days in a row</p>
            </CardContent>
          </Card>
        </div>

        {/* Welcome Message for New Users */}
        {enrollments.length === 0 && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-green-900 mb-2">Welcome to SkillForge!</h3>
                  <p className="text-green-700 mb-4">
                    Ready to start your learning journey? Here are some popular courses to get you started:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    {availableCourses.slice(0, 3).map((course) => (
                      <div key={course.id} className="bg-white rounded-lg p-4 border border-green-200">
                        <h4 className="font-medium text-sm mb-2">{course.title}</h4>
                        <p className="text-xs text-gray-600 mb-3 line-clamp-2">{course.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-green-600 font-medium">
                            {course.price === 0 ? "Free" : `$${course.price}`}
                          </span>
                          <Button size="sm" onClick={() => enrollInCourse(course.id)}>
                            Enroll
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Link href="/courses">
                    <Button className="bg-green-600 hover:bg-green-700">
                      <BookOpen className="w-4 h-4 mr-2" />
                      Browse All Courses
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        <Tabs defaultValue="courses" className="space-y-4">
          <TabsList>
            <TabsTrigger value="courses">My Courses ({enrollments.length})</TabsTrigger>
            <TabsTrigger value="badges">Badges ({badges.length})</TabsTrigger>
            <TabsTrigger value="certificates">Certificates</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
          </TabsList>

          <TabsContent value="courses" className="space-y-4">
            <div className="grid gap-4">
              {enrollments.map((enrollment) => (
                <Card key={enrollment.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <BookOpen className="w-8 h-8 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold">{enrollment.courses.title}</h3>
                          <p className="text-gray-600 text-sm line-clamp-2">{enrollment.courses.description}</p>
                          <div className="flex items-center space-x-2 mt-2">
                            <UIBadge variant={enrollment.status === "completed" ? "default" : "secondary"}>
                              {enrollment.status}
                            </UIBadge>
                            <span className="text-sm text-gray-500">by {enrollment.courses.profiles?.full_name}</span>
                          </div>
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span>Progress</span>
                              <span>{enrollment.progress_percentage}%</span>
                            </div>
                            <Progress value={enrollment.progress_percentage} className="h-2" />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {enrollment.status === "completed" ? (
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <span className="text-sm text-green-600 font-medium">Completed</span>
                          </div>
                        ) : (
                          <Button onClick={() => continueCourse(enrollment.courses.id)}>
                            <Play className="w-4 h-4 mr-1" />
                            Continue Learning
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="badges" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {badges.map((badge) => (
                <Card key={badge.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl mb-3">{badge.icon}</div>
                    <h3 className="font-semibold mb-2">{badge.name}</h3>
                    <p className="text-sm text-gray-600 mb-3">{badge.description}</p>
                    <UIBadge variant="outline">Earned {new Date(badge.earned_at).toLocaleDateString()}</UIBadge>
                  </CardContent>
                </Card>
              ))}

              {badges.length === 0 && (
                <div className="col-span-full">
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No badges earned yet</h3>
                      <p className="text-gray-600 mb-4">Complete lessons and courses to earn your first badge</p>
                      <div className="text-sm text-gray-500">
                        <p>🎯 Complete your first lesson to earn "First Steps"</p>
                        <p>⚡ Complete 5 lessons in a day to earn "Quick Learner"</p>
                        <p>🏆 Complete your first course to earn "Course Crusher"</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="certificates" className="space-y-4">
            <Card>
              <CardContent className="p-12 text-center">
                <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No certificates yet</h3>
                <p className="text-gray-600 mb-4">
                  Complete courses to earn certificates and showcase your achievements
                </p>
                <div className="text-sm text-gray-500">
                  <p>📄 Certificates are automatically generated when you complete a course</p>
                  <p>🎓 Share your certificates on LinkedIn and social media</p>
                  <p>⭐ Build your professional portfolio with verified skills</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="progress" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Learning Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Overall Progress</span>
                        <span>
                          {stats.totalCourses > 0 ? Math.round((stats.completedCourses / stats.totalCourses) * 100) : 0}
                          %
                        </span>
                      </div>
                      <Progress
                        value={stats.totalCourses > 0 ? (stats.completedCourses / stats.totalCourses) * 100 : 0}
                        className="h-2"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-blue-600">{stats.totalCourses}</div>
                        <div className="text-sm text-gray-600">Enrolled</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600">{stats.completedCourses}</div>
                        <div className="text-sm text-gray-600">Completed</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Star className="w-5 h-5 mr-2" />
                    Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Points Earned</span>
                      <span className="font-bold text-yellow-600">{stats.totalPoints}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Badges Unlocked</span>
                      <span className="font-bold text-purple-600">{stats.totalBadges}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Learning Streak</span>
                      <span className="font-bold text-orange-600">{stats.learningStreak} days 🔥</span>
                    </div>
                    <div className="pt-2 border-t">
                      <div className="text-sm text-gray-600 text-center">
                        Keep learning to unlock more achievements!
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
