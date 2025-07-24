"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
	BookOpen,
	Search,
	Filter,
	Play,
	Clock,
	Star,
	User,
	TrendingUp,
	Award,
	Heart,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import ProtectedRoute from "@/components/ProtectedRoute"
import PaymentEnrollmentModal from "@/components/PaymentEnrollmentModal"
import EditProfileModal from "@/components/EditProfileModal"

// Remove static enrolledCourses and availableCourses

export default function StudentDashboard() {
	const [selectedTab, setSelectedTab] = useState("my-courses")
	const [searchQuery, setSearchQuery] = useState("")
	const { logout, user } = useAuth()
	const router = useRouter()
	const [enrollStatus, setEnrollStatus] = useState<{ [courseId: string]: string }>({})
	const [enrolledCourses, setEnrolledCourses] = useState<any[]>([])
	const [availableCourses, setAvailableCourses] = useState<any[]>([])
	const [loadingCourses, setLoadingCourses] = useState(true)
	const [enrollments, setEnrollments] = useState<any[]>([])
	const [loadingEnrollments, setLoadingEnrollments] = useState(true)
	const [selectedCourse, setSelectedCourse] = useState<any>(null)
	const [showPaymentModal, setShowPaymentModal] = useState(false)
	const [bankDetails, setBankDetails] = useState<any>(null)
	const [enrollmentLoading, setEnrollmentLoading] = useState(false)
	const [showEditProfileModal, setShowEditProfileModal] = useState(false)

	// Helper to open payment modal for enrollment
	const handleEnrollRequest = async (course: any) => {
		if (!user) return
		
		try {
			// Fetch teacher bank details
			let teacherId = course.teacherId || course.instructorId
			
			// If missing, fetch course details from /api/courses
			if (!teacherId) {
				const res = await fetch(`/api/courses`)
				const allCourses = await res.json()
				const found = allCourses.find((c: any) => (c._id || c.id) === (course._id || course.id))
				if (found) {
					teacherId = found.teacherId || found.instructorId
				}
			}
			
			if (!teacherId) {
				alert('Could not find teacher information for this course. Please contact support.')
				return
			}

			// Fetch bank details
			const bankRes = await fetch(`/api/teacher/bank-details?teacherId=${teacherId}`)
			const bankData = await bankRes.json()
			
			// Check if teacher has set up bank details
			if (!bankData.bankName) {
				alert('This teacher has not set up bank details yet. Please contact the teacher directly for payment information.')
				return
			}
			
			setBankDetails(bankData)
			setSelectedCourse(course)
			setShowPaymentModal(true)
		} catch (error) {
			console.error('Error fetching bank details:', error)
			alert('Failed to load payment information. Please try again.')
		}
	}

	// Handle payment enrollment submission
	const handlePaymentEnrollment = async (receiptData: string, bankDetails: any) => {
		if (!user || !selectedCourse) return
		
		setEnrollmentLoading(true)
		try {
			// Get teacher details
			let teacherId = selectedCourse.teacherId || selectedCourse.instructorId
			let teacherEmail = selectedCourse.teacherEmail
			
			// If missing, fetch course details
			if (!teacherEmail || !teacherId) {
				const res = await fetch(`/api/courses`)
				const allCourses = await res.json()
				const found = allCourses.find((c: any) => (c._id || c.id) === (selectedCourse._id || selectedCourse.id))
				if (found) {
					teacherId = found.teacherId || found.instructorId
					teacherEmail = found.teacherEmail
				}
			}
			
			if (!teacherEmail) {
				alert('Could not find teacher email for this course. Please contact support.')
				return
			}

			const res = await fetch('/api/enrollments', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					courseId: selectedCourse._id || selectedCourse.id,
					studentId: user.uid,
					studentEmail: user.email,
					studentName: user.displayName,
					teacherId,
					teacherEmail,
					courseTitle: selectedCourse.title,
					paymentReceipt: receiptData,
					bankDetails
				})
			})
			
			const inserted = await res.json()
			
			// Update UI immediately with pending status
			const courseId = selectedCourse._id || selectedCourse.id
			setEnrollStatus((prev) => ({ ...prev, [courseId]: 'pending' }))
			setEnrollments((prev) => [...prev, inserted])
			
			alert('Enrollment request submitted successfully! You will receive an email confirmation once the teacher approves your request.')
		} catch (error) {
			console.error('Error submitting enrollment:', error)
			alert('Failed to submit enrollment request. Please try again.')
		} finally {
			setEnrollmentLoading(false)
		}
	}

	useEffect(() => {
		const fetchAll = async () => {
			setLoadingCourses(true)
			setLoadingEnrollments(true)
			try {
				const [coursesRes, enrollmentsRes] = await Promise.all([
					fetch("/api/courses"),
					user ? fetch(`/api/enrollments?studentId=${user.uid}`) : Promise.resolve({ json: async () => [] })
				])
				const courses = await coursesRes.json()
				const enrollments = user ? await enrollmentsRes.json() : []
				setEnrollments(enrollments)
				// Map courseId to enrollment status
				const enrollmentMap: { [courseId: string]: string } = {}
				enrollments.forEach((e: any) => {
					enrollmentMap[e.courseId] = e.status
				})
				setEnrollStatus(enrollmentMap)
				// Merge enrollment progress into courses
				const enrolled = courses
					.filter((c: any) => enrollmentMap[c._id || c.id] === 'approved')
					.map((c: any) => {
						const enrollment = enrollments.find((e: any) => e.courseId === (c._id || c.id))
						const completedLessons = enrollment?.completedLessons ? enrollment.completedLessons.length : 0
						const totalLessons = c.lessons ? c.lessons.length : (c.totalLessons || 0)
						const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0
						return {
							...c,
							completedLessons,
							totalLessons,
							progress,
							lastWatched: enrollment?.lastWatched || "-"
						}
					})
				setEnrolledCourses(enrolled)
				setAvailableCourses(courses.filter((c: any) => !enrollmentMap[c._id || c.id] || enrollmentMap[c._id || c.id] !== 'approved'))
			} catch (e) {
				setEnrolledCourses([])
				setAvailableCourses([])
				setEnrollments([])
			} finally {
				setLoadingCourses(false)
				setLoadingEnrollments(false)
			}
		}
		fetchAll()
	}, [user])

	const handleLogout = async () => {
		await logout()
		router.push("/")
	}

