let windowStart = 0;
let attempts = 0;
export function allowAccountAttempt(now = Date.now()) {
  if (now - windowStart >= 60_000) { windowStart = now; attempts = 0; }
  attempts++;
  return attempts <= 30;
}
