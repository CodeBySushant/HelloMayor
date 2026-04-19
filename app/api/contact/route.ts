import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../lib/db";
import { requireAdmin } from "@/lib/auth";

// =======================
// GET (PROTECTED - admin only)
// =======================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let messages: any[];

    if (status && status !== "all") {
      [messages] = (await db.query(
        `SELECT * FROM contact_messages WHERE status = ? ORDER BY created_at DESC`,
        [status]
      )) as any;
    } else {
      [messages] = (await db.query(
        `SELECT * FROM contact_messages ORDER BY created_at DESC`
      )) as any;
    }

    return NextResponse.json({ success: true, data: messages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

// =======================
// POST (PUBLIC - contact form submission)
// =======================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, subject, message } = body;

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: name, email, subject, message" },
        { status: 400 }
      );
    }

    const [result]: any = await db.query(
      `INSERT INTO contact_messages (name, email, phone, subject, message)
       VALUES (?, ?, ?, ?, ?)`,
      [name, email, phone ?? null, subject, message]
    );

    const [newMessage]: any = await db.query(
      `SELECT * FROM contact_messages WHERE id = ?`,
      [result.insertId]
    );

    return NextResponse.json({ success: true, data: newMessage[0] }, { status: 201 });
  } catch (error) {
    console.error("Error creating message:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send message" },
      { status: 500 }
    );
  }
}

// =======================
// PATCH (PROTECTED - mark read/responded + response text)
// =======================
export async function PATCH(request: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const body = await request.json();
    const { id, status, response_message } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Message ID is required" },
        { status: 400 }
      );
    }

    const [existing]: any = await db.query(
      `SELECT id FROM contact_messages WHERE id = ?`,
      [id]
    );
    if (!existing || existing.length === 0) {
      return NextResponse.json(
        { success: false, error: "Message not found" },
        { status: 404 }
      );
    }

    await db.query(
      `UPDATE contact_messages 
       SET 
         status = COALESCE(?, status),
         response_message = COALESCE(?, response_message),
         responded_at = CASE WHEN ? = 'responded' THEN NOW() ELSE responded_at END
       WHERE id = ?`,
      [status ?? null, response_message ?? null, status ?? null, id]
    );

    const [updated]: any = await db.query(
      `SELECT * FROM contact_messages WHERE id = ?`,
      [id]
    );

    return NextResponse.json({ success: true, data: updated[0] });
  } catch (error) {
    console.error("Error updating message:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update message" },
      { status: 500 }
    );
  }
}

// =======================
// DELETE (PROTECTED)
// =======================
export async function DELETE(request: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Message ID is required" },
        { status: 400 }
      );
    }

    const [existing]: any = await db.query(
      `SELECT id FROM contact_messages WHERE id = ?`,
      [id]
    );
    if (!existing || existing.length === 0) {
      return NextResponse.json(
        { success: false, error: "Message not found" },
        { status: 404 }
      );
    }

    await db.query(`DELETE FROM contact_messages WHERE id = ?`, [id]);

    return NextResponse.json({ success: true, message: "Message deleted successfully" });
  } catch (error) {
    console.error("Error deleting message:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete message" },
      { status: 500 }
    );
  }
}