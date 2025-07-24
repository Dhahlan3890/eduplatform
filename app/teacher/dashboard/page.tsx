"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { BookOpen, Users, DollarSign, Plus, Edit, Trash2, Star, User, Award, TrendingUp } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import ProtectedRoute from "@/components/ProtectedRoute"
import EditProfileModal from "@/components/EditProfileModal"
import BankDetailsModal, { BankDetailsDisplay } from "@/components/BankDetailsModal"

// type Course = {
// 	id: number
// 	title: string
// 	subject: string
// 	students: number
// 	revenue: number
// 	rating: number
// 	status: "published" | "draft"
// 	thumbnail?: string
// }

// Mock data
// const courses: Course[] = [
// 	{
// 		id: 1,
// 		title: "Complete JavaScript Mastery",
// 		subject: "Programming",
// 		students: 245,
// 		revenue: 4900,
// 		rating: 4.8,
// 		status: "published",
// 		thumbnail: "/placeholder.svg?height=200&width=300",
// 	},
// 	{
// 		id: 2,
// 		title: "Advanced React Development",
// 		subject: "Web Development",
// 		students: 189,
// 		revenue: 3780,
// 		rating: 4.9,
// 		status: "published",
// 		thumbnail: "/placeholder.svg?height=200&width=300",
// 	},
// 	{
// 		id: 3,
// 		title: "Python for Data Science",
// 		subject: "Data Science",
// 		students: 156,
// 		revenue: 3120,
// 		rating: 4.7,
// 		status: "draft",
// 		thumbnail: "/placeholder.svg?height=200&width=300",
// 	},
// ]

