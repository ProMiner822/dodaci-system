import { z } from "zod";

const envSchema = z.object({
  GMAIL_USER: z.string().min(1, "GMAIL_USER is required"),
  GMAIL_APP_PASSWORD: z.string().min(1, "GMAIL_APP_PASSWORD is required"),
  EMAIL_FROM: z.string().min(1, "EMAIL_FROM is required"),
  EMAIL_CC: z.string().optional().default(""),
  GOOGLE_SCRIPT_URL: z.string().url("GOOGLE_SCRIPT_URL must be a valid URL"),
  AUTH_USERNAME: z.string().min(1, "AUTH_USERNAME is required"),
  AUTH_PASSWORD_HASH: z.string().min(1, "AUTH_PASSWORD_HASH is required"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  BLOB_READ_WRITE_TOKEN: z.string().min(1, "BLOB_READ_WRITE_TOKEN is required"),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");

    throw new Error(
      `\n❌ Invalid environment variables:\n${formatted}\n\nCheck your .env.local file.\n`,
    );
  }

  return result.data;
}

export const env = validateEnv();
