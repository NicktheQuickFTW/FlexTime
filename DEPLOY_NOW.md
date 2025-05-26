# 🚀 Deploy FlexTime to Railway - Quick Start

## Step 1: Deploy Backend to Railway

1. **Go to Railway**: [railway.app](https://railway.app)
2. **Login with GitHub** (connects automatically)
3. **New Project** → "Deploy from GitHub repo"
4. **Select**: FlexTime repository
5. **Service Settings**:
   - **Root Directory**: `backend`
   - Railway auto-detects Dockerfile ✅

6. **Add Environment Variables**:
   ```
   NODE_ENV=production
   PORT=3001
   LOG_LEVEL=info
   NEON_DB_CONNECTION_STRING=postgresql://xii-os_owner:npg_4qYJFR0lneIg@ep-wandering-sea-aa01qr2o-pooler.westus3.azure.neon.tech:5432/HELiiX?sslmode=require
   USE_NEON_DB=true
   ENABLE_NEON_MEMORY=true
   NEON_DB_NAME=HELiiX
   JWT_SECRET=flextime_jwt_secret_key_2024
   ANTHROPIC_API_KEY=sk-ant-api03-ZwPGHdvBxAcjCpEqGSxzwlcXwGwJlpLJcVlvnMJnrCbzwHwYVsHlMOWXQRzQWDLOQA-5Aq6DQAAAAGZ8Jg9A
   GOOGLE_MAPS_API_KEY=AIzaSyC_a-sk9MpJ2cFUxDaY6XGvDZf4-vw9-nQ
   ```

7. **Deploy**: Railway builds automatically
8. **Save Backend URL**: Note the generated URL (like `backend-production-abc123.railway.app`)

## Step 2: Deploy Frontend to Railway

1. **Add Service** (in same project): "GitHub Repo"
2. **Select**: FlexTime repository again
3. **Service Settings**:
   - **Root Directory**: `frontend`
   - Railway auto-detects React ✅

4. **Add Environment Variables**:
   ```
   REACT_APP_API_URL=https://[YOUR-BACKEND-URL]/api
   ```
   Replace `[YOUR-BACKEND-URL]` with the actual backend URL from Step 1

5. **Deploy**: Railway builds React app automatically

## Step 3: Test Your Live App! 🎉

- **Backend API**: `https://[backend-url]/api/status`
- **Frontend App**: `https://[frontend-url]`
- **Login**: Use the live application!

**Expected Deployment Time**: ~10 minutes
**Cost**: ~$5/month (Backend: $5/month, Frontend: Free)

Ready to deploy? Follow these steps and you'll have FlexTime live in ~10 minutes! 🚀