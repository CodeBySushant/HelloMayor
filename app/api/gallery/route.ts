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
    const limit = searchParams.get("limit");

    let query = `
      SELECT id, title_en, title_np, description_en, description_np,
             media_type, media_url, thumbnail_url, category, event_date,
             is_featured, sort_order, created_at
      FROM gallery_items
    `;
    const params: any[] = [];

    if (category && category !== "all") {
      query += ` WHERE category = ?`;
      params.push(category);
    }

    query += ` ORDER BY is_featured DESC, sort_order ASC, created_at DESC`;

    if (limit) {
      query += ` LIMIT ?`;
      params.push(Number(limit));
    }

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
// POST — Upload file to VPS then save URL in DB
// =======================
export async function POST(request: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const title_en = formData.get("title_en") as string;
    const title_np = formData.get("title_np") as string | null;
    const description_en = formData.get("description_en") as string | null;
    const description_np = formData.get("description_np") as string | null;
    const media_type = (formData.get("media_type") as string) || "image";
    const category = (formData.get("category") as string) || "general";
    const event_date = formData.get("event_date") as string | null;
    const is_featured = formData.get("is_featured") === "true";

    if (!title_en) {
      return NextResponse.json(
        { success: false, error: "Title (English) is required" },
        { status: 400 }
      );
    }

    let media_url = formData.get("media_url") as string | null;

    // Upload file to VPS if provided
    if (file) {
      const vpsUrl = process.env.VPS_API_URL;
      if (!vpsUrl) {
        return NextResponse.json(
          { success: false, error: "VPS_API_URL is not configured in .env" },
          { status: 500 }
        );
      }

      const vpsForm = new FormData();
      vpsForm.append("file", file);

      const vpsRes = await fetch(`${vpsUrl}/api/upload`, {
        method: "POST",
        headers: { "x-api-key": process.env.VPS_API_KEY || "" },
        body: vpsForm,
      });

      if (!vpsRes.ok) {
        const err = await vpsRes.text();
        console.error("VPS upload error:", err);
        return NextResponse.json(
          { success: false, error: "File upload to VPS failed" },
          { status: 502 }
        );
      }

      const vpsData = await vpsRes.json();
      media_url = vpsData.url;
    }

    if (!media_url) {
      return NextResponse.json(
        { success: false, error: "Provide either a file upload or a media_url" },
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
        media_type,
        media_url,
        media_url, // thumbnail = same URL for now
        category,
        event_date || null,
        is_featured,
      ]
    );

    const [newItem]: any = await db.query(
      `SELECT * FROM gallery_items WHERE id = ?`,
      [result.insertId]
    );

    return NextResponse.json({ success: true, data: newItem[0] }, { status: 201 });
  } catch (error) {
    console.error("Gallery create error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create gallery item" },
      { status: 500 }
    );
  }
}

// =======================
// PUT — Full update (metadata only, no file re-upload)
// =======================
export async function PUT(request: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const body = await request.json();
    const { id, title_en, title_np, description_en, description_np, category, is_featured, event_date } = body;

    if (!id || !title_en) {
      return NextResponse.json(
        { success: false, error: "id and title_en are required" },
        { status: 400 }
      );
    }

    const [existing]: any = await db.query(
      "SELECT id FROM gallery_items WHERE id = ?", [id]
    );
    if (!existing?.length) {
      return NextResponse.json({ success: false, error: "Item not found" }, { status: 404 });
    }

    await db.query(
      `UPDATE gallery_items SET
        title_en       = ?,
        title_np       = ?,
        description_en = ?,
        description_np = ?,
        category       = ?,
        is_featured    = ?,
        event_date     = ?
      WHERE id = ?`,
      [
        title_en,
        title_np ?? null,
        description_en ?? null,
        description_np ?? null,
        category ?? "general",
        is_featured ? 1 : 0,
        event_date || null,
        id,
      ]
    );

    const [updated]: any = await db.query(
      "SELECT * FROM gallery_items WHERE id = ?", [id]
    );
    return NextResponse.json({ success: true, data: updated[0] });
  } catch (error) {
    console.error("Gallery update error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update gallery item" },
      { status: 500 }
    );
  }
}

// =======================
// DELETE — removes from DB and VPS storage
// =======================
export async function DELETE(request: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));

    if (!id) {
      return NextResponse.json({ success: false, error: "id is required" }, { status: 400 });
    }

    const [rows]: any = await db.query(
      "SELECT media_url FROM gallery_items WHERE id = ?", [id]
    );

    if (!rows?.length) {
      return NextResponse.json({ success: false, error: "Item not found" }, { status: 404 });
    }

    const mediaUrl: string = rows[0].media_url;
    const vpsUrl = process.env.VPS_API_URL;

    // Delete from VPS storage only if URL belongs to our VPS
    if (vpsUrl && mediaUrl.startsWith(vpsUrl)) {
      try {
        await fetch(`${vpsUrl}/api/delete`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.VPS_API_KEY || "",
          },
          body: JSON.stringify({ url: mediaUrl }),
        });
      } catch (vpsErr) {
        console.warn("VPS delete failed (non-fatal):", vpsErr);
      }
    }

    await db.query("DELETE FROM gallery_items WHERE id = ?", [id]);

    return NextResponse.json({ success: true, message: "Deleted successfully" });
  } catch (error) {
    console.error("Gallery delete error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete gallery item" },
      { status: 500 }
    );
  }
}