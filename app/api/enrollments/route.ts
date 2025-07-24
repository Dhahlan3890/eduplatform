import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { sendEmail } from "@/lib/sendEmail"
import { ObjectId } from "mongodb"

// POST: Student requests to enroll in a course
export async function POST(req: Request) {
  const { courseId, studentId, studentEmail, studentName, teacherId, teacherEmail, courseTitle, paymentReceipt, bankDetails } = await req.json()
  const client = await clientPromise
  const db = client.db()
  // Create pending enrollment
  const result = await db.collection("enrollments").insertOne({
    courseId, 
    studentId, 
    studentEmail, 
    studentName, 
    teacherId, 
    courseTitle,
    status: "pending", 
    requestedAt: new Date().toISOString(),
    paymentReceipt,
    bankDetails
  })
  // Send email to teacher
  await sendEmail({
    to: teacherEmail,
    subject: `New enrollment request for ${courseTitle}`,
    text: `${studentName} (${studentEmail}) has requested to enroll in your course: ${courseTitle}. Payment receipt has been submitted. Please review and approve in your dashboard.`
  })
  // Return the inserted enrollment for UI update
  const inserted = await db.collection("enrollments").findOne({ _id: result.insertedId })
  return NextResponse.json(inserted)
}

// PATCH: Teacher approves or rejects enrollment
export async function PATCH(req: Request) {
  const { enrollmentId, status } = await req.json()
  const client = await clientPromise
  const db = client.db()
  await db.collection("enrollments").updateOne({ _id: new ObjectId(enrollmentId) }, { $set: { status } })
  return NextResponse.json({ success: true })
}

// GET: Teacher fetches all enrollments for their courses
export async function GET(req: Request) {
  const url = new URL(req.url!)
  const teacherId = url.searchParams.get("teacherId")
  const studentId = url.searchParams.get("studentId")
  const client = await clientPromise
  const db = client.db()
  let enrollments: any[] = []
  if (teacherId) {
    enrollments = await db.collection("enrollments").find({ teacherId }).toArray()
  } else if (studentId) {
    enrollments = await db.collection("enrollments").find({ studentId }).toArray()
  }
  return NextResponse.json(enrollments)
}
