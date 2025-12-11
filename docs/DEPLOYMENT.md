
# Deployment Guide: Postpartum Recovery AI

This guide covers deploying the application using two popular methods:
1. **Google Cloud Run** (Containerized, scalable)
2. **GitHub via Vercel** (Quickest, optimized for React)

---

## Option 1: Google Cloud Run

We use a Docker container to build the React app and serve it via Nginx.

### Prerequisites
- Google Cloud SDK (`gcloud`) installed.
- A Google Cloud Project.
- Docker installed (optional, for local testing).

### 1. Enable APIs
Enable the **Cloud Run** and **Artifact Registry** APIs in your Google Cloud Console.

### 2. Build & Deploy
Since this is a client-side React app, environment variables (API Keys) must be "baked" into the build. 

Run the following command in your terminal (replace placeholders with your actual values):

```bash
# 1. Submit the build to Cloud Build
gcloud builds submit --tag gcr.io/[YOUR_PROJECT_ID]/postpartum-ai \
  --substitutions=_API_KEY="your_gemini_key",_SUPABASE_URL="your_url",_SUPABASE_ANON_KEY="your_key"
```

*Note: If you are using a local Docker build, use:*
```bash
docker build \
  --build-arg API_KEY="your_key" \
  --build-arg SUPABASE_URL="url" \
  --build-arg SUPABASE_ANON_KEY="key" \
  -t gcr.io/[YOUR_PROJECT_ID]/postpartum-ai .
```

### 3. Deploy the Service

```bash
gcloud run deploy postpartum-ai \
  --image gcr.io/[YOUR_PROJECT_ID]/postpartum-ai \
  --platform managed \
  --region us-central1 \
  --port 8080 \
  --allow-unauthenticated
```

After deployment, Google Cloud will provide a URL (e.g., `https://postpartum-ai-xyz.a.run.app`) where your app is live.

---

## Option 2: GitHub via Vercel

Vercel is the easiest way to deploy React applications.

### 1. Push Code to GitHub
Ensure your project (including `package.json`, `vite.config.ts`, etc.) is pushed to a GitHub repository.

### 2. Connect to Vercel
1. Log in to [Vercel](https://vercel.com).
2. Click **"Add New..."** > **"Project"**.
3. Select your `postpartum-ai` repository.

### 3. Configure Project
Vercel should automatically detect **Vite** as the framework.
- **Root Directory**: `./`
- **Build Command**: `vite build` (default)
- **Output Directory**: `dist` (default)

### 4. Environment Variables
Expand the **"Environment Variables"** section and add the following:

| Key | Value |
|-----|-------|
| `API_KEY` | Your Google Gemini API Key |
| `SUPABASE_URL` | Your Supabase Project URL |
| `SUPABASE_ANON_KEY` | Your Supabase Anon Key |

### 5. Deploy
Click **Deploy**. Vercel will build your application and assign it a domain (e.g., `postpartum-ai.vercel.app`).

### Automatic Updates
Whenever you push changes to your `main` branch on GitHub, Vercel will automatically rebuild and redeploy your app.
