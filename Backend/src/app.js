import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

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

app.use(cors());
app.use(cookieParser());
app.use(bodyParser.json({ limit: "5mb" }));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "public", "uploads"))
);

// decrypt client-side encrypted date fields when present
app.use(decryptDate);

const MONGO_URI = process.env.MONGO_URI;
mongoose.set("strictQuery", false);
mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err.message));

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
