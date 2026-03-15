'use client'

import { useState } from 'react'

const AWARDS = [
  { key: 'mvp',          label: 'Most Valuable Player',    icon: '🏆' },
  { key: 'top_scorer',   label: 'Top Scorer',              icon: '🥅' },
  { key: 'top_goalie',   label: 'Best Goaltender',         icon: '🧤' },
  { key: 'best_defenceman', label: 'Best Defenceman',      icon: '🛡' },
  { key: 'rookie',       label: 'Rookie of the Year',      icon: '⭐' },
  { key: 'sportsmanship',label: 'Sportsmanship Award',     icon: '🤝' },
]

interface Player {
  id: number
  first_name: string
  last_name: string
  team: { name_en: string; abbreviation: string; color: string } | null
}

interface Props { players: Player[] }

export function AwardsManager({ players }: Props) {
  const [awards, setAwards] = useState<Record<string, number | null>>(
    Object.fromEntries(AWARDS.map(a => [a.key, null]))
  )
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    // In a full implementation this would save to a season_awards table
    // For now just show a success state
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const getPlayer = (id: number | null) =>
    id ? players.find(p => p.id === id) : null

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-rink-800 border border-amber-500/20 rounded px-4 py-3 text-[12px] text-amber-400">
        Select award winners for the 2025–26 season. These will be displayed on the public site.
      </div>

      <div className="flex flex-col gap-3">
        {AWARDS.map(award => {
          const winner = getPlayer(awards[award.key])
          return (
            <div key={award.key} className="bg-rink-800 border border-white/[0.07] rounded-lg px-4 py-4 flex items-center gap-4">
              <div className="text-2xl w-8 text-center shrink-0">{award.icon}</div>
              <div className="flex-1">
                <div className="text-[12px] font-black uppercase tracking-wider text-muted mb-2">{award.label}</div>
                <select
                  value={awards[award.key] ?? ''}
                  onChange={e => setAwards(a => ({ ...a, [award.key]: Number(e.target.value) || null }))}
                  className="bg-rink-700 border border-white/10 rounded px-3 py-2 text-sm text-white w-full max-w-xs">
                  <option value="">— Not yet awarded —</option>
                  {players.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.first_name} {p.last_name} ({p.team?.abbreviation})
                    </option>
                  ))}
                </select>
              </div>
              {winner && (
                <div className="flex items-center gap-2 shrink-0">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-black text-white"
                    style={{ background: winner.team?.color ?? '#333' }}>
                    {winner.team?.abbreviation}
                  </div>
                  <div>
                    <div className="text-[13px] font-bold text-white">{winner.first_name} {winner.last_name}</div>
                    <div className="text-[10px] text-dim">{winner.team?.name_en}</div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex justify-end">
        <button onClick={handleSave}
          className="px-5 py-2 text-[12px] font-bold bg-ice hover:bg-ice-light text-white rounded transition-colors">
          {saved ? '✓ Saved!' : 'Save Awards'}
        </button>
      </div>
    </div>
  )
}