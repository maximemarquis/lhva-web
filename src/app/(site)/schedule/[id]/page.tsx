import { createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Goal, Penalty, GoalieStat, GamePPStat } from '@/types'

export const revalidate = 60

// ── Helpers ────────────────────────────────────────────────────

const PERIOD_LABELS: Record<number, string> = { 1: '1st', 2: '2nd', 3: '3rd', 4: 'OT', 5: 'SO' }

function gameTypeLabel(type: string) {
  if (type === 'regular')       return 'Regular Season'
  if (type === 'playoff-qf')    return 'Playoffs – Quarter-Finals'
  if (type === 'playoff-sf')    return 'Playoffs – Semi-Finals'
  if (type === 'playoff-final') return 'Playoffs – Championship Final'
  return type
}

function TeamDisc({ team, size = 'md' }: { team: any; size?: 'sm' | 'md' | 'lg' }) {
  const dims = size === 'lg' ? 'w-16 h-16 text-[11px]' : size === 'sm' ? 'w-5 h-5 text-[7px]' : 'w-8 h-8 text-[9px]'
  return (
    <div className={`${dims} rounded-full flex items-center justify-center font-black text-white shrink-0`}
      style={{ background: team?.color ?? '#333' }}>
      {team?.abbreviation}
    </div>
  )
}

