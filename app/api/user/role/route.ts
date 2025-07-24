import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

// GET: Get user role by uid
export async function GET(req: Request) {
  const url = new URL(req.url!)
  const uid = url.searchParams.get("uid")
  if (!uid) return NextResponse.json({ error: "Missing uid" }, { status: 400 })
  const client = await clientPromise
  const db = client.db()
  const user = await db.collection("users").findOne({ uid })
  return NextResponse.json({ role: user?.role || "student" })
}

// POST: Set user role by uid
export async function POST(req: Request) {
  const { uid, role, email, displayName } = await req.json()
  if (!uid || !role) return NextResponse.json({ error: "Missing uid or role" }, { status: 400 })
  const client = await clientPromise
  const db = client.db()
  await db.collection("users").updateOne(
    { uid },
    { $set: { uid, role, email, displayName } },
    { upsert: true }
  )
  return NextResponse.json({ success: true })
}
