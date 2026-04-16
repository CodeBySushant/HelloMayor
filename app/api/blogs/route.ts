import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../lib/db";
import { requireAdmin } from "@/lib/auth";

// =======================
// GET (PUBLIC)
// =======================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    let blogs: any[];

    if (slug) {
      [blogs] = await db.query(
        "SELECT * FROM blogs WHERE slug = ? AND is_published = true",
        [slug]
      ) as any;
    } else {
      [blogs] = await db.query(
        "SELECT * FROM blogs WHERE is_published = true ORDER BY created_at DESC"
      ) as any;
    }

    return NextResponse.json({ success: true, data: blogs });

  } catch (error) {
    console.error("Blogs fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch blogs" },
      { status: 500 }
    );
  }
}

// =======================
// POST (CREATE)
// =======================
export async function POST(request: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const body = await request.json();

    const {
      title_en,
      content_en,
      slug,
      cover_image_url,
      category,
      tags,
      is_featured,
    } = body;

    if (!title_en || !content_en || !slug) {
      return NextResponse.json(
        { success: false, error: "Required fields missing" },
        { status: 400 }
      );
    }

    // 🔥 CHECK DUPLICATE SLUG
    const [existing]: any = await db.query(
      "SELECT id FROM blogs WHERE slug = ?",
      [slug]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, error: "Slug already exists" },
        { status: 400 }
      );
    }

    const [result]: any = await db.query(
      `INSERT INTO blogs 
      (title_en, content_en, slug, cover_image_url, category, tags, is_featured)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        title_en,
        content_en,
        slug,
        cover_image_url ?? null,
        category ?? null,
        tags ?? null,
        is_featured ?? false,
      ]
    );

    const [newBlog]: any = await db.query(
      "SELECT * FROM blogs WHERE id = ?",
      [result.insertId]
    );

    return NextResponse.json({
      success: true,
      data: newBlog[0],
    });

  } catch (error) {
    console.error("Create blog error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create blog" },
      { status: 500 }
    );
  }
}

// =======================
// PATCH (UPDATE)
// =======================
export async function PATCH(request: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const body = await request.json();

    const {
      id,
      title_en,
      content_en,
      slug,
      cover_image_url,
      category,
      tags,
      is_featured,
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID required" },
        { status: 400 }
      );
    }

    await db.query(
      `UPDATE blogs SET
        title_en = COALESCE(?, title_en),
        content_en = COALESCE(?, content_en),
        slug = COALESCE(?, slug),
        cover_image_url = COALESCE(?, cover_image_url),
        category = COALESCE(?, category),
        tags = COALESCE(?, tags),
        is_featured = COALESCE(?, is_featured),
        updated_at = NOW()
      WHERE id = ?`,
      [
        title_en ?? null,
        content_en ?? null,
        slug ?? null,
        cover_image_url ?? null,
        category ?? null,
        tags ?? null,
        is_featured ?? null,
        id,
      ]
    );

    const [updated]: any = await db.query(
      "SELECT * FROM blogs WHERE id = ?",
      [id]
    );

    return NextResponse.json({
      success: true,
      data: updated[0],
    });

  } catch (error) {
    console.error("Update blog error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update blog" },
      { status: 500 }
    );
  }
}

// =======================
// DELETE
// =======================
export async function DELETE(request: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));

    if (!id || isNaN(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid ID" },
        { status: 400 }
      );
    }

    await db.query("DELETE FROM blogs WHERE id = ?", [id]);

    return NextResponse.json({
      success: true,
      message: "Deleted successfully",
    });

  } catch (error) {
    console.error("Delete blog error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete" },
      { status: 500 }
    );
  }
}