import { NextRequest, NextResponse } from "next/server";
import {
  ACCOUNT_COOKIE,
  accountRequest,
  customerSession,
  linkCustomerOrders,
  readAccountBody,
} from "@/lib/account/server";
import { accountInput } from "@/lib/account/input";
import { allowAccountAttempt } from "@/lib/account/rate-limit";
import {
  GUEST_ORDERS_COOKIE,
  parseGuestCartReferences,
} from "@/lib/commerce/guest-order-access";

const headers = { "Cache-Control": "private, no-store", Vary: "Cookie" };
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json(
      {
        customer: await customerSession(
          request.cookies.get(ACCOUNT_COOKIE)?.value ?? "",
        ),
      },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { error: "unavailable" },
      { status: 503, headers },
    );
  }
}
export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin)
    return NextResponse.json({ error: "forbidden" }, { status: 403, headers });
  try {
    const body = await readAccountBody(request);
    const cookie = {
      httpOnly: true,
      secure:
        process.env.NODE_ENV === "production" ||
        request.nextUrl.protocol === "https:",
      sameSite: "lax" as const,
      path: "/",
    };
    if (
      body &&
      typeof body === "object" &&
      "action" in body &&
      body.action === "logout"
    ) {
      const token = request.cookies.get(ACCOUNT_COOKIE)?.value;
      if (token) {
        try {
          await accountRequest("/storefront-customer/logout", token, {});
        } catch (error) {
          if (!(error instanceof Error) || error.message !== "unauthorized")
            throw error;
        }
      }
      const response = NextResponse.json({ customer: null }, { headers });
      response.cookies.set(ACCOUNT_COOKIE, "", { ...cookie, maxAge: 0 });
      return response;
    }
    const input = accountInput(body);
    if (!input)
      return NextResponse.json({ error: "invalid" }, { status: 400, headers });
    if (!allowAccountAttempt(input.email))
      return NextResponse.json(
        { error: "limited" },
        { status: 429, headers: { ...headers, "Retry-After": "60" } },
      );
    if (input.action === "register")
      await accountRequest(
        "/users",
        undefined,
        {
          name: input.name,
          email: input.email,
          password: input.password,
          roles: ["customer"],
          enableAPIKey: false,
        },
        true,
      );
    const result = await accountRequest("/users/login", undefined, {
      email: input.email,
      password: input.password,
    });
    if (typeof result.token !== "string") throw new Error("unauthorized");
    const customer = await customerSession(result.token);
    if (!customer) throw new Error("unauthorized");
    const linked = await linkCustomerOrders(
      parseGuestCartReferences(request.cookies.get(GUEST_ORDERS_COOKIE)?.value),
      result.token,
    );
    if (!linked) throw new Error("unauthorized");
    const response = NextResponse.json({ customer }, { headers });
    response.cookies.set(ACCOUNT_COOKIE, result.token, {
      ...cookie,
      maxAge: 7200,
    });
    return response;
  } catch {
    return NextResponse.json(
      { error: "unavailable" },
      { status: 400, headers },
    );
  }
}
