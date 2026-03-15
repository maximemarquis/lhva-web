'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const NAV_LINKS = [
  { label: 'Home',      href: '/' },
  { label: 'Scores',    href: '/scores' },
  { label: 'Schedule',  href: '/schedule' },
  { label: 'Standings', href: '/standings' },
  { label: 'Stats',     href: '/stats' },
  { label: 'Teams',     href: '/teams' },
  { label: 'Playoffs',  href: '/playoffs' },
  { label: 'News',      href: '/news' },
]

export function Nav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <nav className="bg-rink-800 border-b-[3px] border-ice sticky top-0 z-50">
      <div className="max-w-[1200px] mx-auto flex items-center h-[58px] px-4 sm:px-6">

        {/* Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-10 flex items-center justify-center">
            <svg viewBox="0 0 36 40" className="w-9 h-10">
              <path d="M18 1L35 8V22C35 31 27 37 18 39C9 37 1 31 1 22V8L18 1Z"
                fill="#0088ce" stroke="#00aaff" strokeWidth="0.8"/>
              <text x="18" y="26" textAnchor="middle" fill="white"
                fontSize="11" fontWeight="900" fontFamily="system-ui">LH</text>
            </svg>
          </div>
          <div className="leading-none">
            <div className="text-[18px] font-black tracking-wide">LHVA</div>
            <div className="text-[10px] text-muted tracking-wide mt-0.5 hidden sm:block">Appalachian Valley Hockey</div>
          </div>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex h-full ml-4 border-l border-white/[0.07] pl-1">
          {NAV_LINKS.map(({ label, href }) => {
            const active = pathname === href
            return (
              <Link key={href} href={href}
                className={`flex items-center px-3 lg:px-4 text-[13px] font-bold uppercase tracking-wider border-b-[3px] -mb-[3px] transition-colors whitespace-nowrap ${
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
          onClick={() => setOpen(o => !o)}
          className="ml-auto md:hidden flex flex-col justify-center items-center w-9 h-9 gap-[5px]"
          aria-label="Toggle menu"
        >
          <span className={`block w-5 h-0.5 bg-white transition-transform duration-200 ${open ? 'translate-y-[7px] rotate-45' : ''}`} />
          <span className={`block w-5 h-0.5 bg-white transition-opacity duration-200 ${open ? 'opacity-0' : ''}`} />
          <span className={`block w-5 h-0.5 bg-white transition-transform duration-200 ${open ? '-translate-y-[7px] -rotate-45' : ''}`} />
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {open && (
        <div className="md:hidden border-t border-white/[0.07] bg-rink-800">
          <div className="px-4 py-2">
            <input type="text" placeholder="Search players, teams…"
              className="w-full bg-rink-700 border border-white/10 rounded text-white text-[13px] px-3 py-2 placeholder:text-dim outline-none focus:border-ice/50 transition-colors" />
          </div>
          {NAV_LINKS.map(({ label, href }) => {
            const active = pathname === href
            return (
              <Link key={href} href={href}
                onClick={() => setOpen(false)}
                className={`flex items-center px-4 py-3 text-[13px] font-bold uppercase tracking-wider border-l-[3px] transition-colors ${
                  active
                    ? 'text-white border-ice bg-white/[0.04]'
                    : 'text-muted border-transparent hover:text-white hover:bg-white/[0.02]'
                }`}>
                {label}
              </Link>
            )
          })}
        </div>
      )}
    </nav>
  )
}
