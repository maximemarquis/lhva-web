'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const NAV = [
  { section: 'Overview',        items: [
    { label: 'Dashboard',   href: '/admin' },
  ]},
  { section: 'Game Management', items: [
    { label: 'Enter Score', href: '/admin/scores' },
    { label: 'Schedule',    href: '/admin/schedule' },
    { label: 'Playoffs',    href: '/admin/playoffs' },
  ]},
  { section: 'League Data',     items: [
    { label: 'Standings',   href: '/admin/standings' },
    { label: 'Player Stats',href: '/admin/stats' },
    { label: 'Rosters',     href: '/admin/rosters' },
    { label: 'Teams',       href: '/admin/teams' },
  ]},
  { section: 'Content',         items: [
    { label: 'Articles',    href: '/admin/articles' },
    { label: 'Awards',      href: '/admin/awards' },
  ]},
  { section: 'Settings',        items: [
    { label: 'Season Config',href: '/admin/settings' },
    { label: 'Users & Roles',href: '/admin/users' },
  ]},
]

interface Props {
  userEmail: string
}

export function AdminSidebar({ userEmail }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
    router.refresh()
  }

  const initials = userEmail.slice(0, 2).toUpperCase()

  return (
    <div className="w-56 bg-rink-800 border-r border-white/[0.07] flex flex-col shrink-0 min-h-screen">

      {/* Logo */}
      <div className="px-4 py-4 border-b border-white/[0.07] flex items-center gap-2.5">
        <svg viewBox="0 0 30 33" className="w-8 h-9 shrink-0">
          <path d="M15 1L29 7V18C29 25 23 30 15 32C7 30 1 25 1 18V7L15 1Z"
            fill="#0088ce" stroke="#00aaff" strokeWidth="0.8"/>
          <text x="15" y="21" textAnchor="middle" fill="white"
            fontSize="9" fontWeight="900" fontFamily="system-ui">LHVA</text>
        </svg>
        <div>
          <div className="text-[14px] font-black">LHVA Admin</div>
          <div className="text-[10px] text-muted">2025–26 Season</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {NAV.map(group => (
          <div key={group.section} className="mb-1">
            <div className="px-4 py-2 text-[9px] font-black uppercase tracking-[0.14em] text-dim">
              {group.section}
            </div>
            {group.items.map(item => {
              const active = pathname === item.href
              return (
                <Link key={item.href} href={item.href}
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

      {/* User footer */}
      <div className="border-t border-white/[0.07] p-3">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-7 h-7 rounded-full bg-ice flex items-center justify-center text-[11px] font-black shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="text-[12px] font-semibold truncate">{userEmail}</div>
            <div className="text-[10px] text-muted">Administrator</div>
          </div>
        </div>
        <button onClick={handleSignOut}
          className="w-full text-[11px] font-bold uppercase tracking-wider text-dim hover:text-white border border-white/[0.07] hover:border-white/20 rounded py-1.5 transition-colors">
          Sign out
        </button>
      </div>

    </div>
  )
}