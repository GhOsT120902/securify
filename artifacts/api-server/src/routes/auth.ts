import { Router, type Request, type Response } from "express";
import { Resend } from "resend";
import bcrypt from "bcryptjs";
import { db, passwordResetsTable, usersTable, emailVerificationsTable } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";
import { z } from "zod";
import crypto from "crypto";

const router = Router();

function getResend() {
  if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY is not set");
  return new Resend(process.env.RESEND_API_KEY);
}

function generateOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
}

function otpEmailHtml(otp: string, subject: string, bodyLine: string) {
  return `<!DOCTYPE html>
<html>
  <head><meta charset="utf-8" /><title>${subject}</title></head>
  <body style="margin:0;padding:0;background:#F9FAFB;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;padding:40px 0;">
      <tr><td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:#1E3A8A;padding:28px 40px;">
              <span style="color:#FFFFFF;font-size:20px;font-weight:700;">🛡️ Securify</span>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <h1 style="margin:0 0 12px;font-size:24px;font-weight:700;color:#1F2937;">${subject}</h1>
              <p style="margin:0 0 28px;font-size:15px;color:#6B7280;line-height:1.6;">${bodyLine}</p>
              <div style="background:#EFF6FF;border:2px solid #BFDBFE;border-radius:10px;padding:24px;text-align:center;margin:0 0 28px;">
                <span style="font-size:36px;font-weight:700;letter-spacing:8px;color:#1E3A8A;font-variant-numeric:tabular-nums;">${otp}</span>
              </div>
              <p style="margin:0;font-size:13px;color:#9CA3AF;line-height:1.6;">If you didn't request this, you can safely ignore this email.</p>
            </td>
          </tr>
          <tr>
            <td style="background:#F9FAFB;padding:20px 40px;border-top:1px solid #E5E7EB;">
              <p style="margin:0;font-size:12px;color:#9CA3AF;text-align:center;">© ${new Date().getFullYear()} Securify. AI-powered scam detection.</p>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

// ── Register ──────────────────────────────────────────────────────────────────
const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

router.post("/register", async (req: Request, res: Response) => {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Email and password (min 8 chars) are required" });
    return;
  }
  const { email, password } = parsed.data;

  try {
    const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (existing.length > 0) {
      res.status(409).json({ error: "An account with this email already exists" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await db.insert(usersTable).values({ email, passwordHash, emailVerified: false });

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await db.insert(emailVerificationsTable).values({ email, otp, expiresAt, used: false });

    await getResend().emails.send({
      from: "Securify <onboarding@resend.dev>",
      to: email,
      subject: "Verify your Securify email",
      html: otpEmailHtml(otp, "Verify your email", "Use the code below to verify your email address. It expires in 15 minutes."),
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Registration failed" });
  }
});

// ── Verify email ──────────────────────────────────────────────────────────────
const VerifyEmailSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
});

router.post("/verify-email", async (req: Request, res: Response) => {
  const parsed = VerifyEmailSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  const { email, otp } = parsed.data;

  try {
    const now = new Date();
    const records = await db.select().from(emailVerificationsTable).where(
      and(
        eq(emailVerificationsTable.email, email),
        eq(emailVerificationsTable.otp, otp),
        eq(emailVerificationsTable.used, false),
        gt(emailVerificationsTable.expiresAt, now),
      )
    ).limit(1);

    if (records.length === 0) {
      res.status(400).json({ error: "Invalid or expired code" });
      return;
    }

    await db.update(emailVerificationsTable).set({ used: true }).where(eq(emailVerificationsTable.id, records[0].id));
    await db.update(usersTable).set({ emailVerified: true }).where(eq(usersTable.email, email));

    const users = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (users.length === 0) {
      res.status(400).json({ error: "User not found" });
      return;
    }

    req.session.userId = users[0].id;
    res.json({ success: true });
  } catch (err) {
    console.error("Verify email error:", err);
    res.status(500).json({ error: "Verification failed" });
  }
});

// ── Login ─────────────────────────────────────────────────────────────────────
const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

router.post("/login", async (req: Request, res: Response) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }
  const { email, password } = parsed.data;

  try {
    const users = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (users.length === 0) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const user = users[0];
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    if (!user.emailVerified) {
      res.status(403).json({ error: "Please verify your email before signing in", code: "EMAIL_NOT_VERIFIED" });
      return;
    }

    req.session.userId = user.id;
    res.json({ success: true, user: { id: user.id, email: user.email } });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

// ── Logout ────────────────────────────────────────────────────────────────────
router.post("/logout", (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) console.error("Logout error:", err);
    res.clearCookie("sid");
    res.json({ success: true });
  });
});

// ── Me ────────────────────────────────────────────────────────────────────────
router.get("/me", async (req: Request, res: Response) => {
  const userId = req.session?.userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  try {
    const users = await db.select({
        id: usersTable.id,
        email: usersTable.email,
        displayName: usersTable.displayName,
        avatarUrl: usersTable.avatarUrl,
      }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);

    if (users.length === 0) {
      req.session.destroy(() => {});
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    res.json({ user: users[0] });
  } catch (err) {
    console.error("Me error:", err);
    res.status(500).json({ error: "Internal error" });
  }
});

// ── Resend verification OTP ───────────────────────────────────────────────────
const ResendOtpSchema = z.object({ email: z.string().email() });

router.post("/resend-otp", async (req: Request, res: Response) => {
  const parsed = ResendOtpSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid email" }); return; }
  const { email } = parsed.data;

  try {
    const users = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (users.length === 0 || users[0].emailVerified) {
      res.json({ success: true });
      return;
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await db.insert(emailVerificationsTable).values({ email, otp, expiresAt, used: false });

    await getResend().emails.send({
      from: "Securify <onboarding@resend.dev>",
      to: email,
      subject: "Your new Securify verification code",
      html: otpEmailHtml(otp, "New verification code", "Here's your new 6-digit code. It expires in 15 minutes."),
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Resend OTP error:", err);
    res.status(500).json({ error: "Failed to resend code" });
  }
});

// ── Forgot password ───────────────────────────────────────────────────────────
const ForgotPasswordSchema = z.object({ email: z.string().email() });

router.post("/forgot-password", async (req: Request, res: Response) => {
  const parsed = ForgotPasswordSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid email address" }); return; }
  const { email } = parsed.data;

  try {
    const users = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (users.length === 0) { res.json({ success: true }); return; }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await db.insert(passwordResetsTable).values({ email, otp, expiresAt, used: false });

    await getResend().emails.send({
      from: "Securify <onboarding@resend.dev>",
      to: email,
      subject: "Your Securify password reset code",
      html: otpEmailHtml(otp, "Reset your password", "Use the code below to reset your Securify password. It expires in 15 minutes."),
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ error: "Failed to send reset email" });
  }
});

// ── Reset password ────────────────────────────────────────────────────────────
const ResetPasswordSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
  newPassword: z.string().min(8),
});

router.post("/reset-password", async (req: Request, res: Response) => {
  const parsed = ResetPasswordSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid request data" }); return; }
  const { email, otp, newPassword } = parsed.data;

  try {
    const now = new Date();
    const records = await db.select().from(passwordResetsTable).where(
      and(
        eq(passwordResetsTable.email, email),
        eq(passwordResetsTable.otp, otp),
        eq(passwordResetsTable.used, false),
        gt(passwordResetsTable.expiresAt, now),
      )
    ).limit(1);

    if (records.length === 0) { res.status(400).json({ error: "Invalid or expired code" }); return; }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await db.update(usersTable).set({ passwordHash }).where(eq(usersTable.email, email));
    await db.update(passwordResetsTable).set({ used: true }).where(eq(passwordResetsTable.id, records[0].id));

    res.json({ success: true });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ error: "Failed to reset password" });
  }
});

// ── Google OAuth ──────────────────────────────────────────────────────────────
function getGoogleCallbackUrl(): string {
  if (process.env.GOOGLE_REDIRECT_URI) return process.env.GOOGLE_REDIRECT_URI;
  const domain = process.env.REPLIT_DEV_DOMAIN || process.env.REPLIT_DOMAINS?.split(",")[0];
  return `https://${domain}/api/auth/google/callback`;
}

