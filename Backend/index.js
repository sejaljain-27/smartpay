import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });
dotenv.config();
import express from "express";
import transactionsRouter from "./routes/transactions.js";
import goalsRouter from "./routes/goals.js";
import offersRouter from "./routes/offers.js";
import authRouter from "./routes/auth.js";
import cardsRouter from "./routes/cards.js";
import { initDb } from "./db.js";
import smsRoutes from "./routes/sms.js";
import insightsRoutes from "./routes/insights.js";
import chatRouter from "./routes/chat.js";
import analyticsRouter from "./routes/analytics.js";
import { initCronJobs } from "./services/cron.js";


const app = express();
import cors from "cors";

// CORS configuration for production and localhost
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      origin.startsWith("http://localhost:") ||
      origin.startsWith("http://127.0.0.1:") ||
      origin.endsWith(".vercel.app") ||
      origin === "https://smartpay-seven.vercel.app"
    ) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
};

app.use(cors(corsOptions));

app.use(express.text({ type: "text/plain" }));

app.use(express.json());

let isDbConnected = false;

app.get("/health", (_req, res) => {
  res.json({
    status: "Backend running",
    database: isDbConnected ? "connected" : "disconnected",
    timestamp: new Date().toISOString()
  });
});
app.get("/", (req, res) => {
  res.send("Backend is running");
});

app.use("/sms", smsRoutes);
app.use("/auth", authRouter);
app.use("/transactions", transactionsRouter);
app.use("/goals", goalsRouter);
app.use("/offers", offersRouter);
app.use("/cards", cardsRouter);

// ... existing code ...
app.use("/insights", insightsRoutes);
app.use("/chat", chatRouter);
app.use("/analytics", analyticsRouter);

app.post("/api/transactions", (req, res) => {
  console.log(req.body);
  res.status(200).send("OK");
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

async function startBackgroundServices() {
  try {
    await initDb();
    isDbConnected = true;
    console.log("Database initialized successfully.");
    initCronJobs();
  } catch (error) {
    isDbConnected = false;
    console.error("[DATABASE INITIALIZATION ERROR]:", error.message || error);
    console.warn("⚠️  Server is alive and listening on port " + port + ", but could not connect to PostgreSQL.");
    console.warn("⚠️  Please verify your DATABASE_URL in Render Dashboard -> Environment variables.");
  }
}

startBackgroundServices();
