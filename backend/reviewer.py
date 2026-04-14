import json
from google import genai
from google.genai import types
from .config import get_settings
from .models import ReviewResult, ReviewMode
from .prompts import build_system_prompt, build_review_prompt
from datetime import datetime, timezone

settings = get_settings()

client = genai.Client(api_key=settings.gemini_api_key)


class CodeReviewer:
    async def review_pr(self, diff, pr_title, pr_description, mode=ReviewMode.STANDARD):
        system_prompt = build_system_prompt(mode)
        user_prompt = build_review_prompt(diff, pr_title, pr_description)
        full_prompt = system_prompt + "\n\n" + user_prompt

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=full_prompt,
            config=types.GenerateContentConfig(
                temperature=0.2,
                max_output_tokens=8192,
            )
        )

        raw = response.text.strip()

        if raw.startswith("```"):
            import re
            match = re.search(r'```(?:json)?\s*(\{.+\})\s*```', raw, re.DOTALL)
            if match:
                raw = match.group(1)

        try:
            data = json.loads(raw)
        except json.JSONDecodeError as e:
            return ReviewResult(
                overall_score=0,
                summary=f"Parsing failed: {str(e)}. Raw: {raw[:300]}",
                issues=[],
                approved=False,
                mode=mode,
                timestamp=datetime.now(timezone.utc).isoformat()
            )

        data.setdefault("mode", mode.value)
        data.setdefault("timestamp", datetime.now(timezone.utc).isoformat())
        return ReviewResult(**data)


reviewer = CodeReviewer()