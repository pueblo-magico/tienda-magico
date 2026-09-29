import { createHash } from "node:crypto";

let windowStart = 0;
let attempts = 0;
const accounts = new Map<string, number>();
export function allowAccountAttempt(email: string, now = Date.now()) {
  if (now - windowStart >= 60_000) {
    windowStart = now;
    attempts = 0;
    accounts.clear();
  }
  if (++attempts > 300) return false;
  const key = createHash("sha256")
    .update(email.trim().toLowerCase())
    .digest("hex");
  const count = (accounts.get(key) ?? 0) + 1;
  accounts.set(key, count);
  return count <= 5;
}
