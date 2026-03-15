'use client'
import { useState } from 'react'

const FALLBACK_LEADERS = {
  points: [
    { rank: 1, name: 'M. Thériault', team: 'Kedgwick',      teamColor: '#1a6fa8', stat: 52 },
    { rank: 2, name: 'J. Cyr',       team: 'St-Basile',     teamColor: '#2e5a3a', stat: 48 },
    { rank: 3, name: 'P. Thibodeau', team: 'Perth-Andover', teamColor: '#543080', stat: 44 },
    { rank: 4, name: 'S. Morneault', team: 'St-Quentin',    teamColor: '#7a3030', stat: 39 },
  ],
  goals: [
    { rank: 1, name: 'J. Cyr',       team: 'St-Basile',     teamColor: '#2e5a3a', stat: 27 },
    { rank: 2, name: 'M. Thériault', team: 'Kedgwick',      teamColor: '#1a6fa8', stat: 24 },
    { rank: 3, name: 'R. Pelletier', team: 'Kedgwick',      teamColor: '#1a6fa8', stat: 22 },
    { rank: 4, name: 'A. Bouchard',  team: 'Bas-Madawaska', teamColor: '#7a6020', stat: 19 },
  ],
  assists: [
    { rank: 1, name: 'M. Thériault', team: 'Kedgwick',      teamColor: '#1a6fa8', stat: 28 },
    { rank: 2, name: 'F. Lapointe',  team: 'Perth-Andover', teamColor: '#543080', stat: 26 },
    { rank: 3, name: 'J. Cyr',       team: 'St-Basile',     teamColor: '#2e5a3a', stat: 21 },
    { rank: 4, name: 'C. Bérubé',    team: 'St-Basile',     teamColor: '#2e5a3a', stat: 19 },
  ],
  gaa: [
    { rank: 1, name: 'D. Ouellette', team: 'Kedgwick',      teamColor: '#1a6fa8', stat: 2.41 },
    { rank: 2, name: 'M. Losier',    team: 'St-Basile',     teamColor: '#2e5a3a', stat: 2.88 },
    { rank: 3, name: 'B. Roy',       team: 'Perth-Andover', teamColor: '#543080', stat: 3.12 },
    { rank: 4, name: 'T. Cormier',   team: 'St-Quentin',    teamColor: '#7a3030', stat: 3.45 },
  ],
}

type Category = keyof typeof FALLBACK_LEADERS

const TABS: { key: Category; label: string }[] = [
  { key: 'points',  label: 'Points'  },
  { key: 'goals',   label: 'Goals'   },
  { key: 'assists', label: 'Assists' },
  { key: 'gaa',     label: 'GAA'     },
]

// Client component needed for tab switching
export function LeagueLeaders() {
  const [active, setActive] = useState<Category>('points')
  const data = FALLBACK_LEADERS[active]

  return (
    <div className="border border-white/[0.07] rounded overflow-hidden">
      {/* Tabs */}
      <div className="flex bg-rink-700 border-b border-white/[0.07]">
        {TABS.map(tab => (
          <button key={tab.key} onClick={() => setActive(tab.key)}
            className={`px-4 py-2.5 text-[11px] font-black uppercase tracking-wider border-b-2 -mb-px transition-colors ${
              active === tab.key
                ? 'text-white border-ice'
                : 'text-muted border-transparent hover:text-white'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Leaders */}
      {data.map((player, i) => (
        <div key={i}
          className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors">
          <div className="flex items-center gap-3">
            <span className="text-[12px] text-dim w-4 font-bold">{player.rank}</span>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-black text-white shrink-0"
              style={{ background: player.teamColor }}>
              {player.team.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="text-[13px] font-bold text-white">{player.name}</div>
              <div className="text-[10px] text-dim uppercase tracking-wide">{player.team}</div>
            </div>
          </div>
          <div className={`text-[22px] font-black ${i === 0 ? 'text-amber-400' : 'text-ice-light'}`}>
            {active === 'gaa' ? player.stat.toFixed(2) : player.stat}
          </div>
        </div>
      ))}
    </div>
  )
}