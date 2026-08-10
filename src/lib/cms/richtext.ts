/** Minimal Lexical JSON → plain text (safe for cards / meta). */
export function richTextToPlain(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value.map((node) => richTextToPlain(node)).filter(Boolean).join("\n");
  }
  if (typeof value !== "object") return "";

  const node = value as Record<string, unknown>;
  if (typeof node.text === "string") return node.text;

  if (Array.isArray(node.children)) {
    const joined = node.children
      .map((child) => richTextToPlain(child))
      .filter(Boolean)
      .join(node.type === "paragraph" || node.type === "heading" ? "\n" : "");
    return joined;
  }

  if (node.root) return richTextToPlain(node.root);
  return "";
}

/** Very small Lexical → HTML for body copy (paragraphs + basic marks). */
export function richTextToHtml(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") {
    if (/<\/?[a-z][\s\S]*>/i.test(value)) return value;
    return value
      .split(/\n+/)
      .map((line) => `<p>${escapeHtml(line)}</p>`)
      .join("");
  }

  if (typeof value !== "object") return "";
  const root =
    "root" in (value as object)
      ? (value as { root: unknown }).root
      : value;

  return renderNode(root);
}

function renderNode(node: unknown): string {
  if (node == null) return "";
  if (typeof node === "string") return escapeHtml(node);
  if (Array.isArray(node)) return node.map(renderNode).join("");
  if (typeof node !== "object") return "";

  const n = node as Record<string, unknown>;
  const children = Array.isArray(n.children) ? n.children.map(renderNode).join("") : "";

  switch (n.type) {
    case "root":
      return children;
    case "paragraph":
      return children.trim() ? `<p>${children}</p>` : "<p></p>";
    case "heading": {
      const tag = typeof n.tag === "string" && /^h[1-6]$/.test(n.tag) ? n.tag : "h2";
      return `<${tag}>${children}</${tag}>`;
    }
    case "list": {
      const tag = n.listType === "number" ? "ol" : "ul";
      return `<${tag}>${children}</${tag}>`;
    }
    case "listitem":
      return `<li>${children}</li>`;
    case "quote":
      return `<blockquote>${children}</blockquote>`;
    case "link": {
      const url =
        typeof n.url === "string"
          ? n.url
          : typeof n.fields === "object" &&
              n.fields &&
              "url" in (n.fields as object)
            ? String((n.fields as { url: unknown }).url)
            : "#";
      return `<a href="${escapeAttr(url)}">${children}</a>`;
    }
    case "text": {
      let text = escapeHtml(String(n.text ?? ""));
      if (n.format && typeof n.format === "number") {
        if (n.format & 1) text = `<strong>${text}</strong>`;
        if (n.format & 2) text = `<em>${text}</em>`;
        if (n.format & 8) text = `<u>${text}</u>`;
        if (n.format & 16) text = `<code>${text}</code>`;
      }
      return text;
    }
    case "linebreak":
      return "<br />";
    default:
      return children;
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeAttr(value: string) {
  return escapeHtml(value).replaceAll("'", "&#39;");
}
