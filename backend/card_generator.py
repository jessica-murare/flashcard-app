import os
import json
import re
from groq import Groq
from dotenv import load_dotenv
from pdf_parser import chunk_text
import time

# simple in-memory rate limiter
class SimpleRateLimiter:
    def __init__(self, calls_per_minute: int):
        self.calls_per_minute = calls_per_minute
        self.calls = []

    def wait_if_needed(self):
        now = time.time()
        # remove calls older than 60 seconds
        self.calls = [t for t in self.calls if now - t < 60]

        if len(self.calls) >= self.calls_per_minute:
            # wait until oldest call is 60s old
            sleep_time = 60 - (now - self.calls[0]) + 0.5
            if sleep_time > 0:
                print(f"Rate limit hit — waiting {sleep_time:.1f}s...")
                time.sleep(sleep_time)

        self.calls.append(time.time())

groq_limiter = SimpleRateLimiter(calls_per_minute=25)  # stay under 30

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))



# ── mode prompts ──────────────────────────────────────────────────
MODE_PROMPTS = {
    "mixed": """You are an expert teacher. Create comprehensive flashcards covering:
- concept: tests understanding of a key idea
- definition: term on front, clear meaning on back
- example: real worked example or application
- edge_case: common misconception or tricky exception
- why: asks WHY something works, not just WHAT it is

Balance all 5 types equally. Write like a great teacher, not a bot.""",

    "quick_quiz": """You are a quiz master. Create rapid-fire flashcards with:
- Very short, punchy questions on the front
- One line / one word / one number answers on the back
- Focus on facts, dates, names, definitions, key terms
- card_type should mostly be "definition" or "concept"
- Back answer must be UNDER 15 words. Be brutal about brevity.
- Great for memorizing facts fast before an exam.""",

    "deep_understanding": """You are a Socratic tutor. Create explanation-style flashcards:
- Front: ask WHY, HOW, or EXPLAIN questions — never simple recall
- Back: 3-5 sentence explanation with analogy or real-world example
- Every card should build mental models, not just facts
- Use card_type "concept", "why", or "edge_case" only
- Write like you're explaining to a curious student who asks "but why?".""",

    "exam_crammer": """You are a ruthless exam coach. Create high-pressure flashcards:
- Mix tricky questions, common mistakes, and must-know facts
- Front: phrase as "What's wrong with...?", "Which of these...?", "True or False:"
- Back: direct answer + one line explaining WHY that's the answer
- Focus on things students commonly get wrong
- Include edge cases, exceptions, and gotchas
- card_type: mix of "edge_case", "concept", "why".""",

    "teach_me": """You are a friendly tutor teaching a complete beginner.
- Front: simple question a confused student would ask
- Back: warm, simple explanation. No jargon. Use analogies.
  If jargon is unavoidable, define it immediately.
- Write like you're sitting next to the student helping them
- Use examples from everyday life
- card_type: mostly "concept", "definition", "example"
- End every back with one encouraging sentence.""",
}

SHARED_RULES = """
Rules for ALL cards:
- Front: one clear specific question. Never vague.
- Hint: a one-line nudge that helps without giving the answer.
- Never copy sentences directly from the text.
- Make the student THINK.

Return ONLY a JSON array. No explanation, no markdown, no preamble.
Format:
[
  {
    "front": "question here",
    "back": "answer here",
    "hint": "one line nudge",
    "card_type": "concept"
  }
]"""


def build_system_prompt(mode: str) -> str:
    base = MODE_PROMPTS.get(mode, MODE_PROMPTS["mixed"])
    return base + "\n\n" + SHARED_RULES


def generate_cards_from_chunk(chunk: str, deck_name: str, mode: str = "mixed") -> list[dict]:
    card_counts = {
        "quick_quiz":        "12-16",
        "exam_crammer":      "10-14",
        "deep_understanding": "6-10",
        "teach_me":          "8-12",
        "mixed":             "8-12",
    }
    count = card_counts.get(mode, "8-12")

    groq_limiter.wait_if_needed() 

    prompt = f"""Create flashcards for a deck called "{deck_name}".
Study mode: {mode.replace("_", " ").title()}

Study material:
{chunk}

Generate {count} flashcards. Return only the JSON array."""

    for attempt in range(3):   # retry up to 3 times
        try:
            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": build_system_prompt(mode)},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.4,
                max_tokens=4000,
            )
            raw = response.choices[0].message.content.strip()
            return parse_cards(raw)

        except Exception as e:
            err = str(e)
            if "rate_limit" in err.lower() and attempt < 2:
                wait = (attempt + 1) * 15
                print(f"Groq rate limit — retry {attempt+1}/3 after {wait}s")
                time.sleep(wait)
            else:
                print(f"Groq error: {e}")
                return []

    return []


def parse_cards(raw: str) -> list[dict]:
    raw = re.sub(r'```json|```', '', raw).strip()
    try:
        cards = json.loads(raw)
    except json.JSONDecodeError:
        match = re.search(r'\[.*\]', raw, re.DOTALL)
        if match:
            try:
                cards = json.loads(match.group())
            except:
                return []
        else:
            return []

    valid = []
    for card in cards:
        if (
            isinstance(card, dict)
            and card.get("front", "").strip()
            and card.get("back", "").strip()
            and card.get("card_type") in ["concept", "definition", "example", "edge_case", "why"]
        ):
            card.setdefault("hint", "Think about the core principle involved.")
            valid.append(card)
    return valid


def generate_all_cards(pdf_text: str, deck_name: str, mode: str = "mixed") -> list[dict]:
    chunks = chunk_text(pdf_text, max_chars=6000)
    all_cards = []

    for i, chunk in enumerate(chunks):
        print(f"Generating cards chunk {i+1}/{len(chunks)} [mode: {mode}]...")
        cards = generate_cards_from_chunk(chunk, deck_name, mode)
        all_cards.extend(cards)

    # deduplicate
    seen = set()
    unique = []
    for card in all_cards:
        key = card["front"].lower().strip()
        if key not in seen:
            seen.add(key)
            unique.append(card)

    print(f"Total cards: {len(unique)}")
    return unique


def detect_subject(pdf_text: str) -> dict:
    """Auto-detect subject + suggest deck name from PDF content."""
    groq_limiter.wait_if_needed()
    sample = pdf_text[:3000]
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{
                "role": "user",
                "content": f"""Analyze this study material and return ONLY a JSON object:
{{
  "subject": "one word subject (e.g. Python, Biology, History, Math)",
  "suggested_name": "short deck name under 5 words",
  "emoji": "one relevant emoji",
  "difficulty": "Beginner / Intermediate / Advanced",
  "recommended_mode": "quick_quiz or deep_understanding or exam_crammer or teach_me or mixed"
}}

Material:
{sample}

Return only the JSON. No explanation."""
            }],
            temperature=0.2,
            max_tokens=200,
        )
        raw = response.choices[0].message.content.strip()
        raw = re.sub(r'```json|```', '', raw).strip()
        return json.loads(raw)
    except:
        return {
            "subject": "General",
            "suggested_name": "",
            "emoji": "📚",
            "difficulty": "Intermediate",
            "recommended_mode": "mixed"
        }