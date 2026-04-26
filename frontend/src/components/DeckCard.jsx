import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { deleteDeck } from "../api.js"
import { FiTrash2, FiAlertTriangle } from "react-icons/fi"

export default function DeckCard({ deck, onDelete }) {
  const navigate = useNavigate()
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const masteryPct = deck.total_cards > 0
    ? Math.round((deck.mastered_cards / deck.total_cards) * 100)
    : 0

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteDeck(deck.id)
      onDelete(deck.id)
    } catch {
      alert("Delete failed. Try again.")
      setDeleting(false)
      setConfirming(false)
    }
  }

  return (
    <div className="glass-panel hover-lift" style={{
      border: `1px solid ${confirming ? "#f87171" : "var(--border)"}`,
      borderRadius: "var(--radius)",
      padding: "28px",
      display: "flex",
      flexDirection: "column",
      gap: 18,
      transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
      position: "relative",
    }}
      onMouseEnter={e => { 
        if (!confirming) {
            e.currentTarget.style.borderColor = "var(--primary)";
            e.currentTarget.style.boxShadow = "0 10px 40px rgba(0,0,0,0.5)";
        }
      }}
      onMouseLeave={e => { 
        if (!confirming) {
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.boxShadow = "none";
        }
      }}
    >
          {/* delete button top right */}
          <button
              onClick={() => setConfirming(true)}
              title="Delete deck"
              style={{
                  position: "absolute",
                  top: 12,
                  right: 12,
                  background: "none",
                  color: "var(--text-muted)",
                  padding: "6px",
                  borderRadius: 6,
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: 0.5,
                  transition: "opacity 0.2s, color 0.2s",
              }}
              onMouseEnter={e => {
                  e.currentTarget.style.opacity = 1
                  e.currentTarget.style.color = "#f87171"
              }}
              onMouseLeave={e => {
                  e.currentTarget.style.opacity = 0.5
                  e.currentTarget.style.color = "var(--text-muted)"
              }}
          >
              <FiTrash2 size={16} />
          </button>

      {/* confirm delete overlay */}
      {confirming && (
        <div style={{
          position: "absolute",
          inset: 0,
          background: "rgba(15,15,19,0.95)",
          borderRadius: "var(--radius)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          padding: 24,
          zIndex: 5,
        }}>
          <FiAlertTriangle size={32} color="#f87171" />
          <p style={{ fontWeight: 700, fontSize: 15, textAlign: "center" }}>
            Delete "{deck.name}"?
          </p>
          <p style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center" }}>
            This will permanently delete all {deck.total_cards} cards and progress.
          </p>
          <div style={{ display: "flex", gap: 10, width: "100%" }}>
            <button
              onClick={handleDelete}
              disabled={deleting}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: 8,
                background: "#f87171",
                color: "#fff",
                fontWeight: 700,
                fontSize: 14,
                border: "none",
                cursor: deleting ? "not-allowed" : "pointer",
                opacity: deleting ? 0.6 : 1,
              }}
            >
              {deleting ? "Deleting..." : "Yes, Delete"}
            </button>
            <button
              onClick={() => setConfirming(false)}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: 8,
                background: "var(--surface2)",
                color: "var(--text-muted)",
                fontWeight: 600,
                fontSize: 14,
                border: "1px solid var(--border)",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* deck name + pdf */}
      <div style={{ paddingRight: 28 }}>
        <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>
          {deck.name}
        </h3>
        <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
          {deck.pdf_name}
        </p>
      </div>

      {/* stats row */}
      <div style={{ display: "flex", gap: 16 }}>
        <Stat label="Total"    value={deck.total_cards} />
        <Stat label="Due"      value={deck.due_cards}    color={deck.due_cards > 0 ? "#facc15" : undefined} />
        <Stat label="Mastered" value={deck.mastered_cards} color="#4ade80" />
      </div>

      {/* mastery mini bar */}
      <div>
        <div style={{
          height: 6,
          background: "var(--border)",
          borderRadius: 999,
          overflow: "hidden",
          marginBottom: 6,
        }}>
          <div style={{
            height: "100%",
            width: `${masteryPct}%`,
            background: "var(--primary)",
            borderRadius: 999,
            transition: "width 0.6s ease",
          }} />
        </div>
        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
          {masteryPct}% mastered
        </span>
      </div>

      {/* action buttons */}
      <div className="button-row deck-actions" style={{ display: "flex", gap: 10, marginTop: 4 }}>
        {deck.due_cards > 0 ? (
          <button
            className="pill-btn hover-lift"
            onClick={() => navigate(`/review/${deck.id}`)}
            style={{
              flex: 1,
              padding: "10px 0",
              background: "var(--primary)",
              color: "#000",
              fontWeight: 800,
              fontSize: 14,
              boxShadow: "0 4px 14px rgba(249, 168, 37, 0.4)",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "var(--primary-hover)";
              e.currentTarget.style.boxShadow = "0 6px 20px rgba(249, 168, 37, 0.6)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "var(--primary)";
              e.currentTarget.style.boxShadow = "0 4px 14px rgba(249, 168, 37, 0.4)";
            }}
          >
            Study ({deck.due_cards} due)
          </button>
        ) : (
          <button
            className="pill-btn hover-lift"
            onClick={() => navigate(`/review/${deck.id}?mode=all`)}
            style={{
              flex: 1,
              padding: "10px 0",
              background: "var(--surface2)",
              color: "var(--primary)",
              fontWeight: 700,
              fontSize: 14,
              border: "1px solid var(--primary)",
            }}
          >
            Practice All Cards
          </button>
        )}
        <button
          className="pill-btn hover-lift"
          onClick={() => navigate(`/progress/${deck.id}`)}
          style={{
            padding: "10px 20px",
            background: "var(--surface2)",
            color: "var(--text-muted)",
            fontWeight: 700,
            fontSize: 14,
            border: "1px solid var(--border)",
          }}
        >
          Stats
        </button>
      </div>
    </div>
  )
}

function Stat({ label, value, color }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: color || "var(--text)" }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>
        {label}
      </div>
    </div>
  )
}
