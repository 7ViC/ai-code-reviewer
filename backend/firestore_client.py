from google.cloud import firestore
from datetime import datetime, timezone
from .models import ReviewResult
from .config import get_settings

settings = get_settings()

# Async Firestore client
db = firestore.AsyncClient(project=settings.gcp_project_id)


async def save_review(repo: str, pr_number: int, result: ReviewResult) -> str:
    """Persist a review result to Firestore. Returns the document ID."""
    doc_ref = db.collection(settings.firestore_collection).document()
    data = result.model_dump()
    data["repo"] = repo
    data["pr_number"] = pr_number
    data["created_at"] = datetime.now(timezone.utc)
    # Convert enums to strings for Firestore
    data["mode"] = result.mode.value
    data["issues"] = [
        {**issue.model_dump(), "severity": issue.severity.value}
        for issue in result.issues
    ]
    await doc_ref.set(data)
    return doc_ref.id


async def get_reviews(limit: int = 20) -> list:
    """Fetch the most recent reviews, newest first."""
    query = (
        db.collection(settings.firestore_collection)
        .order_by("created_at", direction=firestore.Query.DESCENDING)
        .limit(limit)
    )
    docs = await query.get()
    results = []
    for d in docs:
        item = d.to_dict()
        item["id"] = d.id
        # Convert Firestore timestamp to ISO string
        if "created_at" in item and hasattr(item["created_at"], "isoformat"):
            item["created_at"] = item["created_at"].isoformat()
        results.append(item)
    return results


async def get_review_by_id(review_id: str) -> dict:
    """Fetch a single review by Firestore document ID."""
    doc = await db.collection(settings.firestore_collection).document(review_id).get()
    if not doc.exists:
        raise ValueError(f"Review {review_id} not found")
    item = doc.to_dict()
    item["id"] = doc.id
    if "created_at" in item and hasattr(item["created_at"], "isoformat"):
        item["created_at"] = item["created_at"].isoformat()
    return item
