import axios from "axios"

const BASE = import.meta.env.VITE_API_URL || "https://flashmind-backend-be1g.onrender.com"

const api = axios.create({ baseURL: BASE })

export const uploadPDF = (formData) =>
  api.post("/api/decks/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  })

export const listDecks = () =>
  api.get("/api/decks")

export const getReviewSession = (deckId) =>
  api.get(`/api/decks/${deckId}/review`)

export const submitReview = (cardId, rating) =>
  api.post(`/api/cards/${cardId}/review`, { rating })

export const getProgress = (deckId) =>
  api.get(`/api/decks/${deckId}/progress`)

export const getRetrySession = (deckId) =>
  api.get(`/api/decks/${deckId}/retry`)

export const explainCard = (cardId) =>
  api.post(`/api/cards/${cardId}/explain`)

export const getWeakSummary = (deckId, cardIds) =>
  api.post(`/api/decks/${deckId}/weak-summary`, cardIds)

export const detectSubject = (formData) =>
  api.post("/api/decks/detect", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  })

export const editCard = (cardId, data) =>
  api.patch(`/api/cards/${cardId}`, data)

export const getAllCards = (deckId) =>
  api.get(`/api/decks/${deckId}/all`)

export const deleteDeck = (deckId) =>
  api.delete(`/api/decks/${deckId}`)

export const addCard = (deckId, data) =>
  api.post(`/api/decks/${deckId}/cards`, data)