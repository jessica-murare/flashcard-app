export default function MasteryBar({ progress }) {
  const { total_cards, new_cards, learning_cards, reviewing_cards, struggling_cards, mastered_cards, mastery_percent } = progress

  const segments = [
    { label: "Mastered", count: mastered_cards,   color: "#4ade80" },
    { label: "Reviewing", count: reviewing_cards,  color: "#7c6af7" },
    { label: "Learning",  count: learning_cards,   color: "#60a5fa" },
    { label: "Struggling",count: struggling_cards, color: "#f87171" },
    { label: "New",       count: new_cards,        color: "#2e2e3e" },
  ]

  return (
    <div style={{ width: "100%" }}>

      {/* percent label */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Mastery</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#4ade80" }}>
          {mastery_percent}%
        </span>
      </div>

      {/* segmented bar */}
      <div style={{
        display: "flex",
        height: 10,
        borderRadius: 999,
        overflow: "hidden",
        background: "var(--border)",
        gap: 2,
      }}>
        {segments.map(seg => {
          const pct = total_cards > 0 ? (seg.count / total_cards) * 100 : 0
          if (pct === 0) return null
          return (
            <div
              key={seg.label}
              title={`${seg.label}: ${seg.count}`}
              style={{
                width: `${pct}%`,
                background: seg.color,
                transition: "width 0.6s ease",
                borderRadius: 999,
              }}
            />
          )
        })}
      </div>

      {/* legend */}
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "6px 16px",
        marginTop: 10,
      }}>
        {segments.map(seg => (
          <div key={seg.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{
              width: 8, height: 8,
              borderRadius: "50%",
              background: seg.color,
              flexShrink: 0
            }}/>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              {seg.label} <strong style={{ color: "var(--text)" }}>{seg.count}</strong>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}