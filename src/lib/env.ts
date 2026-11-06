import { z } from "zod";

/** Thrown when the environment is incomplete. The message is for server logs only. */
export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

/**
 * Server environment variables.
 * None use public client prefixes to prevent leaking credentials to the browser.
 */
const serverEnvSchema = z
  .object({
    DATABASE_URI: z
      .string()
      .min(1, "must be a valid PostgreSQL connection string")
      .optional(),
    DATABASE_URL: z
      .string()
      .min(1, "must be a valid PostgreSQL connection string")
      .optional(),
    POSTGRES_URL: z
      .string()
      .min(1, "must be a valid PostgreSQL connection string")
      .optional(),
    SESSION_SECRET: z
      .string()
      .min(32, "must be at least 32 characters long for secure HMAC signing")
      .default(
        "sinarberkah_session_secret_default_development_key_minimum_32_characters",
      ),
    BLOB_READ_WRITE_TOKEN: z.string().optional(),
    ALLOWED_ORIGINS: z.string().optional(),
    FRONTEND_URL: z.string().optional(),
    REVALIDATE_SECRET: z.string().optional(),
    CRON_SECRET: z.string().optional(),
  })
  .transform((data) => {
    const uri = data.DATABASE_URI || data.DATABASE_URL || data.POSTGRES_URL;
    if (!uri) {
      throw new ConfigError(
        "DATABASE_URI, DATABASE_URL, or POSTGRES_URL must be provided.",
      );
    }
    return {
      ...data,
      DATABASE_URI: uri,
    };
  });

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cachedServerEnv: ServerEnv | undefined;

/** Reads and validates the environment on first use (not at build time). */
export function getServerEnv(): ServerEnv {
  if (cachedServerEnv) return cachedServerEnv;

  const result = serverEnvSchema.safeParse(process.env);
  if (!result.success) {
    const problems = result.error.issues
      .map((issue) => `${issue.path.join(".")} ${issue.message}`)
      .join("; ");
    throw new ConfigError(`Incomplete environment: ${problems}`);
  }

  cachedServerEnv = result.data;
  return cachedServerEnv;
}

export const env = new Proxy({} as ServerEnv, {
  get(_target, prop: string | symbol) {
    return getServerEnv()[prop as keyof ServerEnv];
  },
});

/** Frontend origins allowed to read the API from the browser (CORS). */
export function getAllowedOrigins(
  value = process.env.ALLOWED_ORIGINS,
): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export const parseAllowedOrigins = getAllowedOrigins;
