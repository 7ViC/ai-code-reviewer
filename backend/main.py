import hashlib
import hmac
import json
import logging
from fastapi import FastAPI, Request, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

from .reviewer import reviewer
from .github_client import get_pr_diff, post_review_comment
from .firestore_client import save_review, get_reviews, get_review_by_id
from .models import ReviewMode
from .config import get_settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="AI Code Reviewer", version="1.0.0")
settings = get_settings()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Webhook Signature Verification ──────────────────────────────────────────

def verify_github_signature(payload: bytes, sig_header: str):
    """Verify GitHub webhook HMAC-SHA256 signature."""
    if not sig_header:
        raise HTTPException(status_code=403, detail="Missing signature header")
    secret = settings.github_webhook_secret.encode()
    expected = "sha256=" + hmac.new(secret, payload, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, sig_header):
        raise HTTPException(status_code=403, detail="Invalid webhook signature")


# ─── GitHub Webhook Endpoint ──────────────────────────────────────────────────

@app.post("/webhook/github")
async def github_webhook(request: Request, background_tasks: BackgroundTasks):
    """Receives GitHub PR events and triggers background review."""
    payload = await request.body()
    sig = request.headers.get("X-Hub-Signature-256", "")
    verify_github_signature(payload, sig)

    event = request.headers.get("X-GitHub-Event", "")
    body = json.loads(payload)

    logger.info(f"Received GitHub event: {event}, action: {body.get('action')}")

    if event == "pull_request" and body.get("action") in ["opened", "synchronize", "reopened"]:
        pr = body["pull_request"]
        repo = body["repository"]["full_name"]

        # Check for strict-review label
        labels = [lbl["name"] for lbl in pr.get("labels", [])]
        mode = ReviewMode.STRICT if "strict-review" in labels else ReviewMode.STANDARD

        background_tasks.add_task(
            process_pr_review,
            repo=repo,
            pr_number=pr["number"],
            pr_title=pr["title"],
            pr_body=pr.get("body", ""),
            mode=mode
        )
        return {"status": "queued", "pr": pr["number"], "mode": mode.value}

    return {"status": "ignored", "event": event}


async def process_pr_review(repo: str, pr_number: int, pr_title: str, pr_body: str, mode: ReviewMode):
    """Background task: fetch diff → review → post comment → store in Firestore."""
    try:
        logger.info(f"Starting review for {repo}#{pr_number} in {mode.value} mode")

        # 1. Fetch PR diff from GitHub
        diff = await get_pr_diff(repo, pr_number)

        # 2. Run AI review via Vertex AI Gemini
        result = await reviewer.review_pr(diff, pr_title, pr_body, mode)
        result.pr_number = pr_number
        result.repo = repo

        # 3. Post review comment back to GitHub
        await post_review_comment(repo, pr_number, result)

        # 4. Persist to Firestore
        doc_id = await save_review(repo, pr_number, result)

        logger.info(f"Review complete for {repo}#{pr_number}. Score: {result.overall_score}. Doc: {doc_id}")

    except Exception as e:
        logger.error(f"Review failed for {repo}#{pr_number}: {e}", exc_info=True)


# ─── Dashboard REST API ───────────────────────────────────────────────────────

@app.get("/api/reviews")
async def list_reviews(limit: int = 20):
    return await get_reviews(limit)


@app.get("/api/reviews/{review_id}")
async def get_review(review_id: str):
    try:
        return await get_review_by_id(review_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.post("/api/reviews/manual")
async def manual_review(request: Request):
    """Manually trigger a review — useful for the dashboard and testing."""
    body = await request.json()
    diff = body.get("diff", "")
    if not diff:
        raise HTTPException(status_code=400, detail="'diff' field is required")

    result = await reviewer.review_pr(
        diff=diff,
        pr_title=body.get("title", "Manual Review"),
        pr_description=body.get("description", ""),
        mode=ReviewMode(body.get("mode", "standard"))
    )
    # Save to Firestore so it appears in the dashboard
    try:
        doc_id = await save_review("manual", 0, result)
        logger.info(f"Firestore saved: {doc_id}")
    except Exception as e:
        logger.error(f"Firestore save failed: {type(e).__name__}: {e}")
    return result


@app.get("/api/health")
def health():
    return {"status": "ok", "model": settings.vertex_model, "project": settings.gcp_project_id}


# ─── Serve React Frontend (production) ───────────────────────────────────────
static_dir = os.path.join(os.path.dirname(__file__), "..", "static")
if os.path.exists(static_dir):
    app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")
