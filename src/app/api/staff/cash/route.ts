import { NextRequest, NextResponse } from "next/server";
import { requestStaffCash } from "@/lib/checkout/staff-cash";
import type { StaffCashAction } from "@/types/staff-cash";

export const dynamic = "force-dynamic";
const cookieName = "magico_cash_staff";
const headers = { "Cache-Control": "private, no-store", Vary: "Cookie" };

async function handle(
  request: NextRequest,
  action: StaffCashAction,
  input: Record<string, unknown> = {},
) {
  const result = await requestStaffCash(
    action,
    request.cookies.get(cookieName)?.value,
    input,
  );
  const response = NextResponse.json(result.body, {
    status: result.status,
    headers,
  });
  const cookie = {
    httpOnly: true,
    secure:
      process.env.NODE_ENV === "production" ||
      request.nextUrl.protocol === "https:",
    sameSite: "strict" as const,
    path: "/api/staff/cash",
  };
  if (action === "login" && result.token)
    response.cookies.set(cookieName, result.token, {
      ...cookie,
      maxAge: result.expiresIn,
    });
  else if (action === "logout" || action === "login" || result.status === 401)
    response.cookies.set(cookieName, "", { ...cookie, maxAge: 0 });
  return response;
}

export async function GET(request: NextRequest) {
  return handle(request, "session");
}

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin)
    return NextResponse.json({ code: "origin" }, { status: 403, headers });
  let input: unknown;
  try {
    const body = await request.text();
    if (body.length > 2048)
      return NextResponse.json({ code: "invalid" }, { status: 400, headers });
    input = JSON.parse(body);
  } catch {
    return NextResponse.json({ code: "invalid" }, { status: 400, headers });
  }
  if (!input || typeof input !== "object" || Array.isArray(input))
    return NextResponse.json({ code: "invalid" }, { status: 400, headers });
  const data = input as Record<string, unknown>;
  if (
    data.action !== "login" &&
    data.action !== "logout" &&
    data.action !== "order" &&
    data.action !== "confirm"
  )
    return NextResponse.json({ code: "invalid" }, { status: 400, headers });
  return handle(request, data.action, data);
}
