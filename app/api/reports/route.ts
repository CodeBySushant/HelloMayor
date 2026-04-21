import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../lib/db";
import { requireAdmin } from "@/lib/auth";

// =======================
// GET
// =======================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get("type");
    const fiscalYear = searchParams.get("year");
    const showAll = searchParams.get("all") === "true"; // admin: show drafts too

    const conditions: string[] = [];
    const params: any[] = [];

    // Public view only sees published; admin passes ?all=true
    if (!showAll) {
      conditions.push(`is_published = true`);
    }

    if (reportType && reportType !== "all") {
      conditions.push(`report_type = ?`);
      params.push(reportType);
    }

    if (fiscalYear && fiscalYear !== "all") {
      conditions.push(`fiscal_year = ?`);
      params.push(fiscalYear);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const query = `
      SELECT id, title_en, title_np, description_en, description_np,
             report_type, fiscal_year, file_url, file_size,
             download_count, is_published, published_at, created_at
      FROM reports
      ${where}
      ORDER BY published_at DESC, created_at DESC
    `;

    const [reports]: any = await db.query(query, params);

    return NextResponse.json({ success: true, data: reports });
  } catch (error) {
    console.error("Reports fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch reports" },
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
      report_type, fiscal_year, file_url, file_size, is_published,
    } = body;

    if (!title_en || !report_type || !fiscal_year || !file_url) {
      return NextResponse.json(
        { success: false, error: "Title, type, fiscal year and file are required" },
        { status: 400 }
      );
    }

    const [result]: any = await db.query(
      `INSERT INTO reports (
        title_en, title_np, description_en, description_np,
        report_type, fiscal_year, file_url, file_size,
        is_published, published_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title_en, title_np ?? null,
        description_en ?? null, description_np ?? null,
        report_type, fiscal_year,
        file_url, file_size ?? 0,
        is_published ?? false,
        is_published ? new Date() : null,
      ]
    );

    const [newReport]: any = await db.query(
      `SELECT * FROM reports WHERE id = ?`, [result.insertId]
    );

    return NextResponse.json({ success: true, data: newReport[0] });
  } catch (error) {
    console.error("Report create error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create report" },
      { status: 500 }
    );
  }
}