# 🍎 Mac Setup Guide — AI Code Reviewer
## From Zero to Deployed on GCP Cloud Run

---

## Prerequisites Check

Open **Terminal** (Cmd+Space → "Terminal") and verify:

```bash
# Check Xcode Command Line Tools (needed for Git, compilers)
xcode-select --version
# If missing, run: xcode-select --install
```

---

## PART 1 — Install All Tools

### Step 1.1 — Install Homebrew (Mac package manager)

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

After install, follow the printed instructions to add brew to your PATH.
For Apple Silicon Macs (M1/M2/M3), run:

```bash
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"
```

Verify:
```bash
brew --version
```

---

### Step 1.2 — Install Python 3.11

```bash
brew install python@3.11
```

Add to PATH (Apple Silicon):
```bash
echo 'export PATH="/opt/homebrew/opt/python@3.11/bin:$PATH"' >> ~/.zprofile
source ~/.zprofile
```

Verify:
```bash
python3.11 --version
# Should print: Python 3.11.x
```

---

### Step 1.3 — Install Node.js 20

```bash
brew install node@20
echo 'export PATH="/opt/homebrew/opt/node@20/bin:$PATH"' >> ~/.zprofile
source ~/.zprofile
node --version   # Should print: v20.x.x
npm --version
```

---

### Step 1.4 — Install Google Cloud SDK

```bash
brew install --cask google-cloud-sdk
```

After install, restart Terminal OR run:
```bash
source "$(brew --prefix)/share/google-cloud-sdk/path.zsh.inc"
source "$(brew --prefix)/share/google-cloud-sdk/completion.zsh.inc"
```

Verify:
```bash
gcloud --version
```

---

### Step 1.5 — Install Docker Desktop

```bash
brew install --cask docker
```

Then open Docker Desktop from Applications and let it finish starting up.
Verify:
```bash
docker --version
docker compose version
```

---

### Step 1.6 — Install Git (already included with Xcode tools, but update it)

```bash
brew install git
git --version
```

Configure Git with your identity:
```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

---

## PART 2 — GCP Project Setup

### Step 2.1 — Login to Google Cloud

```bash
gcloud auth login
# Opens browser — sign in with your Google account

gcloud auth application-default login
# Also opens browser — needed for local Vertex AI access
```

---

### Step 2.2 — Create GCP Project

```bash
# Replace "ai-code-reviewer-prod" with your preferred project ID
# Project IDs must be globally unique!
gcloud projects create ai-code-reviewer-prod --name="AI Code Reviewer"

# Set as active project
gcloud config set project ai-code-reviewer-prod

# Verify
gcloud config get-value project
```

> ⚠️ You must have billing enabled on your GCP account for Vertex AI and Cloud Run.
> Go to: https://console.cloud.google.com/billing

---

### Step 2.3 — Enable Required APIs

```bash
gcloud services enable \
  run.googleapis.com \
  aiplatform.googleapis.com \
  firestore.googleapis.com \
  secretmanager.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  iam.googleapis.com

# This takes 1-2 minutes
echo "APIs enabled ✅"
```

---

### Step 2.4 — Create Artifact Registry Repository

```bash
gcloud artifacts repositories create ai-reviewer \
  --repository-format=docker \
  --location=us-central1 \
  --description="AI Code Reviewer Docker images"
```

---

### Step 2.5 — Create Firestore Database

```bash
gcloud firestore databases create \
  --location=us-central1 \
  --type=firestore-native
```

---

## PART 3 — Get the Project Code

### Step 3.1 — Clone or Copy the Project

If you downloaded the zip, unzip it:
```bash
cd ~/Desktop
unzip ai-code-reviewer.zip
cd ai-code-reviewer
```

Or if you're starting fresh, the folder is already created.

---

### Step 3.2 — Set Up Python Virtual Environment

```bash
cd ~/Desktop/ai-code-reviewer   # or wherever you put it

# Create venv
python3.11 -m venv venv

# Activate it
source venv/bin/activate

# You should see (venv) in your prompt now

# Install dependencies
pip install --upgrade pip
pip install -r backend/requirements.txt

