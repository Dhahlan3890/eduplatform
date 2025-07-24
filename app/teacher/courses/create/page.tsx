"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Youtube, Save, Eye, ArrowLeft } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/contexts/AuthContext"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface Lesson {
  id: string
  title: string
  description: string
  videoUrl: string
  duration: string
}

export default function CreateCoursePage() {
  const { user } = useAuth()
  const [courseData, setCourseData] = useState({
    title: "",
    subject: "",
    description: "",
    price: "",
    thumbnail: "",
  })

  const [lessons, setLessons] = useState<Lesson[]>([
    { id: "1", title: "", description: "", videoUrl: "", duration: "" },
  ])

  const [previewOpen, setPreviewOpen] = useState(false)

  const addLesson = () => {
    const newLesson: Lesson = {
      id: Date.now().toString(),
      title: "",
      description: "",
      videoUrl: "",
      duration: "",
    }
    setLessons([...lessons, newLesson])
  }

  const removeLesson = (id: string) => {
    setLessons(lessons.filter((lesson) => lesson.id !== id))
  }

  const updateLesson = (id: string, field: keyof Lesson, value: string) => {
    setLessons(lessons.map((lesson) => (lesson.id === id ? { ...lesson, [field]: value } : lesson)))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    const course = {
      ...courseData,
      price: parseFloat(courseData.price),
      lessons,
      teacherId: user.uid,
      teacherName: user.displayName || user.email || "Teacher",
      teacherEmail: user.email, // <-- ensure teacherEmail is saved
      status: "published",
      createdAt: new Date().toISOString(),
    }
    const res = await fetch("/api/teacher/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(course),
    })
    if (res.ok) {
      window.location.href = "/teacher/dashboard"
    }
  }

  // Add a helper to convert YouTube URL to embed URL
  function getYouTubeEmbedUrl(url: string) {
    const match = url.match(/(?:youtu.be\/|youtube.com\/(?:watch\?v=|embed\/|v\/|shorts\/)?)([\w-]{11})/)
    return match ? `https://www.youtube.com/embed/${match[1]}` : null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/teacher/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Create New Course</h1>
                <p className="text-gray-600">Share your knowledge with students worldwide</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={() => setPreviewOpen(true)}>
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </Button>
              <Button onClick={handleSubmit}>
                <Save className="mr-2 h-4 w-4" />
                Save Course
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Provide the essential details about your course</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Course Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Complete JavaScript Mastery"
                    value={courseData.title}
                    onChange={(e) => setCourseData({ ...courseData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject *</Label>
                  <Select onValueChange={(value) => setCourseData({ ...courseData, subject: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="programming">Programming</SelectItem>
                      <SelectItem value="web-development">Web Development</SelectItem>
                      <SelectItem value="data-science">Data Science</SelectItem>
                      <SelectItem value="design">Design</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="photography">Photography</SelectItem>
                      <SelectItem value="music">Music</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Course Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what students will learn in this course..."
                  rows={4}
                  value={courseData.description}
                  onChange={(e) => setCourseData({ ...courseData, description: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="price">Course Price (LKR) *</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="2999.00"
                    min="0"
                    step="0.01"
                    value={courseData.price}
                    onChange={(e) => setCourseData({ ...courseData, price: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="thumbnail">Course Thumbnail URL</Label>
                  <Input
                    id="thumbnail"
                    placeholder="https://example.com/thumbnail.jpg"
                    value={courseData.thumbnail}
                    onChange={(e) => setCourseData({ ...courseData, thumbnail: e.target.value })}
                  />
                </div>
              </div>

              {courseData.thumbnail && (
                <div className="space-y-2">
                  <Label>Thumbnail Preview</Label>
                  <div className="w-64 h-36 border rounded-lg overflow-hidden">
                    <Image
                      src={courseData.thumbnail || "/placeholder.svg"}
                      alt="Course thumbnail"
                      width={256}
                      height={144}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Course Content */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Course Content</CardTitle>
                  <CardDescription>Add lessons with YouTube video links</CardDescription>
                </div>
                <Button type="button" onClick={addLesson} variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Lesson
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {lessons.map((lesson, index) => (
                  <div key={lesson.id} className="border rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Lesson {index + 1}</h3>
                      {lessons.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeLesson(lesson.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Lesson Title *</Label>
                        <Input
                          placeholder="e.g., Introduction to Variables"
                          value={lesson.title}
                          onChange={(e) => updateLesson(lesson.id, "title", e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Duration</Label>
                        <Input
                          placeholder="e.g., 15:30"
                          value={lesson.duration}
                          onChange={(e) => updateLesson(lesson.id, "duration", e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Lesson Description</Label>
                      <Textarea
                        placeholder="Brief description of what this lesson covers..."
                        rows={2}
                        value={lesson.description}
                        onChange={(e) => updateLesson(lesson.id, "description", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center">
                        <Youtube className="mr-2 h-4 w-4 text-red-600" />
                        YouTube Video URL *
                      </Label>
                      <Input
                        placeholder="https://www.youtube.com/watch?v=..."
                        value={lesson.videoUrl}
                        onChange={(e) => updateLesson(lesson.id, "videoUrl", e.target.value)}
                        required
                      />
                      <p className="text-xs text-gray-500">
                        Paste the full YouTube URL. We'll automatically convert it for embedding.
                      </p>
                    </div>

                    {lesson.videoUrl && (
                      <div className="space-y-2">
                        <Label>Video Preview</Label>
                        <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                          {getYouTubeEmbedUrl(lesson.videoUrl) ? (
                            <iframe
                              src={getYouTubeEmbedUrl(lesson.videoUrl) || ''}
                              title="YouTube Video Preview"
                              className="w-full h-full rounded-lg"
                              allowFullScreen
                            />
                          ) : (
                            <div className="text-center">
                              <Youtube className="h-12 w-12 text-red-600 mx-auto mb-2" />
                              <p className="text-sm text-gray-600">Invalid YouTube URL</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Course Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Course Settings</CardTitle>
              <CardDescription>Configure how your course will be published</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Course Status</h4>
                    <p className="text-sm text-gray-600">Choose whether to publish immediately or save as draft</p>
                  </div>
                  <div className="flex space-x-2">
                    <Badge variant="secondary">Draft</Badge>
                    <Badge variant="default">Published</Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Student Enrollment</h4>
                    <p className="text-sm text-gray-600">Allow students to enroll in this course</p>
                  </div>
                  <Badge variant="default">Open</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4">
            <Link href="/teacher/dashboard">
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button type="button" variant="outline" onClick={async () => {
              if (!user) return
              const course = {
                ...courseData,
                price: parseFloat(courseData.price),
                lessons,
                teacherId: user.uid,
                teacherName: user.displayName || user.email || "Teacher",
                teacherEmail: user.email, // <-- ensure teacherEmail is saved
                status: "draft",
                createdAt: new Date().toISOString(),
              }
              const res = await fetch("/api/teacher/courses", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(course),
              })
              if (res.ok) {
                window.location.href = "/teacher/dashboard"
              }
            }}>
              Save as Draft
            </Button>
            <Button type="submit">Publish Course</Button>
          </div>
        </form>
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Course Preview</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex space-x-4">
              <div className="w-40 h-24 rounded-lg overflow-hidden border">
                <Image
                  src={courseData.thumbnail || "/placeholder.svg"}
                  alt="Course thumbnail"
                  width={160}
                  height={96}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h2 className="text-xl font-bold">{courseData.title || "Course Title"}</h2>
                <div className="text-gray-600">{courseData.subject || "Subject"}</div>
                <div className="text-gray-700 mt-2">{courseData.description || "Course description..."}</div>
                <div className="mt-2 font-semibold text-green-700">LKR {courseData.price || "0.00"}</div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Lessons</h3>
              <div className="space-y-4">
                {lessons.map((lesson, idx) => (
                  <div key={lesson.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{idx + 1}. {lesson.title || "Lesson Title"}</span>
                      <span className="text-xs text-gray-500">{lesson.duration || "00:00"}</span>
                    </div>
                    <div className="text-gray-600 mb-2">{lesson.description || "Lesson description..."}</div>
                    {getYouTubeEmbedUrl(lesson.videoUrl) ? (
                      <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                        <iframe
                          src={getYouTubeEmbedUrl(lesson.videoUrl) || ''}
                          title="YouTube Video Preview"
                          className="w-full h-full rounded-lg"
                          allowFullScreen
                        />
                      </div>
                    ) : lesson.videoUrl ? (
                      <div className="text-xs text-red-500">Invalid YouTube URL</div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
