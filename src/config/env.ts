export const env = {
  SUPABASE_URL: process.env.SUPABASE_URL || "",
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || "",
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  SUPABASE_JWT_SECRET: process.env.SUPABASE_JWT_SECRET || "",
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || "",
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || "",
  STRIPE_PRICE_ID_PRO: process.env.STRIPE_PRICE_ID_PRO || "",
  STRIPE_PRICE_ID_TRIAL: process.env.STRIPE_PRICE_ID_TRIAL || "",
  LIVEKIT_API_KEY: process.env.LIVEKIT_API_KEY || "",
  LIVEKIT_API_SECRET: process.env.LIVEKIT_API_SECRET || "",
  APP_BASE_URL: process.env.APP_BASE_URL || "http://localhost:4000",
  FREE_STUDENTS_LIMIT: Number(process.env.FREE_STUDENTS_LIMIT || 5),
  TRIAL_PERIOD_DAYS: Number(process.env.TRIAL_PERIOD_DAYS || 7),
  PRO_MONTHLY_PRICE: Number(process.env.PRO_MONTHLY_PRICE || 50), // £50/month
}