echo "Python deps installed ✅"
```

---

### Step 3.3 — Set Up Frontend

```bash
cd frontend
npm install
cd ..
echo "Node deps installed ✅"
```

---

## PART 4 — GitHub Setup

### Step 4.1 — Create GitHub Personal Access Token

1. Go to https://github.com/settings/tokens?type=beta
2. Click **"Generate new token"**
3. Give it a name: `ai-code-reviewer`
4. Set Expiration: 90 days (or custom)
5. Under **Repository access** → Select your target repo
6. Under **Permissions**:
   - Pull requests: **Read and write**
   - Contents: **Read-only**
7. Click **Generate token**
8. **Copy it now** — you won't see it again!

---

### Step 4.2 — Generate a Webhook Secret

```bash
# Generate a random 32-byte hex string
python3 -c "import secrets; print(secrets.token_hex(32))"
# Example output: a3f8c2d1e4b7a9f0c3d2e1b8a7f6c5d4e3b2a1f0c9d8e7b6a5f4c3d2e1b0a9f8
# Save this string!
```

---

### Step 4.3 — Create GitHub Repository

```bash
# Create a new repo on GitHub at: https://github.com/new
# Name it: ai-code-reviewer
# Keep it private if you want
# Do NOT initialize with README (we'll push our own)
```

---

## PART 5 — Configure Secrets

### Step 5.1 — Create Local .env File

```bash
cd ~/Desktop/ai-code-reviewer
cp .env.example .env
```

Edit `.env`:
```bash
open -e .env
# Or use nano: nano .env
# Or VS Code: code .env
```

Fill in your values:
```
GCP_PROJECT_ID=ai-code-reviewer-prod
GCP_LOCATION=us-central1
VERTEX_MODEL=gemini-1.5-pro-001
GITHUB_TOKEN=ghp_your_actual_token_here
GITHUB_WEBHOOK_SECRET=your_random_secret_here
FIRESTORE_COLLECTION=reviews
```

Save and close.

---

### Step 5.2 — Store Secrets in GCP Secret Manager

```bash
# Make sure you're in the project
gcloud config get-value project

# Store GitHub token
echo -n "ghp_YOUR_GITHUB_TOKEN_HERE" | \
  gcloud secrets create github-token \
  --data-file=- \
  --replication-policy=automatic

# Store webhook secret
echo -n "YOUR_WEBHOOK_SECRET_HERE" | \
  gcloud secrets create github-webhook-secret \
  --data-file=- \
  --replication-policy=automatic

echo "Secrets stored ✅"
```

---

### Step 5.3 — Grant IAM Permissions

```bash
# Get your project number
export PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format="value(projectNumber)")
echo "Project number: $PROJECT_NUMBER"

# The default Compute service account used by Cloud Run
export SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
echo "Service account: $SA"

# Grant Secret Manager access
gcloud secrets add-iam-policy-binding github-token \
  --member="serviceAccount:${SA}" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding github-webhook-secret \
  --member="serviceAccount:${SA}" \
  --role="roles/secretmanager.secretAccessor"

# Grant Vertex AI access
gcloud projects add-iam-policy-binding $(gcloud config get-value project) \
  --member="serviceAccount:${SA}" \
  --role="roles/aiplatform.user"

# Grant Firestore access
gcloud projects add-iam-policy-binding $(gcloud config get-value project) \
  --member="serviceAccount:${SA}" \
  --role="roles/datastore.user"

echo "IAM permissions set ✅"
```

---

## PART 6 — Run Locally (Test Before Deploying)

### Step 6.1 — Run Backend Directly

```bash
cd ~/Desktop/ai-code-reviewer
source venv/bin/activate

# Run the FastAPI server
uvicorn backend.main:app --reload --port 8080

# You should see:
# INFO:     Uvicorn running on http://127.0.0.1:8080
```

Open a new Terminal tab and test:
```bash
curl http://localhost:8080/api/health
# {"status":"ok","model":"gemini-1.5-pro-001","project":"ai-code-reviewer-prod"}
```

---

### Step 6.2 — Run Frontend Dev Server

Open another Terminal tab:
```bash
cd ~/Desktop/ai-code-reviewer/frontend
npm run dev
# Vite starts on http://localhost:5173
```

Open http://localhost:5173 in your browser — you'll see the dashboard.

---

### Step 6.3 — Test Manual Review

With the backend running, test a manual review:
```bash
curl -X POST http://localhost:8080/api/reviews/manual \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Add authentication",
    "mode": "strict",
    "diff": "--- a/auth.py\n+++ b/auth.py\n@@ -0,0 +1,5 @@\n+def login(username, password):\n+    query = f\"SELECT * FROM users WHERE user='"'"'{username}'"'"' AND pass='"'"'{password}'"'"'\"\n+    return db.execute(query)"
  }'
