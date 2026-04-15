import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../lib/db";
import { requireAdmin } from "@/lib/auth";


// =======================
// GET (PUBLIC)
// =======================
export async function GET() {
  try {
    const [notices]: any = await db.query(`
      SELECT * FROM notices 
      WHERE (expiry_date IS NULL OR expiry_date >= CURDATE())
      ORDER BY is_important DESC, publish_date DESC
    `);

    return NextResponse.json({ success: true, data: notices });

  } catch (error) {
    console.error("Error fetching notices:", error);

    return NextResponse.json(
      { success: false, error: "Failed to fetch notices" },
      { status: 500 }
    );
  }
}


// =======================
// POST (PROTECTED - CLEAN)
// =======================
export async function POST(request: NextRequest) {
  // 🔥 CLEAN AUTH
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const body = await request.json();

    const {
      title_en,
      title_np,
      content_en,
      content_np,
      category,
      is_important,
      expiry_date,
      attachment_url,
    } = body;

    if (!title_en || !content_en) {
      return NextResponse.json(
        { success: false, error: "Title and content are required" },
        { status: 400 }
      );
    }

    const [result]: any = await db.query(
      `INSERT INTO notices 
       (title_en, title_np, content_en, content_np, category, is_important, expiry_date, attachment_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title_en,
        title_np ?? null,
        content_en,
        content_np ?? null,
        category ?? null,
        is_important ?? false,
        expiry_date ?? null,
        attachment_url ?? null,
      ]
    );

    const [newNotice]: any = await db.query(
      `SELECT * FROM notices WHERE id = ?`,
      [result.insertId]
    );

    return NextResponse.json({
      success: true,
      data: newNotice[0],
    });

  } catch (error) {
    console.error("Error creating notice:", error);

    return NextResponse.json(
      { success: false, error: "Failed to create notice" },
      { status: 500 }
    );
  }
}