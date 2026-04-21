import dotenv from "dotenv";
import cors from "cors";
import express from "express";
import { connectDB } from "./lib/db.js";
import itemsRouter from "./routes/items.js";
import invoicesRouter from "./routes/invoices.js";

// Prefer local developer overrides, then fall back to default .env.
dotenv.config({ path: ".env.local" });
dotenv.config();

const app = express();
const port = Number(process.env.PORT || 4000);

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  })
);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/items", itemsRouter);
app.use("/api/invoices", invoicesRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`Backend running on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect to database:", error);
    process.exit(1);
  });