```

The AI should catch the SQL injection vulnerability!

---

### Step 6.4 — Run with Docker (optional local test)

```bash
cd ~/Desktop/ai-code-reviewer

# Build the image
docker build -t ai-code-reviewer .

# Run it
docker compose up

# Test
curl http://localhost:8080/api/health
```

---

### Step 6.5 — Run Tests

```bash
source venv/bin/activate
pip install pytest pytest-asyncio

pytest backend/tests/ -v
```

---

## PART 7 — Push to GitHub

### Step 7.1 — Initialize Git

```bash
cd ~/Desktop/ai-code-reviewer

git init
git add .
git status   # Review what's being committed
```

---

### Step 7.2 — Verify .gitignore is working

```bash
# These should NOT appear in git status:
# - .env
# - venv/
# - node_modules/
# - static/
# If they do, check your .gitignore
git status
```

---

### Step 7.3 — Make First Commit

```bash
git commit -m "feat: initial AI Code Reviewer — Vertex AI + Cloud Run"
```

---

### Step 7.4 — Push to GitHub

```bash
# Replace YOUR_USERNAME with your GitHub username
git remote add origin https://github.com/YOUR_USERNAME/ai-code-reviewer.git
git branch -M main
git push -u origin main
```

If prompted for credentials:
- Username: your GitHub username
- Password: your GitHub Personal Access Token (not your account password)

Or set up SSH keys:
```bash
ssh-keygen -t ed25519 -C "you@example.com"
cat ~/.ssh/id_ed25519.pub
# Copy this and add at: https://github.com/settings/keys
```

---

## PART 8 — Deploy to GCP Cloud Run

### Step 8.1 — Set Environment Variables

```bash
export PROJECT_ID=$(gcloud config get-value project)
export REGION=us-central1
export IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/ai-reviewer/api:latest"
echo "Image will be: $IMAGE"
```

---

### Step 8.2 — Configure Docker for Artifact Registry

```bash
gcloud auth configure-docker ${REGION}-docker.pkg.dev
# Enter Y when prompted
```

---

### Step 8.3 — Build and Push Docker Image

```bash
cd ~/Desktop/ai-code-reviewer

# Build (this takes 2-5 minutes first time)
docker build --platform linux/amd64 -t ${IMAGE} .
# Note: --platform linux/amd64 is important on Apple Silicon Macs!

# Push to Artifact Registry
docker push ${IMAGE}
echo "Image pushed ✅"
```

---

### Step 8.4 — Deploy to Cloud Run

```bash
gcloud run deploy ai-code-reviewer \
  --image=${IMAGE} \
  --region=${REGION} \
  --platform=managed \
  --allow-unauthenticated \
  --port=8080 \
  --memory=2Gi \
  --cpu=2 \
  --min-instances=0 \
  --max-instances=10 \
  --set-secrets="GITHUB_TOKEN=github-token:latest,GITHUB_WEBHOOK_SECRET=github-webhook-secret:latest" \
  --set-env-vars="GCP_PROJECT_ID=${PROJECT_ID},GCP_LOCATION=${REGION},VERTEX_MODEL=gemini-1.5-pro-001"

# Deployment takes 1-2 minutes
```

When done, it prints your service URL:
```
Service URL: https://ai-code-reviewer-xxxxxxxxxx-uc.a.run.app
```

**Copy this URL — you'll need it for the webhook.**

---

### Step 8.5 — Test the Deployed Service

```bash
# Replace with your actual URL
export SERVICE_URL="https://ai-code-reviewer-xxxxxxxxxx-uc.a.run.app"

# Health check
curl ${SERVICE_URL}/api/health

# Manual review test
curl -X POST ${SERVICE_URL}/api/reviews/manual \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Review",
    "mode": "standard",
    "diff": "--- a/app.py\n+++ b/app.py\n@@ -0,0 +1,3 @@\n+def hello():\n+    print(\"hello world\")"
  }'
```

---

## PART 9 — Connect GitHub Webhook

### Step 9.1 — Add Webhook to Your Repo

1. Go to your GitHub repo → **Settings** → **Webhooks** → **Add webhook**

2. Fill in:
   - **Payload URL**: `https://YOUR-CLOUD-RUN-URL/webhook/github`
   - **Content type**: `application/json`
   - **Secret**: paste your webhook secret (same as `GITHUB_WEBHOOK_SECRET` in .env)
   - **SSL verification**: Enable

3. Under **"Which events would you like to trigger this webhook?"**
   - Select: **"Let me select individual events"**
   - Check only: ✅ **Pull requests**

