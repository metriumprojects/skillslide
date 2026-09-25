import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import curriculumRoutes from "./routes/curriculumRoutes.js";
import lessonRoutes from "./routes/lessonRoutes.js";
import listingRoutes from "./routes/listingRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import favoriteRoutes from "./routes/favoriteRoutes.js";
import ratingRoutes from "./routes/ratingRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import proposeRoutes from "./routes/proposeRoutes.js";
import availabilityRoutes from "./routes/availabilityRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import withdrawalRoutes from "./routes/withdrawalRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import currencyRoutes from "./routes/currencyRoutes.js";
import discoverRoutes from "./routes/discoverRoutes.js";
import stripeConnectRoutes from "./routes/stripeConnectRoutes.js";
import cookieParser from "cookie-parser";
import compression from "compression";
import helmet from "helmet";
import { stripeWebhook } from "./controllers/stripeWebhookController.js";
// Places Autocomplete Route
import placesAutocompleteRoutes from "./routes/placesAutocompleteRoutes.js";
import studentStoryRoutes from "./routes/studentStoryRoutes.js";
import { apiLimiter } from "./middleware/rateLimiter.js";
import { mongoSanitize } from "./middleware/mongoSanitize.js";
dotenv.config();
connectDB();

const app = express();

// Security Headers (CSP disabled so external images/CDNs load cleanly)
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// Gzip response compression
app.use(compression());

// Debug Middleware to log request details in development only
if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });
}

// Configurable CORS with mobile and local dev support
const allowedOrigins = [
  "https://skillask.com",
  "https://www.skillask.com",
  "https://courses-website-drab.vercel.app",
  process.env.FRONTEND_URL,
].filter(Boolean);

const isAllowedOrigin = (origin) => {
  if (!origin) return true; // Non-browser clients (native mobile, Postman, curl)
  if (process.env.NODE_ENV !== "production") return true; // Allow dev origins
  if (allowedOrigins.includes(origin)) return true;
  // Allow hybrid mobile apps (Capacitor / Ionic)
  if (
    origin.startsWith("capacitor://") ||
    origin.startsWith("ionic://") ||
    origin.startsWith("http://localhost") ||
    origin.startsWith("https://localhost")
  ) {
    return true;
  }
  return false;
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Stripe requires the unmodified request body to verify webhook signatures.
app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), stripeWebhook);

// Rate limiter for general API routes (skips stripe webhook)
app.use("/api", apiLimiter);

// Safe payload limits (prevents JSON memory exhaustion DoS)
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Recursive NoSQL query injection sanitizer
app.use(mongoSanitize);


app.use(cookieParser());
app.use("/api/users", userRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/course", curriculumRoutes);
app.use("/api/lessons", lessonRoutes);
app.use("/api/listings", listingRoutes);
app.use("/api/book", bookingRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/rating", ratingRoutes);
app.use("/api/review", reviewRoutes);
app.use("/api/propose", proposeRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/withdrawal", withdrawalRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/currency", currencyRoutes);
app.use("/api/discover", discoverRoutes);
app.use("/api/stripe-connect", stripeConnectRoutes);
app.use("/api/student-stories", studentStoryRoutes);


app.use("/api", placesAutocompleteRoutes);


// Global error handler (sanitized for production)
app.use((err, req, res, next) => {
  const isProduction = process.env.NODE_ENV === "production";
  if (!isProduction) {
    console.error(err.stack || err);
  } else {
    console.error(`[Error] ${err.name || "Error"}: ${err.message}`);
  }

  const statusCode = err.status || (res.statusCode >= 400 ? res.statusCode : 500);
  const message = isProduction && statusCode === 500
    ? "Internal Server Error"
    : err.message || "An unexpected error occurred";

  res.status(statusCode).json({
    status: false,
    success: false,
    message,
  });
});



export default app;
