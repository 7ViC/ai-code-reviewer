from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # GCP
    gcp_project_id: str = "yai-code-reviewer-493301"
    gcp_location: str = "us-central1"

    # Vertex AI
    vertex_model: str = "gemini-1.5-flash-001"
    gemini_api_key: str = ""

    # GitHub
    github_token: str = ""
    github_webhook_secret: str = ""

    # Firestore
    firestore_collection: str = "reviews"

    class Config:
        env_file = ".env"


@lru_cache
def get_settings():
    return Settings()
