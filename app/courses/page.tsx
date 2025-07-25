"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BookOpen, Search, Star, Users, Clock } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/components/providers"
import { useToast } from "@/hooks/use-toast"
import DashboardLayout from "@/components/layout/dashboard-layout"

type Course = {
  id: string
  title: string
  description: string
  thumbnail_url: string | null
  price: number
  level: "beginner" | "intermediate" | "advanced" | null
  duration_hours: number
  created_at: string
  profiles: {
    full_name: string
    avatar_url: string | null
  }
  categories: {
    name: string
  } | null
  enrollments: { count: number }[]
}

type Category = {
  id: string
  name: string
}

export default function CoursesPage() {
  const { user } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedLevel, setSelectedLevel] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("newest")
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  useEffect(() => {
    fetchCourses()
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchCourses()
  }, [searchTerm, selectedCategory, selectedLevel, sortBy])

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase.from("categories").select("*").order("name")

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }

  const fetchCourses = async () => {
    try {
      let query = supabase
        .from("courses")
        .select(`
          *,
          profiles:instructor_id (full_name, avatar_url),
          categories (name),
          enrollments (count)
        `)
        .eq("status", "published")

      // Apply filters
      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      }

      if (selectedCategory !== "all") {
        query = query.eq("category_id", selectedCategory)
      }

      if (selectedLevel !== "all") {
        query = query.eq("level", selectedLevel)
      }

      // Apply sorting
      switch (sortBy) {
        case "newest":
          query = query.order("created_at", { ascending: false })
          break
        case "oldest":
          query = query.order("created_at", { ascending: true })
          break
        case "price_low":
          query = query.order("price", { ascending: true })
          break
        case "price_high":
          query = query.order("price", { ascending: false })
          break
        case "popular":
          // This would need a more complex query in a real app
          query = query.order("created_at", { ascending: false })
          break
      }

      const { data, error } = await query

      if (error) throw error
      setCourses(data || [])
    } catch (error) {
      console.error("Error fetching courses:", error)
      toast({
        title: "Error",
        description: "Failed to load courses",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const enrollInCourse = async (courseId: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to enroll in courses",
        variant: "destructive",
      })
      return
    }

    try {
      const { error } = await supabase.from("enrollments").insert({
        learner_id: user.id,
        course_id: courseId,
      })

      if (error) {
        if (error.code === "23505") {
          // Unique constraint violation
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
        // Refresh courses to update enrollment count
        fetchCourses()
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

  const Layout = user ? DashboardLayout : "div"

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Course Marketplace</h1>
            <p className="text-gray-600">Discover and enroll in courses to advance your skills</p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="All Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="price_low">Price: Low to High</SelectItem>
                  <SelectItem value="price_high">Price: High to Low</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Course Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Card key={course.id} className="hover:shadow-lg transition-shadow">
              <div className="aspect-video bg-gradient-to-r from-blue-500 to-purple-600 rounded-t-lg relative">
                {course.thumbnail_url && (
                  <img
                    src={course.thumbnail_url || "/placeholder.svg"}
                    alt={course.title}
                    className="w-full h-full object-cover rounded-t-lg"
                  />
                )}
                <div className="absolute top-2 right-2">
                  <Badge variant="secondary" className="bg-white/90">
                    {course.price === 0 ? "Free" : `$${course.price}`}
                  </Badge>
                </div>
              </div>
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline">{course.categories?.name || "Uncategorized"}</Badge>
                  {course.level && (
                    <Badge variant="secondary" className="capitalize">
                      {course.level}
                    </Badge>
                  )}
                </div>
                <CardTitle className="line-clamp-2">{course.title}</CardTitle>
                <CardDescription className="line-clamp-3">{course.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gray-200 rounded-full overflow-hidden">
                      {course.profiles?.avatar_url ? (
                        <img
                          src={course.profiles.avatar_url || "/placeholder.svg"}
                          alt={course.profiles.full_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                          <span className="text-xs font-medium">{course.profiles?.full_name?.charAt(0) || "I"}</span>
                        </div>
                      )}
                    </div>
                    <span className="text-sm text-gray-600">{course.profiles?.full_name}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>{course.enrollments?.[0]?.count || 0} students</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{course.duration_hours}h</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span>4.8</span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Link href={`/courses/${course.id}`} className="flex-1">
                    <Button variant="outline" className="w-full bg-transparent">
                      View Details
                    </Button>
                  </Link>
                  <Button onClick={() => enrollInCourse(course.id)} className="flex-1">
                    Enroll Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {courses.length === 0 && !loading && (
          <Card>
            <CardContent className="p-12 text-center">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
              <p className="text-gray-600">Try adjusting your search criteria or browse all courses</p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  )
}
