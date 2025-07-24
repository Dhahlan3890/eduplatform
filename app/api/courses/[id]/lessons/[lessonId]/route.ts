import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

// PATCH: Mark a lesson as completed for a course for a specific student
export async function PATCH(req: Request, context: { params: { id: string, lessonId: string } }) {
  const params = context.params
  const client = await clientPromise
  const db = client.db()
  const { completed, studentId } = await req.json()
  if (!studentId) {
    return NextResponse.json({ error: "Missing studentId" }, { status: 400 })
  }
  try {
    // Find the enrollment for this student and course
    const enrollment = await db.collection("enrollments").findOne({ courseId: params.id, studentId })
    if (!enrollment) {
      return NextResponse.json({ error: "Enrollment not found" }, { status: 404 })
    }
    // Update the completedLessons array in the enrollment
    let completedLessons = enrollment.completedLessons || []
    if (completed) {
      if (!completedLessons.includes(params.lessonId)) {
        completedLessons.push(params.lessonId)
      }
    } else {
      completedLessons = completedLessons.filter((id: string) => id !== params.lessonId)
    }
    await db.collection("enrollments").updateOne(
      { _id: enrollment._id },
      { $set: { completedLessons } }
    )
    return NextResponse.json({ success: true, completedLessons })
  } catch (e) {
    return NextResponse.json({ error: "Failed to update lesson completion" }, { status: 500 })
  }
}
