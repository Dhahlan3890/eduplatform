import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

// GET: List all courses for a teacher (by teacherId) with dynamic student count and revenue
export async function GET(req: Request) {
  const url = new URL(req.url!)
  const teacherId = url.searchParams.get("teacherId")
  const client = await clientPromise
  const db = client.db()
  
  try {
    const query = teacherId ? { teacherId } : {}
    const courses = await db.collection("courses").find(query).toArray()
    
    // Calculate dynamic student count and revenue for each course from enrollments
    const coursesWithDynamicData = await Promise.all(
      courses.map(async (course) => {
        const studentCount = await db.collection("enrollments").countDocuments({
          courseId: course._id.toString(),
          status: "approved"
        })
        
        // Calculate revenue as student count * course price
        const revenue = studentCount * (course.price || 0)
        
        return {
          ...course,
          students: studentCount,
          revenue: revenue
        }
      })
    )
    
    return NextResponse.json(coursesWithDynamicData)
  } catch (error) {
    console.error("Error fetching teacher courses:", error)
    return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 })
  }
}

// POST: Create a new course
export async function POST(req: Request) {
  const body = await req.json()
  const client = await clientPromise
  const db = client.db()
  const result = await db.collection("courses").insertOne(body)
  return NextResponse.json({ insertedId: result.insertedId })
}
