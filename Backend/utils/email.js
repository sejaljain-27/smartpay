import nodemailer from "nodemailer";

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SMTP_SECURE,
  EMAIL_FROM,
  EMAIL,
  EMAIL_PASS
} = process.env;

export function createTransport() {
  if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
    return nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: SMTP_SECURE === "true",
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
      }
    });
  }

  if (EMAIL && EMAIL_PASS) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: EMAIL,
        pass: EMAIL_PASS
      }
    });
  }

  throw new Error("Email configuration missing");
}

export async function sendVerificationEmail({ to, verifyUrl }) {
  const transporter = createTransport();

  const from = EMAIL_FROM || SMTP_USER || EMAIL;
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

export async function sendOtpEmail({ to, otp, expiresInMinutes }) {
  const transporter = createTransport();

  const from = EMAIL_FROM || SMTP_USER || EMAIL;
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
