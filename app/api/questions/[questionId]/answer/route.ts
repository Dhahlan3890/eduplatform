import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

// PATCH: Answer a question
export async function PATCH(req: Request, context: { params: { questionId: string } }) {
  const params = context.params
  const client = await clientPromise
  const db = client.db()
  const { answer, answeredBy } = await req.json()
  if (!answer || !answeredBy) {
    return NextResponse.json({ error: "Missing answer or answeredBy" }, { status: 400 })
  }
  const result = await db.collection("questions").updateOne(
    { _id: new ObjectId(params.questionId) },
    { $set: { answer, answeredBy, answeredAt: new Date().toISOString() } }
  )
  if (result.modifiedCount === 0) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 })
  }
  return NextResponse.json({ success: true })
}
