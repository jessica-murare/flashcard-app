from datetime import datetime, timedelta
import math

# ── FSRS-4.5 constants ────────────────────────────────────────────
W = [
    0.4072, 1.1829, 3.1262, 15.4722,
    7.2102, 0.5316, 1.0651, 0.0589,
    1.5330, 0.1544, 1.0070, 1.9395,
    0.1100, 0.2900, 2.2700, 0.1500,
    2.9898, 0.5100, 0.3400
]

DECAY    = -0.5
FACTOR   = 0.9 ** (1 / DECAY) - 1
REQUEST_RETENTION = 0.9  # target 90% retention

def forgetting_curve(stability: float, days: float) -> float:
    """Probability of recall after `days` since last review."""
    return (1 + FACTOR * days / stability) ** DECAY

def next_interval(stability: float) -> int:
    """Days until retention drops to REQUEST_RETENTION."""
    interval = stability / FACTOR * (REQUEST_RETENTION ** (1 / DECAY) - 1)
    return max(1, round(interval))

def init_stability(rating: int) -> float:
    """Initial stability after first review."""
    return max(W[rating - 1], 0.1)

def init_difficulty(rating: int) -> float:
    """Initial difficulty after first review."""
    d = W[4] - math.exp(W[5] * (rating - 1)) + 1
    return min(max(d, 1.0), 10.0)

def next_difficulty(d: float, rating: int) -> float:
    delta = W[6] * (rating - 3)
    mean_reversion = W[7] * (W[4] - d)
    new_d = d - delta + mean_reversion
    return min(max(new_d, 1.0), 10.0)

def short_term_stability(s: float, rating: int) -> float:
    return s * math.exp(W[17] * (rating - 3 + W[18]))

def next_stability(d: float, s: float, r: float, rating: int) -> float:
    if rating == 1:  # Again — lapse
        new_s = W[11] * (d ** -W[12]) * ((s + 1) ** W[13] - 1) * math.exp(W[14] * (1 - r))
        return max(new_s, 0.1)
    else:  # Hard / Good / Easy
        hard_penalty = W[15] if rating == 2 else 1.0
        easy_bonus   = W[16] if rating == 4 else 1.0
        new_s = s * math.exp(W[8]) * (11 - d) ** W[9] * ((s + 1) ** W[10] - 1) \
                * hard_penalty * easy_bonus * math.exp(W[14] * (1 - r))
        return max(new_s, 0.1)


def fsrs(
    stability: float,
    difficulty: float,
    repetitions: int,
    rating: int,        # 1=Again  2=Hard  3=Easy  (mapped from your UI)
    last_review: datetime = None,
) -> dict:
    """
    Main FSRS scheduler.
    rating mapping: 1=Again → FSRS-1, 2=Hard → FSRS-2, 3=Easy → FSRS-4
    (skipping FSRS-3 Good intentionally — keeps your 3-button UI)
    """
    # map your 3 ratings to FSRS 1-4 scale
    fsrs_rating = {1: 1, 2: 2, 3: 4}.get(rating, 3)

    now = datetime.utcnow()

    if repetitions == 0:
        # first review
        new_stability   = init_stability(fsrs_rating)
        new_difficulty  = init_difficulty(fsrs_rating)
        new_repetitions = 1
    else:
        # calculate retrievability at time of review
        days_since = (now - last_review).days if last_review else 1
        days_since = max(days_since, 0)
        r = forgetting_curve(stability, days_since)

        new_difficulty  = next_difficulty(difficulty, fsrs_rating)
        new_stability   = next_stability(difficulty, stability, r, fsrs_rating)
        new_repetitions = repetitions + 1

    interval     = next_interval(new_stability)
    new_due_date = now + timedelta(days=interval)

    return {
        "stability":   round(new_stability, 4),
        "difficulty":  round(new_difficulty, 4),
        "interval":    interval,
        "repetitions": new_repetitions,
        "due_date":    new_due_date,
        "last_rating": rating,
        "last_review": now,
    }


def get_retrievability(stability: float, last_review: datetime) -> float:
    """Current probability of recall (0-1)."""
    if not last_review:
        return 0.0
    days = (datetime.utcnow() - last_review).total_seconds() / 86400
    return round(forgetting_curve(stability, days), 3)


def get_mastery_level(repetitions: int, stability: float, retrievability: float) -> str:
    if repetitions == 0:
        return "new"
    elif repetitions <= 1:
        return "learning"
    elif retrievability < 0.7:
        return "struggling"
    elif stability >= 21 and retrievability >= 0.9:
        return "mastered"
    else:
        return "reviewing"


def is_due(due_date: datetime) -> bool:
    return datetime.utcnow() >= due_date