import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  GROQ_API_KEY: z.string().min(1),
  PORT: z.string().optional(),
  FRONTEND_URL: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Missing required environment variables:");
  for (const issue of parsed.error.issues) {
    console.error(`  ${issue.path.join(".")}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = parsed.data;
