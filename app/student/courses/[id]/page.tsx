"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Play, CheckCircle, Circle, Star, User, Clock, BookOpen } from "lucide-react"
import { useParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import { Input } from "@/components/ui/input"

function getYouTubeEmbedUrl(url: string) {
  const match = url.match(/(?:youtu.be\/|youtube.com\/(?:watch\?v=|embed\/|v\/|shorts\/)?)([\w-]{11})/)
  return match ? `https://www.youtube.com/embed/${match[1]}` : null
}

export default function CourseViewPage() {
  const params = useParams()
  const courseId = params.id as string
  const [courseData, setCourseData] = useState<any>(null)
  const [reviews, setReviews] = useState<any[]>([])
  const [currentLesson, setCurrentLesson] = useState<any>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const { user } = useAuth()
  const [questions, setQuestions] = useState<any[]>([])
  const [questionInput, setQuestionInput] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [qaError, setQaError] = useState<string|null>(null)
  const [enrollment, setEnrollment] = useState<any>(null)
  const [loadingEnrollment, setLoadingEnrollment] = useState(true)

  useEffect(() => {
    async function fetchCourse() {
      const res = await fetch(`/api/courses/${courseId}`)
      if (res.ok) {
        const data = await res.json()
        setCourseData(data)
        setCurrentLesson(data.lessons[0])
      }
    }
    async function fetchReviews() {
      const res = await fetch(`/api/courses/${courseId}/reviews`)
      if (res.ok) {
        setReviews(await res.json())
      }
    }
    async function fetchEnrollment() {
      if (!user || !courseId) return;
      setLoadingEnrollment(true);
      const res = await fetch(`/api/enrollments?studentId=${user.uid}`);
      if (res.ok) {
        const arr = await res.json();
        const found = arr.find((e: any) => e.courseId === courseId);
        setEnrollment(found || null);
      } else {
        setEnrollment(null);
      }
      setLoadingEnrollment(false);
    }
    if (courseId) {
      fetchCourse();
      fetchReviews();
    }
    if (user && courseId) {
      fetchEnrollment();
    }
  }, [courseId, user])

  // Fetch questions for this course
  useEffect(() => {
    async function fetchQuestions() {
      const res = await fetch(`/api/courses/${courseId}/questions`)
      if (res.ok) setQuestions(await res.json())
    }
    if (courseId) fetchQuestions()
  }, [courseId])

  if (!courseData || !currentLesson || loadingEnrollment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span>Loading course...</span>
      </div>
    )
  }

  // Use per-student completedLessons from enrollment
  const completedLessonsArr = enrollment?.completedLessons || [];
  const completedLessons = courseData.lessons.filter((lesson: any) => completedLessonsArr.includes(lesson.id)).length;
  const progress = (completedLessons / courseData.lessons.length) * 100;

  const handleLessonSelect = (lesson: any) => {
    setCurrentLesson(lesson)
    setIsPlaying(false)
  }

  const markAsCompleted = async (lessonId: string) => {
    if (!courseData || !courseData._id || !user) return;
    try {
      const res = await fetch(`/api/courses/${courseData._id}/lessons/${lessonId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: true, studentId: user.uid })
      });
      if (res.ok) {
        // Update UI: update enrollment.completedLessons
        setEnrollment((prev: any) => {
          if (!prev) return prev;
          return {
            ...prev,
            completedLessons: prev.completedLessons ? [...new Set([...prev.completedLessons, lessonId])] : [lessonId]
          };
        });
      }
    } catch (e) {
      // Optionally show error
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/student/dashboard">
                <Button variant="outline">&larr; Back to Dashboard</Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{courseData.title}</h1>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-1" />
                    {courseData.instructor}
                  </div>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 mr-1" />
                    {courseData.rating} ({courseData.totalStudents} students)
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {courseData.duration}
                  </div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600 mb-1">Course Progress</div>
              <div className="flex items-center space-x-2">
                <Progress value={progress} className="w-32" />
                <span className="text-sm font-medium">{Math.round(progress)}%</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Video Player */}
          <div className="lg:col-span-3">
            <Card className="overflow-hidden">
              <div className="relative aspect-video bg-black">
                {getYouTubeEmbedUrl(currentLesson.videoUrl) ? (
                  <iframe
                    src={getYouTubeEmbedUrl(currentLesson.videoUrl) || ''}
                    title={currentLesson.title}
                    className="w-full h-full"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-white">Invalid YouTube URL</div>
                )}
              </div>

              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{currentLesson.title}</CardTitle>
                    <CardDescription className="mt-2">{currentLesson.description}</CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={completedLessonsArr.includes(currentLesson.id) ? "default" : "secondary"}>
                      {completedLessonsArr.includes(currentLesson.id) ? "Completed" : "In Progress"}
                    </Badge>
                    {!completedLessonsArr.includes(currentLesson.id) && (
                      <Button size="sm" onClick={() => markAsCompleted(currentLesson.id)}>
                        Mark Complete
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Course Details Tabs */}
            <div className="mt-6">
              <Tabs defaultValue="overview" className="w-full">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="reviews">Q&amp;A</TabsTrigger>
                  <TabsTrigger value="instructor">Instructor</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Course Description</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 leading-relaxed">{courseData.description}</p>
                      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <BookOpen className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                          <div className="font-semibold">{courseData.lessons.length} Lessons</div>
                          <div className="text-sm text-gray-600">Comprehensive content</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <Clock className="h-8 w-8 text-green-600 mx-auto mb-2" />
                          <div className="font-semibold">{courseData.duration}</div>
                          <div className="text-sm text-gray-600">Total duration</div>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                          <User className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                          <div className="font-semibold">{courseData.totalStudents}+</div>
                          <div className="text-sm text-gray-600">Students enrolled</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="reviews" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Q&amp;A (Ask a Question)</CardTitle>
                      <CardDescription>Ask questions about this course. Teachers will answer here.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          setQaError(null);
                          if (!user) {
                            setQaError("You must be signed in to ask a question.");
                            return;
                          }
                          if (!questionInput.trim()) return;
                          setSubmitting(true);
                          try {
                            const res = await fetch(`/api/courses/${courseId}/questions`, {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                studentId: user.uid,
                                studentName: user.displayName || user.email,
                                question: questionInput.trim(),
                              })
                            });
                            if (res.ok) {
                              const newQ = await res.json();
                              setQuestions((prev) => [newQ, ...prev]);
                              setQuestionInput("");
                            } else {
                              let err = "Failed to submit question. Please try again.";
                              try {
                                const data = await res.json();
                                err = data?.error || err;
                              } catch {}
                              setQaError(err);
                            }
                          } catch (error: any) {
                            setQaError("Network error. Please try again.");
                          }
                          setSubmitting(false);
                        }}
                        className="mb-6"
                      >
                        <div className="flex gap-2">
                          <Input
                            placeholder="Type your question..."
                            value={questionInput}
                            onChange={e => setQuestionInput(e.target.value)}
                            className="flex-1"
                            required
                            disabled={submitting || !user}
                          />
                          <Button type="submit" disabled={submitting || !questionInput.trim() || !user} className="relative">
                            {submitting ? (
                              <span className="flex items-center">
                                <svg className="animate-spin h-4 w-4 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                                </svg>
                                Asking...
                              </span>
                            ) : "Ask"}
                          </Button>
                        </div>
                        {qaError && (
                          <div className="text-red-500 text-sm mt-2">{qaError}</div>
                        )}
                      </form>
                      <div className="space-y-6">
                        {questions.length === 0 && <div className="text-gray-500">No questions yet. Be the first to ask!</div>}
                        {questions.map((q) => (
                          <div key={q._id} className="border-b pb-4 last:border-b-0">
                            <div className="flex items-start gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-semibold">{q.studentName}</span>
                                  <span className="text-xs text-gray-400">{new Date(q.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="text-gray-800 mb-2">Q: {q.question}</div>
                                {q.answer ? (
                                  <div className="bg-green-50 border-l-4 border-green-400 p-2 rounded">
                                    <span className="font-semibold text-green-700">A:</span> {q.answer}
                                    <span className="ml-2 text-xs text-gray-400">by {q.answeredBy}</span>
                                  </div>
                                ) : (
                                  <div className="text-xs text-gray-500">Awaiting answer from teacher...</div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="instructor" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>About the Instructor</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-start space-x-4">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-8 w-8 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold mb-2">{courseData.instructor}</h3>
                          <p className="text-gray-700 mb-4">
                            Senior JavaScript Developer with over 8 years of experience in web development. Passionate
                            about teaching and helping students master modern JavaScript concepts.
                          </p>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span>5+ courses</span>
                            <span>10,000+ students</span>
                            <span>4.8 average rating</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Lesson Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Course Content
                  <Badge variant="secondary">
                    {completedLessons}/{courseData.lessons.length}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {courseData.lessons.length} lessons • {courseData.duration}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-1">
                  {courseData.lessons.map((lesson, index) => (
                    <button
                      key={lesson.id}
                      onClick={() => handleLessonSelect(lesson)}
                      className={`w-full text-left p-4 hover:bg-gray-50 transition-colors border-l-4 ${
                        currentLesson.id === lesson.id ? "border-blue-500 bg-blue-50" : "border-transparent"
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          {completedLessonsArr.includes(lesson.id) ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <Circle className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-900 truncate">
                              {index + 1}. {lesson.title}
                            </span>
                            <Play className="h-4 w-4 text-gray-400 flex-shrink-0 ml-2" />
                          </div>
                          <div className="text-xs text-gray-500">{lesson.duration}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
