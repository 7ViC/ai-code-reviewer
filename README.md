# 🤖 AI Code Reviewer

> A production-grade AI code reviewer that thinks like a Senior Engineer.
> Powered by **Google Vertex AI (Gemini 1.5 Pro)**, deployed on **GCP Cloud Run**.

## Features

- 🔍 **Deep PR reviews** — architecture, security, scalability, logic, style
- 🚨 **Strict Mode** — Principal Engineer persona that challenges every decision
- 🐙 **GitHub Webhook** — automatic reviews on every PR open/sync
- 📊 **React Dashboard** — view all reviews with scores and issue breakdowns
- 🔒 **GCP Secret Manager** — zero hardcoded secrets
- ☁️ **Cloud Run** — serverless, scales to zero, pay-per-use
- 🔄 **Cloud Build CI/CD** — auto-deploy on push to main

## Quick Start (Mac)

See [MAC_SETUP.md](./MAC_SETUP.md) for the full step-by-step tutorial.

## Tech Stack

| Layer | Technology |
|---|---|
| AI Model | Gemini 1.5 Pro via Vertex AI |
| Backend | Python 3.11, FastAPI, uvicorn |
| Frontend | React 18, Vite |
| Database | Cloud Firestore |
| Secrets | GCP Secret Manager |
| Hosting | Cloud Run |
| CI/CD | Cloud Build |
| Container | Docker (multi-stage build) |

## Trigger Strict Mode

Add the label `strict-review` to any GitHub PR to activate Principal Engineer mode.

## API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/webhook/github` | GitHub PR webhook receiver |
| GET | `/api/reviews` | List recent reviews |
| GET | `/api/reviews/{id}` | Get a specific review |
| POST | `/api/reviews/manual` | Manually trigger a review |
| GET | `/api/health` | Health check |

## Project Structure

```
ai-code-reviewer/
├── backend/
│   ├── main.py              # FastAPI app + webhook handler
│   ├── reviewer.py          # Vertex AI / Gemini integration
│   ├── prompts.py           # Senior/Principal Engineer personas
│   ├── github_client.py     # GitHub API (fetch diff, post comment)
│   ├── firestore_client.py  # Firestore read/write
│   ├── models.py            # Pydantic data models
│   ├── config.py            # Settings via env vars
│   └── requirements.txt
├── frontend/
│   └── src/App.jsx          # React dashboard
├── Dockerfile               # Multi-stage build
├── docker-compose.yml       # Local development
├── cloudbuild.yaml          # CI/CD pipeline
└── MAC_SETUP.md             # Full setup tutorial
```
