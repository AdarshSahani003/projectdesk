import nodemailer from "nodemailer";
import { HttpError } from "./httpError.js";

function getTransport() {
  const requiredValues = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS"];
  const missingValue = requiredValues.find((key) => !process.env[key]);

  if (missingValue) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

export async function sendVerificationEmail(user, token) {
  const transport = getTransport();
  if (!transport) {
    console.log("SMTP not configured - skipping email for user:", user.email);
    return;
  }

  const appUrl = process.env.APP_URL || process.env.CLIENT_URL || "http://localhost:5173";
  const verifyUrl = `${appUrl.replace(/\/$/, "")}/?verifyToken=${token}`;
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  try {
    const info = await transport.sendMail({
      from,
      to: user.email,
      subject: "Verify your TaskFlow account",
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827">
          <h2>Verify your email</h2>
          <p>Hi ${user.name}, confirm your email address to finish setting up your TaskFlow account.</p>
          <p><a href="${verifyUrl}" style="display:inline-block;background:#5b3df5;color:#fff;padding:10px 14px;border-radius:7px;text-decoration:none">Verify email</a></p>
          <p>If the button does not work, open this link:</p>
          <p>${verifyUrl}</p>
        </div>
      `
    });
    console.log("✅ Verification email sent to:", user.email, "Response:", info.response);
  } catch (error) {
    console.error("❌ Failed to send verification email:", error.message);
    console.error("Error code:", error.code);
    console.error("Full error:", error);
  }
}

export async function sendPasswordResetEmail(user, token) {
  const transport = getTransport();
  if (!transport) {
    console.log("SMTP not configured - skipping email for user:", user.email);
    return;
  }

  const appUrl = process.env.APP_URL || process.env.CLIENT_URL || "http://localhost:5173";
  const resetUrl = `${appUrl.replace(/\/$/, "")}/?resetToken=${token}`;
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  try {
    const info = await transport.sendMail({
      from,
      to: user.email,
      subject: "Reset your TaskFlow password",
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827">
          <h2>Reset your password</h2>
          <p>Hi ${user.name}, we received a request to reset your TaskFlow password.</p>
          <p><a href="${resetUrl}" style="display:inline-block;background:#5b3df5;color:#fff;padding:10px 14px;border-radius:7px;text-decoration:none">Reset password</a></p>
          <p>If the button does not work, open this link:</p>
          <p>${resetUrl}</p>
          <p>This link expires in 1 hour. If you didn't request a password reset, please ignore this email.</p>
        </div>
      `
    });
    console.log("✅ Password reset email sent to:", user.email, "Response:", info.response);
  } catch (error) {
    console.error("❌ Failed to send password reset email:", error.message);
    console.error("Error code:", error.code);
    console.error("Full error:", error);
  }
}


