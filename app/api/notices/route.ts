import { neon } from "@neondatabase/serverless"
import { NextRequest, NextResponse } from "next/server"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    const notices = await sql`
      SELECT * FROM notices 
      WHERE (expiry_date IS NULL OR expiry_date >= CURRENT_DATE)
      ORDER BY is_important DESC, publish_date DESC
    `

    return NextResponse.json({ success: true, data: notices })
  } catch (error) {
    console.error("Error fetching notices:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch notices" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title_en, title_np, content_en, content_np, category, is_important, expiry_date, attachment_url } = body

    if (!title_en || !content_en) {
      return NextResponse.json(
        { success: false, error: "Title and content are required" },
        { status: 400 }
      )
    }

    const result = await sql`
      INSERT INTO notices (title_en, title_np, content_en, content_np, category, is_important, expiry_date, attachment_url)
      VALUES (${title_en}, ${title_np || null}, ${content_en}, ${content_np || null}, ${category || null}, ${is_important || false}, ${expiry_date || null}, ${attachment_url || null})
      RETURNING *
    `

    return NextResponse.json({ success: true, data: result[0] })
  } catch (error) {
    console.error("Error creating notice:", error)
    return NextResponse.json(
      { success: false, error: "Failed to create notice" },
      { status: 500 }
    )
  }
}
