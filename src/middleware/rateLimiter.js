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

// Limiter for checkout initiation & sensitive Stripe Connect onboarding
export const checkoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 checkout/session initiations per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: false,
    message: "Too many booking or payment attempts. Please wait a few minutes before trying again.",
  },
});

// Limiter for withdrawal creation
export const withdrawalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 withdrawal submissions per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: false,
    message: "Too many withdrawal requests. Please wait a while before requesting again.",
  },
});

// Limiter for chat message flooding
export const chatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // Limit each IP to 60 messages per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: false,
    message: "You are sending messages too quickly. Please wait a moment.",
  },
});

