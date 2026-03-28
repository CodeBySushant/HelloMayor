import { neon } from "@neondatabase/serverless"
import { NextRequest, NextResponse } from "next/server"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const category = searchParams.get("category")

    let works

    if (status && status !== "all") {
      works = await sql`
        SELECT * FROM development_works WHERE status = ${status} ORDER BY created_at DESC
      `
    } else if (category && category !== "all") {
      works = await sql`
        SELECT * FROM development_works WHERE category = ${category} ORDER BY created_at DESC
      `
    } else {
      works = await sql`
        SELECT * FROM development_works ORDER BY created_at DESC
      `
    }

    return NextResponse.json({ success: true, data: works })
  } catch (error) {
    console.error("Error fetching development works:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch development works" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title_en, title_np, description_en, description_np, category, budget, status, start_date, expected_completion, contractor_name, location } = body

    if (!title_en) {
      return NextResponse.json(
        { success: false, error: "Title is required" },
        { status: 400 }
      )
    }

    const result = await sql`
      INSERT INTO development_works (title_en, title_np, description_en, description_np, category, budget, status, start_date, expected_completion, contractor_name, location)
      VALUES (${title_en}, ${title_np || null}, ${description_en || null}, ${description_np || null}, ${category || null}, ${budget || 0}, ${status || 'planned'}, ${start_date || null}, ${expected_completion || null}, ${contractor_name || null}, ${location || null})
      RETURNING *
    `

    return NextResponse.json({ success: true, data: result[0] })
  } catch (error) {
    console.error("Error creating development work:", error)
    return NextResponse.json(
      { success: false, error: "Failed to create development work" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, progress, spent, status } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Development work ID is required" },
        { status: 400 }
      )
    }

    const result = await sql`
      UPDATE development_works 
      SET 
        progress = COALESCE(${progress ?? null}, progress),
        spent = COALESCE(${spent ?? null}, spent),
        status = COALESCE(${status || null}, status),
        actual_completion = CASE WHEN ${status} = 'completed' THEN CURRENT_DATE ELSE actual_completion END,
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `

    return NextResponse.json({ success: true, data: result[0] })
  } catch (error) {
    console.error("Error updating development work:", error)
    return NextResponse.json(
      { success: false, error: "Failed to update development work" },
      { status: 500 }
    )
  }
}
