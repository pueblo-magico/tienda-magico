import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import {
  catalogRevalidationTags,
  parseCatalogRevalidationEvent,
} from "@/lib/revalidation/catalog";

function secretsMatch(received: string | null, expected: string) {
  if (!received) return false;
  const left = Buffer.from(received);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function POST(request: Request) {
  const secret = process.env.STOREFRONT_REVALIDATION_SECRET;
  if (!secret) {
    return Response.json(
      { error: "Revalidación no configurada." },
      { status: 503 },
    );
  }
  if (!secretsMatch(request.headers.get("x-revalidation-secret"), secret)) {
    return Response.json({ error: "No autorizado." }, { status: 401 });
  }
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 4096) {
    return Response.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return Response.json({ error: "Solicitud inválida." }, { status: 400 });
  }
  if (Buffer.byteLength(rawBody) > 4096) {
    return Response.json({ error: "Solicitud inválida." }, { status: 400 });
  }
  let body: unknown;
  try {
    body = JSON.parse(rawBody) as unknown;
  } catch {
    return Response.json({ error: "Solicitud inválida." }, { status: 400 });
  }
  const event = parseCatalogRevalidationEvent(body);
  if (!event) {
    return Response.json({ error: "Solicitud inválida." }, { status: 400 });
  }
  const tags = catalogRevalidationTags(event);
  for (const tag of tags) revalidateTag(tag, { expire: 0 });
  return Response.json({ revalidated: true, tags: tags.length });
}
