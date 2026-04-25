import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { getProgress } from "../api.js"
import MasteryBar from "../components/MasteryBar.jsx"
import HelpDialog from "../components/HelpDialog.jsx"

export default function Progress() {
  const { deckId } = useParams()
  const navigate = useNavigate()
  const [progress, setProgress] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    getProgress(deckId)
      .then(res => setProgress(res.data))
      .catch(() => setError("Could not load progress."))
      .finally(() => setLoading(false))
  }, [deckId])

  if (loading) return (
    <div style={centerPage}>
      <p style={{ color: "var(--text-muted)" }}>Loading progress...</p>
    </div>
  )

  if (error) return (
    <div style={centerPage}>
      <p style={{ color: "#f87171" }}>{error}</p>
      <button onClick={() => navigate("/")} style={ghostBtn}>← Dashboard</button>
    </div>
  )

  const buckets = [
    {
      label: "New",
      count: progress.new_cards,
      color: "#8888a8",
      bg: "var(--surface2)",
      desc: "Not studied yet",
    },
    {
      label: "Learning",
      count: progress.learning_cards,
      color: "#60a5fa",
      bg: "#1a2744",
      desc: "Seen 1–2 times",
    },
    {
      label: "Reviewing",
      count: progress.reviewing_cards,
      color: "#7c6af7",
      bg: "#1e1b4b",
      desc: "Getting familiar",
    },
    {
      label: "Struggling",
      count: progress.struggling_cards,
      color: "#f87171",
      bg: "#2d1a1a",
      desc: "Needs more practice",
    },
    {
      label: "Mastered",
      count: progress.mastered_cards,
      color: "#4ade80",
      bg: "#14291f",
      desc: "Long-term memory ✓",
    },
  ]

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>

      {/* navbar */}
      <nav style={{
        padding: "0 28px",
        height: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid var(--border)",
        background: "var(--surface)",
      }}>
        <button
          onClick={() => navigate("/")}
          style={{ background: "none", color: "var(--text-muted)", fontSize: 14, padding: 0, cursor: "pointer" }}
        >
          ← Dashboard
        </button>
        <span style={{ fontWeight: 700, fontSize: 15 }}>{progress.deck_name}</span>
        <button
          onClick={() => navigate(`/review/${deckId}`)}
          style={{
            background: "var(--primary)",
            color: "#fff",
            padding: "8px 18px",
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          Study Now
        </button>
      </nav>

      <main style={{ maxWidth: 640, margin: "0 auto", padding: "40px 24px" }}>

        {/* header */}
        <div style={{ marginBottom: 32, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
          <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>
            Progress
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
            {progress.total_cards} cards total
          </p>
          </div>
          <HelpDialog
            title="How to read progress"
            description="Progress helps you understand how strong the deck is and where to focus next."
            steps={[
              "Use the mastery percentage as a quick summary of how familiar you are with the deck.",
              "Check the bucket list to see how many cards are new, learning, struggling, or mastered.",
              "Press Study Now to improve the weak areas and move cards into stronger buckets.",
            ]}
            tips={[
              "A high struggling count usually means that another short review session would help.",
            ]}
            storageKey="flashmind_help_progress"
            autoOpen
          />
        </div>

        {/* mastery percent hero */}
        <div style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          padding: "32px",
          marginBottom: 20,
          textAlign: "center",
        }}>
          <div style={{
            fontSize: 64,
            fontWeight: 900,
            color: progress.mastery_percent >= 80
              ? "#4ade80"
              : progress.mastery_percent >= 40
              ? "#7c6af7"
              : "#facc15",
            lineHeight: 1,
            marginBottom: 8,
          }}>
            {progress.mastery_percent}%
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 24 }}>
            {progress.mastery_percent >= 80
              ? "Excellent! You've mastered most of this deck. 🏆"
              : progress.mastery_percent >= 40
              ? "Good progress! Keep reviewing to lock it in. 💪"
              : "Just getting started — consistency is key. 🌱"}
          </p>
          <MasteryBar progress={progress} />
        </div>

        {/* bucket breakdown */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {buckets.map(b => (
            <div
              key={b.label}
              style={{
                background: b.bg,
                border: `1px solid ${b.color}33`,
                borderRadius: "var(--radius)",
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: b.color,
                  flexShrink: 0,
                }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{b.label}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{b.desc}</div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: b.color }}>
                  {b.count}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  {progress.total_cards > 0
                    ? `${Math.round((b.count / progress.total_cards) * 100)}%`
                    : "0%"}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* bottom cta */}
        <div style={{ marginTop: 32, display: "flex", gap: 12 }}>
                  <button
                      onClick={() => navigate(`/review/${deckId}?mode=all`)}
                      style={{ ...primaryBtn, flex: 2 }}
                  >
                      Continue Studying →
                  </button>
          <button
            onClick={() => navigate("/")}
            style={{ ...ghostBtn, flex: 1 }}
          >
            All Decks
          </button>
        </div>

      </main>
    </div>
  )
}

const centerPage = {
  minHeight: "100vh",
  background: "var(--bg)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 16,
  padding: 24,
}

const primaryBtn = {
  background: "var(--primary)",
  color: "#fff",
  padding: "13px 20px",
  borderRadius: 8,
  fontWeight: 700,
  fontSize: 14,
  border: "none",
  cursor: "pointer",
}

const ghostBtn = {
  background: "var(--surface2)",
  color: "var(--text-muted)",
  padding: "13px 20px",
  borderRadius: 8,
  fontWeight: 600,
  fontSize: 14,
  border: "1px solid var(--border)",
  cursor: "pointer",
}
