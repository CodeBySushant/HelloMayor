import { NextRequest, NextResponse } from "next/server";
import { sql } from "../../../lib/db";

export async function GET(request: NextRequest) {
  if (!sql)
    return NextResponse.json(
      { success: false, error: "Database not configured" },
      { status: 500 },
    );
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let messages;

    if (status && status !== "all") {
      messages = await sql`
        SELECT * FROM contact_messages WHERE status = ${status} ORDER BY created_at DESC
      `;
    } else {
      messages = await sql`
        SELECT * FROM contact_messages ORDER BY created_at DESC
      `;
    }

    return NextResponse.json({ success: true, data: messages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch messages" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  if (!sql)
    return NextResponse.json(
      { success: false, error: "Database not configured" },
      { status: 500 },
    );
  try {
    const body = await request.json();
    const { name, email, phone, subject, message } = body;

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 },
      );
    }

    const result = await sql`
      INSERT INTO contact_messages (name, email, phone, subject, message)
      VALUES (${name}, ${email}, ${phone || null}, ${subject}, ${message})
      RETURNING *
    `;

    return NextResponse.json({ success: true, data: result[0] });
  } catch (error) {
    console.error("Error creating message:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send message" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  if (!sql)
    return NextResponse.json(
      { success: false, error: "Database not configured" },
      { status: 500 },
    );
  try {
    const body = await request.json();
    const { id, status, response_message } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Message ID is required" },
        { status: 400 },
      );
    }

    const result = await sql`
      UPDATE contact_messages 
      SET 
        status = COALESCE(${status || null}, status),
        response_message = COALESCE(${response_message || null}, response_message),
        responded_at = CASE WHEN ${status} = 'responded' THEN NOW() ELSE responded_at END
      WHERE id = ${id}
      RETURNING *
    `;

    return NextResponse.json({ success: true, data: result[0] });
  } catch (error) {
    console.error("Error updating message:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update message" },
      { status: 500 },
    );
  }
}
