'use client'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import type { Player, Team } from '@/types'

// ── Types ──────────────────────────────────────────────────────
interface PlayerWithTeam extends Player {
  team?: Team
}

// ── Filter Select ───────────────────────────────────────────────
function FilterSelect({
  label, value, onChange, children,
}: { label: string; value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-black uppercase tracking-widest text-dim">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="bg-rink-700 border border-white/[0.07] rounded text-[12px] font-bold text-white px-3 py-2 outline-none focus:border-ice/40 transition-colors cursor-pointer appearance-none pr-8"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 10px center',
        }}
      >
        {children}
      </select>
    </div>
  )
}

// ── Player Card ─────────────────────────────────────────────────
function PlayerCard({ player, showTeam }: { player: PlayerWithTeam; showTeam: boolean }) {
  const team = player.team
  const posLabel =
    player.position === 'F' ? 'Forward' :
    player.position === 'D' ? 'Defence' : 'Goalie'

  return (
    <Link
      href={`/players/${player.slug ?? player.id}`}
      className="bg-rink-800 border border-white/[0.07] rounded-lg p-3 hover:border-white/20 hover:bg-rink-700 transition-colors group"
    >
      {/* Photo or jersey placeholder */}
      <div className="w-full aspect-square rounded-lg mb-2 overflow-hidden bg-rink-700 flex items-center justify-center">
        {player.photo_url ? (
          <img
            src={player.photo_url}
            alt={`${player.first_name} ${player.last_name}`}
            className="w-full h-full object-cover object-top"
          />
        ) : (
          <div
            className="text-3xl font-black"
            style={{ color: (team?.color ?? '#888') + '50' }}
          >
            {player.jersey_number ?? '#'}
          </div>
        )}
      </div>

      <div className="text-[11px] text-dim mb-0.5">
        {player.jersey_number ? `#${player.jersey_number}` : '—'}
      </div>
      <div className="text-[13px] font-bold text-white leading-tight group-hover:text-ice-light transition-colors">
        {player.first_name} {player.last_name}
      </div>
      <div className="text-[10px] text-dim mt-0.5 uppercase tracking-wider">{posLabel}</div>
      {showTeam && team && (
        <div className="flex items-center gap-1 mt-1.5">
          <span
            className="w-2 h-2 rounded-full inline-block shrink-0"
            style={{ background: team.color }}
          />
          <span className="text-[10px] text-dim truncate">{team.abbreviation}</span>
        </div>
      )}
    </Link>
  )
}

// ── Team Section Header ─────────────────────────────────────────
function TeamHeader({ team, count }: { team: Team; count: number }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black text-white shrink-0"
        style={{ background: team.color }}
      >
        {team.abbreviation}
      </div>
      <h2 className="text-[15px] font-black uppercase tracking-wide">{team.name_en}</h2>
      <span className="text-[11px] text-dim ml-1">{count} players</span>
    </div>
  )
}

// ── Main Component ──────────────────────────────────────────────
interface Props {
  players: PlayerWithTeam[]
  teams: Team[]
}

const SORT_OPTIONS = [
  { value: 'jersey',    label: 'Jersey Number' },
  { value: 'last_name', label: 'Last Name (A–Z)' },
  { value: 'position',  label: 'Position' },
]

export function PlayersClient({ players, teams }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const teamFilter = searchParams.get('team') ?? ''
  const posFilter  = searchParams.get('pos')  ?? ''
  const sortBy     = searchParams.get('sort') ?? 'jersey'

  const setParam = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    router.push(`/players?${params.toString()}`, { scroll: false })
  }, [router, searchParams])

  // Filter
  const filtered = players.filter(p => {
    if (teamFilter && p.team?.abbreviation !== teamFilter) return false
    if (posFilter  && p.position !== posFilter)             return false
    return true
  })

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'last_name') {
      const cmp = a.last_name.localeCompare(b.last_name, 'fr')
      return cmp !== 0 ? cmp : a.first_name.localeCompare(b.first_name, 'fr')
    }
    if (sortBy === 'position') {
      const POS_ORDER: Record<string, number> = { F: 0, D: 1, G: 2 }
      const cmp = (POS_ORDER[a.position] ?? 9) - (POS_ORDER[b.position] ?? 9)
      return cmp !== 0 ? cmp : (a.jersey_number ?? 999) - (b.jersey_number ?? 999)
    }
    // default: jersey number
    return (a.jersey_number ?? 999) - (b.jersey_number ?? 999)
  })

  // Group by team (only when no team filter active and sort is jersey/position)
  const grouped = !teamFilter && sortBy !== 'last_name'

  const activeTeams = teams.filter(t =>
    sorted.some(p => p.team_id === t.id)
  )

  return (
    <div className="max-w-[1000px] mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="text-[11px] font-black uppercase tracking-widest text-ice-light mb-1">2025–26 Season</div>
        <h1 className="text-3xl font-black uppercase tracking-tight">Players</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <FilterSelect label="Team" value={teamFilter} onChange={v => setParam('team', v)}>
          <option value="">All Teams</option>
          {teams.map(t => (
            <option key={t.id} value={t.abbreviation}>{t.name_en}</option>
          ))}
        </FilterSelect>

        <FilterSelect label="Position" value={posFilter} onChange={v => setParam('pos', v)}>
          <option value="">All Positions</option>
          <option value="F">Forwards</option>
          <option value="D">Defence</option>
          <option value="G">Goalies</option>
        </FilterSelect>

        <FilterSelect label="Sort" value={sortBy} onChange={v => setParam('sort', v === 'jersey' ? '' : v)}>
          {SORT_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </FilterSelect>
      </div>

      {/* Result count */}
      <div className="text-[11px] text-dim mb-5 uppercase tracking-wider">
        {sorted.length} player{sorted.length !== 1 ? 's' : ''}
        {teamFilter || posFilter ? ' matching filters' : ''}
      </div>

      {/* Empty state */}
      {sorted.length === 0 && (
        <div className="bg-rink-800 border border-white/[0.07] rounded-lg px-6 py-16 text-center text-[13px] text-dim">
          No players match the selected filters.
        </div>
      )}

      {/* Grouped by team */}
      {grouped && sorted.length > 0 && (
        <div className="flex flex-col gap-8">
          {activeTeams.map(team => {
            const teamPlayers = sorted.filter(p => p.team_id === team.id)
            if (teamPlayers.length === 0) return null
            return (
              <div key={team.id}>
                <TeamHeader team={team} count={teamPlayers.length} />
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {teamPlayers.map(p => <PlayerCard key={p.id} player={p} showTeam={false} />)}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Flat list (when filtering by team or sorting by last name) */}
      {!grouped && sorted.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {sorted.map(p => <PlayerCard key={p.id} player={p} showTeam={!teamFilter} />)}
        </div>
      )}
    </div>
  )
}
