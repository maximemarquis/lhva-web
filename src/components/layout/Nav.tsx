'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_LINKS = [
  { label: 'Home',      href: '/' },
  { label: 'Scores',    href: '/scores' },
  { label: 'Schedule',  href: '/schedule' },
  { label: 'Standings', href: '/standings' },
  { label: 'Stats',     href: '/stats' },
  { label: 'Players',   href: '/players' },
  { label: 'Teams',     href: '/teams' },
  { label: 'Playoffs',  href: '/playoffs' },
  { label: 'News',      href: '/news' },
]

export function Nav() {
  const pathname = usePathname()
  return (
    <nav className="bg-rink-800 border-b-[3px] border-ice sticky top-0 z-50">
      <div className="max-w-[1200px] mx-auto flex items-center h-[58px] px-6">
        <div className="flex items-center gap-3 pr-7 border-r border-white/[0.07] mr-1 shrink-0">
          <svg viewBox="0 0 36 40" className="w-9 h-10">
            <path d="M18 1L35 8V22C35 31 27 37 18 39C9 37 1 31 1 22V8L18 1Z"
              fill="#0088ce" stroke="#00aaff" strokeWidth="0.8"/>
            <text x="18" y="26" textAnchor="middle" fill="white"
              fontSize="11" fontWeight="900" fontFamily="system-ui">LH</text>
          </svg>
          <div className="leading-none">
            <div className="text-[18px] font-black tracking-wide">LHVA</div>
            <div className="text-[10px] text-muted tracking-wide mt-0.5">Appalachian Valley Hockey</div>
          </div>
        </div>

        <div className="flex h-full">
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

        <div className="ml-auto">
          <input type="text" placeholder="Search players, teams…"
            className="bg-rink-700 border border-white/10 rounded text-white text-[12px] px-3 py-1.5 w-44 placeholder:text-dim outline-none focus:border-ice/50 transition-colors" />
        </div>
      </div>
    </nav>
  )
}