router.get("/google", (_req: Request, res: Response) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) { res.status(500).send("Google OAuth not configured"); return; }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getGoogleCallbackUrl(),
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "select_account",
  });

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

router.get("/google/callback", async (req: Request, res: Response) => {
  const { code, error } = req.query as { code?: string; error?: string };

  if (error || !code) {
    res.redirect("/?error=google_auth_failed");
    return;
  }

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: getGoogleCallbackUrl(),
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      console.error("Google token exchange failed:", await tokenRes.text());
      res.redirect("/?error=google_auth_failed");
      return;
    }

    const tokens = await tokenRes.json() as { access_token: string };

    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userInfoRes.ok) {
      res.redirect("/?error=google_auth_failed");
      return;
    }

    const googleUser = await userInfoRes.json() as {
      id: string;
      email: string;
      name?: string;
      picture?: string;
      verified_email?: boolean;
    };

    // Find existing user by googleId or email
    let user = (await db.select().from(usersTable).where(eq(usersTable.googleId, googleUser.id)).limit(1))[0];

    if (!user) {
      const byEmail = (await db.select().from(usersTable).where(eq(usersTable.email, googleUser.email)).limit(1))[0];
      if (byEmail) {
        // Link Google to existing email account
        await db.update(usersTable).set({
          googleId: googleUser.id,
          emailVerified: true,
          displayName: byEmail.displayName ?? googleUser.name,
          avatarUrl: byEmail.avatarUrl ?? googleUser.picture,
        }).where(eq(usersTable.id, byEmail.id));
        user = { ...byEmail, googleId: googleUser.id, emailVerified: true };
      } else {
        // Create new user
        const inserted = await db.insert(usersTable).values({
          email: googleUser.email,
          googleId: googleUser.id,
          emailVerified: googleUser.verified_email ?? true,
          displayName: googleUser.name,
          avatarUrl: googleUser.picture,
        }).returning();
        user = inserted[0];

        // Send welcome email via Resend
        try {
          await getResend().emails.send({
            from: "Securify <onboarding@resend.dev>",
            to: googleUser.email,
            subject: "Welcome to Securify!",
            html: `<!DOCTYPE html>
<html>
  <head><meta charset="utf-8" /></head>
  <body style="margin:0;padding:0;background:#F9FAFB;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;padding:40px 0;">
      <tr><td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <tr><td style="background:#1E3A8A;padding:28px 40px;"><span style="color:#FFFFFF;font-size:20px;font-weight:700;">🛡️ Securify</span></td></tr>
          <tr><td style="padding:40px;">
            <h1 style="margin:0 0 12px;font-size:24px;font-weight:700;color:#1F2937;">Welcome${googleUser.name ? `, ${googleUser.name.split(" ")[0]}` : ""}!</h1>
            <p style="margin:0 0 20px;font-size:15px;color:#6B7280;line-height:1.6;">Your Securify account is ready. Upload a screenshot or paste any suspicious message and our AI will tell you if it's a scam — in seconds.</p>
            <p style="margin:0;font-size:13px;color:#9CA3AF;">Stay safe online 🛡️</p>
          </td></tr>
          <tr><td style="background:#F9FAFB;padding:20px 40px;border-top:1px solid #E5E7EB;"><p style="margin:0;font-size:12px;color:#9CA3AF;text-align:center;">© ${new Date().getFullYear()} Securify</p></td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`,
          });
        } catch (emailErr) {
          console.error("Welcome email failed:", emailErr);
        }
      }
    }

    req.session.userId = user.id;
    res.redirect("/app");
  } catch (err) {
    console.error("Google callback error:", err);
    res.redirect("/?error=google_auth_failed");
  }
});

export default router;

