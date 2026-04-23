import { Router, type Request, type Response } from "express";
import { Resend } from "resend";
import { db, passwordResetsTable } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";
import { clerkClient } from "@clerk/express";
import { z } from "zod";
import crypto from "crypto";

const router = Router();

function getResend() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not set");
  }
  return new Resend(process.env.RESEND_API_KEY);
}

function generateOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
}

const ForgotPasswordSchema = z.object({
  email: z.string().email(),
});

const ResetPasswordSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
  newPassword: z.string().min(8),
});

router.post("/forgot-password", async (req: Request, res: Response) => {
  const parsed = ForgotPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid email address" });
    return;
  }

  const { email } = parsed.data;

  try {
    const users = await clerkClient().users.getUserList({ emailAddress: [email] });
    if (users.totalCount === 0) {
      res.json({ success: true });
      return;
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await db.insert(passwordResetsTable).values({
      email,
      otp,
      expiresAt,
      used: false,
    });

    await getResend().emails.send({
      from: "Securify <onboarding@resend.dev>",
      to: email,
      subject: "Your Securify password reset code",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>Reset your password</title>
          </head>
          <body style="margin:0;padding:0;background:#F9FAFB;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;padding:40px 0;">
              <tr>
                <td align="center">
                  <table width="480" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
                    <tr>
                      <td style="background:#1E3A8A;padding:28px 40px;">
                        <table cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="color:#FFFFFF;font-size:20px;font-weight:700;letter-spacing:-0.3px;">
                              🛡️ Securify
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:40px;">
                        <h1 style="margin:0 0 12px;font-size:24px;font-weight:700;color:#1F2937;letter-spacing:-0.3px;">
                          Reset your password
                        </h1>
                        <p style="margin:0 0 28px;font-size:15px;color:#6B7280;line-height:1.6;">
                          Use the code below to reset your Securify password. It expires in 15 minutes.
                        </p>
                        <div style="background:#EFF6FF;border:2px solid #BFDBFE;border-radius:10px;padding:24px;text-align:center;margin:0 0 28px;">
                          <span style="font-size:36px;font-weight:700;letter-spacing:8px;color:#1E3A8A;font-variant-numeric:tabular-nums;">
                            ${otp}
                          </span>
                        </div>
                        <p style="margin:0;font-size:13px;color:#9CA3AF;line-height:1.6;">
                          If you didn't request a password reset, you can safely ignore this email. Your account is secure.
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="background:#F9FAFB;padding:20px 40px;border-top:1px solid #E5E7EB;">
                        <p style="margin:0;font-size:12px;color:#9CA3AF;text-align:center;">
                          © ${new Date().getFullYear()} Securify. AI-powered scam detection.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ error: "Failed to send reset email" });
  }
});

router.post("/reset-password", async (req: Request, res: Response) => {
  const parsed = ResetPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request data" });
    return;
  }

  const { email, otp, newPassword } = parsed.data;

  try {
    const now = new Date();
    const records = await db
      .select()
      .from(passwordResetsTable)
      .where(
        and(
          eq(passwordResetsTable.email, email),
          eq(passwordResetsTable.otp, otp),
          eq(passwordResetsTable.used, false),
          gt(passwordResetsTable.expiresAt, now)
        )
      )
      .limit(1);

    if (records.length === 0) {
      res.status(400).json({ error: "Invalid or expired code" });
      return;
    }

    const record = records[0];

    const users = await clerkClient().users.getUserList({ emailAddress: [email] });
    if (users.totalCount === 0) {
      res.status(400).json({ error: "User not found" });
      return;
    }

    const user = users.data[0];

    await clerkClient().users.updateUser(user.id, { password: newPassword });

    await db
      .update(passwordResetsTable)
      .set({ used: true })
      .where(eq(passwordResetsTable.id, record.id));

    res.json({ success: true });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ error: "Failed to reset password" });
  }
});

export default router;
