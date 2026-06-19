import { Routes, Route } from 'react-router-dom'
import NavBar from './components/NavBar'
import AlertToasts from './components/AlertToasts'
import Dashboard from './pages/Dashboard'
import Lots from './pages/Lots'
import LotDetail from './pages/LotDetail'
import Alertes from './pages/Alertes'
import Automatisation from './pages/Automatisation'

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
          <Route path="/automatisation" element={<Automatisation />} />
        </Routes>
      </main>
      <AlertToasts />
    </div>
  )
}
