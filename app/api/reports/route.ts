import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../lib/db";
import { requireAdmin } from "@/lib/auth";


// =======================
// GET (PUBLIC)
// =======================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get("type");
    const fiscalYear = searchParams.get("year");

    let conditions: string[] = ["is_published = true"];
    const params: any[] = [];

    if (reportType && reportType !== "all") {
      conditions.push(`report_type = ?`);
      params.push(reportType);
    }

    if (fiscalYear && fiscalYear !== "all") {
      conditions.push(`fiscal_year = ?`);
      params.push(fiscalYear);
    }

    const query = `
      SELECT id, title_en, title_np, description_en, description_np, 
             report_type, fiscal_year, file_url, file_size, download_count, 
             published_at, created_at
      FROM reports
      WHERE ${conditions.join(" AND ")}
      ORDER BY published_at DESC
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
// POST (PROTECTED - CLEAN)
// =======================
export async function POST(request: NextRequest) {
  // 🔥 CLEAN AUTH
  const authError = requireAdmin();
  if (authError) return authError;

  try {
    const body = await request.json();

    const {
      title_en,
      title_np,
      description_en,
      description_np,
      report_type,
      fiscal_year,
      file_url,
      file_size,
    } = body;

    if (!title_en || !report_type || !fiscal_year || !file_url) {
      return NextResponse.json(
        { success: false, error: "Required fields missing" },
        { status: 400 }
      );
    }

    const [result]: any = await db.query(
      `INSERT INTO reports (
        title_en, title_np, description_en, description_np, 
        report_type, fiscal_year, file_url, file_size
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title_en,
        title_np ?? null,
        description_en ?? null,
        description_np ?? null,
        report_type,
        fiscal_year,
        file_url,
        file_size ?? 0,
      ]
    );

    const [newReport]: any = await db.query(
      `SELECT * FROM reports WHERE id = ?`,
      [result.insertId]
    );

    return NextResponse.json({
      success: true,
      data: newReport[0],
    });

  } catch (error) {
    console.error("Report create error:", error);

    return NextResponse.json(
      { success: false, error: "Failed to create report" },
      { status: 500 }
    );
  }
}