function GoalTypeBadge({ type }: { type: string }) {
  if (type === 'ev') return null
  const colors: Record<string, string> = {
    pp: 'text-yellow-400 bg-yellow-400/10',
    sh: 'text-blue-400 bg-blue-400/10',
    en: 'text-orange-400 bg-orange-400/10',
    so: 'text-purple-400 bg-purple-400/10',
    'pen-shot': 'text-red-400 bg-red-400/10',
  }
  return (
    <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${colors[type] ?? 'text-white/50 bg-white/5'}`}>
      {type.replace('pen-shot', 'PS')}
    </span>
  )
}

// ── Period scoring table ───────────────────────────────────────

function PeriodTable({ game, goals }: { game: any; goals: Goal[] }) {
  const periods = game.overtime ? [1, 2, 3, 4] : game.shootout ? [1, 2, 3, 5] : [1, 2, 3]
  const homeId = game.home_team_id
  const awayId = game.away_team_id

  const goalsForPeriod = (teamId: number, period: number) =>
    goals.filter(g => g.team_id === teamId && g.period === period && g.goal_type !== 'so').length

  return (
    <div className="bg-rink-800 border border-white/[0.07] rounded-lg overflow-hidden">
      <div className="px-4 py-2.5 bg-rink-700 border-b border-white/[0.07]">
        <span className="text-[11px] font-black uppercase tracking-widest text-dim">Scoring by Period</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-white/[0.07]">
              <th className="text-left px-4 py-2 text-dim font-bold text-[11px] w-36">Team</th>
              {periods.map(p => (
                <th key={p} className="text-center px-3 py-2 text-dim font-bold text-[11px]">{PERIOD_LABELS[p]}</th>
              ))}
              <th className="text-center px-4 py-2 text-white font-black text-[12px]">T</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-white/[0.04]">
              <td className="px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <TeamDisc team={game.home_team} size="sm" />
                  <span className="font-semibold text-white">{game.home_team?.abbreviation}</span>
                </div>
              </td>
              {periods.map(p => (
                <td key={p} className="text-center px-3 py-2.5 text-muted">{goalsForPeriod(homeId, p)}</td>
              ))}
              <td className="text-center px-4 py-2.5 font-black text-white">{game.home_score}</td>
            </tr>
            <tr>
              <td className="px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <TeamDisc team={game.away_team} size="sm" />
                  <span className="font-semibold text-white">{game.away_team?.abbreviation}</span>
                </div>
              </td>
              {periods.map(p => (
                <td key={p} className="text-center px-3 py-2.5 text-muted">{goalsForPeriod(awayId, p)}</td>
              ))}
              <td className="text-center px-4 py-2.5 font-black text-white">{game.away_score}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Goals section ──────────────────────────────────────────────

function GoalsSection({ game, goals }: { game: any; goals: Goal[] }) {
  const sorted = [...goals].sort((a, b) => {
    if (a.period !== b.period) return a.period - b.period
    return (a.time_in_period ?? '').localeCompare(b.time_in_period ?? '')
  })

  const periods = [...new Set(sorted.map(g => g.period))].sort((a, b) => a - b)

  return (
    <div className="bg-rink-800 border border-white/[0.07] rounded-lg overflow-hidden">
      <div className="px-4 py-2.5 bg-rink-700 border-b border-white/[0.07]">
        <span className="text-[11px] font-black uppercase tracking-widest text-dim">Goals</span>
      </div>
      {sorted.length === 0 ? (
        <div className="px-4 py-8 text-center text-[12px] text-dim/60">No scoring data entered</div>
      ) : (
        periods.map(period => (
          <div key={period}>
            <div className="px-4 py-2 border-b border-white/[0.04] bg-rink-700/40">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted">{PERIOD_LABELS[period] ?? `P${period}`} Period</span>
            </div>
            {sorted.filter(g => g.period === period).map(goal => {
              const isHome = goal.team_id === game.home_team_id
              const team = isHome ? game.home_team : game.away_team
              return (
                <div key={goal.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-white/[0.04] last:border-0 text-[13px]">
                  <span className="text-dim font-bold w-12 shrink-0">{goal.time_in_period}</span>
                  <TeamDisc team={team} size="sm" />
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-white">
                      {(goal as any).scorer?.first_name?.[0]}. {(goal as any).scorer?.last_name}
                    </span>
                    {((goal as any).assist1 || (goal as any).assist2) && (
                      <span className="text-dim text-[11px] ml-1.5">
                        ({[(goal as any).assist1, (goal as any).assist2]
                          .filter(Boolean)
                          .map((a: any) => `${a.first_name[0]}. ${a.last_name}`)
                          .join(', ')})
                      </span>
                    )}
                  </div>
                  <GoalTypeBadge type={goal.goal_type} />
                </div>
              )
            })}
          </div>
        ))
      )}
    </div>
  )
}

// ── Penalties section ──────────────────────────────────────────

function PenaltiesSection({ game, penalties }: { game: any; penalties: Penalty[] }) {
  const sorted = [...penalties].sort((a, b) => {
    if (a.period !== b.period) return a.period - b.period
    return (a.time_in_period ?? '').localeCompare(b.time_in_period ?? '')
  })
  const periods = [...new Set(sorted.map(p => p.period))].sort((a, b) => a - b)

  return (
    <div className="bg-rink-800 border border-white/[0.07] rounded-lg overflow-hidden">
      <div className="px-4 py-2.5 bg-rink-700 border-b border-white/[0.07]">
        <span className="text-[11px] font-black uppercase tracking-widest text-dim">Penalties</span>
      </div>
      {sorted.length === 0 ? (
        <div className="px-4 py-8 text-center text-[12px] text-dim/60">No penalty data entered</div>
      ) : (
        periods.map(period => (
          <div key={period}>
            <div className="px-4 py-2 border-b border-white/[0.04] bg-rink-700/40">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted">{PERIOD_LABELS[period] ?? `P${period}`} Period</span>
            </div>
            {sorted.filter(p => p.period === period).map(pen => {
              const isHome = pen.team_id === game.home_team_id
              const team = isHome ? game.home_team : game.away_team
              return (
                <div key={pen.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-white/[0.04] last:border-0 text-[13px]">
                  <span className="text-dim font-bold w-12 shrink-0">{pen.time_in_period}</span>
                  <TeamDisc team={team} size="sm" />
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-white">
                      {(pen as any).player?.first_name?.[0]}. {(pen as any).player?.last_name}
                    </span>
                    <span className="text-dim ml-1.5 text-[12px]">{pen.infraction}</span>
                  </div>
                  <span className="text-amber-400 font-black text-[12px] shrink-0">{pen.minutes} min</span>
                </div>
              )
            })}
          </div>
        ))
      )}
    </div>
  )
}

// ── Goalie stats ───────────────────────────────────────────────

function GoalieSection({ game, goalieStats }: { game: any; goalieStats: GoalieStat[] }) {
  const homeGoalies = goalieStats.filter(g => g.team_id === game.home_team_id)
  const awayGoalies = goalieStats.filter(g => g.team_id === game.away_team_id)

  const DECISION_COLORS: Record<string, string> = {
    W: 'text-green-400 bg-green-400/10',
    L: 'text-red-400 bg-red-400/10',
    OTW: 'text-green-400 bg-green-400/10',
    OTL: 'text-orange-400 bg-orange-400/10',
    SOW: 'text-green-400 bg-green-400/10',
    SOL: 'text-orange-400 bg-orange-400/10',
    ND: 'text-dim bg-white/5',
  }

  function GoalieCard({ goalie, team }: { goalie: GoalieStat; team: any }) {
    return (
      <div className="flex items-start gap-3 p-4">
        <TeamDisc team={team} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13px] font-semibold text-white">
              {(goalie as any).player?.first_name?.[0]}. {(goalie as any).player?.last_name}
            </span>
            {goalie.decision && (
              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${DECISION_COLORS[goalie.decision] ?? ''}`}>
                {goalie.decision}
              </span>
            )}
            {goalie.shutout && (
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded uppercase text-ice-light bg-ice/10">SO</span>
            )}
          </div>
          <div className="text-[12px] text-dim mt-0.5">
            {goalie.saves}/{goalie.shots_against} saves
            {goalie.toi_minutes != null && ` · ${goalie.toi_minutes} min`}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-rink-800 border border-white/[0.07] rounded-lg overflow-hidden">
      <div className="px-4 py-2.5 bg-rink-700 border-b border-white/[0.07]">
        <span className="text-[11px] font-black uppercase tracking-widest text-dim">Goaltenders</span>
      </div>
      {goalieStats.length === 0 ? (
        <div className="px-4 py-8 text-center text-[12px] text-dim/60">No goalie data entered</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.07]">
          <div>
            <div className="px-4 pt-3 text-[10px] font-black uppercase tracking-widest text-dim">{game.home_team?.name_en}</div>
            {homeGoalies.length > 0
              ? homeGoalies.map(g => <GoalieCard key={g.id} goalie={g} team={game.home_team} />)
              : <div className="px-4 py-4 text-[12px] text-dim/60">—</div>
            }
          </div>
          <div>
            <div className="px-4 pt-3 text-[10px] font-black uppercase tracking-widest text-dim">{game.away_team?.name_en}</div>
            {awayGoalies.length > 0
              ? awayGoalies.map(g => <GoalieCard key={g.id} goalie={g} team={game.away_team} />)
              : <div className="px-4 py-4 text-[12px] text-dim/60">—</div>
            }
          </div>
        </div>
      )}
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────

