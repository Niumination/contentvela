import { NavLink, Outlet } from 'react-router-dom'
import { useContentStore } from './store'
import { Button } from './components'

const NAV = [
  { to: '/', label: 'Dashboard', icon: '◈', end: true },
  { to: '/ideas', label: 'Ideas', icon: '◇' },
  { to: '/drafts', label: 'Drafts', icon: '✎' },
  { to: '/publish', label: 'Publish', icon: '⇪' },
  { to: '/analytics', label: 'Analytics', icon: '◑' },
]

export default function Layout() {
  const resetToSeed = useContentStore((s) => s.resetToSeed)

  return (
    <div className="flex min-h-full">
      <aside className="flex w-56 shrink-0 flex-col border-r border-ink-700/70 bg-ink-800/40">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-vela-500 text-lg font-bold text-ink-900">
            ⛵
          </span>
          <div className="leading-tight">
            <div className="text-sm font-semibold text-ink-300">contentvela</div>
            <div className="text-[10px] tracking-wide text-ink-600 uppercase">
              creator workspace
            </div>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? 'bg-vela-600/15 text-vela-300'
                    : 'text-ink-400 hover:bg-ink-700/40 hover:text-ink-300'
                }`
              }
            >
              <span className="w-4 text-center opacity-70">{n.icon}</span>
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-ink-700/70 p-3">
          <Button variant="subtle" size="sm" onClick={resetToSeed}>
            Reset data contoh
          </Button>
          <p className="mt-2 text-[10px] leading-relaxed text-ink-600">
            Data tersimpan lokal di browser (localStorage). Tidak ada server.
          </p>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-6xl px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}