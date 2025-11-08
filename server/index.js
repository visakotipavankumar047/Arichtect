/* eslint-env node */
import process from "node:process";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import { applyWorkspaceRoutes } from "./routes/workspaceRoutes.js";
import { seedWorkspace } from "./services/seedWorkspace.js";

dotenv.config();

const PORT = process.env.PORT || 4000;
const MONGODB_URL = process.env.MONGODB_URL || process.env.MONGODB_URI;

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

console.log("Applying workspace routes...");
applyWorkspaceRoutes(app);
console.log("Workspace routes applied.");

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({
    message: err.message || "Unexpected server error.",
  });
});

const startServer = async () => {
  if (!MONGODB_URL) {
    throw new Error("Missing MONGODB_URL in .env");
  }

  try {
    await mongoose.connect(MONGODB_URL);
    console.log("MongoDB connected successfully.");
    await seedWorkspace();
    console.log("Workspace seeded successfully.");

    app.listen(PORT, () => {
      console.log(`Workspace API running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer()
