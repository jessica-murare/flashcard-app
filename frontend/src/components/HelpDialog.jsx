import { useEffect, useState } from "react"

export default function HelpDialog({
  title,
  description,
  steps = [],
  tips = [],
  triggerLabel = "How to use",
  storageKey,
  autoOpen = false,
  compact = false,
}) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!autoOpen || !storageKey) return
    const seen = localStorage.getItem(storageKey)
    if (seen) return

    setOpen(true)
    localStorage.setItem(storageKey, "seen")
  }, [autoOpen, storageKey])

  const triggerStyle = compact
    ? {
        width: 30,
        height: 30,
        borderRadius: 999,
        background: "var(--surface2)",
        color: "var(--text-muted)",
        border: "1px solid var(--border)",
        fontSize: 14,
        fontWeight: 700,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }
    : {
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        background: "var(--surface2)",
        color: "var(--text-muted)",
        border: "1px solid var(--border)",
        borderRadius: 999,
        padding: "8px 14px",
        fontSize: 13,
        fontWeight: 600,
      }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} style={triggerStyle}>
        {compact ? "?" : "?"} {!compact && triggerLabel}
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "var(--overlay)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 560,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 18,
              padding: 28,
              boxShadow: "0 28px 80px rgba(0, 0, 0, 0.35)",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--primary)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>
                  Quick Guide
                </div>
                <h2 style={{ fontSize: 24, fontWeight: 800, lineHeight: 1.2 }}>{title}</h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 999,
                  background: "var(--surface2)",
                  color: "var(--text-muted)",
                  border: "1px solid var(--border)",
                  fontSize: 18,
                }}
              >
                ×
              </button>
            </div>

            {description && (
              <p style={{ color: "var(--text-muted)", fontSize: 14, lineHeight: 1.7, marginBottom: steps.length ? 18 : 0 }}>
                {description}
              </p>
            )}

            {steps.length > 0 && (
              <div style={{ marginBottom: tips.length ? 18 : 0 }}>
                <div style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
                  Steps
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {steps.map((step, index) => (
                    <div
                      key={`${title}-step-${index}`}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 12,
                        background: "var(--surface2)",
                        border: "1px solid var(--border)",
                        borderRadius: 12,
                        padding: "12px 14px",
                      }}
                    >
                      <div style={{
                        minWidth: 28,
                        height: 28,
                        borderRadius: 999,
                        background: "rgba(124,106,247,0.18)",
                        color: "var(--primary)",
                        fontSize: 12,
                        fontWeight: 800,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}>
                        {index + 1}
                      </div>
                      <p style={{ fontSize: 14, lineHeight: 1.6 }}>{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tips.length > 0 && (
              <div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
                  Helpful Tips
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {tips.map((tip, index) => (
                    <div
                      key={`${title}-tip-${index}`}
                      style={{
                        background: "#1e1b4b",
                        border: "1px solid #7c6af766",
                        color: "var(--text)",
                        borderRadius: 12,
                        padding: "11px 14px",
                        fontSize: 13,
                        lineHeight: 1.6,
                      }}
                    >
                      {tip}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
