// DELETE: Delete a course by ID
export async function DELETE(req: Request, context: { params: { id: string } }) {
  const params = context.params;
  const client = await clientPromise;
  const db = client.db();
  try {
    const result = await db.collection("courses").deleteOne({ _id: new ObjectId(params.id) });
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    let detail = "";
    if (e && typeof e === "object" && "message" in e) {
      detail = (e as any).message;
    } else {
      detail = JSON.stringify(e);
    }
    return NextResponse.json({ error: "Failed to delete course", detail }, { status: 400 });
  }
}
import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

// PATCH: Update a course by ID
export async function PATCH(req: Request, context: { params: { id: string } }) {
  const params = context.params;
  const client = await clientPromise;
  const db = client.db();
  try {
    const body = await req.json();
    const updateFields = { ...body };
    // Remove _id if present to avoid immutable field error
    delete updateFields._id;
    console.log("PATCH /api/courses/[id]", { id: params.id, updateFields });
    const result = await db.collection("courses").updateOne(
      { _id: new ObjectId(params.id) },
      { $set: updateFields }
    );
    if (result.matchedCount === 0) {
      console.error("Course not found for id", params.id);
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }
    const updated = await db.collection("courses").findOne({ _id: new ObjectId(params.id) });
    return NextResponse.json(updated);
  } catch (e) {
    console.error("PATCH /api/courses/[id] error", e);
    let detail = "";
    if (e && typeof e === "object" && "message" in e) {
      detail = (e as any).message;
    } else {
      detail = JSON.stringify(e);
    }
    return NextResponse.json({ error: "Failed to update course", detail }, { status: 400 });
  }
}

// GET: Get a single course by ID
export async function GET(req: Request, context: { params: { id: string } }) {
  const params = context.params
  const client = await clientPromise
  const db = client.db()
  try {
    const course = await db.collection("courses").findOne({ _id: new ObjectId(params.id) })
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }
    return NextResponse.json(course)
  } catch (e) {
    return NextResponse.json({ error: "Invalid course ID" }, { status: 400 })
  }
}
