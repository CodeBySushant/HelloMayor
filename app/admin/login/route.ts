import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    // Temporary credentials (we'll connect DB later)
    if (username === "admin" && password === "1234") {
      const response = NextResponse.json({ success: true });

      response.cookies.set("admin-auth", "true", {
        httpOnly: true,
        secure: false, // IMPORTANT for localhost
        sameSite: "lax",
        path: "/",
      });

      return response;
    }

    return NextResponse.json(
      { success: false, message: "Invalid credentials" },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}