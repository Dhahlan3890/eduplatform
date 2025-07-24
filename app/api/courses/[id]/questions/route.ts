import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

// GET: Get all questions for a course
export async function GET(req: Request, context: { params: { id: string } }) {
  const params = context.params
  const client = await clientPromise
  const db = client.db()
  const questions = await db.collection("questions").find({ courseId: params.id }).sort({ createdAt: -1 }).toArray()
  return NextResponse.json(questions)
}

// POST: Add a new question to a course
export async function POST(req: Request, context: { params: { id: string } }) {
  const params = context.params
  const client = await clientPromise
  const db = client.db()
  const { studentId, studentName, question } = await req.json()
  if (!question || !studentId) {
    return NextResponse.json({ error: "Missing question or studentId" }, { status: 400 })
  }
  const doc = {
    courseId: params.id,
    studentId,
    studentName,
    question,
    answer: null,
    answeredBy: null,
    answeredAt: null,
    createdAt: new Date().toISOString(),
  }
  const result = await db.collection("questions").insertOne(doc)
  return NextResponse.json({ ...doc, _id: result.insertedId })
}
