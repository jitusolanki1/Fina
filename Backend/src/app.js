import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { v4 as uuidv4 } from 'uuid';

import authRoutes from "./routes/auth.js";
import accountsRoutes from "./routes/accounts.js";
import transactionsRoutes from "./routes/transactions.js";
import historyRoutes from "./routes/transactionsHistory.js";
import summariesRoutes from "./routes/summaries.js";
import uploadsRoutes from "./routes/uploads.js";
import errorHandler from "./middleware/errorHandler.js";
import decryptDate from "./middleware/decryptDate.js";

dotenv.config();

const app = express();

// Disable ETag generation for API responses to avoid automatic 304 Not Modified
app.set('etag', false);

// For all API routes, send no-cache headers so clients receive fresh content
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// Configure CORS to allow requests (with credentials) from the frontend origins.
// Provide a comma-separated list in env var FRONTEND_ORIGINS, or default to localhost and Netlify preview.
const defaultOrigins = "http://localhost:5173,https://finaa-app.netlify.app";
const allowedOrigins = (process.env.FRONTEND_ORIGINS || defaultOrigins).split(",").map((s) => s.trim());

app.use(
  cors({
    origin: function (origin, callback) {
      // allow non-browser or same-origin requests (no origin)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1) return callback(null, true);
      return callback(new Error("CORS policy: Origin not allowed"));
    },
    credentials: true,
  })
);

// Attach a request id to every request for tracing
app.use((req, res, next) => {
  try {
    const id = uuidv4();
    req.requestId = id;
    res.setHeader('X-Request-Id', id);
  } catch (e) {}
  next();
});
app.use(cookieParser());
app.use(bodyParser.json({ limit: "5mb" }));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "public", "uploads"))
);

app.use(decryptDate);

const MONGO_URI = process.env.MONGO_URI ;
mongoose.set("strictQuery", false);
// small helper to mask credentials when printing the connection string
function maskMongoUri(uri) {
  if (!uri) return "(not set)";
  try {
    // replace any user:pass@ with ***@
    return uri.replace(/:\/\/.+@/, "://***@");
  } catch (e) {
    return "(masked)";
  }
}

console.log("Connecting to MongoDB (masked):", maskMongoUri(MONGO_URI));

mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Mongoose connected"))
  .catch((err) => console.error("Mongoose connection error:", err.message));

// try to also connect with native MongoClient helper (optional)
import { connectToMongo } from "./mongoClient.js";
connectToMongo(MONGO_URI, process.env.MONGO_DB_NAME || "Ciw").catch((err) =>
  console.error("Native MongoClient connection error:", err.message)
);

// routes
app.use("/api/auth", authRoutes);
app.use("/api/accounts", accountsRoutes);
app.use("/api/transactions", transactionsRoutes);
app.use("/api/transactionsHistory", historyRoutes);
app.use("/api/summaries", summariesRoutes);
app.use("/api/uploads", uploadsRoutes);

app.use(errorHandler);

// basic health
app.get("/", (req, res) =>
  res.json({ ok: true, version: "fina-backend-0.1.0" })
);

export default app;
