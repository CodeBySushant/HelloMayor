import { NextRequest, NextResponse } from "next/server";
import { sql } from "../../../lib/db";

function generateTrackingId(): string {
  const prefix = "CMP";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

export async function GET(request: NextRequest) {
  if (!sql)
    return NextResponse.json(
      { success: false, error: "Database not configured" },
      { status: 500 },
    );
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const trackingId = searchParams.get("trackingId");

    let complaints;

    if (trackingId) {
      complaints = await sql`
        SELECT * FROM complaints WHERE tracking_id = ${trackingId}
      `;
    } else if (status && status !== "all") {
      complaints = await sql`
        SELECT * FROM complaints WHERE status = ${status} ORDER BY created_at DESC
      `;
    } else {
      complaints = await sql`
        SELECT * FROM complaints ORDER BY created_at DESC
      `;
    }

    return NextResponse.json({ success: true, data: complaints });
  } catch (error) {
    console.error("Error fetching complaints:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch complaints" },
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
    const {
      name,
      email,
      phone,
      address,
      category,
      subject,
      description,
      priority,
    } = body;

    if (!name || !phone || !category || !subject || !description) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 },
      );
    }

    const trackingId = generateTrackingId();

    const result = await sql`
      INSERT INTO complaints (tracking_id, name, email, phone, address, category, subject, description, priority)
      VALUES (${trackingId}, ${name}, ${email || null}, ${phone}, ${address || null}, ${category}, ${subject}, ${description}, ${priority || "medium"})
      RETURNING *
    `;

    return NextResponse.json({ success: true, data: result[0], trackingId });
  } catch (error) {
    console.error("Error creating complaint:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create complaint" },
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
    const { id, status, admin_notes, assigned_to } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Complaint ID is required" },
        { status: 400 },
      );
    }

    const updates: string[] = [];
    const values: Record<string, unknown> = { id };

    if (status) {
      values.status = status;
    }
    if (admin_notes !== undefined) {
      values.admin_notes = admin_notes;
    }
    if (assigned_to !== undefined) {
      values.assigned_to = assigned_to;
    }

    const result = await sql`
      UPDATE complaints 
      SET 
        status = COALESCE(${status || null}, status),
        admin_notes = COALESCE(${admin_notes || null}, admin_notes),
        assigned_to = COALESCE(${assigned_to || null}, assigned_to),
        updated_at = NOW(),
        resolved_at = CASE WHEN ${status} = 'resolved' THEN NOW() ELSE resolved_at END
      WHERE id = ${id}
      RETURNING *
    `;

    return NextResponse.json({ success: true, data: result[0] });
  } catch (error) {
    console.error("Error updating complaint:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update complaint" },
      { status: 500 },
    );
  }
}
