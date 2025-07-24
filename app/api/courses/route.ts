import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

// GET: List all courses (for students to browse) with dynamic student count
export async function GET() {
  const client = await clientPromise
  const db = client.db()
  
  try {
    const courses = await db.collection("courses").find({}).toArray()
    
    // Calculate dynamic student count for each course from enrollments
    const coursesWithStudentCount = await Promise.all(
      courses.map(async (course) => {
        const studentCount = await db.collection("enrollments").countDocuments({
          courseId: course._id.toString(),
          status: "approved"
        })
        
        return {
          ...course,
          students: studentCount
        }
      })
    )
    
    return NextResponse.json(coursesWithStudentCount)
  } catch (error) {
    console.error("Error fetching courses:", error)
    return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 })
  }
}
