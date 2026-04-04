import { NextResponse } from "next/server";
import { sql } from "../../../lib/db";

export async function GET(request: Request) {
  if (!sql)
    return NextResponse.json(
      { success: false, error: "Database not configured" },
      { status: 500 },
    );
  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get("type");
    const fiscalYear = searchParams.get("year");

    let conditions: string[] = ["is_published = true"];

    if (reportType && reportType !== "all") {
      conditions.push(`report_type = '${reportType}'`);
    }

    if (fiscalYear && fiscalYear !== "all") {
      conditions.push(`fiscal_year = '${fiscalYear}'`);
    }

    const query = `
      SELECT id, title_en, title_np, description_en, description_np, 
             report_type, fiscal_year, file_url, file_size, download_count, 
             published_at, created_at
      FROM reports
      WHERE ${conditions.join(" AND ")}
      ORDER BY published_at DESC
    `;

    const reports = await sql(query);

    return NextResponse.json({ success: true, data: reports });
  } catch (error) {
    console.error("Reports fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch reports" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
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
      description_en,
      description_np,
      report_type,
      fiscal_year,
      file_url,
      file_size,
    } = body;

    const result = await sql`
      INSERT INTO reports (
        title_en, title_np, description_en, description_np, 
        report_type, fiscal_year, file_url, file_size
      )
      VALUES (
        ${title_en}, ${title_np || null}, ${description_en || null}, ${description_np || null},
        ${report_type}, ${fiscal_year}, ${file_url}, ${file_size || 0}
      )
      RETURNING *
    `;

    return NextResponse.json({ success: true, data: result[0] });
  } catch (error) {
    console.error("Report create error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create report" },
      { status: 500 },
    );
  }
}
