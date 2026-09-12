import { revalidateTag } from "next/cache";
import {
  catalogRevalidationTags,
  isRevalidationSecretValid,
  parseCatalogRevalidationEvent,
} from "@/lib/revalidation/catalog";

export async function POST(request: Request) {
  const secret = process.env.STOREFRONT_REVALIDATION_SECRET;
  if (!secret) {
    return Response.json(
      { error: "Revalidación no configurada." },
      { status: 503 },
    );
  }
  if (
    !isRevalidationSecretValid(
      request.headers.get("x-revalidation-secret"),
      secret,
    )
  ) {
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
