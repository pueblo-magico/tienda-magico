export function accountInput(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const input = value as Record<string, unknown>;
  if (input.action !== "login" && input.action !== "register") return null;
  if (typeof input.email !== "string" || typeof input.password !== "string")
    return null;
  const email = input.email.trim().toLowerCase();
  if (
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    input.password.length > 128 ||
    input.password.length < (input.action === "register" ? 12 : 1)
  )
    return null;
  const name = typeof input.name === "string" ? input.name.trim() : "";
  if (input.action === "register" && (!name || name.length > 120)) return null;
  return { action: input.action, email, password: input.password, name };
}
