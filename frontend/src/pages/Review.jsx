import { useEffect, useState, useCallback } from "react"
import { useParams, useNavigate, useSearchParams } from "react-router-dom"
import { getReviewSession, submitReview, getRetrySession, getWeakSummary, getAllCards } from "../api.js"
import FlashCard from "../components/FlashCard.jsx"
import HelpDialog from "../components/HelpDialog.jsx"
import confetti from "canvas-confetti"
import { addCard } from "../api.js"

const XP_MAP = { 1: 2, 2: 5, 3: 10 }
const LEVELS = [0, 100, 250, 500, 900, 1400, 2100, 3000, 4200, 6000]

function getTodayStr() {
  return new Date().toISOString().split("T")[0]
}

function loadDailyProgress() {
  const saved = localStorage.getItem("flashmind_daily")
  if (!saved) return { date: getTodayStr(), reviewed: 0 }
  const data = JSON.parse(saved)
  if (data.date !== getTodayStr()) return { date: getTodayStr(), reviewed: 0 }
  return data
}

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

function loadXP() {
    return parseInt(localStorage.getItem("flashmind_xp") || "0")
}

function saveXP(xp) {
    localStorage.setItem("flashmind_xp", xp)
}

function shuffleArray(items) {
    const copy = [...items]
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[copy[i], copy[j]] = [copy[j], copy[i]]
    }
    return copy
}

