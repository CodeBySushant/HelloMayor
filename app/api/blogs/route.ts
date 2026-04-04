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
    const featured = searchParams.get("featured");
    const slug = searchParams.get("slug");

    let blogs;

    if (slug) {
      blogs = await sql`
        SELECT * FROM blogs WHERE slug = ${slug} AND is_published = true
      `;
      if (blogs.length > 0) {
        await sql`UPDATE blogs SET view_count = view_count + 1 WHERE slug = ${slug}`;
      }
    } else if (featured === "true") {
      blogs = await sql`
        SELECT * FROM blogs WHERE is_featured = true AND is_published = true ORDER BY published_at DESC LIMIT 3
      `;
    } else {
      blogs = await sql`
        SELECT * FROM blogs WHERE is_published = true ORDER BY published_at DESC
      `;
    }

    return NextResponse.json({ success: true, data: blogs });
  } catch (error) {
    console.error("Error fetching blogs:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch blogs" },
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
        { status: 400 },
      );
    }

    const result = await sql`
      INSERT INTO blogs (title_en, title_np, slug, excerpt_en, excerpt_np, content_en, content_np, cover_image_url, author_name, category, tags, is_featured)
      VALUES (${title_en}, ${title_np || null}, ${slug}, ${excerpt_en || null}, ${excerpt_np || null}, ${content_en}, ${content_np || null}, ${cover_image_url || null}, ${author_name || null}, ${category || null}, ${tags || null}, ${is_featured || false})
      RETURNING *
    `;

    return NextResponse.json({ success: true, data: result[0] });
  } catch (error) {
    console.error("Error creating blog:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create blog" },
      { status: 500 },
    );
  }
}
