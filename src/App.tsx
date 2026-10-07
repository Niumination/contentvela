import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import Layout from './shared/Layout'
import Dashboard from './pages/Dashboard'
import Ideas from './pages/Ideas'
import Drafts from './pages/Drafts'
import Publish from './pages/Publish'
// Recharts is ~450 kB of the bundle; keep it out of the initial payload by
// loading the analytics route lazily.
const Analytics = lazy(() => import('./pages/Analytics'))

export default function App() {
  return (
    <HashRouter>
      <Suspense
        fallback={
          <div className="py-20 text-center text-sm text-ink-600">
            Memuat analytics…
          </div>
        }
      >
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="/ideas" element={<Ideas />} />
            <Route path="/drafts" element={<Drafts />} />
            <Route path="/drafts/:id" element={<Drafts />} />
            <Route path="/publish" element={<Publish />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </HashRouter>
  )
}