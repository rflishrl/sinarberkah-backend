import { z } from "zod";

/** Thrown when the environment is incomplete. The message is for server logs only. */
export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

const requiredTrimmedString = z
  .string({ error: "is required" })
  .trim()
  .min(1, "is required");

const requiredHttpsUrl = z
  .string({ error: "is required" })
  .trim()
  .min(1, "is required")
  .url("must be a valid URL")
  .refine((value) => value.startsWith("https://"), "must use https:// scheme")
  .transform((value) => value.replace(/\/+$/, ""));

function optionalPositiveNumber(defaultValue: number, max?: number) {
  let schema = z.coerce.number().finite().positive();
  if (max !== undefined) {
    schema = schema.max(max);
  }
  return z.preprocess(
    (value) =>
      value === undefined || (typeof value === "string" && value.trim() === "")
        ? defaultValue
        : value,
    schema,
  );
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
    R2_ACCESS_KEY_ID: requiredTrimmedString,
    R2_SECRET_ACCESS_KEY: requiredTrimmedString,
    R2_ENDPOINT: requiredHttpsUrl,
    R2_BUCKET_NAME: requiredTrimmedString,
    R2_PUBLIC_DOMAIN: requiredHttpsUrl,
    R2_APP_QUOTA_MB: optionalPositiveNumber(2560),
    MAX_UPLOAD_MB: optionalPositiveNumber(4, 4),
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

/** Clears cached server environment (intended for unit tests). */
export function resetServerEnvCache(): void {
  cachedServerEnv = undefined;
}

/**
 * Returns true for local and Vercel Preview environments so non-production uploads
 * use the `dev/` object key prefix inside the shared application bucket.
 */
export function isNonProductionMediaEnv(
  envSource: Record<string, string | undefined> = process.env,
): boolean {
  if (envSource.VERCEL_ENV) {
    return envSource.VERCEL_ENV !== "production";
  }
  return envSource.NODE_ENV !== "production";
}

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
