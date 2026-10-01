const express = require("express");
const cors = require("cors");

const routes = require("./routes");
const { notFound, errorHandler } = require("./middleware/error");

const app = express();

const configured = (process.env.CLIENT_URL || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

const allowed = new Set(["http://localhost:5173", "http://localhost:4173", ...configured]);

app.set("trust proxy", 1);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (
        allowed.has(origin) ||
        /^https?:\/\/localhost(:\d+)?$/.test(origin) ||
        origin.endsWith(".vercel.app") ||
        origin.endsWith(".netlify.app") ||
        origin.endsWith(".onrender.com") ||
        origin.endsWith(".railway.app")
      ) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} is not allowed by CORS.`));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

app.get("/", (_req, res) => res.json({ success: true, name: "ResolveX API", version: "2.0.0" }));
app.get("/health", (_req, res) => res.json({ success: true, status: "ok", at: new Date() }));

app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
