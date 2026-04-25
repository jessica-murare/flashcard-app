import { useState, useEffect } from "react"
import { explainCard, editCard } from "../api.js"

const typeColors = {
  concept:    { bg: "#1e1b4b", border: "#7c6af7", label: "Concept" },
  definition: { bg: "#1a2744", border: "#60a5fa", label: "Definition" },
  example:    { bg: "#14291f", border: "#4ade80", label: "Example" },
  edge_case:  { bg: "#2d1a1a", border: "#f87171", label: "Edge Case" },
  why:        { bg: "#2a1f0f", border: "#facc15", label: "Why" },
}

const XP_MAP = { 1: 2, 2: 5, 3: 10 }

// ── sound effects ─────────────────────────────────────────────────
function playSound(type) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()

    if (type === "flip") {
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.15, ctx.sampleRate)
      const data = buf.getChannelData(0)
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2)
      }
      const source = ctx.createBufferSource()
      source.buffer = buf
      const filter = ctx.createBiquadFilter()
      filter.type = "bandpass"
      filter.frequency.setValueAtTime(800, ctx.currentTime)
      filter.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.15)
      filter.Q.value = 0.5
      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
      source.connect(filter)
      filter.connect(gain)
      gain.connect(ctx.destination)
      source.start()
    } else if (type === "easy") {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.connect(g)
      g.connect(ctx.destination)
      o.type = "sine"
      o.frequency.setValueAtTime(523, ctx.currentTime)
      o.frequency.setValueAtTime(659, ctx.currentTime + 0.1)
      o.frequency.setValueAtTime(784, ctx.currentTime + 0.2)
      g.gain.setValueAtTime(0.2, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35)
      o.start(); o.stop(ctx.currentTime + 0.35)
    } else if (type === "hard") {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.connect(g)
      g.connect(ctx.destination)
      o.type = "sine"
      o.frequency.setValueAtTime(400, ctx.currentTime)
      o.frequency.setValueAtTime(350, ctx.currentTime + 0.1)
      g.gain.setValueAtTime(0.15, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)
      o.start(); o.stop(ctx.currentTime + 0.2)
    } else if (type === "again") {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.connect(g)
      g.connect(ctx.destination)
      o.type = "sawtooth"
      o.frequency.setValueAtTime(200, ctx.currentTime)
      o.frequency.setValueAtTime(150, ctx.currentTime + 0.15)
      g.gain.setValueAtTime(0.1, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)
      o.start(); o.stop(ctx.currentTime + 0.2)
    }
  } catch {}
}

