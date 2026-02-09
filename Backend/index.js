import "dotenv/config";
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
  origin: [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://smartpay-seven.vercel.app"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
};

app.use(cors(corsOptions));

app.use(express.text({ type: "text/plain" }));

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "Backend running" });
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




const port = process.env.PORT || 3000;

async function startServer() {
  try {
    await initDb();
    initCronJobs();
    app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to initialize database", error);
    process.exit(1);
  }
}
app.post("/api/transactions", (req, res) => {
  console.log(req.body)
  res.status(200).send("OK")
})

startServer();
