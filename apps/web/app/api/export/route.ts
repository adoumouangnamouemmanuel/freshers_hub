import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:4000").replace("localhost", "127.0.0.1");

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const academicYearId = searchParams.get("academicYearId");

  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;

  if (!token) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const query = academicYearId ? `?academicYearId=${academicYearId}` : "";
  
  // Forward the request to the backend stream
  const res = await fetch(`${API_URL}/admin/analytics/export${query}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    // Required to receive the raw stream
    cache: "no-store", 
  });

  if (!res.ok) {
    return new NextResponse(`Export failed: ${res.status}`, { status: res.status });
  }

  // Proxy the binary stream and headers directly to the browser
  const headers = new Headers();
  headers.set("Content-Type", res.headers.get("Content-Type") || "application/octet-stream");
  headers.set(
    "Content-Disposition", 
    res.headers.get("Content-Disposition") || 'attachment; filename="export.xlsx"'
  );

  return new NextResponse(res.body, {
    status: 200,
    headers,
  });
}
