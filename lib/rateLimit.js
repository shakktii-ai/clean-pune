/**
 * In-memory sliding window rate limiter for sensitive authentication endpoints.
 */
const rateLimitMap = new Map();

/**
 * Check if a client IP has exceeded the allowed limit within a timeframe.
 * @param {string} identifier - e.g. client IP or composite key
 * @param {number} limit - maximum allowed requests
 * @param {number} windowMs - time window in milliseconds (default: 60,000ms = 1 minute)
 * @returns {{ success: boolean, remaining: number, resetInMs: number }}
 */
export function checkRateLimit(identifier, limit = 10, windowMs = 60000) {
  const now = Date.now();
  const clientData = rateLimitMap.get(identifier) || { count: 0, startTime: now };

  // If window has passed, reset
  if (now - clientData.startTime > windowMs) {
    clientData.count = 1;
    clientData.startTime = now;
    rateLimitMap.set(identifier, clientData);
    return { success: true, remaining: limit - 1, resetInMs: windowMs };
  }

  // Increment count
  clientData.count += 1;
  rateLimitMap.set(identifier, clientData);

  if (clientData.count > limit) {
    const resetInMs = windowMs - (now - clientData.startTime);
    return { success: false, remaining: 0, resetInMs };
  }

  return {
    success: true,
    remaining: limit - clientData.count,
    resetInMs: windowMs - (now - clientData.startTime),
  };
}

/**
 * Helper to extract client IP from Next.js request headers
 */
export function getClientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || '127.0.0.1';
}
