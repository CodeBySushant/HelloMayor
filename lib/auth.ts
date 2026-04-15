import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export function requireAdmin() {
  const cookieStore = cookies();
  const isAdmin = cookieStore.get("admin-auth");

  if (!isAdmin) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  return null;
}