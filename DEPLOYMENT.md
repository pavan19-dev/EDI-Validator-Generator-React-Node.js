# 🚀 Deployment Guide - Render Platform

This guide will help you deploy both your **frontend** and **backend** on **Render.com** for **FREE**!

---

## 📋 Prerequisites

Before you begin, make sure you have:

1. ✅ A **GitHub account** (create one at https://github.com)
2. ✅ Your code **pushed to GitHub** (see instructions below if you haven't done this)
3. ✅ A **Render account** (create free account at https://render.com)

---

## Step 1️⃣: Push Your Code to GitHub

If your code isn't on GitHub yet, follow these steps:

### Option A: Using GitHub Desktop (Easiest)
1. Download **GitHub Desktop** from https://desktop.github.com
2. Install and sign in with your GitHub account
3. Click **"Add"** → **"Add Existing Repository"**
4. Select your project folder: `C:\Users\Pavan N\Desktop\EDI-WEBTOOL`
5. Click **"Publish repository"**
6. Uncheck **"Keep this code private"** (or keep it checked if you prefer)
7. Click **"Publish Repository"**

### Option B: Using Command Line
Open PowerShell in your project folder and run:

```powershell
cd "C:\Users\Pavan N\Desktop\EDI-WEBTOOL"
git init
git add .
git commit -m "Initial commit - EDI Tool"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/EDI-WEBTOOL.git
git push -u origin main
```

> **Note**: Replace `YOUR-USERNAME` with your actual GitHub username

---

## Step 2️⃣: Create a Render Account

1. Go to https://render.com
2. Click **"Get Started for Free"**
3. Sign up with your **GitHub account** (recommended)
4. Authorize Render to access your GitHub repositories

---

## Step 3️⃣: Deploy Your Application

### Deploy Using Blueprint (Easiest - Both Services at Once!)

1. **Go to Render Dashboard**: https://dashboard.render.com
2. Click **"New +"** → **"Blueprint"**
3. **Connect your GitHub repository**:
   - Find and select `EDI-WEBTOOL` repository
   - Click **"Connect"**
4. Render will automatically detect the `render.yaml` file
5. **Review the services**:
   - ✅ `edi-backend` - Your Node.js API
   - ✅ `edi-frontend` - Your React app
6. Click **"Apply"** to start deployment

### Manual Deployment (Alternative Method)

If you prefer to deploy services separately:

#### Deploy Backend First:

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `edi-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free`
4. Click **"Create Web Service"**
5. **Copy the backend URL** (e.g., `https://edi-backend.onrender.com`)

#### Deploy Frontend:

1. Click **"New +"** → **"Static Site"**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `edi-frontend`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `build`
   - **Plan**: `Free`
4. **Add Environment Variable**:
   - Click **"Advanced"** → **"Add Environment Variable"**
   - **Key**: `REACT_APP_API_URL`
   - **Value**: Your backend URL (e.g., `https://edi-backend.onrender.com`)
5. Click **"Create Static Site"**

---

## Step 4️⃣: Configure Environment Variables

### For Frontend:

1. Go to your **frontend service** in Render dashboard
2. Click **"Environment"** in the left sidebar
3. Add environment variable:
   - **Key**: `REACT_APP_API_URL`
   - **Value**: `https://edi-backend.onrender.com` (use your actual backend URL)
4. Click **"Save Changes"**
5. The frontend will automatically redeploy

### For Backend:

The backend is already configured! The `PORT` environment variable is automatically set by Render.

---

## Step 5️⃣: Wait for Deployment

- ⏳ **Backend**: Usually takes 2-3 minutes
- ⏳ **Frontend**: Usually takes 3-5 minutes

You can watch the build logs in real-time on the Render dashboard.

---

## Step 6️⃣: Test Your Deployment

Once both services show **"Live"** status:

1. **Open your frontend URL** (e.g., `https://edi-frontend.onrender.com`)
2. **Test the application**:
   - Click **"Load Sample"** to load sample data
   - Click **"Generate 856 ASN"**
   - Click **"Generate 810 Invoice"**
3. ✅ If everything works, you're done!

---

## 🎉 Your App is Live!

**Frontend URL**: `https://edi-frontend.onrender.com` (or your custom name)  
**Backend API URL**: `https://edi-backend.onrender.com` (or your custom name)

---

## 🔧 Troubleshooting

### Issue: Frontend can't connect to backend

**Solution**: Make sure the `REACT_APP_API_URL` environment variable is set correctly:
1. Go to frontend service → **Environment**
2. Verify `REACT_APP_API_URL` = your backend URL
3. Click **"Save Changes"** to redeploy

### Issue: Backend shows "Service Unavailable"

**Solution**: Check the backend logs:
1. Go to backend service → **Logs**
2. Look for errors in the startup process
3. Make sure all dependencies are installed

### Issue: "Free instance will spin down with inactivity"

**Note**: Free tier services sleep after 15 minutes of inactivity. The first request after sleeping takes ~30 seconds to wake up. This is normal for free tier!

---

## 🔄 Updating Your Deployment

Whenever you make changes to your code:

1. **Commit and push to GitHub**:
   ```powershell
   git add .
   git commit -m "Your update message"
   git push
   ```

2. **Render will automatically redeploy** your changes! 🎉

---

## 💡 Pro Tips

1. **Custom Domain**: You can add a custom domain in Render settings (free!)
2. **Environment Variables**: Never commit sensitive data - use environment variables
3. **Logs**: Always check logs if something isn't working
4. **Free Tier Limits**: 
   - 750 hours/month per service (enough for 24/7 operation)
   - Services sleep after 15 min of inactivity
   - 100GB bandwidth/month

---

## 📞 Need Help?

- **Render Documentation**: https://render.com/docs
- **Render Community**: https://community.render.com
- **GitHub Issues**: Create an issue in your repository

---

**Congratulations! Your EDI Tool is now deployed and accessible worldwide! 🌍**
