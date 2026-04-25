from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List
import os

from database import engine, get_db, Base
from models import Deck, Card, Review
from schemas import DeckOut, CardOut, ReviewIn, ReviewStateOut, ProgressOut, SessionCardOut
from pdf_parser import extract_text_from_pdf
from card_generator import generate_all_cards
from fsrs import fsrs, is_due, get_mastery_level, get_retrievability

# create all tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Flashcard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── 1. Upload PDF → create deck + cards ──────────────────────────
@app.post("/api/decks/upload")
async def upload_pdf(
    file: UploadFile = File(...),
    deck_name: str = Form(...),
    mode: str = Form(default="mixed"),
    db: Session = Depends(get_db)
):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files allowed")

    file_bytes = await file.read()
    if len(file_bytes) > 20 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="PDF too large. Max 20MB.")

    pdf_text = extract_text_from_pdf(file_bytes)
    if not pdf_text.strip():
        raise HTTPException(status_code=400, detail="Could not extract text from PDF.")

    deck = Deck(name=deck_name, pdf_name=file.filename)
    db.add(deck)
    db.commit()
    db.refresh(deck)

    raw_cards = generate_all_cards(pdf_text, deck_name, mode)
    if not raw_cards:
        db.delete(deck)
        db.commit()
        raise HTTPException(status_code=500, detail="Card generation failed.")

    for c in raw_cards:
        card = Card(
            deck_id=deck.id,
            front=c["front"],
            back=c["back"],
            card_type=c["card_type"],
            hint=c.get("hint")
        )
        db.add(card)
        db.flush()
        review = Review(
            card_id=card.id,
            stability=0.0,
            difficulty=5.0,
            interval=0,
            repetitions=0,
            due_date=datetime.utcnow(),
            last_review=None
    )
        db.add(review)

    db.commit()
    return {
        "deck_id": deck.id,
        "deck_name": deck.name,
        "cards_generated": len(raw_cards),
        "mode": mode,
        "message": "Deck created successfully"
    }


# ── auto detect subject ───────────────────────────────────────────
@app.post("/api/decks/detect")
async def detect_subject_route(file: UploadFile = File(...)):
    file_bytes = await file.read()
    pdf_text = extract_text_from_pdf(file_bytes)
    from card_generator import detect_subject
    result = detect_subject(pdf_text)
    return result

# ── 2. List all decks ─────────────────────────────────────────────
@app.get("/api/decks", response_model=List[DeckOut])
def list_decks(db: Session = Depends(get_db)):
    from sqlalchemy import func, case
    from datetime import datetime

    decks = db.query(Deck).order_by(Deck.created_at.desc()).all()
    now = datetime.utcnow()

    result = []
    for deck in decks:
        # single query per deck instead of loading all relationships
        stats = db.query(
            func.count(Card.id).label("total"),
            func.sum(
                case((Review.due_date <= now, 1), else_=0)
            ).label("due"),
            func.sum(
                case((
                    (Review.repetitions >= 3) &
                    (Review.stability >= 21), 1
                ), else_=0)
            ).label("mastered")
        ).join(Review, Card.id == Review.card_id)\
         .filter(Card.deck_id == deck.id)\
         .first()

        result.append(DeckOut(
            id=deck.id,
            name=deck.name,
            pdf_name=deck.pdf_name,
            created_at=deck.created_at,
            total_cards=stats.total or 0,
            due_cards=stats.due or 0,
            mastered_cards=stats.mastered or 0,
        ))

    return result


# ── 3. Get due cards for review session ───────────────────────────
@app.get("/api/decks/{deck_id}/review", response_model=List[SessionCardOut])
def get_review_session(deck_id: int, db: Session = Depends(get_db)):
    deck = db.query(Deck).filter(Deck.id == deck_id).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")

    due_cards = [
        c for c in deck.cards
        if c.review and is_due(c.review.due_date)
    ]

    if not due_cards:
        return []

    result = []
    for c in due_cards:
        result.append(SessionCardOut(
            id=c.id,
            front=c.front,
            back=c.back,
            card_type=c.card_type,
            ease_factor=c.review.stability,
            interval=c.review.interval,
            repetitions=c.review.repetitions,
            last_rating=c.review.last_rating
        ))

    return result


