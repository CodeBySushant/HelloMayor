import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const category = searchParams.get("category");

    let works: any[];

    if (status && status !== "all") {
      [works] = await db.query(
        `SELECT * FROM development_works WHERE status = ? ORDER BY created_at DESC`,
        [status]
      ) as any;
    } else if (category && category !== "all") {
      [works] = await db.query(
        `SELECT * FROM development_works WHERE category = ? ORDER BY created_at DESC`,
        [category]
      ) as any;
    } else {
      [works] = await db.query(
        `SELECT * FROM development_works 
ORDER BY created_at DESC 
LIMIT 10`
      ) as any;
    }

    return NextResponse.json({ success: true, data: works });
  } catch (error) {
    console.error("Error fetching development works:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch development works" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title_en, title_np, description_en, description_np,
      category, budget, status, start_date,
      expected_completion, contractor_name, location,
    } = body;

    if (!title_en) {
      return NextResponse.json(
        { success: false, error: "Title is required" },
        { status: 400 }
      );
    }

    const [result]: any = await db.query(
      `INSERT INTO development_works 
        (title_en, title_np, description_en, description_np, category, budget, status, start_date, expected_completion, contractor_name, location)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title_en, title_np ?? null, description_en ?? null, description_np ?? null,
        category ?? null, budget ?? 0, status ?? "planned", start_date ?? null,
        expected_completion ?? null, contractor_name ?? null, location ?? null,
      ]
    );

    const [newWork]: any = await db.query(
      `SELECT * FROM development_works WHERE id = ?`,
      [result.insertId]
    );

    return NextResponse.json({ success: true, data: newWork[0] });
  } catch (error) {
    console.error("Error creating development work:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create development work" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, progress, spent, status } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Development work ID is required" },
        { status: 400 }
      );
    }

    await db.query(
      `UPDATE development_works 
       SET 
         progress = COALESCE(?, progress),
         spent = COALESCE(?, spent),
         status = COALESCE(?, status),
         actual_completion = CASE WHEN ? = 'completed' THEN CURDATE() ELSE actual_completion END,
         updated_at = NOW()
       WHERE id = ?`,
      [progress ?? null, spent ?? null, status ?? null, status ?? null, id]
    );

    const [updated]: any = await db.query(
      `SELECT * FROM development_works WHERE id = ?`,
      [id]
    );

    return NextResponse.json({ success: true, data: updated[0] });
  } catch (error) {
    console.error("Error updating development work:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update development work" },
      { status: 500 }
    );
  }
}