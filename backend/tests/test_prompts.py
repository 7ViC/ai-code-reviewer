import pytest
from backend.prompts import build_system_prompt, build_review_prompt
from backend.models import ReviewMode


def test_standard_persona_in_prompt():
    prompt = build_system_prompt(ReviewMode.STANDARD)
    assert "Senior Staff" in prompt
    assert "JSON" in prompt


def test_strict_persona_in_prompt():
    prompt = build_system_prompt(ReviewMode.STRICT)
    assert "Principal Engineer" in prompt


def test_diff_truncation():
    huge_diff = "x" * 20000
    prompt = build_review_prompt(huge_diff, "test", "")
    # Should be truncated to ~15000 chars of diff
    assert len(prompt) < 20000


def test_review_prompt_includes_title():
    prompt = build_review_prompt("diff content", "My Cool PR", "Some description")
    assert "My Cool PR" in prompt
    assert "Some description" in prompt
