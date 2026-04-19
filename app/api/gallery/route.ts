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
// POST — Upload image to VPS then save URL in DB
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
        { success: false, error: "Title is required" },
        { status: 400 }
      );
    }

    let media_url = formData.get("media_url") as string | null;

    // If a file was uploaded, send it to the VPS image server
    if (file) {
      const vpsUrl = process.env.VPS_API_URL;
      if (!vpsUrl) {
        return NextResponse.json(
          { success: false, error: "VPS_API_URL not configured" },
          { status: 500 }
        );
      }

      const vpsForm = new FormData();
      vpsForm.append("image", file);

      const vpsRes = await fetch(`${vpsUrl}/upload`, {
        method: "POST",
        headers: {
          "x-api-key": process.env.VPS_API_KEY || "",
        },
        body: vpsForm,
      });

      if (!vpsRes.ok) {
        const err = await vpsRes.text();
        console.error("VPS upload error:", err);
        return NextResponse.json(
          { success: false, error: "Image upload to VPS failed" },
          { status: 502 }
        );
      }

      const vpsData = await vpsRes.json();
      media_url = vpsData.url; // VPS returns { url: "https://..." }
    }

    if (!media_url) {
      return NextResponse.json(
        { success: false, error: "Either a file or media_url is required" },
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
        media_url, // use same URL as thumbnail
        category,
        event_date ?? null,
        is_featured,
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

// =======================
// PATCH (UPDATE metadata only)
// =======================
export async function PATCH(request: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const body = await request.json();
    const { id, title_en, title_np, description_en, description_np, category, is_featured, event_date } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID required" },
        { status: 400 }
      );
    }

    await db.query(
      `UPDATE gallery_items SET
        title_en       = COALESCE(?, title_en),
        title_np       = COALESCE(?, title_np),
        description_en = COALESCE(?, description_en),
        description_np = COALESCE(?, description_np),
        category       = COALESCE(?, category),
        is_featured    = COALESCE(?, is_featured),
        event_date     = COALESCE(?, event_date)
      WHERE id = ?`,
      [
        title_en ?? null,
        title_np ?? null,
        description_en ?? null,
        description_np ?? null,
        category ?? null,
        is_featured !== undefined ? is_featured : null,
        event_date ?? null,
        id,
      ]
    );

    const [updated]: any = await db.query(
      "SELECT * FROM gallery_items WHERE id = ?",
      [id]
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
// DELETE — removes from DB and VPS
// =======================
export async function DELETE(request: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID required" },
        { status: 400 }
      );
    }

    // Fetch item to get its VPS URL before deleting
    const [rows]: any = await db.query(
      "SELECT media_url FROM gallery_items WHERE id = ?",
      [id]
    );

    if (rows.length > 0) {
      const mediaUrl: string = rows[0].media_url;
      const vpsUrl = process.env.VPS_API_URL;

      // Only call VPS delete if the URL is hosted on our VPS
      if (vpsUrl && mediaUrl.startsWith(vpsUrl)) {
        try {
          await fetch(`${vpsUrl}/delete`, {
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