export default async function GameDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const { data } = await supabase
    .from('games')
    .select(`
      *,
      home_team:teams!home_team_id(*),
      away_team:teams!away_team_id(*),
      goals(
        *,
        scorer:players!scorer_id(id, first_name, last_name),
        assist1:players!assist1_id(id, first_name, last_name),
        assist2:players!assist2_id(id, first_name, last_name),
        team:teams(id, abbreviation, color)
      ),
      penalties(
        *,
        player:players(id, first_name, last_name, jersey_number),
        team:teams(id, abbreviation, color)
      ),
      goalie_stats(*, player:players(id, first_name, last_name, jersey_number)),
      game_pp_stats(*)
    `)
    .eq('id', id)
    .eq('is_published', true)
    .single()

  if (!data) notFound()

  const game      = data as any
  const goals     = (game.goals ?? []) as Goal[]
  const penalties = (game.penalties ?? []) as Penalty[]
  const goalieStats = (game.goalie_stats ?? []) as GoalieStat[]
  const ppStats   = (game.game_pp_stats ?? []) as GamePPStat[]

  const isPlayed = game.home_score !== null
  const isLive   = game.status === 'live'
  const suffix   = game.overtime ? ' OT' : game.shootout ? ' SO' : ''
  const homeWon  = (game.home_score ?? 0) > (game.away_score ?? 0)
  const awayWon  = (game.away_score ?? 0) > (game.home_score ?? 0)

  const homePP = ppStats.find((p: GamePPStat) => p.team_id === game.home_team_id)
  const awayPP = ppStats.find((p: GamePPStat) => p.team_id === game.away_team_id)

  const gameDate = new Date(game.played_at).toLocaleDateString('en-CA', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    timeZone: 'America/Moncton',
  })
  const gameTime = new Date(game.played_at).toLocaleTimeString('en-CA', {
    hour: 'numeric', minute: '2-digit', timeZone: 'America/Moncton',
  })

  return (
    <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-8">

      {/* Back */}
      <Link href="/schedule" className="inline-flex items-center gap-1.5 text-[12px] font-bold text-dim hover:text-white transition-colors mb-6">
        ← Schedule
      </Link>

      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="text-[11px] font-black uppercase tracking-widest text-ice-light">{gameDate} · {gameTime}</span>
          <span className="text-[10px] font-black uppercase tracking-wider text-dim bg-rink-700 border border-white/[0.07] px-2 py-0.5 rounded">
            {gameTypeLabel(game.game_type)}
          </span>
          {isLive && (
            <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
              Live
            </span>
          )}
        </div>
        {game.home_team?.arena && (
          <div className="text-[12px] text-dim">{game.home_team.arena}</div>
        )}
      </div>

      {/* Scoreboard */}
      <div className="bg-rink-800 border border-white/[0.07] rounded-xl px-5 py-6 mb-6">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          {/* Home */}
          <div className="flex flex-col items-center gap-2 text-center">
            <TeamDisc team={game.home_team} size="lg" />
            <div>
              <div className={`text-[15px] font-black uppercase ${isPlayed && homeWon ? 'text-white' : isPlayed ? 'text-muted' : 'text-white'}`}>
                {game.home_team?.name_en}
              </div>
              <div className="text-[10px] text-dim uppercase tracking-wider">Home</div>
            </div>
          </div>

          {/* Score */}
          <div className="text-center px-2">
            {isPlayed || isLive ? (
              <div>
                <div className="flex items-center justify-center gap-4">
                  <span className={`text-5xl font-black ${homeWon ? 'text-white' : 'text-muted'}`}>{game.home_score ?? 0}</span>
                  <span className="text-2xl text-dim">–</span>
                  <span className={`text-5xl font-black ${awayWon ? 'text-white' : 'text-muted'}`}>{game.away_score ?? 0}</span>
                </div>
                {isPlayed && !isLive && (
                  <div className="text-[11px] font-black text-dim uppercase tracking-widest mt-1">Final{suffix}</div>
                )}
                {isLive && (
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
                    <span className="text-[11px] font-black text-green-400 uppercase">
                      {PERIOD_LABELS[game.current_period] ?? ''} Period
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-[14px] font-black text-ice-light">{gameTime}</div>
            )}
          </div>

          {/* Away */}
          <div className="flex flex-col items-center gap-2 text-center">
            <TeamDisc team={game.away_team} size="lg" />
            <div>
              <div className={`text-[15px] font-black uppercase ${isPlayed && awayWon ? 'text-white' : isPlayed ? 'text-muted' : 'text-white'}`}>
                {game.away_team?.name_en}
              </div>
              <div className="text-[10px] text-dim uppercase tracking-wider">Away</div>
            </div>
          </div>
        </div>

        {/* PP stats strip */}
        {(homePP || awayPP) && (
          <div className="mt-4 pt-4 border-t border-white/[0.07] flex items-center justify-center gap-6 text-[12px]">
            <div className="text-center">
              <div className="font-black text-white">{homePP?.pp_goals ?? 0}/{homePP?.pp_opportunities ?? 0}</div>
              <div className="text-dim text-[10px] uppercase tracking-wider">PP</div>
            </div>
            <div className="text-dim text-[10px] uppercase tracking-widest">Power Play</div>
            <div className="text-center">
              <div className="font-black text-white">{awayPP?.pp_goals ?? 0}/{awayPP?.pp_opportunities ?? 0}</div>
              <div className="text-dim text-[10px] uppercase tracking-wider">PP</div>
            </div>
          </div>
        )}
      </div>

      {/* Detail sections — only show for played games */}
      {(isPlayed || isLive) && (
        <div className="flex flex-col gap-4">
          <PeriodTable game={game} goals={goals} />
          <GoalsSection game={game} goals={goals} />
          <PenaltiesSection game={game} penalties={penalties} />
          <GoalieSection game={game} goalieStats={goalieStats} />
        </div>
      )}
    </div>
  )
}
