import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function GET(req: Request) {
  const client = await clientPromise
  const db = client.db()
  // Replace with user-specific query if needed
  const courses = await db.collection("student_courses").find({}).toArray()
  return NextResponse.json(courses)
}
