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
import { stripeWebhook } from "./controllers/stripeWebhookController.js";
// Places Autocomplete Route
import placesAutocompleteRoutes from "./routes/placesAutocompleteRoutes.js";
import studentStoryRoutes from "./routes/studentStoryRoutes.js";
dotenv.config();
connectDB();

const app = express();

// Debug Middleware to log request details
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log(`  Origin: ${req.headers.origin || "No Origin"}`);
  console.log(`  User-Agent: ${req.headers["user-agent"]}`);
  next();
});

app.use(
  cors({
    origin: true, // Allow all origins for debugging
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Stripe requires the unmodified request body to verify webhook signatures.
app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), stripeWebhook);

// Middleware
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));


app.use(cookieParser());
app.use("/api/users", userRoutes);
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


// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});


export default app;