# ── 4. Submit rating for a card ───────────────────────────────────
@app.post("/api/cards/{card_id}/review", response_model=ReviewStateOut)
def submit_review(card_id: int, review_in: ReviewIn, db: Session = Depends(get_db)):
    card = db.query(Card).filter(Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")

    if review_in.rating not in [1, 2, 3]:
        raise HTTPException(status_code=400, detail="Rating must be 1, 2, or 3")

    review  = card.review
    updated = fsrs(
        stability   = review.stability,
        difficulty  = review.difficulty,
        repetitions = review.repetitions,
        rating      = review_in.rating,
        last_review = review.last_review,
    )

    review.stability   = updated["stability"]
    review.difficulty  = updated["difficulty"]
    review.interval    = updated["interval"]
    review.repetitions = updated["repetitions"]
    review.due_date    = updated["due_date"]
    review.last_rating = updated["last_rating"]
    review.last_review = updated["last_review"]

    db.commit()
    db.refresh(review)

    r = get_retrievability(review.stability, review.last_review)

    return ReviewStateOut(
        card_id       = card.id,
        ease_factor   = review.stability,   # reusing ease_factor field for stability
        interval      = review.interval,
        repetitions   = review.repetitions,
        due_date      = review.due_date,
        last_rating   = review.last_rating,
        mastery_level = get_mastery_level(review.repetitions, review.stability, r)
    )


# ── 5. Progress for a deck ────────────────────────────────────────
@app.get("/api/decks/{deck_id}/progress", response_model=ProgressOut)
def get_progress(deck_id: int, db: Session = Depends(get_db)):
    deck = db.query(Deck).filter(Deck.id == deck_id).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")

    cards = deck.cards
    total = len(cards)
    buckets = {"new": 0, "learning": 0, "reviewing": 0, "struggling": 0, "mastered": 0}

    for c in cards:
        if c.review:
            r = get_retrievability(c.review.stability, c.review.last_review)
            level = get_mastery_level(c.review.repetitions, c.review.stability, r)
            buckets[level] += 1

    mastery_percent = round((buckets["mastered"] / total * 100), 1) if total > 0 else 0.0

    return ProgressOut(
        deck_id         = deck.id,
        deck_name       = deck.name,
        total_cards     = total,
        new_cards       = buckets["new"],
        learning_cards  = buckets["learning"],
        reviewing_cards = buckets["reviewing"],
        struggling_cards= buckets["struggling"],
        mastered_cards  = buckets["mastered"],
        mastery_percent = mastery_percent
    )

# ── 6. Retry hard cards ───────────────────────────────────────────
@app.get("/api/decks/{deck_id}/retry", response_model=List[SessionCardOut])
def get_retry_session(deck_id: int, db: Session = Depends(get_db)):
    deck = db.query(Deck).filter(Deck.id == deck_id).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")

    hard_cards = [
        c for c in deck.cards
        if c.review and c.review.last_rating == 1
    ]

    return [
        SessionCardOut(
            id=c.id,
            front=c.front,
            back=c.back,
            card_type=c.card_type,
            hint=c.hint,
            ease_factor=c.review.stability,
            interval=c.review.interval,
            repetitions=c.review.repetitions,
            last_rating=c.review.last_rating
        )
        for c in hard_cards
    ]


# ── 7. AI explain a card ──────────────────────────────────────────
@app.post("/api/cards/{card_id}/explain")
def explain_card(card_id: int, db: Session = Depends(get_db)):
    from groq import Groq
    card = db.query(Card).filter(Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")

    client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    prompt = f"""A student is struggling to understand this flashcard.

Question: {card.front}
Answer: {card.back}

Give a simple, friendly 2-3 sentence explanation like you're explaining to a confused student.
Use an analogy or example if it helps. Be warm and encouraging."""

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.5,
            max_tokens=300,
        )
        explanation = response.choices[0].message.content.strip()
        return {"explanation": explanation}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI error: {str(e)}")


# ── 8. Weak area summary ──────────────────────────────────────────
@app.post("/api/decks/{deck_id}/weak-summary")
def weak_summary(deck_id: int, card_ids: List[int], db: Session = Depends(get_db)):
    from groq import Groq
    deck = db.query(Deck).filter(Deck.id == deck_id).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")

    struggled = db.query(Card).filter(Card.id.in_(card_ids)).all()
    if not struggled:
        return {"summary": "Great job! No weak areas this session.", "focus_cards": []}

    fronts = [c.front for c in struggled]
    fronts_text = "\n".join(f"- {f}" for f in fronts)

    client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    prompt = f"""A student struggled with these flashcard questions:
{fronts_text}

In 2 sentences, identify what topic or concept they need to focus on.
Be encouraging and specific. Start with "You struggled most with..."."""

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.4,
            max_tokens=150,
        )
        summary = response.choices[0].message.content.strip()
        return {"summary": summary, "focus_cards": fronts[:3]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI error: {str(e)}")

# ── 9. Edit a card ────────────────────────────────────────────────
@app.patch("/api/cards/{card_id}")
def edit_card(card_id: int, data: dict, db: Session = Depends(get_db)):
    card = db.query(Card).filter(Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    if "front" in data and data["front"].strip():
        card.front = data["front"].strip()
    if "back" in data and data["back"].strip():
        card.back = data["back"].strip()
    if "hint" in data:
        card.hint = data["hint"].strip()
    db.commit()
    db.refresh(card)
    return {"id": card.id, "front": card.front, "back": card.back, "hint": card.hint}

# ── 10. Get ALL cards for a deck (practice mode) ──────────────────
@app.get("/api/decks/{deck_id}/all", response_model=List[SessionCardOut])
def get_all_cards(deck_id: int, db: Session = Depends(get_db)):
    deck = db.query(Deck).filter(Deck.id == deck_id).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")

    return [
        SessionCardOut(
            id=c.id,
            front=c.front,
            back=c.back,
            card_type=c.card_type,
            hint=c.hint,
            ease_factor=c.review.stability if c.review else 0.0,
            interval=c.review.interval if c.review else 0,
            repetitions=c.review.repetitions if c.review else 0,
            last_rating=c.review.last_rating if c.review else 0,
        )
        for c in deck.cards
    ]

# ── 11. Delete a deck ─────────────────────────────────────────────
@app.delete("/api/decks/{deck_id}")
def delete_deck(deck_id: int, db: Session = Depends(get_db)):
    deck = db.query(Deck).filter(Deck.id == deck_id).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    db.delete(deck)
    db.commit()
    return {"message": "Deck deleted"}

# ── 12. Add custom card to deck ───────────────────────────────────
@app.post("/api/decks/{deck_id}/cards")
def add_card(deck_id: int, data: dict, db: Session = Depends(get_db)):
    deck = db.query(Deck).filter(Deck.id == deck_id).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")

    card = Card(
        deck_id=deck_id,
        front=data.get("front", "").strip(),
        back=data.get("back", "").strip(),
        hint=data.get("hint", "").strip() or None,
        card_type=data.get("card_type", "concept"),
    )
    db.add(card)
    db.flush()

    review = Review(
        card_id=card.id,
        stability=0.0,
        difficulty=5.0,
        interval=0,
        repetitions=0,
        due_date=datetime.utcnow(),
        last_review=None,
    )
    db.add(review)
    db.commit()
    db.refresh(card)

    return {
        "id": card.id,
        "front": card.front,
        "back": card.back,
        "hint": card.hint,
        "card_type": card.card_type,
        "ease_factor": 2.5,
        "interval": 0,
        "repetitions": 0,
        "last_rating": 0,
    }

# ── Health check ──────────────────────────────────────────────────
@app.get("/")
def root():
    return {"status": "ok", "message": "Flashcard API running"}
