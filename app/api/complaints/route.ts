import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../lib/db";

function generateTrackingId(): string {
  const prefix = "CMP";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const trackingId = searchParams.get("trackingId");

    let complaints: any[];

    if (trackingId) {
      [complaints] = await db.query(
        `SELECT * FROM complaints WHERE tracking_id = ?`,
        [trackingId]
      ) as any;
    } else if (status && status !== "all") {
      [complaints] = await db.query(
        `SELECT * FROM complaints WHERE status = ? ORDER BY created_at DESC`,
        [status]
      ) as any;
    } else {
      [complaints] = await db.query(
        `SELECT * FROM complaints ORDER BY created_at DESC`
      ) as any;
    }

    return NextResponse.json({ success: true, data: complaints });
  } catch (error) {
    console.error("Error fetching complaints:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch complaints" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, address, category, subject, description, priority } = body;

    if (!name || !phone || !category || !subject || !description) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const trackingId = generateTrackingId();

    const [result]: any = await db.query(
      `INSERT INTO complaints (tracking_id, name, email, phone, address, category, subject, description, priority)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [trackingId, name, email ?? null, phone, address ?? null, category, subject, description, priority ?? "medium"]
    );

    const [newComplaint]: any = await db.query(
      `SELECT * FROM complaints WHERE id = ?`,
      [result.insertId]
    );

    return NextResponse.json({ success: true, data: newComplaint[0], trackingId });
  } catch (error) {
    console.error("Error creating complaint:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create complaint" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, admin_notes, assigned_to } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Complaint ID is required" },
        { status: 400 }
      );
    }

    await db.query(
      `UPDATE complaints 
       SET 
         status = COALESCE(?, status),
         admin_notes = COALESCE(?, admin_notes),
         assigned_to = COALESCE(?, assigned_to),
         updated_at = NOW(),
         resolved_at = CASE WHEN ? = 'resolved' THEN NOW() ELSE resolved_at END
       WHERE id = ?`,
      [status ?? null, admin_notes ?? null, assigned_to ?? null, status ?? null, id]
    );

    const [updated]: any = await db.query(
      `SELECT * FROM complaints WHERE id = ?`,
      [id]
    );

    return NextResponse.json({ success: true, data: updated[0] });
  } catch (error) {
    console.error("Error updating complaint:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update complaint" },
      { status: 500 }
    );
  }
}