export default function TeacherDashboard() {
	const [selectedTab, setSelectedTab] = useState("overview")
	const { logout, user } = useAuth()
	const router = useRouter()

	const [courses, setCourses] = useState<any[]>([])
	const [loadingCourses, setLoadingCourses] = useState(true)
	const [enrollments, setEnrollments] = useState<any[]>([])
	const [loadingEnrollments, setLoadingEnrollments] = useState(true)
	const [questions, setQuestions] = useState<any[]>([])
	const [answerInput, setAnswerInput] = useState<{ [id: string]: string }>({})
	const [answerLoading, setAnswerLoading] = useState<{ [id: string]: boolean }>({})
	const [showReceiptModal, setShowReceiptModal] = useState(false)
	const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null)
	const [showEditProfileModal, setShowEditProfileModal] = useState(false)
	const [showBankDetailsModal, setShowBankDetailsModal] = useState(false)
	
	const teacherId = user?.uid // Use logged-in user's UID
	// Fetch enrollments for this teacher
	useEffect(() => {
		if (!teacherId) return
		const fetchEnrollments = async () => {
			setLoadingEnrollments(true)
			try {
				const res = await fetch(`/api/enrollments?teacherId=${teacherId}`)
				const data = await res.json()
				setEnrollments(data)
			} catch (e) {
				setEnrollments([])
			} finally {
				setLoadingEnrollments(false)
			}
		}
		fetchEnrollments()
	}, [teacherId])
	// Approve or reject enrollment
	const handleEnrollmentAction = async (enrollmentId: string, action: 'approve' | 'reject') => {
		const status = action === 'approve' ? 'approved' : 'rejected';
		await fetch('/api/enrollments', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ enrollmentId, status }),
		})
		// Refresh enrollments
		const res = await fetch(`/api/enrollments?teacherId=${teacherId}`)
		const data = await res.json()
		setEnrollments(data)
		
		// Also refresh courses to update student counts
		const coursesRes = await fetch(`/api/teacher/courses?teacherId=${teacherId}`)
		const coursesData = await coursesRes.json()
		setCourses(coursesData)
	}

	useEffect(() => {
		if (!teacherId) return
		const fetchCourses = async () => {
			setLoadingCourses(true)
			try {
				const res = await fetch(`/api/teacher/courses?teacherId=${teacherId}`)
				const data = await res.json()
				setCourses(data)
			} catch (e) {
				setCourses([])
			} finally {
				setLoadingCourses(false)
			}
		}
		fetchCourses()
	}, [teacherId])

	const handleCreateCourse = async (course: any) => {
		await fetch("/api/teacher/courses", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ ...course, teacherId }),
		})
		// Refresh course list
		const res = await fetch(`/api/teacher/courses?teacherId=${teacherId}`)
		const data = await res.json()
		setCourses(data)
	}

	const handleLogout = async () => {
		await logout()
		router.push("/")
	}

	const handleViewReceipt = (receiptUrl: string) => {
		setSelectedReceipt(receiptUrl)
		setShowReceiptModal(true)
	}

	const handleCloseReceiptModal = () => {
		setShowReceiptModal(false)
		setSelectedReceipt(null)
	}

	const handleBankDetailsSave = (bankDetails: any) => {
		// Bank details saved successfully, modal will close automatically
		console.log('Bank details saved:', bankDetails)
	}

	const totalStudents = courses.reduce((sum, course) => sum + (course.students || 0), 0)
	const totalRevenue = courses.reduce((sum, course) => sum + (course.revenue || 0), 0)
	const averageRating = courses.length ? courses.reduce((sum, course) => sum + (course.rating || 0), 0) / courses.length : 0

	// Fetch all questions for teacher's courses
	useEffect(() => {
		async function fetchQuestions() {
			if (!courses.length) return
			const all = await Promise.all(
				courses.map(async (course) => {
					const res = await fetch(`/api/courses/${course._id}/questions`)
					if (res.ok) {
						const arr = await res.json()
						return arr.map((q: any) => ({ ...q, courseTitle: course.title, courseId: course._id }))
					}
					return []
				})
			)
			setQuestions(all.flat())
		}
		fetchQuestions()
	}, [courses])

	return (
		<ProtectedRoute>
			<div className="min-h-screen bg-gray-50">
				{/* Header */}
				<header className="bg-white border-b">
					<div className="container mx-auto px-4 py-4">
						<div className="flex items-center justify-between">
							<div>
								<h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
								<p className="text-gray-600">Welcome back</p>
							</div>
							<div className="flex items-center space-x-4">
								<Link href="/teacher/courses/create">
									<Button className="bg-blue-600 hover:bg-blue-700">
										<Plus className="mr-2 h-4 w-4" />
										Create Course
									</Button>
								</Link>
								<Button variant="outline" onClick={handleLogout}>
									Logout
								</Button>
							</div>
						</div>
					</div>
				</header>

				<div className="container mx-auto px-4 py-8">
					{loadingCourses ? (
						<div className="text-center py-10">Loading courses...</div>
					) : (
						<Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
							<TabsList className="grid w-full grid-cols-5 lg:w-auto lg:grid-cols-5">
								<TabsTrigger value="overview">Overview</TabsTrigger>
								<TabsTrigger value="courses">My Courses</TabsTrigger>
								<TabsTrigger value="students">Students</TabsTrigger>
								<TabsTrigger value="questions">Q&amp;A</TabsTrigger>
								<TabsTrigger value="profile">Profile</TabsTrigger>
							</TabsList>

							<TabsContent value="overview" className="space-y-6">
								{/* Stats Cards */}
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
									<Card>
										<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
											<CardTitle className="text-sm font-medium">Total Students</CardTitle>
											<Users className="h-4 w-4 text-muted-foreground" />
										</CardHeader>
										<CardContent>
											<div className="text-2xl font-bold">{totalStudents}</div>
											{/* <p className="text-xs text-muted-foreground">+12% from last month</p> */}
										</CardContent>
									</Card>

									<Card>
										<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
											<CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
											<DollarSign className="h-4 w-4 text-muted-foreground" />
										</CardHeader>
										<CardContent>
											<div className="text-2xl font-bold">LKR {totalRevenue.toLocaleString()}</div>
											{/* <p className="text-xs text-muted-foreground">+8% from last month</p> */}
										</CardContent>
									</Card>

									<Card>
										<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
											<CardTitle className="text-sm font-medium">Active Courses</CardTitle>
											<BookOpen className="h-4 w-4 text-muted-foreground" />
										</CardHeader>
										<CardContent>
											<div className="text-2xl font-bold">{courses.length}</div>
											{/* <p className="text-xs text-muted-foreground">2 published, 1 draft</p> */}
										</CardContent>
									</Card>

									<Card>
										<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
											<CardTitle className="text-sm font-medium">Average Rating</CardTitle>
											<Star className="h-4 w-4 text-muted-foreground" />
										</CardHeader>
										<CardContent>
											<div className="text-2xl font-bold">{averageRating.toFixed(1)}</div>
											<p className="text-xs text-muted-foreground">Across all courses</p>
										</CardContent>
									</Card>
								</div>

								{/* Recent Activity */}
								<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
									<Card>
										<CardHeader>
											<CardTitle>Course Performance</CardTitle>
											<CardDescription>Your top performing courses</CardDescription>
										</CardHeader>
										<CardContent>
											<div className="space-y-4">
												{courses.slice(0, 3).map((course) => (
													<div key={course.id} className="flex items-center justify-between">
														<div className="flex items-center space-x-3">
															<Image
																src={course.thumbnail || "/placeholder.svg"}
																alt={course.title}
																width={48}
																height={32}
																className="rounded object-cover"
															/>
															<div>
																<p className="text-sm font-medium">{course.title}</p>
																<p className="text-xs text-gray-500">{course.students} students</p>
															</div>
														</div>
														<div className="text-right">
															<p className="text-sm font-medium">LKR {course.revenue}</p>
															<div className="flex items-center">
																<Star className="h-3 w-3 text-yellow-400 mr-1" />
																<span className="text-xs text-gray-500">{course.rating}</span>
															</div>
														</div>
													</div>
												))}
											</div>
										</CardContent>
									</Card>
								</div>
							</TabsContent>

							<TabsContent value="courses" className="space-y-6">
								<div className="flex items-center justify-between">
									<h2 className="text-2xl font-bold">My Courses</h2>
									<Link href="/teacher/courses/create">
										<Button>
											<Plus className="mr-2 h-4 w-4" />
											Create New Course
										</Button>
									</Link>
								</div>

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {courses.map((course) => (
	<Card key={course._id || course.id} className="overflow-hidden">
	  <div className="relative">
		<Image
		  src={course.thumbnail || "/placeholder.svg"}
		  alt={course.title}
		  width={300}
		  height={200}
		  className="w-full h-48 object-cover"
		/>
		<Badge
		  className={`absolute top-2 right-2 ${
			course.status === "published"
			  ? "bg-green-500 hover:bg-green-600"
			  : "bg-yellow-500 hover:bg-yellow-600"
		  }`}
		>
		  {course.status}
		</Badge>
	  </div>
	  <CardHeader>
		<CardTitle className="line-clamp-2">{course.title}</CardTitle>
		<CardDescription>{course.subject}</CardDescription>
	  </CardHeader>
	  <CardContent>
		<div className="flex items-center justify-between text-sm text-gray-600 mb-4">
		  <span>{course.students} students</span>
		  <div className="flex items-center">
			<Star className="h-4 w-4 text-yellow-400 mr-1" />
			{course.rating}
		  </div>
		</div>
		<div className="text-lg font-semibold text-green-600 mb-4">
		  LKR {course.revenue} earned
		</div>
		<div className="flex space-x-2">
<Button
  variant="outline"
  size="sm"
  className="w-full bg-transparent flex-1"
  onClick={() => router.push(`/teacher/courses/${course._id || course.id}/edit`)}
>
  <Edit className="mr-2 h-4 w-4" />Edit
</Button>
		  <Button
			variant="outline"
			size="sm"
			className="text-red-600 hover:text-red-700 bg-transparent"
			onClick={async () => {
			  if (!window.confirm("Are you sure you want to delete this course? This action cannot be undone.")) return;
			  const res = await fetch(`/api/courses/${course._id || course.id}`, {
				method: "DELETE",
			  });
			  if (res.ok) {
				setCourses((prev) => prev.filter((c) => (c._id || c.id) !== (course._id || course.id)));
			  } else {
				const data = await res.json().catch(() => ({}));
				alert("Failed to delete course. " + (data?.error || res.statusText));
			  }
			}}
		  >
			<Trash2 className="h-4 w-4" />
		  </Button>
		</div>
	  </CardContent>
	</Card>
  ))}
</div>
							</TabsContent>

							<TabsContent value="students" className="space-y-6">
								<h2 className="text-2xl font-bold">Student Management</h2>
								<Card>
									<CardHeader>
										<CardTitle>Enrollment Requests</CardTitle>
										<CardDescription>Approve or reject students for your courses</CardDescription>
									</CardHeader>
									<CardContent>
										{loadingEnrollments ? (
											<div>Loading enrollments...</div>
										) : enrollments.length === 0 ? (
											<div>No enrollment requests yet.</div>
										) : (
											<div className="space-y-6">
												{/* Group enrollments by course */}
												{courses.map((course) => {
													const courseEnrollments = enrollments.filter((e) => e.courseId === course._id)
													if (courseEnrollments.length === 0) return null
													return (
														<div key={course._id} className="border rounded-lg p-4">
															<div className="font-semibold mb-2">{course.title}</div>
															<div className="space-y-2">
																{courseEnrollments.map((enrollment) => (
																	<div key={enrollment._id} className="bg-gray-50 p-4 rounded-lg">
																		<div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
																			<div className="flex-1">
																				<div className="font-medium">{enrollment.studentName} <span className="text-xs text-gray-500">({enrollment.studentEmail})</span></div>
																				<div className="text-xs text-gray-500">Requested: {new Date(enrollment.requestedAt).toLocaleString()}</div>
																				<div className="text-xs">
																				  Status: <span className={enrollment.status === 'pending' ? 'text-yellow-600' : enrollment.status === 'approved' ? 'text-green-600' : 'text-red-600'}>{enrollment.status}</span>
																				</div>
																				{enrollment.bankDetails && (
																					<div className="text-xs text-gray-600 mt-2">
																						<span className="font-semibold">Payment to:</span> {enrollment.bankDetails.bankName} - {enrollment.bankDetails.accountNumber}
																					</div>
																				)}
																			</div>
																			
															{/* Payment Receipt */}
															{enrollment.paymentReceipt && (
																<div className="flex-shrink-0">
																	<div className="text-xs font-semibold text-gray-700 mb-1">Payment Receipt:</div>
																	<Image
																		src={enrollment.paymentReceipt}
																		alt="Payment Receipt"
																		width={120}
																		height={80}
																		className="rounded border cursor-pointer hover:opacity-80 transition-opacity"
																		onClick={() => handleViewReceipt(enrollment.paymentReceipt)}
																	/>
																	<div className="text-xs text-blue-600 mt-1 cursor-pointer" onClick={() => handleViewReceipt(enrollment.paymentReceipt)}>
																		View Full Size
																	</div>
																</div>
															)}																			<div className="flex space-x-2">
																				{enrollment.status === 'pending' && (
																				  <>
																					<Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleEnrollmentAction(enrollment._id, 'approve')}>Approve</Button>
																					<Button size="sm" variant="outline" className="border-red-600 text-red-600 hover:bg-red-50" onClick={() => handleEnrollmentAction(enrollment._id, 'reject')}>Reject</Button>
																				  </>
																				)}
																				{enrollment.status === 'approved' && <span className="text-green-600 font-semibold">Approved</span>}
																				{enrollment.status === 'rejected' && <span className="text-red-600 font-semibold">Rejected</span>}
																			</div>
																		</div>
																	</div>
																))}
															</div>
														</div>
													)
												})}
											</div>
										)}
									</CardContent>
								</Card>
							</TabsContent>

							<TabsContent value="questions" className="space-y-6">
								<h2 className="text-2xl font-bold">Course Q&amp;A</h2>
								<Card>
									<CardHeader>
										<CardTitle>Student Questions</CardTitle>
										<CardDescription>Answer questions for your courses</CardDescription>
									</CardHeader>
									<CardContent>
										<div className="space-y-6">
											{questions.length === 0 && <div className="text-gray-500">No questions yet.</div>}
											{questions.map((q) => (
												<div key={q._id} className="border-b pb-4 last:border-b-0">
													<div className="mb-1 text-sm text-gray-500">Course: <span className="font-semibold text-gray-800">{q.courseTitle}</span></div>
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
																<form
																	onSubmit={async (e) => {
																		e.preventDefault();
																		if (!answerInput[q._id]?.trim()) return;
																		setAnswerLoading((prev) => ({ ...prev, [q._id]: true }));
																		try {
																			await fetch(`/api/questions/${q._id}/answer`, {
																				method: "PATCH",
																				headers: { "Content-Type": "application/json" },
																				body: JSON.stringify({
																					answer: answerInput[q._id],
																					answeredBy: user?.displayName || user?.email || "Teacher"
																				})
																			});
																			setQuestions((prev) => prev.map((qq) => qq._id === q._id ? { ...qq, answer: answerInput[q._id], answeredBy: user?.displayName || user?.email || "Teacher", answeredAt: new Date().toISOString() } : qq));
																			setAnswerInput((prev) => ({ ...prev, [q._id]: "" }));
																		} finally {
																			setAnswerLoading((prev) => ({ ...prev, [q._id]: false }));
																		}
																	}}
																	className="flex gap-2 mt-2"
																>
																	<input
																		type="text"
																		placeholder="Type your answer..."
																		value={answerInput[q._id] || ""}
																		onChange={e => setAnswerInput({ ...answerInput, [q._id]: e.target.value })}
																		className="flex-1 border rounded px-2 py-1"
																		required
																		disabled={answerLoading[q._id]}
																	/>
																	<Button type="submit" size="sm" disabled={answerLoading[q._id]} className="relative">
																		{answerLoading[q._id] ? (
																			<span className="flex items-center">
																				<svg className="animate-spin h-4 w-4 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
																					<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
																					<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
																				</svg>
																				Answering...
																			</span>
																		) : "Answer"}
																	</Button>
																</form>
															)}
														</div>
													</div>
												</div>
											))}
										</div>
									</CardContent>
								</Card>
							</TabsContent>

							<TabsContent value="profile" className="space-y-6">
								<h2 className="text-2xl font-bold">Teacher Profile</h2>

								<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
									<Card className="lg:col-span-1">
										<CardHeader className="text-center">
											{user?.photoURL ? (
												<Image
													src={user.photoURL}
													alt="Profile"
													width={96}
													height={96}
													className="mx-auto w-24 h-24 rounded-full object-cover mb-4"
												/>
											) : (
												<div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-4">
													<User className="h-12 w-12 text-green-600" />
												</div>
											)}
											<CardTitle>{user?.displayName || "Teacher"}</CardTitle>
											<CardDescription>
												{user?.email}
											</CardDescription>
											<CardDescription>
												Teaching since {user?.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : "Recently"}
											</CardDescription>
										</CardHeader>
										<CardContent>
											<div className="space-y-4">
												<div className="text-center">
													<div className="text-2xl font-bold text-green-600">
														{courses.length}
													</div>
													<p className="text-sm text-gray-600">
														Courses Created
													</p>
												</div>
												<div className="text-center">
													<div className="text-2xl font-bold text-blue-600">
														{courses.reduce((sum, course) => sum + (course.students || 0), 0)}
													</div>
													<p className="text-sm text-gray-600">
														Total Students
													</p>
												</div>
												<div className="text-center">
													<div className="text-2xl font-bold text-yellow-600">
														{courses.length > 0 ? (courses.reduce((sum, course) => sum + (course.rating || 0), 0) / courses.length).toFixed(1) : "0.0"}
													</div>
													<p className="text-sm text-gray-600">
														Average Rating
													</p>
												</div>
												<Button
													className="w-full bg-transparent"
													variant="outline"
													onClick={() => setShowEditProfileModal(true)}
												>
													Edit Profile
												</Button>
											</div>
										</CardContent>
									</Card>

									<Card className="lg:col-span-2">
										<CardHeader>
											<CardTitle>Teaching Activity</CardTitle>
											<CardDescription>
												Your course performance overview
											</CardDescription>
										</CardHeader>
										<CardContent>
											<div className="space-y-6">
												{courses.length === 0 ? (
													<div className="text-center py-8 text-gray-500">
														<BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
														<p>No courses created yet</p>
														<Link href="/teacher/courses/create">
															<Button className="mt-4">
																<Plus className="h-4 w-4 mr-2" />
																Create Your First Course
															</Button>
														</Link>
													</div>
												) : (
													courses.slice(0, 5).map((course) => (
														<div
															key={course._id || course.id}
															className="border-l-4 border-green-500 pl-4"
														>
															<div className="flex justify-between items-start">
																<div className="flex-1">
																	<h4 className="font-semibold">{course.title}</h4>
																	<p className="text-sm text-gray-600 mb-2">
																		{course.students || 0} students • LKR {course.price || 0}
																	</p>
																	<div className="flex items-center space-x-4">
																		<div className="flex items-center">
																			<Star className="h-4 w-4 text-yellow-400 mr-1" />
																			<span className="text-sm">{course.rating || "No ratings"}</span>
																		</div>
																		<Badge variant={course.status === 'published' ? 'default' : 'secondary'}>
																			{course.status || 'draft'}
																		</Badge>
																	</div>
																</div>
															</div>
														</div>
													))
												)}
											</div>
										</CardContent>
									</Card>
								</div>

								{/* Bank Details Section */}
								<BankDetailsDisplay 
									teacherId={teacherId || ""} 
									onEdit={() => setShowBankDetailsModal(true)} 
								/>

								<Card>
									<CardHeader>
										<CardTitle>Teaching Achievements</CardTitle>
										<CardDescription>
											Your teaching milestones
										</CardDescription>
									</CardHeader>
									<CardContent>
										<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
											<div className={`text-center p-4 border rounded-lg ${courses.length > 0 ? '' : 'opacity-50'}`}>
												<BookOpen className={`h-8 w-8 mx-auto mb-2 ${courses.length > 0 ? 'text-green-500' : 'text-gray-400'}`} />
												<h4 className="font-semibold">Course Creator</h4>
												<p className="text-sm text-gray-600">
													{courses.length > 0 ? 'Created your first course' : 'Create your first course'}
												</p>
											</div>
											<div className={`text-center p-4 border rounded-lg ${courses.reduce((sum, course) => sum + (course.students || 0), 0) >= 10 ? '' : 'opacity-50'}`}>
												<Users className={`h-8 w-8 mx-auto mb-2 ${courses.reduce((sum, course) => sum + (course.students || 0), 0) >= 10 ? 'text-blue-500' : 'text-gray-400'}`} />
												<h4 className="font-semibold">Popular Teacher</h4>
												<p className="text-sm text-gray-600">
													{courses.reduce((sum, course) => sum + (course.students || 0), 0) >= 10 ? 'Reached 10+ students' : `Reach ${10 - courses.reduce((sum, course) => sum + (course.students || 0), 0)} more students`}
												</p>
											</div>
											<div className={`text-center p-4 border rounded-lg ${courses.some(course => (course.rating || 0) >= 4.5) ? '' : 'opacity-50'}`}>
												<Award className={`h-8 w-8 mx-auto mb-2 ${courses.some(course => (course.rating || 0) >= 4.5) ? 'text-yellow-500' : 'text-gray-400'}`} />
												<h4 className="font-semibold">Top Rated</h4>
												<p className="text-sm text-gray-600">
													{courses.some(course => (course.rating || 0) >= 4.5) ? 'Achieved 4.5+ star rating' : 'Achieve 4.5+ star rating'}
												</p>
											</div>
										</div>
									</CardContent>
								</Card>
							</TabsContent>
						</Tabs>
					)}
				</div>

				{/* Receipt Viewer Modal */}
				<Dialog open={showReceiptModal} onOpenChange={handleCloseReceiptModal}>
					<DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
						<DialogHeader>
							<DialogTitle>Payment Receipt</DialogTitle>
						</DialogHeader>
						<div className="flex justify-center items-center p-4">
							{selectedReceipt && (
								<Image
									src={selectedReceipt}
									alt="Payment Receipt - Full Size"
									width={800}
									height={600}
									className="max-w-full max-h-[70vh] object-contain rounded-lg"
								/>
							)}
						</div>
					</DialogContent>
				</Dialog>

				{/* Edit Profile Modal */}
				<EditProfileModal
					isOpen={showEditProfileModal}
					onClose={() => setShowEditProfileModal(false)}
					userType="teacher"
				/>

				{/* Bank Details Modal */}
				<BankDetailsModal
					isOpen={showBankDetailsModal}
					onClose={() => setShowBankDetailsModal(false)}
					teacherId={teacherId || ""}
					onSave={handleBankDetailsSave}
				/>
			</div>
		</ProtectedRoute>
	)
}
