import express from "express";
import bcrypt from "bcryptjs";
// import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import pool from "../db.js";
import { sendOtpEmail, sendVerificationEmail } from "../utils/email.js";

import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

const {
  JWT_SECRET,
  JWT_EXPIRES_IN,
  EMAIL_VERIFY_SECRET,
  EMAIL_VERIFY_EXPIRES_IN,
  APP_BASE_URL,
  GOOGLE_CLIENT_ID,
  OTP_EXPIRES_MINUTES
} = process.env;

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

function requireEnv(value, name) {
  if (!value) {
    throw new Error(`${name} not configured`);
  }
}

function signAuthToken(userId) {
  requireEnv(JWT_SECRET, "JWT_SECRET");
  return jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN || "7d"
  });
}

function signEmailToken(userId) {
  requireEnv(EMAIL_VERIFY_SECRET, "EMAIL_VERIFY_SECRET");
  return jwt.sign({ userId }, EMAIL_VERIFY_SECRET, {
    expiresIn: EMAIL_VERIFY_EXPIRES_IN || "1d"
  });
}

const otpStore = new Map();

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function getOtpExpiryMinutes() {
  const minutes = Number(OTP_EXPIRES_MINUTES);
  return Number.isFinite(minutes) && minutes > 0 ? minutes : 10;
}

function setOtp(email, otp) {
  const expiresInMinutes = getOtpExpiryMinutes();
  const expiresAt = Date.now() + expiresInMinutes * 60 * 1000;
  otpStore.set(email, { otp, expiresAt });
  return expiresInMinutes;
}

function verifyOtp(email, otp) {
  const entry = otpStore.get(email);
  if (!entry) {
    return false;
  }

  if (Date.now() > entry.expiresAt) {
    otpStore.delete(email);
    return false;
  }

  const matches = entry.otp === otp;
  if (matches) {
    otpStore.delete(email);
  }

  return matches;
}

// GET /auth/me
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      "SELECT id, email, name, phone, location, is_verified, created_at FROM users WHERE id = $1",
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// PUT /auth/me - Update profile
router.put("/me", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, phone, location } = req.body;

    // Build dynamic update query
    const updates = [];
    const values = [];
    let query = "UPDATE users SET ";

    if (name !== undefined) {
      updates.push(`name = $${values.length + 1}`);
      values.push(name);
    }
    if (phone !== undefined) {
      updates.push(`phone = $${values.length + 1}`);
      values.push(phone);
    }
    if (location !== undefined) {
      updates.push(`location = $${values.length + 1}`);
      values.push(location);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    query += updates.join(", ");
    query += ` WHERE id = $${values.length + 1} RETURNING id, email, name, phone, location`;
    values.push(userId);

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

async function handleSignup(req, res) {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const existing = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `
      INSERT INTO users (email, password, name, is_verified)
      VALUES ($1, $2, $3, false)
      RETURNING id, email, name
      `,
      [email, hashedPassword, name || null]
    );

    const user = result.rows[0];
    const otp = generateOtp();
    const expiresInMinutes = setOtp(user.email, otp);

    try {
      await sendOtpEmail({ to: user.email, otp, expiresInMinutes });
    } catch (emailError) {
      console.error(emailError);
      return res.status(500).json({
        error: "Email service not configured",
        message: "Unable to send OTP. Check email settings."
      });
    }

    return res.status(201).json({
      message: "Signup successful. OTP sent to email.",
      email: user.email
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to sign up" });
  }
}

// POST /auth/signup
router.post("/signup", handleSignup);

// POST /auth/register (alias)
router.post("/register", handleSignup);

// GET /auth/verify-email?token=XYZ
router.get("/verify-email", async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ error: "Missing token" });
    }

    requireEnv(EMAIL_VERIFY_SECRET, "EMAIL_VERIFY_SECRET");
    const payload = jwt.verify(token, EMAIL_VERIFY_SECRET);

    const result = await pool.query(
      "UPDATE users SET is_verified = true WHERE id = $1 RETURNING id, email",
      [payload.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({ message: "Email verified" });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ error: "Invalid or expired token" });
  }
});

// POST /auth/verify-otp
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: "Email and OTP are required" });
    }

    const isValid = verifyOtp(email, otp);
    if (!isValid) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    const result = await pool.query(
      "UPDATE users SET is_verified = true WHERE email = $1 RETURNING id, email",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({ message: "Email verified" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to verify OTP" });
  }
});

// POST /auth/request-otp
router.post("/request-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const existing = await pool.query(
      "SELECT id, is_verified FROM users WHERE email = $1",
      [email]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    if (existing.rows[0].is_verified) {
      return res.status(400).json({ error: "Email already verified" });
    }

    const otp = generateOtp();
    const expiresInMinutes = setOtp(email, otp);

    try {
      await sendOtpEmail({ to: email, otp, expiresInMinutes });
    } catch (emailError) {
      console.error(emailError);
      return res.status(500).json({
        error: "Email service not configured",
        message: "Unable to send OTP. Check email settings."
      });
    }

    return res.json({ message: "OTP sent" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to send OTP" });
  }
});

// POST /auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const result = await pool.query(
      "SELECT id, password, is_verified FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = result.rows[0];
    if (!user.is_verified) {
      return res.status(403).json({ error: "Email not verified" });
    }

    if (!user.password) {
      return res.status(401).json({ error: "Use Google login" });
    }

    const matches = await bcrypt.compare(password, user.password);
    if (!matches) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = signAuthToken(user.id);
    return res.json({ token });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Login failed" });
  }
});

// POST /auth/google
router.post("/google", async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ error: "Missing Google ID token" });
    }

    requireEnv(GOOGLE_CLIENT_ID, "GOOGLE_CLIENT_ID");
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email || !payload.sub) {
      return res.status(400).json({ error: "Invalid Google token" });
    }

    const email = payload.email;
    const googleId = payload.sub;
    const name = payload.name; // Extract name

    const existing = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    let userId;

    if (existing.rows.length > 0) {
      userId = existing.rows[0].id;

      await pool.query(
        "UPDATE users SET google_id = $1, is_verified = true, name = COALESCE(name, $3) WHERE id = $2",
        [googleId, userId, name]
      );
    } else {
      const insert = await pool.query(
        `
        INSERT INTO users (email, google_id, name, is_verified)
        VALUES ($1, $2, $3, true)
        RETURNING id
        `,
        [email, googleId, name]
      );
      userId = insert.rows[0].id;
    }

    const token = signAuthToken(userId);
    return res.json({ token });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Google login failed" });
  }
});

export default router;
