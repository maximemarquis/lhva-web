'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { AdminRole } from '@/types'

// ── Nav config ─────────────────────────────────────────────
const COMMISSIONER_NAV = [
  { section: 'Overview', items: [
    { label: 'Dashboard',    href: '/admin' },
    { label: 'Activity Log', href: '/admin/activity' },
  ]},
  { section: 'Game Management', items: [
    { label: 'Scores',       href: '/admin/scores' },
    { label: 'Schedule',     href: '/admin/schedule' },
    { label: 'Playoffs',     href: '/admin/playoffs' },
  ]},
  { section: 'League Data', items: [
    { label: 'Standings',    href: '/admin/standings' },
    { label: 'Player Stats', href: '/admin/stats' },
    { label: 'Rosters',      href: '/admin/rosters' },
    { label: 'Teams',        href: '/admin/teams' },
  ]},
  { section: 'Content', items: [
    { label: 'Articles',     href: '/admin/articles' },
    { label: 'Awards',       href: '/admin/awards' },
  ]},
  { section: 'Settings', items: [
    { label: 'Season Config', href: '/admin/settings' },
    { label: 'Users & Roles', href: '/admin/users' },
  ]},
]

const SCOREKEEPER_NAV = [
  { section: 'Game Day', items: [
    { label: 'Games',        href: '/admin/scores' },
  ]},
  { section: 'League', items: [
    { label: 'Standings',    href: '/admin/standings' },
    { label: 'Player Stats', href: '/admin/stats' },
  ]},
]

const TEAM_REP_NAV = [
  { section: 'My Team', items: [
    { label: 'Roster',       href: '/admin/rosters' },
  ]},
  { section: 'League', items: [
    { label: 'Standings',    href: '/admin/standings' },
    { label: 'Schedule',     href: '/admin/schedule' },
    { label: 'Player Stats', href: '/admin/stats' },
  ]},
]

const ROLE_LABEL: Record<string, string> = {
  commissioner: 'Commissioner',
  scorekeeper:  'Scorekeeper',
  team_rep:     'Team Rep',
  readonly:     'Read Only',
}

const ROLE_COLOR: Record<string, string> = {
  commissioner: 'bg-amber-500/15 text-amber-400',
  scorekeeper:  'bg-ice/15 text-ice-light',
  team_rep:     'bg-green-500/15 text-green-400',
  readonly:     'bg-white/5 text-dim',
}

// ── Component ──────────────────────────────────────────────
interface Props {
  userEmail: string
  userName?: string
  role: string
  open?: boolean
  onClose?: () => void
}

export function AdminSidebar({ userEmail, userName, role, open = true, onClose }: Props) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()

  const nav = role === 'commissioner' || role === 'readonly'
    ? COMMISSIONER_NAV
    : role === 'team_rep'
    ? TEAM_REP_NAV
    : SCOREKEEPER_NAV

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
    router.refresh()
  }

  const handleNavClick = () => {
    onClose?.()
  }

  const initials = (userName ?? userEmail).slice(0, 2).toUpperCase()
  const displayName = userName ?? userEmail

  return (
    <>
      {/* Mobile backdrop */}
      {onClose && open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        bg-rink-800 border-r border-white/[0.07] flex flex-col min-h-screen
        fixed inset-y-0 left-0 z-50 w-56 transition-transform duration-200
        md:relative md:translate-x-0 md:shrink-0
        ${open ? 'translate-x-0' : '-translate-x-full'}
      `}>

        {/* Logo */}
        <div className="px-4 py-4 border-b border-white/[0.07] flex items-center gap-2.5">
          <svg viewBox="0 0 30 33" className="w-8 h-9 shrink-0">
            <path d="M15 1L29 7V18C29 25 23 30 15 32C7 30 1 25 1 18V7L15 1Z"
              fill="#0088ce" stroke="#00aaff" strokeWidth="0.8"/>
            <text x="15" y="21" textAnchor="middle" fill="white"
              fontSize="9" fontWeight="900" fontFamily="system-ui">LHVA</text>
          </svg>
          <div className="flex-1 min-w-0">
            <div className="text-[14px] font-black">LHVA Admin</div>
            <div className="text-[10px] text-muted">2025–26 Season</div>
          </div>
          {/* Close button — mobile only */}
          {onClose && (
            <button
              onClick={onClose}
              className="md:hidden p-1 text-muted hover:text-white transition-colors shrink-0"
              aria-label="Close menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Role badge */}
        <div className="px-4 py-2 border-b border-white/[0.07]">
          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-sm ${ROLE_COLOR[role] ?? ROLE_COLOR.readonly}`}>
            {ROLE_LABEL[role] ?? role}
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 overflow-y-auto">
          {nav.map(group => (
            <div key={group.section} className="mb-1">
              <div className="px-4 py-2 text-[9px] font-black uppercase tracking-[0.14em] text-dim">
                {group.section}
              </div>
              {group.items.map(item => {
                const active = pathname === item.href ||
                  (item.href !== '/admin' && pathname.startsWith(item.href))
                return (
                  <Link key={item.href} href={item.href}
                    onClick={handleNavClick}
                    className={`flex items-center gap-2 mx-2 px-3 py-2 rounded text-[12px] font-medium transition-colors ${
                      active
                        ? 'bg-ice/15 text-ice-light'
                        : 'text-muted hover:bg-white/[0.04] hover:text-white'
                    }`}>
                    {item.label}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Scorekeeper game day shortcut */}
        {role === 'scorekeeper' && (
          <div className="px-3 py-3 border-t border-white/[0.07]">
            <Link href="/admin/scores"
              onClick={handleNavClick}
              className="flex items-center justify-center gap-2 w-full bg-green-500/15 hover:bg-green-500/25 text-green-400 border border-green-500/30 rounded-lg py-2.5 text-[12px] font-black transition-colors">
              🏒 Game Day
            </Link>
          </div>
        )}

        {/* User footer */}
        <div className="border-t border-white/[0.07] p-3">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-7 h-7 rounded-full bg-ice flex items-center justify-center text-[11px] font-black shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="text-[12px] font-semibold truncate">{displayName}</div>
              <div className="text-[10px] text-muted truncate">{userName ? userEmail : ''}</div>
            </div>
          </div>
          <button onClick={handleSignOut}
            className="w-full text-[11px] font-bold uppercase tracking-wider text-dim hover:text-white border border-white/[0.07] hover:border-white/20 rounded py-1.5 transition-colors">
            Sign out
          </button>
        </div>

      </div>
    </>
  )
}
