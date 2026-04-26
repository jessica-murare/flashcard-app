import { useNavigate } from "react-router-dom"
import { useState, useEffect, useRef } from "react"

// ── Dot Grid Canvas Component ──
function DotGrid() {
  const canvasRef = useRef(null)
  const mouseRef = useRef({ x: -999, y: -999 })
  const dotsRef = useRef([])
  const animRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")

    const SPACING = 40
    const INFLUENCE = 380
    const SPRING = 0.06
    const DAMPING = 0.85

    function init() {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      dotsRef.current = []
      const cols = Math.ceil(canvas.width / SPACING)
      const rows = Math.ceil(canvas.height / SPACING)
      for (let r = 0; r <= rows; r++) {
        for (let c = 0; c <= cols; c++) {
          const ox = c * SPACING
          const oy = r * SPACING
          dotsRef.current.push({ originX: ox, originY: oy, x: ox, y: oy, vx: 0, vy: 0 })
        }
      }
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const mouse = mouseRef.current

      for (const dot of dotsRef.current) {
        const dx = dot.x - mouse.x
        const dy = dot.y - mouse.y
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < INFLUENCE && dist > 0) {
          const force = (INFLUENCE - dist) / INFLUENCE
          dot.vx += (dx / dist) * force * 7
          dot.vy += (dy / dist) * force * 7
        }

        dot.vx += (dot.originX - dot.x) * SPRING
        dot.vy += (dot.originY - dot.y) * SPRING
        dot.vx *= DAMPING
        dot.vy *= DAMPING
        dot.x += dot.vx
        dot.y += dot.vy

        const dx2 = dot.x - mouse.x
        const dy2 = dot.y - mouse.y
        const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2)
        const force2 = dist2 < INFLUENCE ? (INFLUENCE - dist2) / INFLUENCE : 0

        if (force2 > 0.01) {
          const r = Math.round(255 * force2 + 255 * (1 - force2))
          const g = Math.round(166 * force2 + 255 * (1 - force2))
          const b = Math.round(35 * force2 + 255 * (1 - force2))
          const a = force2 * 0.85

          ctx.beginPath()
          ctx.arc(dot.x, dot.y, 1.5 + force2 * 3, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(${r},${g},${b},${a})`
          ctx.fill()
        }
      }

      animRef.current = requestAnimationFrame(animate)
    }

    function onMouseMove(e) {
      const rect = canvas.getBoundingClientRect()
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }

    function onMouseLeave() {
      mouseRef.current = { x: -999, y: -999 }
    }

    let resizeTimer
    function onResize() {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(init, 300)
    }

    init()
    animate()

    const section = canvas.parentElement
    section.addEventListener("mousemove", onMouseMove)
    section.addEventListener("mouseleave", onMouseLeave)
    window.addEventListener("resize", onResize)

    return () => {
      cancelAnimationFrame(animRef.current)
      section.removeEventListener("mousemove", onMouseMove)
      section.removeEventListener("mouseleave", onMouseLeave)
      window.removeEventListener("resize", onResize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        display: "block",
      }}
    />
  )
}

// ── Fanned Flashcard Reveal Component ──
const FAN_CARDS = [
  {
    emoji: "🧠",
    label: "FSRS Algorithm",
    desc: "Predicts exactly when you'll forget",
    color: "#7c6af7",
    // stacked rotation → scattered position
    stackRot: -8,
    finalX: "-38vw", finalY: "-12vh", finalRot: -15,
  },
  {
    emoji: "⚡",
    label: "5 Study Modes",
    desc: "Quiz · Deep · Crammer · Teach · Mixed",
    color: "#facc15",
    stackRot: -4,
    finalX: "36vw", finalY: "-18vh", finalRot: 12,
  },
  {
    emoji: "🤖",
    label: "AI Card Generation",
    desc: "Groq Llama 3.3 70B — under 30 seconds",
    color: "#60a5fa",
    stackRot: 0,
    finalX: "-34vw", finalY: "20vh", finalRot: -8,
  },
  {
    emoji: "📊",
    label: "Mastery Tracking",
    desc: "See exactly what's mastered vs shaky",
    color: "#4ade80",
    stackRot: 4,
    finalX: "32vw", finalY: "22vh", finalRot: 10,
  },
  {
    emoji: "🔥",
    label: "Streaks & XP",
    desc: "Daily goals, levels, confetti",
    color: "#fb923c",
    stackRot: 9,
    finalX: "0vw", finalY: "30vh", finalRot: -3,
  },
]

function FanReveal() {
  const [exploded, setExploded] = useState(false)
  const sectionRef = useRef(null)

  useEffect(() => {
    // auto-trigger after 1.2s OR on scroll into view
    const timer = setTimeout(() => setExploded(true), 1200)

    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setExploded(true) },
      { threshold: 0.4 }
    )
    if (sectionRef.current) observer.observe(sectionRef.current)

    return () => {
      clearTimeout(timer)
      observer.disconnect()
    }
  }, [])

  return (
    <section
      ref={sectionRef}
      style={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        background: "var(--bg)",
        borderTop: "1px solid var(--border)",
      }}
    >
      {/* ── headline behind the cards ── */}
      <div style={{
        position: "relative",
        zIndex: 2,
        textAlign: "center",
        pointerEvents: "none",
        userSelect: "none",
      }}>
        <p style={{
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: 3,
          textTransform: "uppercase",
          color: "var(--primary)",
          marginBottom: 16,
          opacity: exploded ? 1 : 0,
          transform: exploded ? "translateY(0)" : "translateY(10px)",
          transition: "opacity 0.6s 0.5s, transform 0.6s 0.5s",
        }}>
          Everything you need
        </p>
        <h2 style={{
          fontSize: "clamp(40px, 7vw, 88px)",
          fontWeight: 900,
          lineHeight: 1.05,
          color: "var(--text)",
          marginBottom: 20,
          opacity: exploded ? 1 : 0,
          transform: exploded ? "translateY(0)" : "translateY(16px)",
          transition: "opacity 0.7s 0.35s, transform 0.7s 0.35s",
        }}>
          study smarter,<br />
          <span style={{
            background: "linear-gradient(135deg, var(--primary), #60a5fa)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            not harder.
          </span>
        </h2>
        <p style={{
          fontSize: 16,
          color: "var(--text-muted)",
          maxWidth: 420,
          margin: "0 auto",
          lineHeight: 1.7,
          opacity: exploded ? 1 : 0,
          transform: exploded ? "translateY(0)" : "translateY(10px)",
          transition: "opacity 0.6s 0.65s, transform 0.6s 0.65s",
        }}>
          Six science-backed tools. One seamless app.
          Watch them fly into place.
        </p>
      </div>

      {/* ── fanned cards ── */}
          <div style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: 0,
              height: 0,
              zIndex: exploded ? 1 : 10,
          }}>
              {FAN_CARDS.map((card, i) => (
                  <div
                      key={i}
                      onClick={() => setExploded(true)}
                      style={{
                          position: "absolute",
                          width: 190,
                          height: 240,
                          borderRadius: 20,
                          background: "var(--surface)",
                          border: `1px solid ${card.color}50`,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 10,
                          padding: 24,
                          cursor: exploded ? "default" : "pointer",
                          // offset by half card size so it centers on the anchor point
                          top: -120,
                          left: -95,
                          transform: exploded
                              ? `translate(${card.finalX}, ${card.finalY}) rotate(${card.finalRot}deg)`
                              : `translate(${i * 4}px, ${i * -3}px) rotate(${card.stackRot}deg)`,
                          transition: exploded
                              ? `transform 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 0.07}s`
                              : "transform 0.3s ease",
                          boxShadow: exploded
                              ? `0 8px 32px ${card.color}20`
                              : "0 20px 60px rgba(0,0,0,0.5)",
                      }}
                  >
                      <div style={{
                          fontSize: 36,
                          width: 64,
                          height: 64,
                          borderRadius: 16,
                          background: `${card.color}15`,
                          border: `1px solid ${card.color}30`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                      }}>
                          {card.emoji}
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: card.color, textAlign: "center" }}>
                          {card.label}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", lineHeight: 1.5 }}>
                          {card.desc}
                      </div>
                  </div>
              ))}
          </div>
      {/* tap hint — only shows before explosion */}
      {!exploded && (
        <div style={{
          position: "absolute",
          bottom: 40,
          left: "50%",
          transform: "translateX(-50%)",
          fontSize: 12,
          color: "var(--text-muted)",
          letterSpacing: 1,
          zIndex: 20,
          animation: "pulse-hint 2s infinite",
        }}>
          ↑ tap to reveal
        </div>
      )}

      <style>{`
        @keyframes pulse-hint {
          0%, 100% { opacity: 0.4; transform: translateX(-50%) translateY(0); }
          50% { opacity: 1; transform: translateX(-50%) translateY(-4px); }
        }
      `}</style>
    </section>
  )
}

// ── data ──
const FEATURES = [
  { emoji: "🧠", title: "FSRS Algorithm", desc: "2026 industry-standard spaced repetition. Predicts exactly when you'll forget — and shows up right before you do.", color: "#7c6af7" },
  { emoji: "⚡", title: "5 Study Modes", desc: "Quick Quiz, Deep Understanding, Exam Crammer, Teach Me, or Mixed. Different goals need different cards.", color: "#facc15" },
  { emoji: "🤖", title: "AI-Powered Cards", desc: "Groq Llama 3.3 70B generates cards like a great teacher — concepts, definitions, edge cases, worked examples.", color: "#60a5fa" },
  { emoji: "📊", title: "Mastery Tracking", desc: "See exactly what you've mastered, what's shaky, and what's coming up for review. Progress that motivates.", color: "#4ade80" },
  { emoji: "🎯", title: "Active Recall", desc: "Flip cards, rate yourself, get AI explanations on demand. The most effective study technique, made effortless.", color: "#f87171" },
  { emoji: "🔥", title: "Streaks & XP", desc: "Daily goals, streaks, levels, and confetti. Studying shouldn't be boring — FlashMind makes sure it isn't.", color: "#fb923c" },
]

const STEPS = [
  { n: "01", title: "Drop a PDF", desc: "Any study material — textbook chapters, class notes, research papers." },
  { n: "02", title: "AI detects & generates", desc: "Subject auto-detected. Smart cards generated in under 30 seconds." },
  { n: "03", title: "Choose your mode", desc: "Quick Quiz for facts. Deep Understanding for concepts. You decide." },
  { n: "04", title: "Study smarter", desc: "FSRS schedules reviews at the perfect moment. Mastery compounds daily." },
]

const STATS = [
  { value: "5x", label: "better retention vs passive reading" },
  { value: "90%", label: "target recall rate (FSRS)" },
  { value: "<30s", label: "PDF to study-ready deck" },
  { value: "5", label: "study modes for any goal" },
]

export default function Landing() {
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || "https://flashmind-backend-be1g.onrender.com"}/`)
      .catch(() => {})
  }, [])

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handler)
    return () => window.removeEventListener("scroll", handler)
  }, [])

  return (
    <div style={{ background: "var(--bg)", color: "var(--text)", overflowX: "hidden" }}>

      {/* ── navbar ── */}
      <nav className="app-nav landing-nav" style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        padding: "0 40px", height: 64,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: scrolled ? "var(--nav-bg)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled ? "1px solid var(--border)" : "none",
        transition: "all 0.3s ease",
      }}>
        <span style={{ fontWeight: 900, fontSize: 22, color: "var(--primary)" }}>⚡ FlashMind</span>
        <div className="nav-actions" style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button onClick={() => navigate("/dashboard")} style={{
            background: "none", color: "var(--text-muted)", fontSize: 14, fontWeight: 600,
            padding: "8px 16px", borderRadius: 8, border: "1px solid var(--border)",
            cursor: "pointer", transition: "all 0.2s",
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--primary)"; e.currentTarget.style.color = "var(--primary)" }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-muted)" }}
          >Dashboard</button>
          <button onClick={() => navigate("/upload")} style={{
            background: "var(--primary)", color: "#fff", fontSize: 14, fontWeight: 700,
            padding: "9px 20px", borderRadius: 8, border: "none", cursor: "pointer", transition: "background 0.2s",
          }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--primary-hover)"}
            onMouseLeave={e => e.currentTarget.style.background = "var(--primary)"}
          >Get Started →</button>
        </div>
      </nav>

      {/* ── hero ── */}
      <section className="landing-hero" style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", textAlign: "center",
        padding: "100px 24px 60px", position: "relative", overflow: "hidden",
      }}>
        <DotGrid />

        <div className="hero-glow" style={{
          position: "absolute", top: "30%", left: "50%",
          transform: "translate(-50%, -50%)", width: 600, height: 600,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(124,106,247,0.12) 0%, transparent 70%)",
          pointerEvents: "none", zIndex: 1,
        }} />

        <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(249,168,37,0.08)", border: "1px solid rgba(249,168,37,0.2)",
            backdropFilter: "blur(12px)",
            borderRadius: 999, padding: "8px 20px", fontSize: 13,
            color: "var(--primary)", fontWeight: 600, marginBottom: 32,
            boxShadow: "0 4px 20px rgba(0,0,0,0.2)"
          }}>
            <span style={{ fontSize: 16 }}>✨</span> FlashMind is built on FSRS 2026
          </div>

          <h1 style={{ fontSize: "clamp(44px, 7vw, 84px)", fontWeight: 900, lineHeight: 1.05, marginBottom: 24, maxWidth: 900, letterSpacing: "-0.03em" }}>
            The AI study engine for <br />
            <span style={{ 
              background: "linear-gradient(135deg, #fff 0%, #8888a8 100%)", 
              WebkitBackgroundClip: "text", 
              WebkitTextFillColor: "transparent" 
            }}>
              top performers
            </span>
          </h1>

          <p style={{ fontSize: "clamp(18px, 2vw, 22px)", color: "var(--text-muted)", maxWidth: 640, lineHeight: 1.6, marginBottom: 48, fontWeight: 400 }}>
            Upload any PDF and get a tailored FSRS study deck in seconds. <br/>
            Stop reading. Start mastering.
          </p>

          <div className="hero-actions" style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center", marginBottom: 20 }}>
            <button onClick={() => navigate("/upload")} style={{
              background: "var(--primary)", color: "#000", padding: "16px 36px",
              borderRadius: 50, fontWeight: 700, fontSize: 16, border: "none",
              cursor: "pointer", transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              boxShadow: "0 8px 24px rgba(249,168,37,0.2)"
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(249,168,37,0.3)" }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(249,168,37,0.2)" }}
            >Start for free →</button>
            <button onClick={() => navigate("/dashboard")} style={{
              background: "rgba(255,255,255,0.05)", color: "var(--text)", padding: "16px 36px",
              borderRadius: 50, fontWeight: 600, fontSize: 16,
              border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer", transition: "all 0.2s",
              backdropFilter: "blur(10px)"
            }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.transform = "translateY(-2px)" }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.transform = "translateY(0)" }}
            >View Dashboard</button>
          </div>
          
          <div style={{ fontSize: 13, color: "var(--text-muted)", opacity: 0.7, marginTop: 12 }}>
            No credit card required
          </div>
        </div>
      </section>

      {/* ── FANNED FLASHCARD REVEAL ── inserted here between hero and how-it-works ── */}
      <FanReveal />

      {/* ── how it works ── */}