const filteredCourses = availableCourses.filter((course) => {
	const q = searchQuery.toLowerCase();
	return (
		(course.title && course.title.toLowerCase().includes(q)) ||
		(course.teacherName && course.teacherName.toLowerCase().includes(q)) ||
		(course.instructor && course.instructor.toLowerCase().includes(q)) ||
		(course.subject && course.subject.toLowerCase().includes(q)) ||
		(course.description && course.description.toLowerCase().includes(q))
	);
});

	return (
		<ProtectedRoute>
			<div className="min-h-screen bg-gray-50">
				{/* Header */}
				<header className="bg-white border-b">
					<div className="container mx-auto px-4 py-4">
						<div className="flex items-center justify-between">
							<div>
								<h1 className="text-2xl font-bold text-gray-900">
									Dashboard
								</h1>
								<p className="text-gray-600">Welcome back</p>
							</div>
							<div className="flex items-center space-x-4">
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
						<Tabs
							value={selectedTab}
							onValueChange={setSelectedTab}
							className="space-y-6"
						>
							<TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-3">
								<TabsTrigger value="my-courses">My Courses</TabsTrigger>
								<TabsTrigger value="browse">Browse Courses</TabsTrigger>
								<TabsTrigger value="profile">Profile</TabsTrigger>
							</TabsList>

							<TabsContent value="my-courses" className="space-y-6">
								{/* Progress Overview */}
								<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
									<Card>
										<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
											<CardTitle className="text-sm font-medium">
												Enrolled Courses
											</CardTitle>
											<BookOpen className="h-4 w-4 text-muted-foreground" />
										</CardHeader>
										<CardContent>
											<div className="text-2xl font-bold">
												{enrolledCourses.length}
											</div>
											<p className="text-xs text-muted-foreground">
												Active learning paths
											</p>
										</CardContent>
									</Card>

									<Card>
										<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
											<CardTitle className="text-sm font-medium">
												Completed Lessons
											</CardTitle>
											<Award className="h-4 w-4 text-muted-foreground" />
										</CardHeader>
										<CardContent>
											<div className="text-2xl font-bold">
												{enrolledCourses.reduce(
													(sum, course) => sum + course.completedLessons,
													0,
												)}
											</div>
											<p className="text-xs text-muted-foreground">
												Keep up the great work!
											</p>
										</CardContent>
									</Card>

									<Card>
										<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
											<CardTitle className="text-sm font-medium">
												Average Progress
											</CardTitle>
											<TrendingUp className="h-4 w-4 text-muted-foreground" />
										</CardHeader>
										<CardContent>
											<div className="text-2xl font-bold">
												{Math.round(
													enrolledCourses.reduce(
														(sum, course) => sum + course.progress,
														0,
													) / enrolledCourses.length,
												)}
												%
											</div>
											<p className="text-xs text-muted-foreground">
												Across all courses
											</p>
										</CardContent>
									</Card>
								</div>

								{/* Enrolled Courses */}
								<div>
									<h2 className="text-2xl font-bold mb-6">Continue Learning</h2>
									<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
										{enrolledCourses.map((course) => (
											<Card key={course.id} className="overflow-hidden">
												<div className="flex">
													<Image
														src={course.thumbnail || "/placeholder.svg"}
														alt={course.title}
														width={160}
														height={120}
														className="w-40 h-30 object-cover"
													/>
													<div className="flex-1 p-4">
														<div className="flex items-start justify-between mb-2">
															<div>
																<h3 className="font-semibold text-lg line-clamp-2">
																	{course.title}
																</h3>
																<p className="text-sm text-gray-600">
																	by{" "}
																	{course.teacherName ||
																		course.instructor ||
																		"Unknown Teacher"}
																</p>
															</div>
															<div className="flex items-center">
																<Star className="h-4 w-4 text-yellow-400 mr-1" />
																<span className="text-sm">
																	{course.rating}
																</span>
															</div>
														</div>

														<div className="space-y-3">
															<div>
																<div className="flex justify-between text-sm text-gray-600 mb-1">
																	<span>Progress</span>
																	<span>
																		{course.completedLessons}/
																		{course.totalLessons} lessons
																	</span>
																</div>
																<Progress value={course.progress} className="h-2" />
															</div>

															<p className="text-sm text-gray-600">
																Last watched: {course.lastWatched}
															</p>

															<Link href={`/student/courses/${course._id?.toString() || course.id}`}>
																<Button className="w-full">
																	<Play className="mr-2 h-4 w-4" />
																	Continue Learning
																</Button>
															</Link>
														</div>
													</div>
												</div>
											</Card>
										))}
									</div>
								</div>
							</TabsContent>

							<TabsContent value="browse" className="space-y-6">
								<div className="flex items-center justify-between mb-4">
									<h2 className="text-2xl font-bold">Browse Courses</h2>
									<Button variant="outline">
										<Filter className="mr-2 h-4 w-4" />
										Filters
									</Button>
								</div>
								<div className="flex items-center mb-6">
									<div className="relative w-full max-w-md">
										<Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
										<Input
											placeholder="Search courses..."
											value={searchQuery}
											onChange={(e) => setSearchQuery(e.target.value)}
											className="pl-10 w-full"
										/>
									</div>
								</div>
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
									{filteredCourses.map((course) => {
										const courseId = course._id?.toString() || course.id
										return (
											<Card
												key={courseId}
												className="overflow-hidden hover:shadow-lg transition-shadow"
											>
												<div className="relative">
													<Image
														src={course.thumbnail || "/placeholder.svg"}
														alt={course.title}
														width={300}
														height={200}
														className="w-full h-48 object-cover"
													/>
													<Badge className="absolute top-2 right-2 bg-blue-600">
														{course.subject}
													</Badge>
												</div>
												<CardHeader>
													<CardTitle className="line-clamp-2">
														{course.title}
													</CardTitle>
													<CardDescription className="flex items-center">
														<User className="h-4 w-4 mr-1" />
														{course.teacherName || course.instructor || "Unknown Teacher"}
													</CardDescription>
												</CardHeader>
												<CardContent>
													<div className="flex items-center justify-between text-sm text-gray-600 mb-4">
														<div className="flex items-center">
															<Star className="h-4 w-4 text-yellow-400 mr-1" />
															<span>{course.rating}</span>
															<span className="ml-2">
																({course.students} students)
															</span>
														</div>
														<div className="flex items-center">
															<Clock className="h-4 w-4 mr-1" />
															{course.duration}
														</div>
													</div>

													<div className="flex items-center justify-between">
														<div className="text-2xl font-bold text-green-600">
															LKR {course.price}
														</div>
														<div className="flex space-x-2">
															{/* <Button variant="outline" size="sm">
																<Heart className="h-4 w-4" />
															</Button> */}
															{/* Enroll Now button logic */}
															{enrollStatus[courseId] === 'pending' ? (
																<Button size="sm" disabled className="bg-yellow-500 text-white">Pending Approval</Button>
															) : enrollStatus[courseId] === 'error' ? (
																<Button size="sm" variant="destructive" disabled>Error</Button>
															) : (
																<Button
																	size="sm"
																	className="bg-blue-600 hover:bg-blue-700"
																	onClick={() => handleEnrollRequest(course)}
																>
																	Enroll Now
																</Button>
															)}
														</div>
													</div>
												</CardContent>
											</Card>
										)
									})}
								</div>
							</TabsContent>

							<TabsContent value="profile" className="space-y-6">
								<h2 className="text-2xl font-bold">My Profile</h2>

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
												<div className="mx-auto w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-4">
													<User className="h-12 w-12 text-blue-600" />
												</div>
											)}
											<CardTitle>{user?.displayName || "Student"}</CardTitle>
											<CardDescription>
												{user?.email}
											</CardDescription>
											<CardDescription>
												Student since {user?.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : "Recently"}
											</CardDescription>
										</CardHeader>
										<CardContent>
											<div className="space-y-4">
												<div className="text-center">
													<div className="text-2xl font-bold text-blue-600">
														{enrolledCourses.length}
													</div>
													<p className="text-sm text-gray-600">
														Courses Enrolled
													</p>
												</div>
												<div className="text-center">
													<div className="text-2xl font-bold text-green-600">
														{enrolledCourses.reduce(
															(sum, course) => sum + course.completedLessons,
															0,
														)}
													</div>
													<p className="text-sm text-gray-600">
														Lessons Completed
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
											<CardTitle>Learning Activity</CardTitle>
											<CardDescription>
												Your recent learning progress
											</CardDescription>
										</CardHeader>
										<CardContent>
											<div className="space-y-6">
												{enrolledCourses.map((course) => (
													<div
														key={course.id}
														className="border-l-4 border-blue-500 pl-4"
													>
														<h4 className="font-semibold">{course.title}</h4>
														<p className="text-sm text-gray-600 mb-2">
															Last activity: {course.lastWatched}
														</p>
														<div className="flex items-center space-x-4">
															<Progress value={course.progress} className="flex-1 h-2" />
															<span className="text-sm font-medium">
																{course.progress}%
															</span>
														</div>
													</div>
												))}
											</div>
										</CardContent>
									</Card>
								</div>

								<Card>
									<CardHeader>
										<CardTitle>Achievements</CardTitle>
										<CardDescription>
											Your learning milestones
										</CardDescription>
									</CardHeader>
									<CardContent>
										<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
											<div className={`text-center p-4 border rounded-lg ${enrolledCourses.length > 0 ? '' : 'opacity-50'}`}>
												<Award className={`h-8 w-8 mx-auto mb-2 ${enrolledCourses.length > 0 ? 'text-yellow-500' : 'text-gray-400'}`} />
												<h4 className="font-semibold">First Course</h4>
												<p className="text-sm text-gray-600">
													{enrolledCourses.length > 0 ? 'Enrolled in your first course' : 'Enroll in your first course'}
												</p>
											</div>
											<div className={`text-center p-4 border rounded-lg ${enrolledCourses.reduce((sum, course) => sum + course.completedLessons, 0) >= 10 ? '' : 'opacity-50'}`}>
												<BookOpen className={`h-8 w-8 mx-auto mb-2 ${enrolledCourses.reduce((sum, course) => sum + course.completedLessons, 0) >= 10 ? 'text-blue-500' : 'text-gray-400'}`} />
												<h4 className="font-semibold">Quick Learner</h4>
												<p className="text-sm text-gray-600">
													{enrolledCourses.reduce((sum, course) => sum + course.completedLessons, 0) >= 10 ? 'Completed 10+ lessons' : `Complete ${10 - enrolledCourses.reduce((sum, course) => sum + course.completedLessons, 0)} more lessons`}
												</p>
											</div>
											<div className={`text-center p-4 border rounded-lg ${enrolledCourses.some(course => course.progress === 100) ? '' : 'opacity-50'}`}>
												<Star className={`h-8 w-8 mx-auto mb-2 ${enrolledCourses.some(course => course.progress === 100) ? 'text-yellow-500' : 'text-gray-400'}`} />
												<h4 className="font-semibold">Course Master</h4>
												<p className="text-sm text-gray-600">
													{enrolledCourses.some(course => course.progress === 100) ? 'Completed your first course' : 'Complete your first course'}
												</p>
											</div>
										</div>
									</CardContent>
								</Card>
							</TabsContent>
						</Tabs>
					)}
				</div>

				{/* Payment Enrollment Modal */}
				<PaymentEnrollmentModal
					isOpen={showPaymentModal}
					onClose={() => {
						setShowPaymentModal(false)
						setSelectedCourse(null)
						setBankDetails(null)
					}}
					course={selectedCourse}
					bankDetails={bankDetails}
					onSubmit={handlePaymentEnrollment}
					isLoading={enrollmentLoading}
				/>

				{/* Edit Profile Modal */}
				<EditProfileModal
					isOpen={showEditProfileModal}
					onClose={() => setShowEditProfileModal(false)}
					userType="student"
				/>
			</div>
		</ProtectedRoute>
	)
}
