# Endubackend (MVC, Supabase, Stripe)

Production backend plan using:
- Supabase (Postgres, Auth, Storage)
- Stripe (subscriptions, teacher billing)
- Node.js + TypeScript + Express (MVC)

## Features (phase 1)
- Auth via Supabase JWT (bearer) with JWK validation
- Announcements (teacher → students)
- Courses, enrollments
- Assignments, submissions, grading
- Invites (student onboarding)
- Live sessions and polls (core tables + endpoints)
- Storage pre-signed uploads via Supabase Storage
- Billing scaffolding with Stripe (free tier 5 students, then paid)

## Structure
```
Endubackend/
  src/
    config/
      env.ts
    lib/
      supabase.ts
      stripe.ts
      jwt.ts
    middlewares/
      auth.ts
      error.ts
    routes/
      index.ts
      announcement.routes.ts
      courses.routes.ts
      assignments.routes.ts
      live.routes.ts
      polls.routes.ts
      storage.routes.ts
      billing.routes.ts
      students.routes.ts
    controllers/
      announcement.controller.ts
      courses.controller.ts
      assignments.controller.ts
      live.controller.ts
      polls.controller.ts
      storage.controller.ts
      billing.controller.ts
      students.controller.ts
    services/
      announcement.service.ts
      courses.service.ts
      assignments.service.ts
      live.service.ts
      polls.service.ts
      storage.service.ts
      billing.service.ts
      students.service.ts
    models/
      types.ts
    utils/
      asyncHandler.ts
    server.ts
  migrations/
    schema.sql (Supabase SQL)
  package.json
  tsconfig.json
  .env.example
```

## Environment
Create `.env` from example:
```
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_JWT_SECRET=

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID_PRO=
APP_BASE_URL=http://localhost:4000
FREE_STUDENTS_LIMIT=5
PORT=4000
```

## Install & run
```
cd Endubackend
npm i
npm run dev
```

## Database schema (Supabase)
Apply `migrations/schema.sql` in Supabase SQL editor (or CLI). Enable RLS as noted inside.

## HTTP overview
- Announcements: `POST /api/announcements` (teacher), `GET /api/announcements?teacher=...`
- Courses: `GET/POST /api/courses`, `GET/PUT /api/courses/:id`, `POST /api/courses/:id/enroll`
- Assignments: `POST /api/assignments`, `GET /api/courses/:id/assignments`, `GET /api/assignments/:id`, `POST /api/assignments/:id/submit`, `POST /api/assignments/:id/grade`
- Live: `POST /api/live`, `POST /api/live/:id/status`
- Polls: `POST /api/live/:id/polls`, `POST /api/polls/:id/vote`
- Storage: `POST /api/storage/sign-upload` (returns signed URL)
- Billing: `POST /api/billing/portal`, `POST /api/billing/webhook`

All endpoints expect Authorization: Bearer <supabase_jwt> unless noted.

## Notes
- Free tier: enforce max 5 active students per teacher; service checks on enrollment and invite creation.
- Stripe: webhook sets `teachers.subscription_status` and `max_students_allowed`.

