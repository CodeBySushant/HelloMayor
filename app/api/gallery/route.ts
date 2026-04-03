import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

const sql = neon(process.env.DATABASE_URL!);

// ✅ GET
export async function GET() {
  try {
    const items = await sql`
      SELECT * FROM gallery
      ORDER BY is_featured DESC, sort_order ASC, created_at DESC
    `;

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
      title,        
      image_url,    
      is_featured,
      sort_order
    } = body;

    const result = await sql`
      INSERT INTO gallery (title, image_url, is_featured, sort_order)
      VALUES (
        ${title},
        ${image_url},
        ${is_featured || false},
        ${sort_order || 0}
      )
      RETURNING *
    `;

    return NextResponse.json({ success: true, data: result[0] });
  } catch (error) {
    console.error("Gallery create error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create gallery item" },
      { status: 500 }
    );
  }
}