<section style={{ padding: "160px 24px", background: "var(--bg)", borderTop: "1px solid var(--border)" }}>
  <style>{`
    .flip-card { perspective: 1200px; }
    .flip-card-inner {
      width: 100%; height: 100%;
      position: relative;
      transform-style: preserve-3d;
      transition: transform 0.8s cubic-bezier(0.23, 1, 0.32, 1);
    }
    .flip-card:hover .flip-card-inner { transform: rotateY(180deg); }
    .flip-card-front, .flip-card-back {
      position: absolute; width: 100%; height: 100%;
      backface-visibility: hidden; border-radius: 24px;
      display: flex; flex-direction: column; justify-content: center; padding: 48px;
    }
    .flip-card-back { 
      transform: rotateY(180deg); 
      background: linear-gradient(135deg, rgba(124,106,247,0.1) 0%, rgba(0,0,0,0) 100%);
      backdrop-filter: blur(10px);
    }

    .step-row { 
      display: flex; 
      align-items: center; 
      gap: 80px; 
      margin-bottom: 120px; 
    }
    .step-row.reverse { flex-direction: row-reverse; }

    @media (max-width: 992px) {
      .step-row, .step-row.reverse { 
        flex-direction: column !important; 
        gap: 40px;
        margin-bottom: 80px;
      }
      .step-text { text-align: center !important; }
      .step-text p { margin: 0 auto !important; }
    }
  `}</style>

  <div style={{ maxWidth: 1100, margin: "0 auto" }}>

    {/* section label */}
    <div style={{ marginBottom: 100, textAlign: "center" }}>
      <div style={{
        fontSize: 14,
        fontWeight: 700,
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        color: "var(--primary)",
        marginBottom: 24,
        opacity: 0.8
      }}>Process</div>

      <h2 style={{
        fontSize: "clamp(48px, 6vw, 84px)",
        fontWeight: 900,
        lineHeight: 1,
        letterSpacing: "-0.04em"
      }}>
        From PDF to mastery<br />in 4 simple steps
      </h2>
    </div>

    {/* ── Step 1 ── */}
    <div className="step-row">
      <div className="step-text" style={{ flex: 1.2 }}>
        <div style={{ fontSize: 100, fontWeight: 900, lineHeight: 1, color: "var(--primary)", marginBottom: 20, opacity: 0.2 }}>01</div>
        <h3 style={{ fontSize: 42, fontWeight: 800, marginBottom: 20, letterSpacing: "-0.02em" }}>Drop a PDF</h3>
        <p style={{ fontSize: 20, color: "var(--text-muted)", lineHeight: 1.6, maxWidth: 440 }}>
          Any study material works—textbook chapters, class notes, or research papers. Simply drag and drop.
        </p>
      </div>

      <div className="flip-card" style={{ flex: 1, height: 320 }}>
        <div className="flip-card-inner">
          <div className="flip-card-front" style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}>
            <div style={{ fontSize: 64, marginBottom: 20 }}>📄</div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>Upload Material</div>
            <div style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 12, opacity: 0.6 }}>Hover to reveal →</div>
          </div>
          <div className="flip-card-back" style={{ border: "1px solid var(--primary-muted)" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--primary)", marginBottom: 16 }}>QUICK START</div>
            <p style={{ fontSize: 18, color: "var(--text)", lineHeight: 1.6 }}>
              Our engine parses complex layouts instantly, ensuring no diagram or definition is left behind.
            </p>
          </div>
        </div>
      </div>
    </div>

    {/* ── Step 2 ── */}
    <div className="step-row reverse">
      <div className="step-text" style={{ flex: 1.2, textAlign: "right" }}>
        <div style={{ fontSize: 100, fontWeight: 900, lineHeight: 1, color: "#60a5fa", marginBottom: 20, opacity: 0.2 }}>02</div>
        <h3 style={{ fontSize: 42, fontWeight: 800, marginBottom: 20, letterSpacing: "-0.02em" }}>AI Generation</h3>
        <p style={{ fontSize: 20, color: "var(--text-muted)", lineHeight: 1.6, maxWidth: 440, marginLeft: "auto" }}>
          FlashMind identifies core concepts and converts them into high-retention active recall cards.
        </p>
      </div>

      <div className="flip-card" style={{ flex: 1, height: 320 }}>
        <div className="flip-card-inner">
          <div className="flip-card-front" style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}>
            <div style={{ fontSize: 64 }}>🤖</div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>Smart Detection</div>
          </div>
          <div className="flip-card-back" style={{ border: "1px solid rgba(96, 165, 250, 0.4)" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#60a5fa", marginBottom: 16 }}>ANALYSIS</div>
            <p style={{ fontSize: 18, color: "var(--text)", lineHeight: 1.6 }}>
              Advanced NLP extracts definitions, formulas, and context automatically.
            </p>
          </div>
        </div>
      </div>
    </div>

    {/* ── Step 3 ── */}
    <div className="step-row">
      <div className="step-text" style={{ flex: 1.2 }}>
        <div style={{ fontSize: 100, fontWeight: 900, lineHeight: 1, color: "#4ade80", marginBottom: 20, opacity: 0.2 }}>03</div>
        <h3 style={{ fontSize: 42, fontWeight: 800, marginBottom: 20, letterSpacing: "-0.02em" }}>Choose Mode</h3>
        <p style={{ fontSize: 20, color: "var(--text-muted)", lineHeight: 1.6, maxWidth: 440 }}>
          Toggle between Speed Review, Deep Dive, or Exam Simulation to match your schedule.
        </p>
      </div>

      <div className="flip-card" style={{ flex: 1, height: 320 }}>
        <div className="flip-card-inner">
          <div className="flip-card-front" style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}>
            <div style={{ fontSize: 64 }}>⚡</div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>Personalize</div>
          </div>
          <div className="flip-card-back" style={{ border: "1px solid rgba(74, 222, 128, 0.4)" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#4ade80", marginBottom: 16 }}>ADAPTIVE</div>
            <p style={{ fontSize: 18, color: "var(--text)", lineHeight: 1.6 }}>
              Custom algorithms tailor the difficulty based on your previous performance.
            </p>
          </div>
        </div>
      </div>
    </div>

    {/* ── Step 4 ── */}
    <div className="step-row reverse">
      <div className="step-text" style={{ flex: 1.2, textAlign: "right" }}>
        <div style={{ fontSize: 100, fontWeight: 900, lineHeight: 1, color: "#fb923c", marginBottom: 20, opacity: 0.2 }}>04</div>
        <h3 style={{ fontSize: 42, fontWeight: 800, marginBottom: 20, letterSpacing: "-0.02em" }}>Stay Sharp</h3>
        <p style={{ fontSize: 20, color: "var(--text-muted)", lineHeight: 1.6, maxWidth: 440, marginLeft: "auto" }}>
          Spaced repetition ensures you review just before you forget. Effortless long-term memory.
        </p>
      </div>

      <div className="flip-card" style={{ flex: 1, height: 320 }}>
        <div className="flip-card-inner">
          <div className="flip-card-front" style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}>
            <div style={{ fontSize: 64 }}>🔥</div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>Long-term Mastery</div>
          </div>
          <div className="flip-card-back" style={{ border: "1px solid rgba(251, 146, 60, 0.4)" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#fb923c", marginBottom: 16 }}>RETENTION</div>
            <p style={{ fontSize: 18, color: "var(--text)", lineHeight: 1.6 }}>
              Review sessions are optimized to be shorter and more effective over time.
            </p>
          </div>
        </div>
      </div>
    </div>

  </div>
</section>

      {/* ── science section ── */}
<section className="page-section science-section" style={{ 
  padding: "120px 24px", 
  maxWidth: 1100, 
  margin: "0 auto", 
  position: "relative" 
}}>
  {/* Decorative Background Glow */}
  <div style={{
    position: "absolute",
    top: "20%",
    left: "50%",
    transform: "translateX(-50%)",
    width: "400px",
    height: "400px",
    background: "radial-gradient(circle, rgba(124, 106, 247, 0.08) 0%, transparent 70%)",
    zIndex: -1,
    filter: "blur(60px)"
  }} />

  <div style={{ textAlign: "center", marginBottom: 64 }}>
    <SectionLabel style={{ 
      letterSpacing: "0.2em", 
      textTransform: "uppercase", 
      fontSize: 12, 
      fontWeight: 800,
      color: "#7c6af7"
    }}>
      The Science
    </SectionLabel>
    <h2 style={{ 
      ...sectionTitle, 
      fontSize: "clamp(2rem, 5vw, 3rem)", 
      fontWeight: 850, 
      letterSpacing: "-0.03em",
      marginTop: 16,
      marginBottom: 24 
    }}>
      Built on what <span style={{ color: "var(--text-main)", opacity: 0.8 }}>actually works</span>
    </h2>
    <p style={{ 
      color: "var(--text-muted)", 
      fontSize: 18, 
      lineHeight: 1.6, 
      maxWidth: 600, 
      margin: "0 auto" 
    }}>
      Ditch the highlighter. We use cognitive science to model your brain's unique forgetting curve.
    </p>
  </div>

  <div className="science-grid" style={{ 
    display: "grid", 
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", 
    gap: 24 
  }}>
    {[
      { 
        label: "Spaced Repetition", 
        desc: "Reviews spaced over time beat cramming by 200%.", 
        color: "#7c6af7",
        icon: "↗" 
      },
      { 
        label: "Active Recall", 
        desc: "Testing yourself beats re-reading by 50%. It's a workout for your neurons.", 
        color: "#4ade80",
        icon: "⚡" 
      },
      { 
        label: "FSRS Algorithm", 
        desc: "The 2026 gold standard. Personalized scheduling that evolves as you learn.", 
        color: "#60a5fa",
        icon: "∞" 
      },
    ].map((s, i) => (
      <div key={i} style={{
        background: "rgba(255, 255, 255, 0.03)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: 24, 
        padding: "40px 32px", 
        transition: "transform 0.3s ease, border-color 0.3s ease",
        cursor: "default",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-8px)";
        e.currentTarget.style.borderColor = `${s.color}60`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
      }}>
        <div>
          <div style={{ 
            fontSize: 24, 
            marginBottom: 20, 
            background: `${s.color}20`, 
            width: 48, 
            height: 48, 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            borderRadius: 12,
            color: s.color
          }}>
            {s.icon}
          </div>
          <h3 style={{ fontWeight: 700, fontSize: 20, marginBottom: 12, color: "var(--text-main)" }}>
            {s.label}
          </h3>
          <p style={{ fontSize: 15, color: "var(--text-muted)", lineHeight: 1.6 }}>
            {s.desc}
          </p>
        </div>
      </div>
    ))}
  </div>
</section>

      {/* ── final CTA ── */}
      <section className="page-section final-cta" style={{ padding: "80px 24px", textAlign: "center", background: "var(--surface)", borderTop: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 900, marginBottom: 16 }}>Ready to study smarter?</h2>
          <p style={{ color: "var(--text-muted)", fontSize: 16, marginBottom: 36, lineHeight: 1.7 }}>
            Drop in a PDF. Get a smart deck in 30 seconds. Your future self will thank you.
          </p>
          <button onClick={() => navigate("/upload")} style={{
            background: "var(--primary)", color: "#fff", padding: "16px 40px",
            borderRadius: 10, fontWeight: 700, fontSize: 17, border: "none",
            cursor: "pointer", boxShadow: "0 0 40px rgba(124,106,247,0.25)", transition: "all 0.2s",
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 0 50px rgba(124,106,247,0.4)" }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 0 40px rgba(124,106,247,0.25)" }}
          >Upload your first PDF →</button>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 16 }}>Free · No signup required · Works on any PDF</p>
        </div>
      </section>

      {/* ── footer ── */}
      <footer className="app-footer" style={{
        padding: "24px 40px", borderTop: "1px solid var(--border)",
        display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12,
      }}>
        <span style={{ fontWeight: 800, color: "var(--primary)", fontSize: 16 }}>⚡ FlashMind</span>
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Built with FSRS · Groq Llama 3.3 70B · React · FastAPI</span>
      </footer>

    </div>
  )
}

function SectionLabel({ children }) {
  return (
    <div style={{
      display: "inline-block", fontSize: 12, fontWeight: 700,
      letterSpacing: 2, textTransform: "uppercase", color: "var(--primary)", marginBottom: 12,
    }}>
      {children}
    </div>
  )
}

const sectionTitle = {
  fontSize: "clamp(24px, 3vw, 40px)",
  fontWeight: 900,
  lineHeight: 1.2,
  marginBottom: 8,
}