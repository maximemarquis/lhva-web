'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const NAV_LINKS = [
  { label: 'Home',      href: '/' },
  { label: 'Schedule',  href: '/schedule' },
  { label: 'Standings', href: '/standings' },
  { label: 'Stats',     href: '/stats' },
  { label: 'Teams',     href: '/teams' },
  { label: 'Players',   href: '/players' },
  { label: 'Playoffs',  href: '/playoffs' },
  { label: 'News',      href: '/news' },
]

export function Nav() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className="bg-rink-800 border-b-[3px] border-ice sticky top-0 z-50">
      <div className="max-w-[1200px] mx-auto flex items-center h-[58px] px-4 md:px-6">
        {/* Logo — click to go home */}
        <Link href="/" className="flex items-center gap-3 pr-4 md:pr-7 border-r border-white/[0.07] mr-1 shrink-0 hover:opacity-85 transition-opacity">
          <div className="w-10 h-10 flex items-center justify-center shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="LHVA Logo"
              className="w-10 h-10 object-contain drop-shadow-sm"
            />
          </div>
          <div className="leading-none">
            <div className="text-[18px] font-black tracking-wide">LHVA</div>
            <div className="text-[10px] text-muted tracking-wide mt-0.5 hidden sm:block">Appalachian Valley Hockey</div>
          </div>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex h-full">
          {NAV_LINKS.map(({ label, href }) => {
            const active = pathname === href
            return (
              <Link key={href} href={href}
                className={`flex items-center px-4 text-[13px] font-bold uppercase tracking-wider border-b-[3px] -mb-[3px] transition-colors whitespace-nowrap ${
                  active
                    ? 'text-white border-ice'
                    : 'text-muted border-transparent hover:text-white'
                }`}>
                {label}
              </Link>
            )
          })}
        </div>

        {/* Desktop Search */}
        <div className="ml-auto hidden md:block">
          <input type="text" placeholder="Search players, teams…"
            className="bg-rink-700 border border-white/10 rounded text-white text-[12px] px-3 py-1.5 w-44 placeholder:text-dim outline-none focus:border-ice/50 transition-colors" />
        </div>

        {/* Mobile Hamburger */}
        <button
          className="ml-auto md:hidden p-2 text-muted hover:text-white transition-colors"
          onClick={() => setMenuOpen(v => !v)}
          aria-label="Toggle menu"
        >
          {menuOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-rink-800 border-t border-white/[0.07] px-4 pb-4">
          <div className="flex flex-col">
            {NAV_LINKS.map(({ label, href }) => {
              const active = pathname === href
              return (
                <Link key={href} href={href}
                  onClick={() => setMenuOpen(false)}
                  className={`py-3 text-[14px] font-bold uppercase tracking-wider border-b border-white/[0.05] transition-colors ${
                    active ? 'text-ice-light' : 'text-muted hover:text-white'
                  }`}>
                  {label}
                </Link>
              )
            })}
          </div>
          <div className="mt-3">
            <input type="text" placeholder="Search players, teams…"
              className="bg-rink-700 border border-white/10 rounded text-white text-[13px] px-3 py-2 w-full placeholder:text-dim outline-none focus:border-ice/50 transition-colors" />
          </div>
        </div>
      )}
    </nav>
  )
}
