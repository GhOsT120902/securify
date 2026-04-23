import app from "./app";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  const domain = process.env.GOOGLE_REDIRECT_URI
    ? "(custom)"
    : process.env.REPLIT_DEV_DOMAIN || process.env.REPLIT_DOMAINS?.split(",")[0];
  const callbackUrl = process.env.GOOGLE_REDIRECT_URI
    || `https://${domain}/api/auth/google/callback`;
  logger.info({ callbackUrl }, "Google OAuth callback URL — add this to Google Cloud Console if sign-in fails");
});
