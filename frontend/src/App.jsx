import { Routes, Route, Navigate } from "react-router-dom"
import Landing from "./pages/Landing.jsx"
import Dashboard from "./pages/Dashboard.jsx"
import Upload from "./pages/Upload.jsx"
import Review from "./pages/Review.jsx"
import Progress from "./pages/Progress.jsx"

export default function App() {

  return (
    <>
      <Routes>
        <Route path="/"           element={<Landing />} />
        <Route path="/dashboard"  element={<Dashboard />} />
        <Route path="/upload"     element={<Upload />} />
        <Route path="/review/:deckId" element={<Review />} />
        <Route path="/progress/:deckId" element={<Progress />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  )
}
