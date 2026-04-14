from pydantic import BaseModel
from typing import List, Optional
from enum import Enum


class ReviewMode(str, Enum):
    STANDARD = "standard"
    STRICT = "strict"


class Severity(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"


class ReviewIssue(BaseModel):
    category: str  # architecture|security|scalability|logic|style
    severity: Severity
    file: Optional[str] = None
    line: Optional[int] = None
    title: str
    explanation: str
    suggestion: str
    example_code: Optional[str] = None


class ReviewResult(BaseModel):
    pr_number: int = 0
    repo: str = ""
    mode: ReviewMode = ReviewMode.STANDARD
    overall_score: int
    summary: str
    issues: List[ReviewIssue]
    approved: bool
    timestamp: str = ""
