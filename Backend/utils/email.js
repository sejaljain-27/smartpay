import nodemailer from "nodemailer";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });
dotenv.config();

export function createTransport() {
  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
    SMTP_SECURE,
    EMAIL,
    EMAIL_USER,
    EMAIL_PASS
  } = process.env;

  const user = (EMAIL || EMAIL_USER || SMTP_USER || "").trim();
  const pass = (EMAIL_PASS || SMTP_PASS || "").trim().replace(/\s+/g, "");

  if (SMTP_HOST && SMTP_PORT && user && pass) {
    return nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: SMTP_SECURE === "true",
      auth: {
        user,
        pass
      },
      connectionTimeout: 4000,
      greetingTimeout: 4000,
      socketTimeout: 5000
    });
  }

  if (user && pass && user !== "your_nodemailer_email" && pass !== "your_nodemailer_password") {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user,
        pass
      },
      connectionTimeout: 4000,
      greetingTimeout: 4000,
      socketTimeout: 5000
    });
  }

  throw new Error("Email configuration missing or using placeholder credentials in Backend/.env");
}

export async function sendVerificationEmail({ to, verifyUrl }) {
  if (process.env.RESEND_API_KEY) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "SmartPay <onboarding@resend.dev>",
        to: [to],
        subject: "Verify your email",
        html: `<p>Verify your email by clicking this link:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`
      })
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Resend error: ${errText}`);
    }
    return;
  }

  const transporter = createTransport();

  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER || process.env.EMAIL || process.env.SMTP_USER;
  const subject = "Verify your email";
  const text = `Verify your email by clicking this link: ${verifyUrl}`;
  const html = `
    <p>Verify your email by clicking this link:</p>
    <p><a href="${verifyUrl}">${verifyUrl}</a></p>
  `;

  await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html
  });
}

export async function sendOtpEmail({ to, otp, expiresInMinutes = 10 }) {
  // If Resend API key is configured, use HTTP API (works on all cloud hosts including Render free tier)
  if (process.env.RESEND_API_KEY) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "SmartPay <onboarding@resend.dev>",
        to: [to],
        subject: `Your SmartPay Verification Code: ${otp}`,
        html: `<p>Your verification code is:</p><h2>${otp}</h2><p>This code expires in ${expiresInMinutes} minutes.</p>`
      })
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Resend error: ${errText}`);
    }
    return;
  }

  const transporter = createTransport();

  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER || process.env.EMAIL || process.env.SMTP_USER;
  const subject = "Your verification code";
  const text = `Your verification code is ${otp}. It expires in ${expiresInMinutes} minutes.`;
  const html = `
    <p>Your verification code is:</p>
    <h2>${otp}</h2>
    <p>This code expires in ${expiresInMinutes} minutes.</p>
  `;

  await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html
  });
}
