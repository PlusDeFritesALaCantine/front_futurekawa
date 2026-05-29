import { Routes, Route } from 'react-router-dom'
import NavBar from './components/NavBar.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Lots from './pages/Lots.jsx'
import LotDetail from './pages/LotDetail.jsx'
import Alertes from './pages/Alertes.jsx'

export default function App() {
  return (
    <div className="layout">
      <NavBar />
      <main className="content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/lots" element={<Lots />} />
          <Route path="/lots/:pays/:lotId" element={<LotDetail />} />
          <Route path="/alertes" element={<Alertes />} />
        </Routes>
      </main>
    </div>
  )
}
