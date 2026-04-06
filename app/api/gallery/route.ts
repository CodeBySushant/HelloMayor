import { NextResponse } from "next/server";
import { db } from "../../../lib/db";

// ✅ GET
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    let query = `
      SELECT id, title_en, title_np, description_en, description_np, 
             media_type, media_url, thumbnail_url, category, event_date, 
             is_featured, sort_order, created_at
      FROM gallery_items
    `;
    const params: any[] = [];

    if (category && category !== "all") {
      query += ` WHERE category = ?`;  // use $1 if PostgreSQL
      params.push(category);
    }

    query += ` ORDER BY is_featured DESC, sort_order ASC, created_at DESC`;

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

// ✅ POST
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      title_en,
      title_np,
      description_en,
      description_np,
      media_type,
      media_url,
      thumbnail_url,
      category,
      event_date,
      is_featured,
    } = body;

    const [result]: any = await db.query(
      `INSERT INTO gallery_items (
        title_en, title_np, description_en, description_np,
        media_type, media_url, thumbnail_url, 
        category, event_date, is_featured
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,  // use $1..$10 if PostgreSQL
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

    return NextResponse.json({ success: true, data: result[0] });
  } catch (error) {
    console.error("Gallery create error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create gallery item" },
      { status: 500 }
    );
  }
}