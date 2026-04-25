from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class Deck(Base):
    __tablename__ = "decks"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    pdf_name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    cards = relationship("Card", back_populates="deck", cascade="all, delete")


class Card(Base):
    __tablename__ = "cards"

    id = Column(Integer, primary_key=True, index=True)
    deck_id = Column(Integer, ForeignKey("decks.id"), nullable=False)
    front = Column(Text, nullable=False)
    back = Column(Text, nullable=False)
    card_type = Column(String, default="concept")
    hint = Column(Text, nullable=True)   

    deck = relationship("Deck", back_populates="cards")
    review = relationship("Review", back_populates="card", uselist=False, cascade="all, delete")


class Review(Base):
    __tablename__ = "reviews"

    id           = Column(Integer, primary_key=True, index=True)
    card_id      = Column(Integer, ForeignKey("cards.id"), nullable=False)

    # FSRS fields
    stability    = Column(Float, default=0.0)     # memory stability in days
    difficulty   = Column(Float, default=5.0)     # card difficulty 1-10
    interval     = Column(Integer, default=0)     # days until next review
    repetitions  = Column(Integer, default=0)     # total successful reviews
    due_date     = Column(DateTime, default=datetime.utcnow)
    last_rating  = Column(Integer, default=0)     # 0=new 1=again 2=hard 3=easy
    last_review  = Column(DateTime, nullable=True)

    card = relationship("Card", back_populates="review")