import { OAuth2Client } from "google-auth-library";
import crypto from "crypto";
import { User } from "../models/user.model.js";
import { createToken } from "../utils/token.js";
import { HttpError } from "../utils/httpError.js";
import { sendVerificationEmail, sendPasswordResetEmail } from "../utils/email.js";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function sendSession(response, user) {
  const token = createToken(user);
  response.json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar
    }
  });
}

export async function signup(request, response) {
  const existingUser = await User.findOne({ email: request.body.email });
  const verificationToken = crypto.randomBytes(32).toString("hex");

  if (existingUser) {
    if (!existingUser.emailVerified && existingUser.authProvider === "email") {
      existingUser.name = request.body.name;
      existingUser.password = request.body.password;
      existingUser.emailVerificationToken = verificationToken;
      existingUser.emailVerificationExpires = new Date(Date.now() + 1000 * 60 * 60);
      await existingUser.save();
      await sendVerificationEmail(existingUser, verificationToken);

      response.status(200).json({
        message: "A new verification email has been sent"
      });
      return;
    }

    throw new HttpError(409, "Email is already registered");
  }

  const user = await User.create({
    ...request.body,
    emailVerificationToken: verificationToken,
    emailVerificationExpires: new Date(Date.now() + 1000 * 60 * 60),
    emailVerified: !process.env.SMTP_HOST // Auto-verify if SMTP not configured
  });

  await sendVerificationEmail(user, verificationToken);

  response.status(201).json({
    message: process.env.SMTP_HOST
      ? "Check your email to verify your account before logging in"
      : "Account created! You can now login."
  });
}

export async function login(request, response) {
  const user = await User.findOne({ email: request.body.email }).select("+password");

  if (!user || !user.password) {
    throw new HttpError(401, "Invalid email or password");
  }

  const passwordMatches = await user.matchesPassword(request.body.password);

  if (!passwordMatches) {
    throw new HttpError(401, "Invalid email or password");
  }

  if (!user.emailVerified) {
    throw new HttpError(403, "Please verify your email before logging in");
  }

  sendSession(response, user);
}

export async function loginWithGoogle(request, response) {
  if (!process.env.GOOGLE_CLIENT_ID) {
    throw new HttpError(500, "Google login is not configured");
  }

  const ticket = await googleClient.verifyIdToken({
    idToken: request.body.credential,
    audience: process.env.GOOGLE_CLIENT_ID
  });

  const profile = ticket.getPayload();

  if (!profile?.email) {
    throw new HttpError(401, "Google account email is required");
  }

  const user = await User.findOneAndUpdate(
    { email: profile.email },
    {
      $setOnInsert: {
        name: profile.name || profile.email.split("@")[0],
        email: profile.email,
        googleId: profile.sub,
        avatar: profile.picture || "",
        authProvider: "google",
        emailVerified: true
      },
      $set: {
        avatar: profile.picture || "",
        emailVerified: true
      }
    },
    { upsert: true, new: true }
  );

  sendSession(response, user);
}

export async function me(request, response) {
  response.json({
    user: {
      id: request.user._id,
      name: request.user.name,
      email: request.user.email,
      avatar: request.user.avatar
    }
  });
}

export async function verifyEmail(request, response) {
  const user = await User.findOne({
    emailVerificationToken: request.body.token,
    emailVerificationExpires: { $gt: new Date() }
  }).select("+emailVerificationToken +emailVerificationExpires");

  if (!user) {
    throw new HttpError(400, "Verification link is invalid or expired");
  }

  user.emailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();

  sendSession(response, user);
}

export async function forgotPassword(request, response) {
  const user = await User.findOne({ email: request.body.email });

  if (!user) {
    throw new HttpError(404, "No account found with this email address");
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  user.passwordResetToken = resetToken;
  user.passwordResetExpires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour
  await user.save();

  await sendPasswordResetEmail(user, resetToken);

  response.json({ message: "Check your email for password reset instructions" });
}

export async function resetPassword(request, response) {
  const user = await User.findOne({
    passwordResetToken: request.body.token,
    passwordResetExpires: { $gt: new Date() }
  }).select("+passwordResetToken +passwordResetExpires +password");

  if (!user) {
    throw new HttpError(400, "Reset link is invalid or expired");
  }

  user.password = request.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  sendSession(response, user);
}

