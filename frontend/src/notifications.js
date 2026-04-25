export function scheduleDailyReminder() {
  if (!("Notification" in window)) return
  if (Notification.permission !== "granted") return

  // check every 30 minutes if cards are due
  setInterval(async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/decks`
      )
      const decks = await res.json()
      const totalDue = decks.reduce((a, d) => a + d.due_cards, 0)

      if (totalDue > 0) {
        new Notification("⚡ FlashMind — Time to Study!", {
          body: `You have ${totalDue} card${totalDue > 1 ? "s" : ""} due for review. Keep your streak alive!`,
          icon: "/favicon.ico",
          badge: "/favicon.ico",
        })
      }
    } catch {}
  }, 30 * 60 * 1000) // every 30 min
}

export function checkAndNotify(totalDue) {
  if (!("Notification" in window)) return
  if (Notification.permission !== "granted") return
  if (totalDue === 0) return

  const lastNotified = localStorage.getItem("flashmind_last_notified")
  const today = new Date().toISOString().split("T")[0]
  if (lastNotified === today) return  // only once per day

  new Notification("⚡ FlashMind — Cards Due!", {
    body: `${totalDue} card${totalDue > 1 ? "s" : ""} waiting for review today.`,
    icon: "/favicon.ico",
  })
  localStorage.setItem("flashmind_last_notified", today)
}