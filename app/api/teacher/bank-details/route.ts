import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

// GET: Get teacher bank details by teacherId
export async function GET(req: Request) {
  try {
    const url = new URL(req.url!)
    const teacherId = url.searchParams.get("teacherId")
    
    if (!teacherId) {
      return NextResponse.json({ error: "Teacher ID is required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db()
    
    // Try to get actual bank details from database first
    const bankDetails = await db.collection("teacher_bank_details").findOne({ teacherId })
    
    if (bankDetails) {
      return NextResponse.json(bankDetails)
    }
    
    // Return empty response if no bank details found
    return NextResponse.json({})
  } catch (error) {
    console.error("Error fetching bank details:", error)
    return NextResponse.json({ error: "Failed to fetch bank details" }, { status: 500 })
  }
}

// POST: Create or update teacher bank details
export async function POST(req: Request) {
  try {
    const { teacherId, bankDetails } = await req.json()
    
    if (!teacherId || !bankDetails) {
      return NextResponse.json({ error: "Teacher ID and bank details are required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db()
    
    // Update or insert teacher bank details
    const result = await db.collection("teacher_bank_details").updateOne(
      { teacherId },
      { 
        $set: {
          teacherId,
          ...bankDetails,
          updatedAt: new Date().toISOString()
        },
        $setOnInsert: {
          createdAt: new Date().toISOString()
        }
      },
      { upsert: true }
    )
    
    return NextResponse.json({ 
      success: true, 
      bankDetailsId: result.upsertedId || teacherId 
    })
  } catch (error) {
    console.error("Error saving bank details:", error)
    return NextResponse.json({ error: "Failed to save bank details" }, { status: 500 })
  }
}
