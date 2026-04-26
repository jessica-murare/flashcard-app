import { useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { uploadPDF, detectSubject } from "../api.js"

const MODES = [
  {
    id: "mixed",
    emoji: "🎯",
    label: "Mixed",
    desc: "Balanced mix of all card types. Best for general studying.",
    color: "#7c6af7",
  },
  {
    id: "quick_quiz",
    emoji: "⚡",
    label: "Quick Quiz",
    desc: "Short punchy Q&A. One word / one line answers. Great for facts.",
    color: "#facc15",
  },
  {
    id: "deep_understanding",
    emoji: "🧠",
    label: "Deep Understanding",
    desc: "Why & how questions with full explanations and analogies.",
    color: "#60a5fa",
  },
  {
    id: "exam_crammer",
    emoji: "🔥",
    label: "Exam Crammer",
    desc: "Tricky questions, common mistakes, edge cases. High pressure.",
    color: "#f87171",
  },
  {
    id: "teach_me",
    emoji: "🌱",
    label: "Teach Me",
    desc: "Beginner friendly. Simple language, everyday analogies.",
    color: "#4ade80",
  },
]

export default function Upload() {
  const [file, setFile] = useState(null)
  const [deckName, setDeckName] = useState("")
  const [mode, setMode] = useState("mixed")
  const [dragging, setDragging] = useState(false)
  const [status, setStatus] = useState("idle")
  const [errorMsg, setErrorMsg] = useState("")
  const [result, setResult] = useState(null)
  const [detecting, setDetecting] = useState(false)
  const [detected, setDetected] = useState(null)
  const fileRef = useRef()
  const navigate = useNavigate()

  const handleFile = async (f) => {
    if (!f || !f.name.endsWith(".pdf")) {
      setErrorMsg("Only PDF files are supported.")
      return
    }
    setFile(f)
    setErrorMsg("")
    if (!deckName) setDeckName(f.name.replace(".pdf", ""))

    // auto detect subject
    setDetecting(true)
    try {
      const fd = new FormData()
      fd.append("file", f)
      const res = await detectSubject(fd)
      setDetected(res.data)
      if (!deckName) {
        setDeckName(res.data.suggested_name || f.name.replace(".pdf", ""))
      }
      // auto-select recommended mode
      if (res.data.recommended_mode) {
        setMode(res.data.recommended_mode)
      }
    } catch {
      // silently fail
    } finally {
      setDetecting(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  const handleSubmit = async () => {
    if (!file) return setErrorMsg("Please select a PDF.")
    if (!deckName.trim()) return setErrorMsg("Please enter a deck name.")

    setStatus("uploading")
    setErrorMsg("")

    const formData = new FormData()
    formData.append("file", file)
    formData.append("deck_name", deckName.trim())
    formData.append("mode", mode)

    try {
      const res = await uploadPDF(formData)
      setResult(res.data)
      setStatus("done")
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || "Upload failed. Try again.")
      setStatus("error")
    }
  }

  // ── done ──────────────────────────────────────
  if (status === "done" && result) {
    const modeInfo = MODES.find(m => m.id === result.mode) || MODES[0]
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <div style={{ fontSize: 52, textAlign: "center", marginBottom: 12 }}>🎉</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, textAlign: "center", marginBottom: 8 }}>
            Deck Created!
          </h2>
          <p style={{ color: "var(--text-muted)", textAlign: "center", marginBottom: 8 }}>
            Generated{" "}
            <strong style={{ color: "var(--primary)" }}>
              {result.cards_generated} flashcards
            </strong>{" "}
            in{" "}
            <strong style={{ color: modeInfo.color }}>
              {modeInfo.emoji} {modeInfo.label}
            </strong>{" "}
            mode.
          </p>
          <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
            <button onClick={() => navigate(`/review/${result.deck_id}`)} style={primaryBtn}>
              Study Now →
            </button>
            <button onClick={() => navigate("/")} style={secondaryBtn}>
              Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── uploading ─────────────────────────────────
  if (status === "uploading") {
    const modeInfo = MODES.find(m => m.id === mode) || MODES[0]
    return (
      <div style={pageStyle}>
        <div style={{ ...cardStyle, alignItems: "center", gap: 20 }}>
          <Spinner />
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Generating flashcards...</h2>
          <div style={{
            background: "var(--surface2)",
            border: `1px solid ${modeInfo.color}44`,
            borderRadius: 8,
            padding: "10px 18px",
            fontSize: 13,
            color: modeInfo.color,
          }}>
            {modeInfo.emoji} {modeInfo.label} mode
          </div>
          <p style={{ color: "var(--text-muted)", textAlign: "center", fontSize: 13 }}>
            Reading your PDF and crafting cards with AI.<br />
            Takes 15–40 seconds depending on length.
          </p>
        </div>
      </div>
    )
  }

  // ── main form ─────────────────────────────────
  return (
    <div style={pageStyle}>
      <div style={{ ...cardStyle, maxWidth: 600 }}>

        <button
          onClick={() => navigate("/")}
          style={{ background: "none", color: "var(--text-muted)", fontSize: 14, marginBottom: 24, padding: 0, cursor: "pointer" }}
        >
          ← Back to Dashboard
        </button>

        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Upload a PDF</h1>
        <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 24 }}>
          Drop in any study material — we'll generate smart flashcards automatically.
        </p>

        {/* drop zone */}
        <div
          onClick={() => fileRef.current.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${dragging ? "var(--primary)" : file ? "#4ade80" : "var(--border)"}`,
            borderRadius: "var(--radius)",
            padding: "32px 24px",
            textAlign: "center",
            cursor: "pointer",
            background: dragging ? "rgba(124,106,247,0.05)" : "var(--surface2)",
            transition: "all 0.2s",
            marginBottom: 16,
          }}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".pdf"
            style={{ display: "none" }}
            onChange={e => handleFile(e.target.files[0])}
          />
          <div style={{ fontSize: 32, marginBottom: 8 }}>
            {file ? "✅" : "📄"}
          </div>
          <p style={{ fontWeight: 600, marginBottom: 4 }}>
            {file ? file.name : "Click or drag a PDF here"}
          </p>
          <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {file
              ? `${(file.size / 1024 / 1024).toFixed(2)} MB`
              : "Max 20MB · PDF only"}
          </p>
        </div>

        {/* auto detect result */}
        {detecting && (
          <div style={{
            background: "var(--surface2)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: "10px 16px",
            fontSize: 13,
            color: "var(--text-muted)",
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}>
            <Spinner small /> Analyzing your PDF...
          </div>
        )}

        {detected && !detecting && (
          <div style={{
            background: "#1e1b4b",
            border: "1px solid #7c6af766",
            borderRadius: 8,
            padding: "12px 16px",
            fontSize: 13,
            marginBottom: 16,
            display: "flex",
            gap: 12,
            alignItems: "center",
            flexWrap: "wrap",
          }}>
            <span style={{ fontSize: 24 }}>{detected.emoji}</span>
            <div>
              <span style={{ color: "var(--primary)", fontWeight: 700 }}>
                {detected.subject}
              </span>
              <span style={{ color: "var(--text-muted)", marginLeft: 8 }}>
                {detected.difficulty}
              </span>
            </div>
            <span style={{ color: "var(--text-muted)", fontSize: 12, marginLeft: "auto" }}>
              Recommended: {MODES.find(m => m.id === detected.recommended_mode)?.label}
            </span>
          </div>
        )}

        {/* deck name */}
        <label style={{ fontSize: 13, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
          Deck Name
        </label>
        <input
          type="text"
          value={deckName}
          onChange={e => setDeckName(e.target.value)}
          placeholder="e.g. Chapter 5 — Thermodynamics"
          style={{
            width: "100%",
            padding: "12px 16px",
            borderRadius: 8,
            background: "var(--surface2)",
            border: "1.5px solid var(--border)",
            color: "var(--text)",
            fontSize: 15,
            marginBottom: 24,
            outline: "none",
          }}
          onFocus={e => e.target.style.borderColor = "var(--primary)"}
          onBlur={e => e.target.style.borderColor = "var(--border)"}
        />

        {/* mode selector */}
        <label style={{ fontSize: 13, color: "var(--text-muted)", display: "block", marginBottom: 10 }}>
          Study Mode
        </label>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
          {MODES.map(m => (
            <div
              key={m.id}
              onClick={() => setMode(m.id)}
              style={{
                border: `1.5px solid ${mode === m.id ? m.color : "var(--border)"}`,
                background: mode === m.id ? `${m.color}11` : "var(--surface2)",
                borderRadius: 10,
                padding: "12px 16px",
                cursor: "pointer",
                transition: "all 0.15s",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <span style={{ fontSize: 22 }}>{m.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontWeight: 700,
                  fontSize: 14,
                  color: mode === m.id ? m.color : "var(--text)",
                }}>
                  {m.label}
                  {detected?.recommended_mode === m.id && (
                    <span style={{
                      marginLeft: 8,
                      fontSize: 10,
                      background: m.color,
                      color: "#000",
                      padding: "2px 6px",
                      borderRadius: 999,
                      fontWeight: 700,
                    }}>
                      RECOMMENDED
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                  {m.desc}
                </div>
              </div>
              {mode === m.id && (
                <div style={{
                  width: 18, height: 18,
                  borderRadius: "50%",
                  background: m.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  color: "#000",
                  fontWeight: 900,
                  flexShrink: 0,
                }}>
                  ✓
                </div>
              )}
            </div>
          ))}
        </div>

        {/* error */}
        {errorMsg && (
          <div style={{
            background: "#2d1a1a",
            border: "1px solid #f87171",
            color: "#f87171",
            padding: "12px 16px",
            borderRadius: 8,
            fontSize: 14,
            marginBottom: 16,
          }}>
            {errorMsg}
          </div>
        )}

        {/* submit */}
        <button
          onClick={handleSubmit}
          disabled={!file || !deckName.trim() || detecting}
          style={{
            ...primaryBtn,
            width: "100%",
            opacity: (!file || !deckName.trim() || detecting) ? 0.5 : 1,
            cursor: (!file || !deckName.trim() || detecting) ? "not-allowed" : "pointer",
          }}
        >
          Generate Flashcards
        </button>

      </div>
    </div>
  )
}

function Spinner({ small }) {
  const size = small ? 16 : 40
  const border = small ? 2 : 3
  return (
    <div style={{
      width: size, height: size,
      border: `${border}px solid var(--border)`,
      borderTop: `${border}px solid var(--primary)`,
      borderRadius: "50%",
      animation: "spin 0.8s linear infinite",
      flexShrink: 0,
    }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

const pageStyle = {
  minHeight: "100vh",
  background: "var(--bg)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "24px",
}

const cardStyle = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius)",
  padding: "40px",
  width: "100%",
  maxWidth: 520,
  display: "flex",
  flexDirection: "column",
}

const primaryBtn = {
  background: "var(--primary)",
  color: "#000",
  padding: "13px 24px",
  fontWeight: 800,
  fontSize: 15,
  border: "none",
  cursor: "pointer",
  boxShadow: "0 4px 14px rgba(249, 168, 37, 0.4)",
}

const secondaryBtn = {
  background: "var(--surface2)",
  color: "var(--text-muted)",
  padding: "13px 24px",
  fontWeight: 700,
  fontSize: 15,
  border: "1px solid var(--border)",
  cursor: "pointer",
}