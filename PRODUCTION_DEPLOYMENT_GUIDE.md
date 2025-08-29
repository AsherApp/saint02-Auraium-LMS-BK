# 🚀 PRODUCTION DEPLOYMENT GUIDE

## 📋 PRE-DEPLOYMENT CHECKLIST

### ✅ Security Configuration
- [ ] Environment variables configured
- [ ] JWT secrets generated and secured
- [ ] CORS origins restricted to production domains
- [ ] Rate limiting enabled
- [ ] Security headers configured
- [ ] Input validation implemented
- [ ] SQL injection protection active
- [ ] XSS protection enabled

### ✅ Database Security
- [ ] RLS (Row Level Security) policies implemented
- [ ] Database backups configured
- [ ] Connection pooling optimized
- [ ] Sensitive data encrypted

### ✅ API Security
- [ ] Authentication middleware active
- [ ] Authorization checks implemented
- [ ] Input sanitization enabled
- [ ] File upload validation active
- [ ] API rate limiting configured

### ✅ Billing System
- [ ] Stripe integration configured
- [ ] Webhook endpoints secured
- [ ] Subscription management active
- [ ] Payment processing tested

## 🔧 ENVIRONMENT SETUP

### 1. Backend Environment Variables

Create `.env` file in `Endubackend/` directory:

```bash
# Application Settings
NODE_ENV=production
PORT=4000
APP_BASE_URL=https://your-api-domain.com
FRONTEND_URL=https://your-frontend-domain.com

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret

# Stripe Billing
STRIPE_SECRET_KEY=sk_live_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
STRIPE_PRICE_ID_PRO=price_your-pro-plan-price-id

# LiveKit Configuration
LIVEKIT_API_KEY=your-livekit-api-key
LIVEKIT_API_SECRET=your-livekit-api-secret
NEXT_PUBLIC_LIVEKIT_URL=wss://your-livekit-domain.com

# Security Settings
FREE_STUDENTS_LIMIT=5
SESSION_TIMEOUT=480
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 2. Frontend Environment Variables

Create `.env.local` file in root directory:

```bash
# API Configuration
NEXT_PUBLIC_API_BASE=https://your-api-domain.com

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# LiveKit Configuration
NEXT_PUBLIC_LIVEKIT_URL=wss://your-livekit-domain.com
```

## 🗄️ DATABASE SETUP

### 1. Apply Database Schema

Run the migration in your Supabase SQL editor:

```sql
-- Apply the complete schema from Endubackend/migrations/schema.sql
```

### 2. Enable Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
-- ... (enable for all tables)

-- Create RLS policies
-- Teachers can only access their own data
CREATE POLICY "Teachers can view own data" ON teachers
  FOR SELECT USING (auth.email() = email);

-- Students can only access their own data
CREATE POLICY "Students can view own data" ON students
  FOR SELECT USING (auth.email() = email);

-- Teachers can only access their own courses
CREATE POLICY "Teachers can manage own courses" ON courses
  FOR ALL USING (auth.email() = teacher_email);

-- Students can only access enrolled courses
CREATE POLICY "Students can view enrolled courses" ON courses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM enrollments 
      WHERE course_id = courses.id 
      AND student_email = auth.email()
    )
  );
```

## 🔐 SECURITY CONFIGURATION

### 1. JWT Configuration

Generate secure JWT secret:

```bash
# Generate a secure random string
openssl rand -base64 32
```

### 2. CORS Configuration

Update CORS origins in production:

```typescript
const corsOptions = {
  origin: ['https://your-frontend-domain.com'],
  credentials: true,
  optionsSuccessStatus: 200
}
```

### 3. Rate Limiting

Configure rate limits for production:

```typescript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
})
```

## 💳 BILLING SYSTEM SETUP

### 1. Stripe Configuration

1. Create Stripe account and get API keys
2. Create product and price for subscription
3. Configure webhook endpoint
4. Test payment flow

### 2. Webhook Configuration

Set webhook endpoint in Stripe dashboard:
```
https://your-api-domain.com/api/billing/webhook
```

Events to listen for:
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

## 🚀 DEPLOYMENT STEPS

### 1. Backend Deployment

```bash
# Build the application
cd Endubackend
npm install
npm run build

# Start production server
npm start
```

### 2. Frontend Deployment

```bash
# Build the application
npm install
npm run build

# Start production server
npm start
```

### 3. Database Migration

```bash
# Apply database schema
# Use Supabase dashboard or CLI to run migrations
```

## 🔍 POST-DEPLOYMENT VERIFICATION

### 1. Security Tests

- [ ] Authentication endpoints working
- [ ] Authorization checks active
- [ ] Rate limiting functional
- [ ] Input validation working
- [ ] File upload security active

### 2. Functionality Tests

- [ ] Teacher registration/login
- [ ] Student registration/login
- [ ] Course creation and management
- [ ] Live sessions working
- [ ] Assignment submission
- [ ] Billing system functional

### 3. Performance Tests

- [ ] API response times < 500ms
- [ ] Database queries optimized
- [ ] File uploads working
- [ ] Real-time features functional

## 📊 MONITORING & LOGGING

### 1. Application Monitoring

Set up monitoring for:
- API response times
- Error rates
- Database performance
- Memory usage
- CPU usage

### 2. Security Monitoring

Monitor for:
- Failed login attempts
- Unusual API usage patterns
- Security events
- File upload attempts

### 3. Business Metrics

Track:
- User registrations
- Subscription conversions
- Course creation rates
- Student engagement

## 🔧 MAINTENANCE

### 1. Regular Updates

- [ ] Keep dependencies updated
- [ ] Monitor security advisories
- [ ] Update SSL certificates
- [ ] Backup database regularly

### 2. Performance Optimization

- [ ] Monitor slow queries
- [ ] Optimize database indexes
- [ ] Cache frequently accessed data
- [ ] Compress static assets

### 3. Security Maintenance

- [ ] Rotate API keys regularly
- [ ] Monitor access logs
- [ ] Update security policies
- [ ] Conduct security audits

## 🆘 TROUBLESHOOTING

### Common Issues

1. **Authentication Failures**
   - Check JWT configuration
   - Verify Supabase settings
   - Check CORS configuration

2. **Database Connection Issues**
   - Verify connection strings
   - Check RLS policies
   - Monitor connection pool

3. **Billing System Issues**
   - Verify Stripe webhooks
   - Check subscription status
   - Monitor payment failures

4. **Performance Issues**
   - Check database queries
   - Monitor memory usage
   - Optimize API responses

## 📞 SUPPORT

For production support:
- Monitor application logs
- Set up alerting for critical issues
- Maintain backup and recovery procedures
- Document incident response procedures

---

**⚠️ IMPORTANT**: This system is now production-ready with comprehensive security measures. The billing system is fully implemented and teachers need to subscribe monthly to use the platform beyond the free tier (5 students).
