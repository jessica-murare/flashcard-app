import { useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"

const FEATURES = [
  {
    emoji: "🧠",
    title: "FSRS Algorithm",
    desc: "2026 industry-standard spaced repetition. Predicts exactly when you'll forget — and shows up right before you do.",
    color: "#7c6af7",
  },
  {
    emoji: "⚡",
    title: "5 Study Modes",
    desc: "Quick Quiz, Deep Understanding, Exam Crammer, Teach Me, or Mixed. Different goals need different cards.",
    color: "#facc15",
  },
  {
    emoji: "🤖",
    title: "AI-Powered Cards",
    desc: "Groq Llama 3.3 70B generates cards like a great teacher — concepts, definitions, edge cases, worked examples.",
    color: "#60a5fa",
  },
  {
    emoji: "📊",
    title: "Mastery Tracking",
    desc: "See exactly what you've mastered, what's shaky, and what's coming up for review. Progress that motivates.",
    color: "#4ade80",
  },
  {
    emoji: "🎯",
    title: "Active Recall",
    desc: "Flip cards, rate yourself, get AI explanations on demand. The most effective study technique, made effortless.",
    color: "#f87171",
  },
  {
    emoji: "🔥",
    title: "Streaks & XP",
    desc: "Daily goals, streaks, levels, and confetti. Studying shouldn't be boring — FlashMind makes sure it isn't.",
    color: "#fb923c",
  },
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
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handler)
    return () => window.removeEventListener("scroll", handler)
  }, [])

  return (
    <div style={{ background: "var(--bg)", color: "var(--text)", overflowX: "hidden" }}>

      {/* ── navbar ── */}
      <nav style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        padding: "0 40px",
        height: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: scrolled ? "rgba(15,15,19,0.95)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled ? "1px solid var(--border)" : "none",
        transition: "all 0.3s ease",
      }}>
        <span style={{ fontWeight: 900, fontSize: 22, color: "var(--primary)" }}>
          ⚡ FlashMind
        </span>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button
            onClick={() => navigate("/dashboard")}
            style={{
              background: "none",
              color: "var(--text-muted)",
              fontSize: 14,
              fontWeight: 600,
              padding: "8px 16px",
              borderRadius: 8,
              border: "1px solid var(--border)",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = "var(--primary)"
              e.currentTarget.style.color = "var(--primary)"
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = "var(--border)"
              e.currentTarget.style.color = "var(--text-muted)"
            }}
          >
            Dashboard
          </button>
          <button
            onClick={() => navigate("/upload")}
            style={{
              background: "var(--primary)",
              color: "#fff",
              fontSize: 14,
              fontWeight: 700,
              padding: "9px 20px",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              transition: "background 0.2s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--primary-hover)"}
            onMouseLeave={e => e.currentTarget.style.background = "var(--primary)"}
          >
            Get Started →
          </button>
        </div>
      </nav>

      {/* ── hero ── */}
      <section style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "100px 24px 60px",
        position: "relative",
      }}>
        {/* background glow */}
        <div style={{
          position: "absolute",
          top: "30%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(124,106,247,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* badge */}
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          background: "rgba(124,106,247,0.1)",
          border: "1px solid rgba(124,106,247,0.3)",
          borderRadius: 999,
          padding: "6px 16px",
          fontSize: 13,
          color: "var(--primary)",
          fontWeight: 600,
          marginBottom: 28,
        }}>
          <span>✨</span>
          Built on cognitive science · FSRS 2026
        </div>

        {/* headline */}
        <h1 style={{
          fontSize: "clamp(36px, 6vw, 72px)",
          fontWeight: 900,
          lineHeight: 1.1,
          marginBottom: 20,
          maxWidth: 800,
        }}>
          Turn any PDF into a{" "}
          <span style={{
            background: "linear-gradient(135deg, var(--primary), #60a5fa)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            smart study deck
          </span>
        </h1>

        {/* subheadline */}
        <p style={{
          fontSize: "clamp(16px, 2vw, 20px)",
          color: "var(--text-muted)",
          maxWidth: 560,
          lineHeight: 1.7,
          marginBottom: 40,
        }}>
          AI-generated flashcards + FSRS spaced repetition + active recall.
          The most effective study techniques — finally in one place.
        </p>

        {/* CTAs */}
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center", marginBottom: 60 }}>
          <button
            onClick={() => navigate("/upload")}
            style={{
              background: "var(--primary)",
              color: "#fff",
              padding: "15px 32px",
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 16,
              border: "none",
              cursor: "pointer",
              boxShadow: "0 0 32px rgba(124,106,247,0.3)",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "var(--primary-hover)"
              e.currentTarget.style.transform = "translateY(-2px)"
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "var(--primary)"
              e.currentTarget.style.transform = "translateY(0)"
            }}
          >
            Upload your first PDF →
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            style={{
              background: "var(--surface)",
              color: "var(--text)",
              padding: "15px 32px",
              borderRadius: 10,
              fontWeight: 600,
              fontSize: 16,
              border: "1px solid var(--border)",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "var(--primary)"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
          >
            View Dashboard
          </button>
        </div>

        {/* stats row */}
        <div style={{
          display: "flex",
          gap: 0,
          flexWrap: "wrap",
          justifyContent: "center",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 16,
          overflow: "hidden",
          maxWidth: 700,
          width: "100%",
        }}>
          {STATS.map((s, i) => (
            <div key={i} style={{
              flex: 1,
              minWidth: 140,
              padding: "20px 16px",
              textAlign: "center",
              borderRight: i < STATS.length - 1 ? "1px solid var(--border)" : "none",
            }}>
              <div style={{ fontSize: 26, fontWeight: 900, color: "var(--primary)" }}>
                {s.value}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4, lineHeight: 1.4 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── how it works ── */}
      <section style={{ padding: "80px 24px", maxWidth: 900, margin: "0 auto" }}>
        <SectionLabel>How it works</SectionLabel>
        <h2 style={sectionTitle}>From PDF to mastery in 4 steps</h2>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 20,
          marginTop: 48,
        }}>
          {STEPS.map((step, i) => (
            <div key={i} style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 14,
              padding: "28px 24px",
              position: "relative",
              transition: "border-color 0.2s, transform 0.2s",
            }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = "var(--primary)"
                e.currentTarget.style.transform = "translateY(-4px)"
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = "var(--border)"
                e.currentTarget.style.transform = "translateY(0)"
              }}
            >
              <div style={{
                fontSize: 13,
                fontWeight: 900,
                color: "var(--primary)",
                letterSpacing: 2,
                marginBottom: 12,
              }}>
                {step.n}
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>
                {step.title}
              </h3>
              <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── features ── */}
      <section style={{
        padding: "80px 24px",
        background: "var(--surface)",
        borderTop: "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
      }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <SectionLabel>Features</SectionLabel>
          <h2 style={sectionTitle}>Everything you need to actually learn</h2>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 20,
            marginTop: 48,
          }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{
                background: "var(--bg)",
                border: "1px solid var(--border)",
                borderRadius: 14,
                padding: "28px 24px",
                transition: "border-color 0.2s, transform 0.2s",
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = f.color
                  e.currentTarget.style.transform = "translateY(-3px)"
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = "var(--border)"
                  e.currentTarget.style.transform = "translateY(0)"
                }}
              >
                <div style={{
                  fontSize: 32,
                  marginBottom: 14,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 56,
                  height: 56,
                  borderRadius: 14,
                  background: `${f.color}15`,
                  border: `1px solid ${f.color}30`,
                }}>
                  {f.emoji}
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: f.color }}>
                  {f.title}
                </h3>
                <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.7 }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── science section ── */}
      <section style={{ padding: "80px 24px", maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
        <SectionLabel>The Science</SectionLabel>
        <h2 style={{ ...sectionTitle, marginBottom: 16 }}>
          Built on what actually works
        </h2>
        <p style={{ color: "var(--text-muted)", fontSize: 16, lineHeight: 1.8, marginBottom: 40 }}>
          Spaced repetition and active recall are the two most effective study techniques
          known to cognitive science — consistently outperforming passive re-reading,
          highlighting, and summarization. FlashMind combines both with the FSRS algorithm,
          the 2026 gold standard that models your personal memory to schedule reviews
          at the exact moment before you forget.
        </p>

        <div style={{
          display: "flex",
          gap: 16,
          justifyContent: "center",
          flexWrap: "wrap",
        }}>
          {[
            { label: "Spaced Repetition", desc: "Reviews spaced over time beat cramming by 200%", color: "#7c6af7" },
            { label: "Active Recall", desc: "Testing yourself beats re-reading by 50%", color: "#4ade80" },
            { label: "FSRS Algorithm", desc: "Personalized scheduling beats fixed intervals", color: "#60a5fa" },
          ].map((s, i) => (
            <div key={i} style={{
              background: "var(--surface)",
              border: `1px solid ${s.color}40`,
              borderRadius: 12,
              padding: "20px 24px",
              maxWidth: 220,
              textAlign: "left",
            }}>
              <div style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: s.color,
                marginBottom: 10,
              }} />
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── final CTA ── */}
      <section style={{
        padding: "80px 24px",
        textAlign: "center",
        background: "var(--surface)",
        borderTop: "1px solid var(--border)",
      }}>
        <div style={{
          maxWidth: 560,
          margin: "0 auto",
        }}>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 900, marginBottom: 16 }}>
            Ready to study smarter?
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: 16, marginBottom: 36, lineHeight: 1.7 }}>
            Drop in a PDF. Get a smart deck in 30 seconds.
            Your future self will thank you.
          </p>
          <button
            onClick={() => navigate("/upload")}
            style={{
              background: "var(--primary)",
              color: "#fff",
              padding: "16px 40px",
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 17,
              border: "none",
              cursor: "pointer",
              boxShadow: "0 0 40px rgba(124,106,247,0.25)",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = "translateY(-2px)"
              e.currentTarget.style.boxShadow = "0 0 50px rgba(124,106,247,0.4)"
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = "translateY(0)"
              e.currentTarget.style.boxShadow = "0 0 40px rgba(124,106,247,0.25)"
            }}
          >
            Upload your first PDF →
          </button>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 16 }}>
            Free · No signup required · Works on any PDF
          </p>
        </div>
      </section>

      {/* ── footer ── */}
      <footer style={{
        padding: "24px 40px",
        borderTop: "1px solid var(--border)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 12,
      }}>
        <span style={{ fontWeight: 800, color: "var(--primary)", fontSize: 16 }}>
          ⚡ FlashMind
        </span>
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
          Built with FSRS · Groq Llama 3.3 70B · React · FastAPI
        </span>
      </footer>

    </div>
  )
}

function SectionLabel({ children }) {
  return (
    <div style={{
      display: "inline-block",
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: 2,
      textTransform: "uppercase",
      color: "var(--primary)",
      marginBottom: 12,
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