export default function FlashCard({ card, onRate, onCardUpdate, disableShortcuts }) {
  const [flipped, setFlipped] = useState(false)
  const [hintVisible, setHintVisible] = useState(false)
  const [explanation, setExplanation] = useState(null)
  const [explaining, setExplaining] = useState(false)
  const [xpPop, setXpPop] = useState(null)
  const [editing, setEditing] = useState(false)
  const [editFront, setEditFront] = useState(card.front)
  const [editBack, setEditBack] = useState(card.back)
  const [editHint, setEditHint] = useState(card.hint || "")
  const [saving, setSaving] = useState(false)
  const colors = typeColors[card.card_type] || typeColors.concept

  // keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (editing) return
      if (disableShortcuts) return
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault()
        handleFlip()
      }
      if (flipped) {
        if (e.key === "1") handleRate(1)
        if (e.key === "2") handleRate(2)
        if (e.key === "3") handleRate(3)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [flipped, editing, disableShortcuts])

  useEffect(() => {
    setFlipped(false)
    setHintVisible(false)
    setExplanation(null)
    setXpPop(null)
    setEditing(false)
    setEditFront(card.front)
    setEditBack(card.back)
    setEditHint(card.hint || "")
  }, [card.id])

  const handleFlip = () => {
    playSound("flip")
    setFlipped(f => !f)
  }

  const handleRate = (rating) => {
    const sounds = { 1: "again", 2: "hard", 3: "easy" }
    playSound(sounds[rating])
    setXpPop({ amount: XP_MAP[rating], key: Date.now() })
    setTimeout(() => {
      setFlipped(false)
      onRate(rating)
    }, 600)
  }

  const handleExplain = async () => {
    setExplaining(true)
    try {
      const res = await explainCard(card.id)
      setExplanation(res.data.explanation)
    } catch {
      setExplanation("Could not load explanation. Try again.")
    } finally {
      setExplaining(false)
    }
  }

  const handleSaveEdit = async () => {
    setSaving(true)
    try {
      await editCard(card.id, {
        front: editFront,
        back: editBack,
        hint: editHint,
      })
      onCardUpdate?.({ ...card, front: editFront, back: editBack, hint: editHint })
      setEditing(false)
    } catch {
      alert("Save failed. Try again.")
    } finally {
      setSaving(false)
    }
  }

  // ── edit mode ─────────────────────────────────
  if (editing) {
    return (
      <div style={{ width: "100%", maxWidth: 600, margin: "0 auto" }}>
        <div style={{
          background: "var(--surface)",
          border: "1.5px solid var(--primary)",
          borderRadius: "var(--radius)",
          padding: "24px",
        }}>
          <h3 style={{ fontWeight: 700, marginBottom: 16, color: "var(--primary)" }}>
            ✏️ Edit Card
          </h3>

          <label style={labelStyle}>Front (Question)</label>
          <textarea
            value={editFront}
            onChange={e => setEditFront(e.target.value)}
            rows={3}
            style={textareaStyle}
          />

          <label style={labelStyle}>Back (Answer)</label>
          <textarea
            value={editBack}
            onChange={e => setEditBack(e.target.value)}
            rows={4}
            style={textareaStyle}
          />

          <label style={labelStyle}>Hint (optional)</label>
          <textarea
            value={editHint}
            onChange={e => setEditHint(e.target.value)}
            rows={2}
            style={textareaStyle}
          />

          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button
              onClick={handleSaveEdit}
              disabled={saving}
              style={{
                flex: 1,
                background: "var(--primary)",
                color: "#fff",
                padding: "11px",
                borderRadius: 8,
                fontWeight: 700,
                fontSize: 14,
                border: "none",
                cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button
              onClick={() => setEditing(false)}
              style={{
                flex: 1,
                background: "var(--surface2)",
                color: "var(--text-muted)",
                padding: "11px",
                borderRadius: 8,
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
      </div>
    )
  }

  // ── normal card ───────────────────────────────
  return (
    <div style={{ width: "100%", maxWidth: 600, margin: "0 auto", position: "relative" }}>

      {/* XP pop */}
      {xpPop && (
        <div key={xpPop.key} style={{
          position: "absolute",
          top: -10,
          right: 20,
          color: xpPop.amount >= 10 ? "#4ade80" : xpPop.amount >= 5 ? "#facc15" : "#f87171",
          fontWeight: 900,
          fontSize: 22,
          pointerEvents: "none",
          animation: "floatUp 0.8s ease forwards",
          zIndex: 10,
        }}>
          +{xpPop.amount} XP
          <style>{`
            @keyframes floatUp {
              0%   { opacity: 1; transform: translateY(0px) scale(1); }
              60%  { opacity: 1; transform: translateY(-30px) scale(1.2); }
              100% { opacity: 0; transform: translateY(-60px) scale(0.8); }
            }
          `}</style>
        </div>
      )}

      {/* type badge + edit button */}
      <div style={{ marginBottom: 12, display: "flex", justifyContent: "center", alignItems: "center", gap: 10 }}>
        <span style={{
          background: colors.bg,
          border: `1px solid ${colors.border}`,
          color: colors.border,
          padding: "4px 14px",
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: 1,
          textTransform: "uppercase",
        }}>
          {colors.label}
        </span>
        <button
          onClick={() => setEditing(true)}
          style={{
            background: "none",
            color: "var(--text-muted)",
            fontSize: 13,
            padding: "3px 8px",
            border: "1px solid var(--border)",
            borderRadius: 6,
            cursor: "pointer",
          }}
          title="Edit this card"
        >
          ✏️
        </button>
      </div>

{/* card */}
<div
  className="card-scene"
  onClick={handleFlip}
>
  <div className={`card-inner ${flipped ? "flipped" : ""}`}>

    {/* front face */}
    <div
      className="card-face front"
      style={{
        background: "var(--surface)",
        border: "1.5px solid var(--border)",
      }}
    >
      <div style={{
        position: "absolute",
        top: 14,
        right: 18,
        fontSize: 11,
        color: "var(--text-muted)",
        letterSpacing: 1,
        textTransform: "uppercase",
      }}>
        Space to flip
      </div>
      <p style={{
        fontSize: 20,
        fontWeight: 600,
        lineHeight: 1.7,
        color: "var(--text)",
      }}>
        {card.front}
      </p>
    </div>

    {/* back face */}
    <div
      className="card-face back"
      style={{
        background: colors.bg,
        border: `1.5px solid ${colors.border}`,
      }}
    >
      <div style={{
        position: "absolute",
        top: 14,
        right: 18,
        fontSize: 11,
        color: colors.border,
        letterSpacing: 1,
        textTransform: "uppercase",
        opacity: 0.7,
      }}>
        Answer
      </div>
      <p style={{
        fontSize: 16,
        fontWeight: 400,
        lineHeight: 1.7,
        color: "var(--text)",
      }}>
        {card.back}
      </p>
    </div>

  </div>
</div>

      {/* hint */}
      {!flipped && card.hint && (
        <div style={{ marginTop: 12, textAlign: "center" }}>
          {!hintVisible ? (
            <button
              onClick={() => setHintVisible(true)}
              style={{
                background: "none",
                color: "var(--text-muted)",
                fontSize: 13,
                borderBottom: "1px dashed var(--text-muted)",
                borderRadius: 0,
                padding: "2px 0",
                cursor: "pointer",
              }}
            >
              💡 Show hint
            </button>
          ) : (
            <div style={{
              background: "#2a1f0f",
              border: "1px solid #facc1566",
              borderRadius: 8,
              padding: "10px 16px",
              fontSize: 13,
              color: "#facc15",
              textAlign: "left",
            }}>
              💡 {card.hint}
            </div>
          )}
        </div>
      )}

      {/* rating buttons */}
      {flipped && (
        <div style={{ display: "flex", gap: 12, marginTop: 20, justifyContent: "center" }}>
          <RateButton label="Again" sub="1 key" color="#f87171" onClick={() => handleRate(1)} />
          <RateButton label="Hard"  sub="2 key" color="#facc15" onClick={() => handleRate(2)} />
          <RateButton label="Easy"  sub="3 key" color="#4ade80" onClick={() => handleRate(3)} />
        </div>
      )}

      {/* AI explain */}
      {flipped && (
        <div style={{ marginTop: 16, textAlign: "center" }}>
          {!explanation ? (
            <button
              onClick={handleExplain}
              disabled={explaining}
              style={{
                background: "none",
                color: "var(--primary)",
                fontSize: 13,
                borderBottom: "1px dashed var(--primary)",
                borderRadius: 0,
                padding: "2px 0",
                cursor: explaining ? "not-allowed" : "pointer",
                opacity: explaining ? 0.6 : 1,
              }}
            >
              {explaining ? "Getting explanation..." : "🤖 I don't get it — explain simply"}
            </button>
          ) : (
            <div style={{
              background: "#1e1b4b",
              border: "1px solid #7c6af766",
              borderRadius: 8,
              padding: "14px 16px",
              fontSize: 13,
              color: "var(--text)",
              textAlign: "left",
              lineHeight: 1.7,
              marginTop: 8,
            }}>
              🤖 {explanation}
            </div>
          )}
        </div>
      )}

      {/* keyboard hint */}
      <p style={{
        textAlign: "center",
        color: "var(--text-muted)",
        fontSize: 11,
        marginTop: 16,
        letterSpacing: 0.5,
      }}>
        {flipped ? "Press 1 · 2 · 3 to rate" : "Press Space or Enter to flip"}
      </p>

    </div>
  )
}

function RateButton({ label, sub, color, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        maxWidth: 160,
        padding: "12px 8px",
        borderRadius: "var(--radius)",
        background: "var(--surface)",
        border: `1.5px solid ${color}`,
        color: color,
        fontWeight: 600,
        fontSize: 15,
        transition: "background 0.2s",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
        cursor: "pointer",
      }}
      onMouseEnter={e => e.currentTarget.style.background = "var(--surface2)"}
      onMouseLeave={e => e.currentTarget.style.background = "var(--surface)"}
    >
      {label}
      <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 400 }}>{sub}</span>
    </button>
  )
}

const labelStyle = {
  fontSize: 12,
  color: "var(--text-muted)",
  display: "block",
  marginBottom: 6,
  marginTop: 12,
}

const textareaStyle = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: 8,
  background: "var(--surface2)",
  border: "1.5px solid var(--border)",
  color: "var(--text)",
  fontSize: 14,
  resize: "vertical",
  outline: "none",
  fontFamily: "inherit",
  lineHeight: 1.6,
}
