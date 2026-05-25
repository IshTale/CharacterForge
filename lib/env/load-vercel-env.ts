import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Loads `.vercel/.env.development.local` (from `vercel pull`) when keys are not already set.
 * Next.js only auto-loads `.env*` at the project root; this bridges Vercel CLI output.
 */
export function loadVercelDevelopmentEnv() {
  const envPath = join(process.cwd(), ".vercel/.env.development.local");
  if (!existsSync(envPath)) {
    return;
  }

  const lines = readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const separator = trimmed.indexOf("=");
    if (separator <= 0) {
      continue;
    }
    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}
