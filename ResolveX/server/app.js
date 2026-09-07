const path = require("path");
const express = require("express");
const cors = require("cors");

const complaintRoutes = require("./routes/complaintRoutes");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const chatRoutes = require("./routes/chatRoutes");

const app = express();

const configuredOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

const allowedOrigins = new Set([
  "http://localhost:5173",
  "http://localhost:5174",
  ...configuredOrigins,
]);

app.use(
  cors({
    origin(origin, callback) {
      // Browser requests normally have Origin. Health checks and server-to-server
      // requests may not.
      if (!origin) return callback(null, true);

      // Allow explicitly configured origins and common Vercel preview domains.
      if (
        allowedOrigins.has(origin) ||
        origin.endsWith(".vercel.app") ||
        origin.endsWith(".up.railway.app") ||
        origin.endsWith(".railway.app")
      ) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "Welcome to ResolveX API 🚀",
  });
});

app.get("/health", (_req, res) => {
  res.json({ success: true, status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/chat", chatRoutes);

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use((err, _req, res, _next) => {
  console.error("SERVER ERROR:", err);

  if (err?.name === "MulterError") {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "Image is larger than the 50 MB limit."
        : err.message;

    return res.status(400).json({
      success: false,
      message,
    });
  }

  if (err?.message === "Only image files are allowed") {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  if (err?.message?.startsWith("CORS blocked origin:")) {
    return res.status(403).json({
      success: false,
      message: err.message,
    });
  }

  res.status(err?.status || 500).json({
    success: false,
    message: err?.message || "Server error",
  });
});

module.exports = app;
