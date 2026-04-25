from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class DeckOut(BaseModel):
    id: int
    name: str
    pdf_name: str
    created_at: datetime
    total_cards: int
    due_cards: int
    mastered_cards: int

    class Config:
        from_attributes = True

class CardOut(BaseModel):
    id: int
    front: str
    back: str
    card_type: str
    deck_id: int
    hint: Optional[str] = None

    class Config:
        from_attributes = True

class ReviewIn(BaseModel):
    rating: int

class ReviewStateOut(BaseModel):
    card_id: int
    ease_factor: float
    interval: int
    repetitions: int
    due_date: datetime
    last_rating: int
    mastery_level: str

    class Config:
        from_attributes = True

class ProgressOut(BaseModel):
    deck_id: int
    deck_name: str
    total_cards: int
    new_cards: int
    learning_cards: int
    reviewing_cards: int
    struggling_cards: int
    mastered_cards: int
    mastery_percent: float

class SessionCardOut(BaseModel):
    id: int
    front: str
    back: str
    card_type: str
    hint: Optional[str] = None
    ease_factor: float
    interval: int
    repetitions: int
    last_rating: int

    class Config:
        from_attributes = True

class ExplainOut(BaseModel):
    explanation: str

class WeakAreaOut(BaseModel):
    summary: str
    focus_cards: List[str]

# ── Deck ──────────────────────────────────────────
class DeckOut(BaseModel):
    id: int
    name: str
    pdf_name: str
    created_at: datetime
    total_cards: int
    due_cards: int
    mastered_cards: int

    class Config:
        from_attributes = True


# ── Card ──────────────────────────────────────────
class CardOut(BaseModel):
    id: int
    front: str
    back: str
    card_type: str
    deck_id: int

    class Config:
        from_attributes = True


# ── Review ────────────────────────────────────────
class ReviewIn(BaseModel):
    rating: int  # 1=Again, 2=Hard, 3=Easy

class ReviewStateOut(BaseModel):
    card_id: int
    ease_factor: float
    interval: int
    repetitions: int
    due_date: datetime
    last_rating: int
    mastery_level: str

    class Config:
        from_attributes = True


# ── Progress ──────────────────────────────────────
class ProgressOut(BaseModel):
    deck_id: int
    deck_name: str
    total_cards: int
    new_cards: int
    learning_cards: int
    reviewing_cards: int
    struggling_cards: int
    mastered_cards: int
    mastery_percent: float


# ── Review Session ────────────────────────────────
class SessionCardOut(BaseModel):
    id: int
    front: str
    back: str
    card_type: str
    ease_factor: float
    interval: int
    repetitions: int
    last_rating: int

    class Config:
        from_attributes = True

class ExplainOut(BaseModel):
    explanation: str

class WeakAreaOut(BaseModel):
    summary: str
    focus_cards: List[str]        