'use client'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import type { Game, Team } from '@/types'

// ── Helpers ────────────────────────────────────────────────────

function teamDisc(team: Team | undefined | null, size = 8) {
  return (
    <div
      className={`w-${size} h-${size} rounded-full flex items-center justify-center text-[9px] font-black text-white shrink-0`}
      style={{ background: team?.color ?? '#333' }}
    >
      {team?.abbreviation}
    </div>
  )
}

const PERIOD_LABELS: Record<number, string> = { 1: '1st', 2: '2nd', 3: '3rd', 4: 'OT', 5: 'SO' }

function gameTypeBadge(type: string) {
  if (type === 'regular') return null
  const label =
    type === 'playoff-final' ? 'Final' :
    type === 'playoff-sf'    ? 'SF' :
    type === 'playoff-qf'    ? 'QF' : 'PO'
  return (
    <span className="text-[9px] font-black uppercase tracking-wider text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">
      {label}
    </span>
  )
}

// ── Game Row ───────────────────────────────────────────────────

function GameRow({ game }: { game: Game }) {
  const isPlayed = game.home_score !== null
  const isLive   = (game as any).status === 'live'
  const homeWon  = (game.home_score ?? 0) > (game.away_score ?? 0)
  const awayWon  = (game.away_score ?? 0) > (game.home_score ?? 0)
  const suffix   = game.overtime ? ' OT' : game.shootout ? ' SO' : ''
  const period   = isLive ? PERIOD_LABELS[(game as any).current_period] ?? '' : null

  return (
    <Link
      href={`/schedule/${game.id}`}
      className={`grid grid-cols-[1fr_auto_1fr] items-center px-4 sm:px-5 py-3 border-b border-white/[0.04] last:border-0 transition-colors group ${
        isLive ? 'bg-green-500/[0.04] hover:bg-green-500/[0.07]' : 'hover:bg-white/[0.03]'
      }`}
    >
      {/* Home */}
      <div className="flex items-center gap-2">
        {teamDisc(game.home_team)}
        <span className={`text-[13px] sm:text-[14px] font-semibold truncate ${
          isPlayed && homeWon ? 'text-white' : isPlayed ? 'text-muted' : 'text-white'
        }`}>
          {game.home_team?.name_en}
        </span>
      </div>

      {/* Centre */}
      <div className="text-center px-3 sm:px-6 min-w-[100px] sm:min-w-[120px]">
        {isLive ? (
          <div>
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl font-black text-white">{game.home_score ?? 0}</span>
              <span className="text-dim text-sm">–</span>
              <span className="text-2xl font-black text-white">{game.away_score ?? 0}</span>
            </div>
            <div className="flex items-center justify-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
              <span className="text-[10px] font-bold text-green-400 uppercase">{period}</span>
            </div>
          </div>
        ) : isPlayed ? (
          <div>
            <div className="flex items-center justify-center gap-2">
              <span className={`text-2xl font-black ${homeWon ? 'text-white' : 'text-muted'}`}>{game.home_score}</span>
              <span className="text-dim text-sm">–</span>
              <span className={`text-2xl font-black ${awayWon ? 'text-white' : 'text-muted'}`}>{game.away_score}</span>
            </div>
            <div className="text-[10px] text-dim uppercase tracking-wider mt-0.5">Final{suffix}</div>
            <div className="text-[10px] text-dim mt-0.5">
              {new Date(game.played_at).toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Moncton' })}
            </div>
          </div>
        ) : (
          <div className="text-[13px] font-black text-ice-light">
            {new Date(game.played_at).toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Moncton' })}
          </div>
        )}
      </div>

      {/* Away */}
      <div className="flex items-center gap-2 justify-end">
        <div className="flex items-center gap-1.5 sm:gap-2">
          {gameTypeBadge(game.game_type)}
          <span className={`text-[13px] sm:text-[14px] font-semibold truncate ${
            isPlayed && awayWon ? 'text-white' : isPlayed ? 'text-muted' : 'text-white'
          }`}>
            {game.away_team?.name_en}
          </span>
        </div>
        {teamDisc(game.away_team)}
      </div>
    </Link>
  )
}

// ── Filter Pill ────────────────────────────────────────────────

function Pill({
  active, onClick, children, color,
}: { active: boolean; onClick: () => void; children: React.ReactNode; color?: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded text-[11px] font-black uppercase tracking-wider transition-all ${
        active
          ? 'text-white'
          : 'bg-rink-700 text-dim hover:text-white border border-white/[0.07]'
      }`}
      style={active ? { background: color ?? 'rgba(255,255,255,0.15)', border: `1px solid ${color ? color + '60' : 'rgba(255,255,255,0.2)'}` } : {}}
    >
      {children}
    </button>
  )
}

// ── Main Component ─────────────────────────────────────────────

interface Props {
  games: Game[]
  teams: Team[]
}

export function ScheduleClient({ games, teams }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const teamFilter = searchParams.get('team') ?? ''
  const typeFilter = searchParams.get('type') ?? ''

  const setParam = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    router.push(`/schedule?${params.toString()}`, { scroll: false })
  }, [router, searchParams])

  // Active teams in the dataset
  const activeTeams = teams.filter(t =>
    games.some(g => g.home_team_id === t.id || g.away_team_id === t.id)
  )

  // Filter games
  const filtered = games.filter(g => {
    if (teamFilter) {
      const abbr = teamFilter.toUpperCase()
      if (g.home_team?.abbreviation !== abbr && g.away_team?.abbreviation !== abbr) return false
    }
    if (typeFilter === 'regular' && g.game_type !== 'regular') return false
    if (typeFilter === 'playoff' && !g.game_type.startsWith('playoff')) return false
    return true
  })

  const played   = filtered.filter(g => g.home_score !== null)
  const upcoming = filtered.filter(g => g.home_score === null && (g as any).status !== 'live')
  const live     = filtered.filter(g => (g as any).status === 'live')

  // Group by date
  const grouped: Record<string, Game[]> = {}
  for (const game of filtered) {
    const date = new Date(game.played_at).toLocaleDateString('en-CA', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
      timeZone: 'America/Moncton',
    })
    if (!grouped[date]) grouped[date] = []
    grouped[date].push(game)
  }

  return (
    <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-8">

      {/* Header */}
      <div className="mb-6">
        <div className="text-[11px] font-black uppercase tracking-widest text-ice-light mb-1">2025–26 Season</div>
        <h1 className="text-3xl font-black uppercase tracking-tight">Schedule & Results</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 mb-6">
        {/* Team filter */}
        <div className="flex flex-wrap gap-2">
          <Pill active={!teamFilter} onClick={() => setParam('team', '')} >All Teams</Pill>
          {activeTeams.map(t => (
            <Pill
              key={t.id}
              active={teamFilter.toUpperCase() === t.abbreviation}
              onClick={() => setParam('team', teamFilter.toUpperCase() === t.abbreviation ? '' : t.abbreviation)}
              color={t.color}
            >
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full inline-block" style={{ background: t.color }} />
                {t.abbreviation}
              </span>
            </Pill>
          ))}
        </div>
        {/* Type filter */}
        <div className="flex flex-wrap gap-2">
          <Pill active={!typeFilter} onClick={() => setParam('type', '')}>All</Pill>
          <Pill active={typeFilter === 'regular'} onClick={() => setParam('type', typeFilter === 'regular' ? '' : 'regular')}>Regular Season</Pill>
          <Pill active={typeFilter === 'playoff'} onClick={() => setParam('type', typeFilter === 'playoff' ? '' : 'playoff')}>Playoffs</Pill>
        </div>
      </div>

      {/* Summary pills */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="bg-rink-800 border border-white/[0.07] rounded px-4 py-2 text-center">
          <div className="text-xl font-black text-white">{played.length + live.length}</div>
          <div className="text-[10px] text-dim uppercase tracking-wider">Played</div>
        </div>
        <div className="bg-rink-800 border border-white/[0.07] rounded px-4 py-2 text-center">
          <div className="text-xl font-black text-ice-light">{upcoming.length}</div>
          <div className="text-[10px] text-dim uppercase tracking-wider">Remaining</div>
        </div>
        <div className="bg-rink-800 border border-white/[0.07] rounded px-4 py-2 text-center">
          <div className="text-xl font-black text-white">{filtered.length}</div>
          <div className="text-[10px] text-dim uppercase tracking-wider">Total</div>
        </div>
      </div>

      {/* Live */}
      {live.length > 0 && (
        <div className="mb-6 bg-rink-800 border border-green-500/30 rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-green-500/10 border-b border-green-500/20 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block" />
            <span className="text-[11px] font-black text-green-400 uppercase tracking-widest">Live Now</span>
          </div>
          {live.map(g => <GameRow key={g.id} game={g} />)}
        </div>
      )}

      {/* All games grouped by date */}
      {Object.keys(grouped).length === 0 ? (
        <div className="bg-rink-800 border border-white/[0.07] rounded-lg px-6 py-16 text-center text-[13px] text-dim">
          No games match the selected filters.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {Object.entries(grouped).map(([date, dayGames]) => (
            <div key={date} className="bg-rink-800 border border-white/[0.07] rounded-lg overflow-hidden">
              <div className="px-4 sm:px-5 py-2.5 bg-rink-700 border-b border-white/[0.07]">
                <span className="text-[11px] font-black uppercase tracking-widest text-muted">{date}</span>
              </div>
              {dayGames.map(game => <GameRow key={game.id} game={game} />)}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
