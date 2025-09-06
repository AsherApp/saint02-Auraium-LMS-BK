# 🚀 Backend Deployment Guide

## Environment Variables Required

Create these environment variables in your hosting platform:

```bash
# Server Configuration
PORT=4000
NODE_ENV=production

# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# LiveKit Configuration
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
LIVEKIT_URL=your_livekit_url

# JWT Configuration
JWT_SECRET=your_jwt_secret_key

# Stripe Configuration (if using payments)
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# CORS Configuration
CORS_ORIGIN=https://your-frontend-domain.com

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Deployment Options

### 1. Railway (Recommended)

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your `saint02-Auraium-LMS-BK` repository
5. Add environment variables in the Variables tab
6. Deploy!

### 2. Render

1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Click "New" → "Web Service"
4. Connect your `saint02-Auraium-LMS-BK` repository
5. Configure:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
6. Add environment variables
7. Deploy!

### 3. Vercel

1. Go to [vercel.com](https://vercel.com)
2. Import your `saint02-Auraium-LMS-BK` repository
3. Configure as Node.js project
4. Add environment variables
5. Deploy!

### 4. DigitalOcean App Platform

1. Go to [cloud.digitalocean.com](https://cloud.digitalocean.com)
2. Create new App
3. Connect GitHub repository
4. Configure build and start commands
5. Add environment variables
6. Deploy!

## Post-Deployment Steps

1. **Update Frontend CORS**: Update your frontend to use the new backend URL
2. **Test API Endpoints**: Verify all endpoints are working
3. **Monitor Logs**: Check for any errors in the hosting platform logs
4. **Set up Monitoring**: Consider adding error tracking (Sentry, etc.)

## Health Check

Your backend includes a health check endpoint at `/health` that returns:
```json
{
  "status": "ok",
  "timestamp": "2025-01-27T...",
  "uptime": 123.456
}
```

## Troubleshooting

- **Build Fails**: Check that all dependencies are in `package.json`
- **Runtime Errors**: Check environment variables are set correctly
- **CORS Issues**: Update `CORS_ORIGIN` to your frontend domain
- **Database Connection**: Verify Supabase credentials are correct