export default function Review() {
    const { deckId } = useParams()
    const [searchParams] = useSearchParams()
    const isPracticeAll = searchParams.get("mode") === "all"
    const navigate = useNavigate()

    const [cards, setCards] = useState([])
    const [index, setIndex] = useState(0)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [sessionDone, setSessionDone] = useState(false)
    const [isRetryMode, setIsRetryMode] = useState(false)
    const [stats, setStats] = useState({ again: 0, hard: 0, easy: 0, againIds: [] })
    const [xp, setXp] = useState(loadXP())
    const [sessionXP, setSessionXP] = useState(0)
    const [weakSummary, setWeakSummary] = useState(null)
    const [loadingSummary, setLoadingSummary] = useState(false)
    const [sessionLength, setSessionLength] = useState(null)
    const [shuffled, setShuffled] = useState(false)
    const [setupDone, setSetupDone] = useState(false)
    const [displayCards, setDisplayCards] = useState([])
    const [showAddCard, setShowAddCard] = useState(false)
    const [newFront, setNewFront] = useState("")
    const [newBack, setNewBack] = useState("")
    const [newHint, setNewHint] = useState("")
    const [newType, setNewType] = useState("concept")
    const [addingCard, setAddingCard] = useState(false)
    const [addError, setAddError] = useState("")

    const loadSession = useCallback((retry = false) => {
        setLoading(true)
        setError(null)
        setIndex(0)
        setSessionDone(false)
        setStats({ again: 0, hard: 0, easy: 0, againIds: [] })
        setSessionXP(0)
        setWeakSummary(null)
        setSetupDone(false)
        setDisplayCards([])

        let fetcher
        if (retry) {
            fetcher = getRetrySession(deckId)
        } else if (isPracticeAll) {
            fetcher = getAllCards(deckId)
        } else {
            fetcher = getReviewSession(deckId)
        }

        fetcher
            .then(res => {
                setCards(res.data)
                if (res.data.length === 0) setSessionDone(true)
            })
            .catch(() => setError("Could not load session."))
            .finally(() => setLoading(false))
    }, [deckId, isPracticeAll])

    useEffect(() => { loadSession(false) }, [loadSession])

    const handleAddCard = async () => {
        if (!newFront.trim()) return setAddError("Front is required.")
        if (!newBack.trim()) return setAddError("Back is required.")
        setAddingCard(true)
        setAddError("")
        try {
            const res = await addCard(deckId, {
                front: newFront,
                back: newBack,
                hint: newHint,
                card_type: newType,
            })
            // add to current session immediately
            setDisplayCards(prev => [...prev, res.data])
            setNewFront("")
            setNewBack("")
            setNewHint("")
            setNewType("concept")
            setShowAddCard(false)
        } catch {
            setAddError("Failed to add card. Try again.")
        } finally {
            setAddingCard(false)
        }
    }

    const handleRate = async (rating) => {
        const card = displayCards[index]
        const earned = XP_MAP[rating]

        // update XP
        const newXP = xp + earned
        setXp(newXP)
        setSessionXP(prev => prev + earned)
        saveXP(newXP)

        // update daily progress
        const daily = loadDailyProgress()
        daily.reviewed += 1
        localStorage.setItem("flashmind_daily", JSON.stringify(daily))

        // update streak
        const today = getTodayStr()
        const last = localStorage.getItem("flashmind_last_study")
        const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0]
        let streak = parseInt(localStorage.getItem("flashmind_streak") || "0")
        if (last === today) {
            // same day, no change
        } else if (last === yesterday) {
            streak += 1
            localStorage.setItem("flashmind_streak", streak)
        } else {
            localStorage.setItem("flashmind_streak", "1")
        }
        localStorage.setItem("flashmind_last_study", today)

        // update stats
        setStats(prev => ({
            again: rating === 1 ? prev.again + 1 : prev.again,
            hard: rating === 2 ? prev.hard + 1 : prev.hard,
            easy: rating === 3 ? prev.easy + 1 : prev.easy,
            againIds: rating === 1 ? [...prev.againIds, card.id] : prev.againIds,
        }))

        try { await submitReview(card.id, rating) }
        catch (e) { console.error("Review submit failed", e) }

        if (index + 1 >= displayCards.length) {
            finishSession(rating, card.id)
        } else {
            setIndex(index + 1)
        }
    }

    const finishSession = (lastRating, lastCardId) => {
        const finalStats = {
            again: stats.again + (lastRating === 1 ? 1 : 0),
            hard: stats.hard + (lastRating === 2 ? 1 : 0),
            easy: stats.easy + (lastRating === 3 ? 1 : 0),
            againIds: lastRating === 1 ? [...stats.againIds, lastCardId] : stats.againIds,
        }
        setStats(finalStats)

        // confetti if mostly easy
        if (finalStats.easy >= finalStats.again) {
            confetti({
                particleCount: 120,
                spread: 80,
                origin: { y: 0.6 },
                colors: ["#7c6af7", "#4ade80", "#facc15", "#60a5fa"],
            })
        }

        // fetch weak summary if any again cards
        if (finalStats.againIds.length > 0) {
            setLoadingSummary(true)
            getWeakSummary(deckId, finalStats.againIds)
                .then(res => setWeakSummary(res.data))
                .catch(() => { })
                .finally(() => setLoadingSummary(false))
        }

        setSessionDone(true)
    }

    // ── session setup screen ──────────────────────────────────────────
    if (!loading && !sessionDone && !setupDone && cards.length > 0) {
        return (
            <div style={centerPage}>
                <div style={cardBox}>
                    <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>
                        Ready to study?
                    </h2>
                    <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 24 }}>
                        {cards.length} cards due · customize your session
                    </p>

                    {/* session length */}
                    <label style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 10, display: "block" }}>
                        Session Length
                    </label>
                    <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
                        {[
                            { label: "Quick", count: 10, emoji: "⚡" },
                            { label: "Standard", count: 20, emoji: "📖" },
                            { label: "Full", count: null, emoji: "🔥" },
                        ].map(opt => {
                            const active = sessionLength === opt.count
                            const actual = opt.count ? Math.min(opt.count, cards.length) : cards.length
                            return (
                                <button
                                    key={opt.label}
                                    onClick={() => setSessionLength(opt.count)}
                                    style={{
                                        flex: 1,
                                        padding: "12px 8px",
                                        borderRadius: 10,
                                        border: `1.5px solid ${active ? "var(--primary)" : "var(--border)"}`,
                                        background: active ? "rgba(124,106,247,0.1)" : "var(--surface2)",
                                        color: active ? "var(--primary)" : "var(--text-muted)",
                                        fontWeight: 600,
                                        fontSize: 13,
                                        cursor: "pointer",
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        gap: 4,
                                    }}
                                >
                                    <span style={{ fontSize: 20 }}>{opt.emoji}</span>
                                    {opt.label}
                                    <span style={{ fontSize: 11, opacity: 0.7 }}>{actual} cards</span>
                                </button>
                            )
                        })}
                    </div>

                    {/* shuffle toggle */}
                    <div
                        onClick={() => setShuffled(s => !s)}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            background: "var(--surface2)",
                            border: `1.5px solid ${shuffled ? "var(--primary)" : "var(--border)"}`,
                            borderRadius: 10,
                            padding: "14px 18px",
                            cursor: "pointer",
                            marginBottom: 24,
                            transition: "all 0.2s",
                        }}
                    >
                        <div>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>🔀 Shuffle cards</div>
                            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                                Randomize card order for this session
                            </div>
                        </div>
                        <div style={{
                            width: 44,
                            height: 24,
                            borderRadius: 999,
                            background: shuffled ? "var(--primary)" : "var(--border)",
                            position: "relative",
                            transition: "background 0.2s",
                            flexShrink: 0,
                        }}>
                            <div style={{
                                position: "absolute",
                                top: 3,
                                left: shuffled ? 22 : 3,
                                width: 18,
                                height: 18,
                                borderRadius: "50%",
                                background: "#fff",
                                transition: "left 0.2s",
                            }} />
                        </div>
                    </div>

                    <button
                        onClick={() => {
                            let chosen = [...cards]
                            if (shuffled) chosen = chosen.sort(() => Math.random() - 0.5)
                            if (sessionLength) chosen = chosen.slice(0, sessionLength)
                            setDisplayCards(chosen)
                            setSetupDone(true)
                        }}
                        style={{ ...primaryBtn, width: "100%" }}
                    >
                        Start Session →
                    </button>
                </div>
            </div>
        )
    }

    // ── loading ───────────────────────────────────
    if (loading) return (
        <div style={centerPage}>
            <Spinner />
            <p style={{ color: "var(--text-muted)", marginTop: 16 }}>
                {isRetryMode ? "Loading hard cards..." : "Loading your cards..."}
            </p>
        </div>
    )

    if (error) return (
        <div style={centerPage}>
            <p style={{ color: "#f87171" }}>{error}</p>
            <button onClick={() => navigate("/")} style={ghostBtn}>← Dashboard</button>
        </div>
    )

    // ── session complete ──────────────────────────
    if (sessionDone) {
        const total = stats.again + stats.hard + stats.easy
        const level = getLevel(xp)
        const xpProgress = getXPProgress(xp)

        return (
            <div style={centerPage}>
                <div style={cardBox}>

                    {/* emoji */}
                    <div style={{ fontSize: 52, textAlign: "center", marginBottom: 12 }}>
                        {total === 0 ? "✅" : stats.easy >= stats.again ? "🏆" : "💪"}
                    </div>

                    <h2 style={{ fontSize: 22, fontWeight: 800, textAlign: "center", marginBottom: 4 }}>
                        {total === 0 ? "Nothing due!" : "Session Complete!"}
                    </h2>

                    <p style={{ color: "var(--text-muted)", textAlign: "center", fontSize: 14, marginBottom: 20 }}>
                        {total === 0
                            ? "You're all caught up. Come back later."
                            : `Reviewed ${total} card${total > 1 ? "s" : ""} · +${sessionXP} XP earned`}
                    </p>

                    {/* XP level bar */}
                    <div style={{
                        background: "var(--surface2)",
                        border: "1px solid var(--border)",
                        borderRadius: 10,
                        padding: "14px 18px",
                        marginBottom: 20,
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--primary)" }}>
                                Level {level}
                            </span>
                            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                                {xp} XP total
                            </span>
                        </div>
                        <div style={{
                            height: 8,
                            background: "var(--border)",
                            borderRadius: 999,
                            overflow: "hidden",
                        }}>
                            <div style={{
                                height: "100%",
                                width: `${xpProgress}%`,
                                background: "var(--primary)",
                                borderRadius: 999,
                                transition: "width 0.6s ease",
                            }} />
                        </div>
                        <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>
                            {xpProgress}% to Level {level + 1}
                        </p>
                    </div>

                    {/* stat pills */}
                    {total > 0 && (
                        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 20 }}>
                            <Pill label="Again" value={stats.again} color="#f87171" />
                            <Pill label="Hard" value={stats.hard} color="#facc15" />
                            <Pill label="Easy" value={stats.easy} color="#4ade80" />
                        </div>
                    )}

                    {/* weak area summary */}
                    {loadingSummary && (
                        <div style={{
                            background: "var(--surface2)",
                            borderRadius: 8,
                            padding: "12px 16px",
                            marginBottom: 16,
                            fontSize: 13,
                            color: "var(--text-muted)",
                        }}>
                            🤖 Analyzing your weak areas...
                        </div>
                    )}
                    {weakSummary && (
                        <div style={{
                            background: "#1e1b4b",
                            border: "1px solid #7c6af766",
                            borderRadius: 8,
                            padding: "14px 16px",
                            marginBottom: 16,
                        }}>
                            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--primary)", marginBottom: 6 }}>
                                🤖 AI Analysis
                            </p>
                            <p style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.7 }}>
                                {weakSummary.summary}
                            </p>
                            {weakSummary.focus_cards?.length > 0 && (
                                <div style={{ marginTop: 10 }}>
                                    <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>
                                        Focus on:
                                    </p>
                                    {weakSummary.focus_cards.map((q, i) => (
                                        <div key={i} style={{
                                            fontSize: 12,
                                            color: "var(--text)",
                                            padding: "4px 0",
                                            borderBottom: "1px solid var(--border)",
                                        }}>
                                            · {q}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* action buttons */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {stats.again > 0 && (
                            <button
                                onClick={() => { setIsRetryMode(true); loadSession(true) }}
                                style={{ ...primaryBtn, background: "#f87171", width: "100%" }}
                            >
                                🔁 Retry {stats.again} hard card{stats.again > 1 ? "s" : ""}
                            </button>
                        )}
                        <div style={{ display: "flex", gap: 10 }}>
                            <button
                                onClick={() => navigate(`/progress/${deckId}`)}
                                style={{ ...primaryBtn, flex: 1 }}
                            >
                                View Progress
                            </button>
                            <button
                                onClick={() => navigate("/")}
                                style={{ ...ghostBtn, flex: 1 }}
                            >
                                Dashboard
                            </button>
                        </div>
                        <button
                            onClick={() => {
                                setIsRetryMode(false)
                                loadSession(false)
                                navigate(`/review/${deckId}?mode=all`)
                            }}
                            style={{
                                ...ghostBtn,
                                width: "100%",
                                color: "var(--primary)",
                                borderColor: "var(--primary)",
                            }}
                        >
                            🔄 Study All Cards Again
                        </button>
                    </div>

                </div>
            </div>
        )
    }

    // ── review session ────────────────────────────
    const current = displayCards[index]
    const progress = (index / displayCards.length) * 100
    const level = getLevel(xp)
    const xpProgress = getXPProgress(xp)

    return (
        <div style={{ minHeight: "100vh", background: "var(--bg)" }}>

            {/* top bar */}
            <div className="review-topbar glass-panel" style={{
                padding: "12px 24px",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                gap: 16,
                position: "sticky",
                top: 0,
                zIndex: 10,
            }}>
                <button
                    onClick={() => navigate("/")}
                    style={{ background: "none", color: "var(--text-muted)", fontSize: 13, padding: 0, whiteSpace: "nowrap" }}
                >
                    ← Exit
                </button>

                <HelpDialog
                    title="How review works"
                    description="Review is where spaced repetition happens. Each rating tells the app how soon to show the card again."
                    steps={[
                        "Flip the card to think through the answer before rating yourself.",
                        "Choose Again if you missed it, Hard if you mostly knew it, or Easy if it felt quick and clear.",
                        "Use Retry Mode after the session to repeat the cards that gave you trouble.",
                    ]}
                    tips={[
                        "You can use Space or Enter to flip, then 1, 2, or 3 to rate.",
                        "The explain button helps when you want a simpler explanation before moving on.",
                    ]}
                    storageKey="flashmind_help_review"
                    autoOpen
                />

                {/* session progress bar */}
                <div style={{ flex: 2 }}>
                    <div style={{ height: 6, background: "var(--border)", borderRadius: 999, overflow: "hidden" }}>
                        <div style={{
                            height: "100%",
                            width: `${progress}%`,
                            background: "var(--primary)",
                            borderRadius: 999,
                            transition: "width 0.4s ease",
                        }} />
                    </div>
                </div>

                <span style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                    {index + 1}/{displayCards.length}
                </span>

                {/* XP level pill */}
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: "var(--surface2)",
                    border: "1px solid var(--border)",
                    borderRadius: 999,
                    padding: "4px 12px",
                    whiteSpace: "nowrap",
                }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--primary)" }}>
                        Lv.{level}
                    </span>
                    <div style={{ width: 48, height: 4, background: "var(--border)", borderRadius: 999, overflow: "hidden" }}>
                        <div style={{
                            height: "100%",
                            width: `${xpProgress}%`,
                            background: "var(--primary)",
                            borderRadius: 999,
                        }} />
                    </div>
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{xp} XP</span>
                </div>

                {/* retry mode badge */}
                {isRetryMode && (
                    <span style={{
                        background: "#2d1a1a",
                        border: "1px solid #f87171",
                        color: "#f87171",
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "3px 10px",
                        borderRadius: 999,
                    }}>
                        RETRY MODE
                    </span>
                )}
            </div>

            {/* add card button */}
            <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 50 }}>
                <button
                    onClick={() => setShowAddCard(true)}
                    style={{
                        background: "var(--primary)",
                        color: "#fff",
                        width: 52,
                        height: 52,
                        borderRadius: "50%",
                        border: "none",
                        fontSize: 24,
                        cursor: "pointer",
                        boxShadow: "0 4px 20px rgba(124,106,247,0.4)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "transform 0.2s, box-shadow 0.2s",
                    }}
                    title="Add your own card"
                    onMouseEnter={e => {
                        e.currentTarget.style.transform = "scale(1.1)"
                        e.currentTarget.style.boxShadow = "0 6px 28px rgba(124,106,247,0.5)"
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.transform = "scale(1)"
                        e.currentTarget.style.boxShadow = "0 4px 20px rgba(124,106,247,0.4)"
                    }}
                >
                    +
                </button>
            </div>

            {/* add card modal */}
            {showAddCard && (
                <div style={{
                    position: "fixed",
                    inset: 0,
                    background: "rgba(0,0,0,0.7)",
                    backdropFilter: "blur(4px)",
                    zIndex: 100,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 24,
                }}
                    onClick={e => { if (e.target === e.currentTarget) setShowAddCard(false) }}
                >
                    <div style={{
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius)",
                        padding: "32px",
                        width: "100%",
                        maxWidth: 500,
                        display: "flex",
                        flexDirection: "column",
                        gap: 14,
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <h2 style={{ fontWeight: 800, fontSize: 18 }}>✍️ Add Your Own Card</h2>
                            <button
                                onClick={() => setShowAddCard(false)}
                                style={{ background: "none", color: "var(--text-muted)", fontSize: 20, border: "none", cursor: "pointer" }}
                            >
                                ×
                            </button>
                        </div>

                        {/* card type */}
                        <div>
                            <label style={modalLabel}>Card Type</label>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                {["concept", "definition", "example", "edge_case", "why"].map(t => (
                                    <button
                                        key={t}
                                        onClick={() => setNewType(t)}
                                        style={{
                                            padding: "5px 12px",
                                            borderRadius: 999,
                                            border: `1px solid ${newType === t ? "var(--primary)" : "var(--border)"}`,
                                            background: newType === t ? "rgba(124,106,247,0.1)" : "var(--surface2)",
                                            color: newType === t ? "var(--primary)" : "var(--text-muted)",
                                            fontSize: 12,
                                            fontWeight: 600,
                                            cursor: "pointer",
                                            textTransform: "capitalize",
                                        }}
                                    >
                                        {t.replace("_", " ")}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* front */}
                        <div>
                            <label style={modalLabel}>Front (Question) *</label>
                            <textarea
                                value={newFront}
                                onChange={e => setNewFront(e.target.value)}
                                placeholder="What is the question?"
                                rows={3}
                                style={modalTextarea}
                            />
                        </div>

                        {/* back */}
                        <div>
                            <label style={modalLabel}>Back (Answer) *</label>
                            <textarea
                                value={newBack}
                                onChange={e => setNewBack(e.target.value)}
                                placeholder="What is the answer?"
                                rows={3}
                                style={modalTextarea}
                            />
                        </div>

                        {/* hint */}
                        <div>
                            <label style={modalLabel}>Hint (optional)</label>
                            <textarea
                                value={newHint}
                                onChange={e => setNewHint(e.target.value)}
                                placeholder="A nudge without giving it away..."
                                rows={2}
                                style={modalTextarea}
                            />
                        </div>

                        {/* error */}
                        {addError && (
                            <div style={{
                                background: "#2d1a1a",
                                border: "1px solid #f87171",
                                color: "#f87171",
                                padding: "10px 14px",
                                borderRadius: 8,
                                fontSize: 13,
                            }}>
                                {addError}
                            </div>
                        )}

                        {/* actions */}
                        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                            <button
                                onClick={handleAddCard}
                                disabled={addingCard}
                                style={{
                                    flex: 1,
                                    background: "var(--primary)",
                                    color: "#fff",
                                    padding: "12px",
                                    borderRadius: 8,
                                    fontWeight: 700,
                                    fontSize: 14,
                                    border: "none",
                                    cursor: addingCard ? "not-allowed" : "pointer",
                                    opacity: addingCard ? 0.6 : 1,
                                }}
                            >
                                {addingCard ? "Adding..." : "Add to Deck"}
                            </button>
                            <button
                                onClick={() => setShowAddCard(false)}
                                style={{
                                    flex: 1,
                                    background: "var(--surface2)",
                                    color: "var(--text-muted)",
                                    padding: "12px",
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
            )}

            {/* card area */}
            <div style={{ maxWidth: 680, margin: "0 auto", padding: "48px 24px" }}>
                <FlashCard
                    key={current.id}
                    card={current}
                    onRate={handleRate}
                    disableShortcuts={showAddCard}
                    onCardUpdate={(updated) => {
                        setDisplayCards(prev =>
                            prev.map(c => c.id === updated.id ? updated : c)
                        )
                    }}
                />
            </div>

        </div>
    )
}

function Spinner() {
    return (
        <div style={{
            width: 40, height: 40,
            border: "3px solid var(--border)",
            borderTop: "3px solid var(--primary)",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
        }}>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
    )
}

function Pill({ label, value, color }) {
    return (
        <div style={{
            background: "var(--surface2)",
            border: `1px solid ${color}`,
            borderRadius: 999,
            padding: "6px 16px",
            display: "flex",
            gap: 8,
            alignItems: "center",
        }}>
            <span style={{ fontSize: 16, fontWeight: 700, color }}>{value}</span>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{label}</span>
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

const cardBox = {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    padding: "36px",
    width: "100%",
    maxWidth: 500,
    display: "flex",
    flexDirection: "column",
}

const primaryBtn = {
    background: "var(--primary)",
    color: "#fff",
    padding: "12px 20px",
    borderRadius: 8,
    fontWeight: 700,
    fontSize: 14,
    border: "none",
    cursor: "pointer",
}

const ghostBtn = {
    background: "var(--surface2)",
    color: "var(--text-muted)",
    padding: "12px 20px",
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 14,
    border: "1px solid var(--border)",
    cursor: "pointer",
}

const modalLabel = {
    fontSize: 12,
    color: "var(--text-muted)",
    display: "block",
    marginBottom: 6,
    fontWeight: 600,
}

const modalTextarea = {
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
