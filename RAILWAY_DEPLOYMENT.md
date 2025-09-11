# Railway Backend Deployment Guide

## Current Status
- ✅ Railway CLI installed
- ✅ Railway.json configuration exists
- ✅ Backend ready for deployment
- ❌ Need to login and connect to Railway project

## Required Steps to Complete Railway Deployment

### 1. Login to Railway (Interactive Required)
```bash
cd backend
railway login
```
This will open a browser for authentication.

### 2. Check for Existing Project or Create New One
```bash
# Check if project already exists
railway status

# If no project exists, create a new one
railway init

# Or link to existing project if you have the project ID
railway link [project-id]
```

### 3. Set Up Environment Variables
The following environment variables need to be set in Railway:

**Required Variables:**
```bash
DATABASE_URL=postgresql://...  # Railway will provide this
JWT_SECRET=your-super-secure-jwt-secret-key
NODE_ENV=production
FRONTEND_URL=https://thecommonsoul.com
PORT=3001  # Railway may override this
```

**Stripe Variables:**
```bash
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Cloudinary Variables:**
```bash
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### 4. Add Variables via Railway CLI
```bash
railway variables set DATABASE_URL="postgresql://..."
railway variables set JWT_SECRET="your-super-secure-jwt-secret-key"
railway variables set NODE_ENV="production"
railway variables set FRONTEND_URL="https://thecommonsoul.com"
railway variables set STRIPE_SECRET_KEY="sk_live_..."
railway variables set STRIPE_PUBLISHABLE_KEY="pk_live_..."
# ... add all other variables
```

### 5. Deploy to Railway
```bash
railway up
```

### 6. Add Database (PostgreSQL)
```bash
railway add postgresql
```

### 7. Run Database Migrations
```bash
railway run npm run db:migrate:prod
```

### 8. Get the Railway URL
```bash
railway domain
```
The URL should be: `https://common-soul-backend-production.up.railway.app`

## Production Environment Configuration

### Backend Configuration Ready
- ✅ `railway.json` configured with health check
- ✅ `package.json` has production scripts
- ✅ Database migrations ready
- ✅ Environment variables documented

### Frontend Configuration Updated
- ✅ API base URL updated to point to Railway
- ✅ Production build configuration ready

## Post-Deployment Steps

### 1. Test Backend Health
```bash
curl https://common-soul-backend-production.up.railway.app/health
```

### 2. Update Frontend Environment Variables
Create `.env.production` in frontend directory:
```bash
VITE_API_BASE_URL=https://common-soul-backend-production.up.railway.app
```

### 3. Rebuild and Deploy Frontend
```bash
npm run build
# Deploy to Vercel (automatic via git push)
```

### 4. Test Full Stack Integration
- Test user registration/login
- Test healer onboarding
- Test booking flow
- Test real-time messaging

## Railway Project Configuration

### Expected Railway URL Structure
- Backend: `https://common-soul-backend-production.up.railway.app`
- Database: Railway PostgreSQL (automatically configured)
- Environment: Production

### Railway Features Enabled
- Automatic deployments from git
- Health check monitoring (`/health` endpoint)
- Environment variable management
- PostgreSQL database with backups
- SSL/HTTPS automatically configured

## Troubleshooting

### Common Issues
1. **Database Connection**: Ensure DATABASE_URL is correctly set
2. **CORS Errors**: Verify FRONTEND_URL environment variable
3. **Build Failures**: Check Node.js version compatibility
4. **Health Check Failures**: Ensure `/health` endpoint responds

### Logs and Monitoring
```bash
railway logs        # View deployment logs
railway open        # Open Railway dashboard
railway status      # Check project status
```

## Security Checklist
- [ ] JWT_SECRET is cryptographically secure
- [ ] Database credentials are secure
- [ ] Stripe keys are production keys
- [ ] CORS is properly configured
- [ ] Rate limiting is enabled
- [ ] All sensitive data is in environment variables

---

**Next Action Required**: Run `railway login` and follow the steps above to complete the deployment.