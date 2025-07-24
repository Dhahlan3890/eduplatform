import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

// GET: Get user profile data
export async function GET(req: Request) {
  try {
    const url = new URL(req.url!)
    const uid = url.searchParams.get("uid")
    
    if (!uid) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db()
    
    const profile = await db.collection("user_profiles").findOne({ uid })
    
    return NextResponse.json(profile || {})
  } catch (error) {
    console.error("Error fetching user profile:", error)
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 })
  }
}

// POST: Create or update user profile
export async function POST(req: Request) {
  try {
    const { uid, bio, expertise, userType } = await req.json()
    
    if (!uid) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db()
    
    const profileData = {
      uid,
      bio,
      userType,
      updatedAt: new Date().toISOString(),
      ...(userType === 'teacher' && { expertise })
    }
    
    // Upsert the profile data
    const result = await db.collection("user_profiles").updateOne(
      { uid },
      { 
        $set: profileData,
        $setOnInsert: { createdAt: new Date().toISOString() }
      },
      { upsert: true }
    )
    
    return NextResponse.json({ 
      success: true, 
      profileId: result.upsertedId || uid 
    })
  } catch (error) {
    console.error("Error saving user profile:", error)
    return NextResponse.json({ error: "Failed to save profile" }, { status: 500 })
  }
}
