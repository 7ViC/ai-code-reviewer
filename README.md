# 🤖 AI Code Reviewer

> **A production-grade AI code reviewer that thinks like a Senior Engineer.**  
> Automatically reviews GitHub Pull Requests for architecture flaws, security vulnerabilities, scalability risks, and logic errors — powered by **Google Gemini 2.5 Flash** and deployed on **GCP Cloud Run**.

<br/>

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Cloud%20Run-4285F4?style=for-the-badge&logo=google-cloud&logoColor=white)](https://ai-code-reviewer-654280815423.us-central1.run.app)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org)
[![GCP](https://img.shields.io/badge/GCP-Cloud%20Run-4285F4?style=for-the-badge&logo=google-cloud&logoColor=white)](https://cloud.google.com/run)

<br/>

![Dashboard Preview](https://img.shields.io/badge/Dashboard-React%20UI-161624?style=for-the-badge)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔍 **Deep PR Reviews** | Analyzes architecture, security, scalability, logic, and style |
| 🚨 **Standard Mode** | Senior Staff Engineer persona with 15 years of production experience |
| 🔴 **Strict Mode** | Principal Engineer persona — tough, blunt, bulletproof reviews |
| 🐙 **GitHub Webhook** | Auto-reviews every PR on open and synchronize events |
| 💬 **PR Comments** | Posts detailed review comments directly on GitHub PRs |
| 📊 **React Dashboard** | View all reviews, scores, and issue breakdowns in a web UI |
| 🔥 **Firestore Storage** | All reviews persisted and queryable |
| ☁️ **Cloud Run** | Serverless deployment — scales to zero, pay per use |
| 🔒 **Secure** | Webhook signature verification, no hardcoded secrets |

---

## 🏗️ Architecture

```
GitHub PR Event
      │
      ▼ webhook
┌─────────────────────┐      ┌──────────────────────┐
│  Cloud Run (FastAPI) │─────▶│  Google Gemini 2.5   │
│                     │      │  Flash (AI Review)   │
└─────────────────────┘      └──────────────────────┘
      │                               │
      ▼ save                          │ result
┌─────────────────┐          ┌────────▼──────────────┐
│    Firestore    │          │  GitHub PR Comment    │
│ (Review Store)  │          │  (Posted Automatically│
└─────────────────┘          └───────────────────────┘
      │
      ▼ read
┌─────────────────────┐
│   React Dashboard   │
│  (Review History)   │
└─────────────────────┘
```

### GCP Services Used

| Service | Purpose |
|---|---|
| **Cloud Run** | Hosts the FastAPI backend + React frontend |
| **Google AI (Gemini 2.5 Flash)** | AI model for code analysis |
| **Cloud Firestore** | Stores review history |
| **Artifact Registry** | Docker image storage |
| **Cloud Build** | CI/CD pipeline |

---

## 🧠 How the AI Reviews Work

Each PR goes through a structured 4-phase pipeline:

1. **Fetch** — Pull the unified diff from the GitHub API
2. **Analyze** — Send diff to Gemini with a role-play system prompt
3. **Strict Mode** *(optional)* — A tougher "Principal Engineer" second pass
4. **Deliver** — Post comment to GitHub PR + save to Firestore

### Review Categories

| Category | What it checks |
|---|---|
| 🏗️ Architecture | Design patterns, abstractions, coupling |
| 🔒 Security | SQL injection, XSS, SSRF, auth flaws, OWASP Top 10 |
| 📈 Scalability | Performance under load, connection pooling, bottlenecks |
| 🧠 Logic | Edge cases, correctness, error handling |
| ✨ Style | Code clarity, naming, observability |

### Severity Levels

```
🚨 CRITICAL  →  Security vulnerability, data loss, outage risk
🔴 HIGH      →  Design flaw, major scalability issue, logic error
🟡 MEDIUM    →  Code smell, missing error handling
🟢 LOW       →  Style issue, small improvement
ℹ️  INFO      →  Positive observation
```

---

## 📁 Project Structure

```
ai-code-reviewer/
├── backend/
│   ├── main.py              # FastAPI app + webhook handler
│   ├── reviewer.py          # Gemini AI integration
│   ├── prompts.py           # Senior/Principal Engineer personas
│   ├── github_client.py     # GitHub API (fetch diff, post comment)
│   ├── firestore_client.py  # Firestore read/write
│   ├── models.py            # Pydantic data models
│   ├── config.py            # Settings via env vars
│   ├── requirements.txt     # Python dependencies
│   └── tests/
│       └── test_prompts.py  # Unit tests
├── frontend/
│   └── src/
│       ├── App.jsx          # React dashboard
│       ├── api.js           # API helper
│       └── index.css        # Styles
├── Dockerfile               # Multi-stage build (Node + Python)
├── docker-compose.yml       # Local development
├── cloudbuild.yaml          # GCP CI/CD pipeline
├── .env.example             # Environment variable template
└── MAC_SETUP.md             # Full Mac setup tutorial
```

---

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Node.js 20+
- Google Cloud SDK
- A GCP project with billing enabled
- A Google AI Studio API key
- A GitHub repository + Personal Access Token

### 1. Clone the repo

```bash
git clone https://github.com/7ViC/ai-code-reviewer.git
cd ai-code-reviewer
```

### 2. Set up environment

```bash
cp .env.example .env
```

Edit `.env`:
```env
GCP_PROJECT_ID=your-gcp-project-id
GCP_LOCATION=us-central1
GEMINI_API_KEY=your-gemini-api-key
GITHUB_TOKEN=your-github-pat
GITHUB_WEBHOOK_SECRET=your-webhook-secret
FIRESTORE_COLLECTION=reviews
```

### 3. Install dependencies

```bash
# Backend
python3.11 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt

# Frontend
cd frontend && npm install && cd ..
```

### 4. Run locally

```bash
# Terminal 1 — Backend
source venv/bin/activate
uvicorn backend.main:app --reload --port 8080

# Terminal 2 — Frontend
cd frontend && npm run dev
```

- **API:** http://localhost:8080
- **Dashboard:** http://localhost:5173

### 5. Test a manual review

```bash
curl -X POST http://localhost:8080/api/reviews/manual \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Add authentication",
    "mode": "strict",
    "diff": "--- a/auth.py\n+++ b/auth.py\n@@ -0,0 +1,3 @@\n+def login(user, pwd):\n+    query = f\"SELECT * FROM users WHERE user={user}\"\n+    return db.execute(query)"
  }'
```

---

## ☁️ Deploy to GCP Cloud Run

### 1. Set up GCP

```bash
export PROJECT_ID="your-gcp-project-id"
export REGION="us-central1"
export IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/ai-reviewer/api:latest"

gcloud config set project $PROJECT_ID

gcloud services enable \
  run.googleapis.com \
  aiplatform.googleapis.com \
  firestore.googleapis.com \
  secretmanager.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com

gcloud artifacts repositories create ai-reviewer \
  --repository-format=docker \
  --location=$REGION

gcloud firestore databases create \
  --location=$REGION \
  --type=firestore-native
```

### 2. Build and push Docker image

```bash
# Uses Cloud Build — no local Docker needed
gcloud builds submit --tag ${IMAGE} .
```

### 3. Deploy

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
  --set-env-vars="GCP_PROJECT_ID=${PROJECT_ID},GCP_LOCATION=${REGION},GEMINI_API_KEY=your-key,FIRESTORE_COLLECTION=reviews"
```

---

## 🐙 GitHub Webhook Setup

1. Go to your GitHub repo → **Settings** → **Webhooks** → **Add webhook**
2. Set **Payload URL** to: `https://YOUR-CLOUD-RUN-URL/webhook/github`
3. Set **Content type** to: `application/json`
4. Set **Secret** to your `GITHUB_WEBHOOK_SECRET` value
5. Select events: ✅ **Pull requests** only
6. Click **Add webhook**

Now every PR open/update automatically triggers an AI review!

---

## 🔴 Strict Mode

Add the label **`strict-review`** to any GitHub PR to activate Principal Engineer mode.

The AI switches persona to Dr. Sarah Chen — a Principal Engineer who reviews code for systems serving 100M+ users. Expect blunt, no-nonsense feedback.

---

## 📡 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/reviews` | List recent reviews (default: 20) |
| `GET` | `/api/reviews/{id}` | Get a specific review by ID |
| `POST` | `/api/reviews/manual` | Manually trigger a review |
| `POST` | `/webhook/github` | GitHub PR webhook receiver |

### Manual Review Request Body

```json
{
  "title": "PR title",
  "description": "Optional PR description",
  "mode": "standard",
  "diff": "--- a/file.py\n+++ b/file.py\n..."
}
```

### Review Response

```json
{
  "overall_score": 45,
  "summary": "This PR introduces critical security vulnerabilities...",
  "approved": false,
  "mode": "strict",
  "issues": [
    {
      "category": "security",
      "severity": "critical",
      "file": "auth.py",
      "line": 3,
      "title": "SQL Injection Vulnerability",
      "explanation": "User input is directly interpolated into SQL...",
      "suggestion": "Use parameterized queries instead.",
      "example_code": "cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,))"
    }
  ]
}
```

---

## 💰 Cost Estimate

| Service | Usage | Est. Cost/month |
|---|---|---|
| Cloud Run | ~100 reviews | ~$0.10 |
| Gemini 2.5 Flash | ~100 reviews × 5K tokens | ~$0.50 |
| Firestore | <1GB, <50K reads | Free tier |
| Artifact Registry | ~1GB Docker storage | ~$0.10 |
| **Total** | | **~$1/month** |

> Cloud Run scales to **zero** when idle — you only pay for actual usage.

---

## 🧪 Running Tests

```bash
source venv/bin/activate
pip install pytest pytest-asyncio
pytest backend/tests/ -v
```

---

## 🔧 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GCP_PROJECT_ID` | ✅ | Your GCP project ID |
| `GCP_LOCATION` | ✅ | GCP region (e.g. `us-central1`) |
| `GEMINI_API_KEY` | ✅ | Google AI Studio API key |
| `GITHUB_TOKEN` | ✅ | GitHub PAT with PR read/write access |
| `GITHUB_WEBHOOK_SECRET` | ✅ | Secret for webhook signature verification |
| `FIRESTORE_COLLECTION` | ✅ | Firestore collection name (default: `reviews`) |

---

## 🛣️ Roadmap

- [ ] Slack / Teams notifications for critical issues
- [ ] Per-repo custom review rules stored in Firestore
- [ ] PR score trends dashboard with charts
- [ ] Inline GitHub comments on specific diff lines
- [ ] RAG on past reviews using Vertex AI Vector Search
- [ ] Multi-model ensemble (security-specialized model)
- [ ] CI/CD with Cloud Build auto-deploy on push to main

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push to the branch: `git push origin feat/your-feature`
5. Open a Pull Request — the AI will review it automatically! 🤖

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

Built with ❤️ using **Google Gemini** · **FastAPI** · **React** · **GCP Cloud Run**

⭐ Star this repo if you found it useful!

</div>
