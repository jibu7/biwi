// Next.js API route to proxy audit logs from backend
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function GET(req: NextRequest) {
  // You may want to forward cookies/auth headers here if needed
  try {
    // Adjust backend URL as needed (Docker: use service name or host.docker.internal)
    const backendUrl = process.env.BACKEND_URL || "http://backend:8000/api/v1/platform/audit-logs";
    const params = req.nextUrl.searchParams.toString();
    const url = params ? `${backendUrl}?${params}` : backendUrl;
    const response = await axios.get(url, {
      headers: {
        // Forward auth headers if needed
        ...(req.headers.get("authorization") && { "authorization": req.headers.get("authorization") }),
      },
      // Optionally, withCredentials: true
    });
    return NextResponse.json(response.data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
