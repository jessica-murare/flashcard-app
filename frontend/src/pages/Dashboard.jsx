import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { listDecks } from "../api.js"
import DeckCard from "../components/DeckCard.jsx"

import { scheduleDailyReminder, checkAndNotify } from "../notifications.js"

// ── streak + daily goal helpers ───────────────────────────────────
function getTodayStr() {
  return new Date().toISOString().split("T")[0]
}

function loadStreak() {
  const last = localStorage.getItem("flashmind_last_study")
  const streak = parseInt(localStorage.getItem("flashmind_streak") || "0")
  const today = getTodayStr()
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0]

  if (last === today) return streak
  if (last === yesterday) return streak // still alive
  return 0 // broken
}

function loadDailyProgress() {
  const saved = localStorage.getItem("flashmind_daily")
  if (!saved) return { date: getTodayStr(), reviewed: 0 }
  const data = JSON.parse(saved)
  if (data.date !== getTodayStr()) return { date: getTodayStr(), reviewed: 0 }
  return data
}

function loadXP() {
  return parseInt(localStorage.getItem("flashmind_xp") || "0")
}

const LEVELS = [0, 100, 250, 500, 900, 1400, 2100, 3000, 4200, 6000]
const DAILY_GOAL = 20

function getLevel(xp) {
  let level = 1
  for (let i = 0; i < LEVELS.length; i++) {
    if (xp >= LEVELS[i]) level = i + 1
  }
  return Math.min(level, LEVELS.length)
}

function getXPProgress(xp) {
  const level = getLevel(xp)
  const current = LEVELS[level - 1] || 0
  const next = LEVELS[level] || LEVELS[LEVELS.length - 1]
  return Math.round(((xp - current) / (next - current)) * 100)
}

function skeletonStyle(width, height, left, top) {
  return {
    position: "absolute",
    left: left || 24,
    top: top + 24,
    width: width,
    height: height,
    borderRadius: 6,
    background: "linear-gradient(90deg, var(--surface2) 25%, var(--border) 50%, var(--surface2) 75%)",
    backgroundSize: "400px 100%",
    animation: "shimmer 1.4s infinite",
  }
}

