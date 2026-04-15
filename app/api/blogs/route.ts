import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../lib/db";
import { requireAdmin } from "@/lib/auth";


// =======================
// GET (PUBLIC)
// =======================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const featured = searchParams.get("featured");
    const slug = searchParams.get("slug");

    let blogs: any[];

    if (slug) {
      [blogs] = await db.query(
        `SELECT * FROM blogs WHERE slug = ? AND is_published = true`,
        [slug]
      ) as any;

      if (blogs.length > 0) {
        await db.query(
          `UPDATE blogs SET view_count = view_count + 1 WHERE slug = ?`,
          [slug]
        );
      }

    } else if (featured === "true") {
      [blogs] = await db.query(
        `SELECT * FROM blogs 
         WHERE is_featured = true AND is_published = true 
         ORDER BY published_at DESC LIMIT 3`
      ) as any;

    } else {
      [blogs] = await db.query(
        `SELECT * FROM blogs 
         WHERE is_published = true 
         ORDER BY published_at DESC`
      ) as any;
    }

    return NextResponse.json({ success: true, data: blogs });

  } catch (error) {
    console.error("Error fetching blogs:", error);

    return NextResponse.json(
      { success: false, error: "Failed to fetch blogs" },
      { status: 500 }
    );
  }
}


// =======================
// POST (PROTECTED - CLEAN)
// =======================
export async function POST(request: NextRequest) {
  // 🔥 CLEAN AUTH (no repetition)
  const authError = requireAdmin();
  if (authError) return authError;

  try {
    const body = await request.json();

    const {
      title_en,
      title_np,
      slug,
      excerpt_en,
      excerpt_np,
      content_en,
      content_np,
      cover_image_url,
      author_name,
      category,
      tags,
      is_featured,
    } = body;

    if (!title_en || !content_en || !slug) {
      return NextResponse.json(
        { success: false, error: "Title, content and slug are required" },
        { status: 400 }
      );
    }

    const [result]: any = await db.query(
      `INSERT INTO blogs 
        (title_en, title_np, slug, excerpt_en, excerpt_np, content_en, content_np, cover_image_url, author_name, category, tags, is_featured)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title_en,
        title_np ?? null,
        slug,
        excerpt_en ?? null,
        excerpt_np ?? null,
        content_en,
        content_np ?? null,
        cover_image_url ?? null,
        author_name ?? null,
        category ?? null,
        tags ?? null,
        is_featured ?? false,
      ]
    );

    const [newBlog]: any = await db.query(
      `SELECT * FROM blogs WHERE id = ?`,
      [result.insertId]
    );

    return NextResponse.json({
      success: true,
      data: newBlog[0],
    });

  } catch (error) {
    console.error("Error creating blog:", error);

    return NextResponse.json(
      { success: false, error: "Failed to create blog" },
      { status: 500 }
    );
  }
}