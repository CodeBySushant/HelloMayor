import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../lib/db";
import { requireAdmin } from "@/lib/auth";

// =======================
// GET (PUBLIC)
// =======================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const limit = parseInt(searchParams.get("limit") || "12");

    const conditions: string[] = [];
    const params: any[] = [];

    if (category && category !== "all") {
      conditions.push(`category = ?`);
      params.push(category);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const query = `
      SELECT id, title_en, title_np, description_en, description_np,
             media_type, media_url, thumbnail_url, category, event_date,
             is_featured, sort_order, created_at
      FROM gallery_items
      ${where}
      ORDER BY is_featured DESC, sort_order ASC, created_at DESC
      LIMIT ?
    `;
    params.push(limit);

    const [items]: any = await db.query(query, params);

    return NextResponse.json({ success: true, data: items });
  } catch (error) {
    console.error("Gallery fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch gallery items" },
      { status: 500 }
    );
  }
}

// =======================
// POST (PROTECTED)
// =======================
export async function POST(request: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const body = await request.json();
    const {
      title_en, title_np, description_en, description_np,
      media_type, media_url, thumbnail_url,
      category, event_date, is_featured,
    } = body;

    if (!title_en || !media_url) {
      return NextResponse.json(
        { success: false, error: "Title and media URL are required" },
        { status: 400 }
      );
    }

    const [result]: any = await db.query(
      `INSERT INTO gallery_items (
        title_en, title_np, description_en, description_np,
        media_type, media_url, thumbnail_url,
        category, event_date, is_featured
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title_en,
        title_np ?? null,
        description_en ?? null,
        description_np ?? null,
        media_type ?? "image",
        media_url,
        thumbnail_url ?? media_url,
        category ?? "general",
        event_date ?? null,
        is_featured ?? false,
      ]
    );

    const [newItem]: any = await db.query(
      `SELECT * FROM gallery_items WHERE id = ?`,
      [result.insertId]
    );

    return NextResponse.json({ success: true, data: newItem[0] });
  } catch (error) {
    console.error("Gallery create error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create gallery item" },
      { status: 500 }
    );
  }
}