// ── component ─────────────────────────────────────────────────────
export default function Dashboard() {
  const [decks, setDecks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const xp = loadXP()
  const level = getLevel(xp)
  const xpProgress = getXPProgress(xp)
  const streak = loadStreak()
  const daily = loadDailyProgress()
  const dailyPct = Math.min(100, Math.round((daily.reviewed / DAILY_GOAL) * 100))
  const dailyDone = daily.reviewed >= DAILY_GOAL

  useEffect(() => {
    // show cached immediately
    const cached = sessionStorage.getItem("flashmind_decks")
    if (cached) {
      setDecks(JSON.parse(cached))
      setLoading(false)
    }

    // always refetch in background
    listDecks()
      .then(res => {
        setDecks(res.data)
        sessionStorage.setItem("flashmind_decks", JSON.stringify(res.data))
        const due = res.data.reduce((a, d) => a + d.due_cards, 0)
        checkAndNotify(due)
        scheduleDailyReminder()
      })
      .catch(() => setError("Could not load decks."))
      .finally(() => setLoading(false))
  }, [])

  const totalDue = decks.reduce((a, d) => a + d.due_cards, 0)

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>

      {/* navbar */}
      <nav className="app-nav dashboard-nav glass-panel" style={{
        padding: "0 32px",
        height: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid var(--border)",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}>
        <span style={{ fontWeight: 800, fontSize: 20, color: "var(--primary)" }}>
          ⚡ FlashMind
        </span>
        <div className="nav-actions dashboard-actions" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          
          {/* XP pill */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "var(--surface2)",
            border: "1px solid var(--border)",
            borderRadius: 999,
            padding: "6px 14px",
          }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--primary)" }}>
              Lv.{level}
            </span>
            <div style={{
              width: 56,
              height: 5,
              background: "var(--border)",
              borderRadius: 999,
              overflow: "hidden",
            }}>
              <div style={{
                height: "100%",
                width: `${xpProgress}%`,
                background: "var(--primary)",
                borderRadius: 999,
              }} />
            </div>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{xp} XP</span>
          </div>

          <button
            className="pill-btn hover-lift"
            onClick={() => navigate("/upload")}
            style={{
              background: "var(--primary)",
              color: "#000",
              boxShadow: "0 4px 14px rgba(249, 168, 37, 0.4)",
              padding: "9px 24px",
              fontWeight: 800,
              fontSize: 14,
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
            + New Deck
          </button>
        </div>
      </nav>

      <main className="page-main dashboard-main" style={{ maxWidth: 960, margin: "0 auto", padding: "36px 24px" }}>

        {/* stats row */}
        <div className="responsive-grid stats-grid" style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
          marginBottom: 32,
        }}>

          {/* streak card */}
          <StatCard>
            <div style={{ fontSize: 36 }}>{streak > 0 ? "🔥" : "💤"}</div>
            <div>
              <div style={{ fontSize: 26, fontWeight: 900, color: streak > 0 ? "#facc15" : "var(--text-muted)" }}>
                {streak}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>
                Day streak
              </div>
            </div>
          </StatCard>

          {/* daily goal card */}
          <StatCard>
            <div style={{ position: "relative", width: 52, height: 52 }}>
              <Ring pct={dailyPct} color={dailyDone ? "#4ade80" : "var(--primary)"} />
              <div style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 700,
                color: dailyDone ? "#4ade80" : "var(--primary)",
              }}>
                {dailyDone ? "✓" : `${dailyPct}%`}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>
                {daily.reviewed}/{DAILY_GOAL}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>
                Daily goal
              </div>
              {dailyDone && (
                <div style={{ fontSize: 11, color: "#4ade80", marginTop: 2 }}>
                  Goal crushed! 🎉
                </div>
              )}
            </div>
          </StatCard>

          {/* due today card */}
          <StatCard>
            <div style={{ fontSize: 36 }}>📚</div>
            <div>
              <div style={{
                fontSize: 26,
                fontWeight: 900,
                color: totalDue > 0 ? "#facc15" : "#4ade80",
              }}>
                {totalDue}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>
                Cards due today
              </div>
              {totalDue === 0 && (
                <div style={{ fontSize: 11, color: "#4ade80", marginTop: 2 }}>All caught up!</div>
              )}
            </div>
          </StatCard>

          {/* total decks */}
          <StatCard>
            <div style={{ fontSize: 36 }}>🗂️</div>
            <div>
              <div style={{ fontSize: 26, fontWeight: 900 }}>{decks.length}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>
                Total decks
              </div>
            </div>
          </StatCard>

        </div>

        {/* deck section header */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Your Decks</h1>
        </div>

        {/* states */}
        {loading && (
          <div className="responsive-grid deck-grid" style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 20,
          }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                padding: "24px",
                height: 220,
                position: "relative",
                overflow: "hidden",
              }}>
                <div style={skeletonStyle(100, 20, 0, 0)} />
                <div style={skeletonStyle(60, 14, 0, 28)} />
                <div style={skeletonStyle("100%", 6, 0, 60)} />
                <div style={skeletonStyle("100%", 40, 0, 80)} />
                <div style={skeletonStyle("100%", 38, 0, 140)} />
                <style>{`
          @keyframes shimmer {
            0%   { background-position: -400px 0; }
            100% { background-position: 400px 0; }
          }
        `}</style>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="responsive-grid deck-grid" style={{
            background: "#2d1a1a",
            border: "1px solid #f87171",
            color: "#f87171",
            padding: "16px 20px",
            borderRadius: "var(--radius)",
          }}>
            {error}
          </div>
        )}

        {!loading && !error && decks.length === 0 && (
          <div
            onClick={() => navigate("/upload")}
            style={{
              border: "2px dashed var(--border)",
              borderRadius: "var(--radius)",
              padding: "80px 40px",
              textAlign: "center",
              cursor: "pointer",
              transition: "border-color 0.2s",
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "var(--primary)"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }}>📄</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
              Upload your first PDF
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
              Drop in a chapter, notes, or textbook — get smart flashcards in seconds.
            </p>
          </div>
        )}

        {!loading && decks.length > 0 && (
          <div className="responsive-grid deck-grid" style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 20,
          }}>
                      {decks.map(deck => (
                          <DeckCard
                              key={deck.id}
                              deck={deck}
                              onDelete={(id) => setDecks(prev => prev.filter(d => d.id !== id))}
                          />
                      ))}
          </div>
        )}

      </main>
    </div>
  )
}

// ── sub components ────────────────────────────────────────────────
function StatCard({ children }) {
  return (
    <div className="hover-lift glass-panel" style={{
      border: "1px solid var(--border)",
      borderRadius: "var(--radius)",
      padding: "20px 24px",
      display: "flex",
      alignItems: "center",
      gap: 16,
      transition: "transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s",
    }}
    onMouseEnter={e => e.currentTarget.style.boxShadow = "0 8px 30px rgba(0,0,0,0.4)"}
    onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
    >
      {children}
    </div>
  )
}

function Ring({ pct, color }) {
  const r = 22
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ

  return (
    <svg width="52" height="52" viewBox="0 0 52 52">
      <circle cx="26" cy="26" r={r} fill="none" stroke="var(--border)" strokeWidth="4" />
      <circle
        cx="26" cy="26" r={r}
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 26 26)"
        style={{ transition: "stroke-dasharray 0.6s ease" }}
      />
    </svg>
  )
}