4. Click **Add webhook**

5. GitHub will send a ping — you should see a green checkmark ✅

---

### Step 9.2 — Test with a Real PR

1. Create a new branch in your repo:
   ```bash
   git checkout -b test/ai-review-demo
   echo "# test" >> TEST.md
   git add TEST.md
   git commit -m "test: trigger AI code review"
   git push origin test/ai-review-demo
   ```

2. Open a Pull Request on GitHub

3. Within ~30 seconds, the AI Code Reviewer will post a review comment!

4. For **Strict Mode**: add the label `strict-review` to the PR

---

## PART 10 — Set Up CI/CD (Auto-Deploy on Push)

### Step 10.1 — Connect Cloud Build to GitHub

```bash
# Open Cloud Build in browser
open "https://console.cloud.google.com/cloud-build/triggers;region=us-central1?project=${PROJECT_ID}"
```

1. Click **"Connect Repository"**
2. Select **GitHub (Cloud Build GitHub App)**
3. Authenticate with GitHub
4. Select your `ai-code-reviewer` repo
5. Click **Connect**

---

### Step 10.2 — Create Build Trigger

```bash
gcloud builds triggers create github \
  --repo-name=ai-code-reviewer \
  --repo-owner=YOUR_GITHUB_USERNAME \
  --branch-pattern='^main$' \
  --build-config=cloudbuild.yaml \
  --region=us-central1 \
  --name="deploy-on-main-push" \
  --project=${PROJECT_ID}
```

Grant Cloud Build permission to deploy to Cloud Run:
```bash
export PROJECT_NUMBER=$(gcloud projects describe ${PROJECT_ID} --format="value(projectNumber)")

gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"
```

---

### Step 10.3 — Test CI/CD Pipeline

```bash
git checkout main
echo "# Updated" >> README.md
git add README.md
git commit -m "ci: test auto-deploy pipeline"
git push origin main
```

Watch the build:
```bash
open "https://console.cloud.google.com/cloud-build/builds;region=us-central1?project=${PROJECT_ID}"
```

Every push to `main` now automatically: runs tests → builds Docker → pushes → deploys. ✅

---

## PART 11 — View the Dashboard

Open your Cloud Run URL in a browser:
```
https://ai-code-reviewer-xxxxxxxxxx-uc.a.run.app
```

You'll see the React dashboard with:
- All past reviews with scores
- Issue breakdowns by severity and category
- Manual review panel to test any diff

---

## Troubleshooting

### "Permission denied" on Vertex AI
```bash
gcloud auth application-default login
# Re-run this if you get 403 errors locally
```

### Docker build fails on Apple Silicon
```bash
# Always use --platform linux/amd64 for GCP
docker build --platform linux/amd64 -t ${IMAGE} .
```

### Cloud Run won't start
```bash
# Check logs
gcloud run services logs read ai-code-reviewer --region=us-central1 --limit=50
```

### Webhook not triggering
- Check the webhook delivery log on GitHub: Repo → Settings → Webhooks → your webhook → Recent Deliveries
- Make sure the payload URL ends in `/webhook/github`
- Verify the secret matches exactly

### Firestore permission error
```bash
# Re-check the service account has datastore.user role
gcloud projects get-iam-policy ${PROJECT_ID} \
  --flatten="bindings[].members" \
  --filter="bindings.role=roles/datastore.user"
```

### Frontend not loading on Cloud Run
```bash
# Make sure you built the frontend before building Docker:
cd frontend && npm run build && cd ..
docker build --platform linux/amd64 -t ${IMAGE} .
```

---

## Cost Estimate

| Service | Usage | Estimated Cost |
|---|---|---|
| Cloud Run | ~100 PR reviews/month | ~$0.10 |
| Vertex AI Gemini 1.5 Pro | ~100 reviews × 5K tokens | ~$1.50 |
| Firestore | <1GB storage, <50K reads | Free tier |
| Artifact Registry | ~1GB Docker storage | ~$0.10 |
| **Total** | | **~$2/month** |

Cloud Run scales to **zero** when idle — you only pay for actual usage.

---

## What's Next

- **Add Slack notifications**: Post a Slack message when a critical issue is found
- **Repo-specific rules**: Store custom rules per-repo in Firestore
- **PR trend dashboard**: Chart review scores over time per team
- **Multi-file inline comments**: Post comments on specific lines using GitHub's review API
- **RAG on past reviews**: Use Vertex AI Vector Search to surface similar past issues
