import rateLimit from "express-rate-limit";

// Strict limiter for authentication endpoints (prevents brute-force attacks)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 requests per window
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  message: {
    status: false,
    message: "Too many authentication attempts. Please try again after 15 minutes.",
  },
});

// General limiter for public API endpoints (prevents DDoS & scraping)
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.originalUrl?.startsWith("/api/stripe/webhook"), // Never throttle Stripe webhooks
  message: {
    status: false,
    message: "Too many requests. Please slow down.",
  },
});
