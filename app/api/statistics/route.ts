import { neon } from "@neondatabase/serverless"
import { NextResponse } from "next/server"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    const statistics = await sql`
      SELECT * FROM ward_statistics WHERE is_active = true ORDER BY sort_order ASC
    `

    // Get aggregated stats from other tables
    const complaintStats = await sql`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
        COUNT(*) FILTER (WHERE status = 'resolved') as resolved
      FROM complaints
    `

    const developmentStats = await sql`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'ongoing') as ongoing,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COALESCE(SUM(budget), 0) as total_budget,
        COALESCE(SUM(spent), 0) as total_spent
      FROM development_works
    `

    const messageStats = await sql`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'unread') as unread
      FROM contact_messages
    `

    return NextResponse.json({ 
      success: true, 
      data: {
        ward: statistics,
        complaints: complaintStats[0],
        development: developmentStats[0],
        messages: messageStats[0]
      }
    })
  } catch (error) {
    console.error("Error fetching statistics:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch statistics" },
      { status: 500 }
    )
  }
}
