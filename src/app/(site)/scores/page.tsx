import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Game } from '@/types'

export const revalidate = 30

const PERIOD_LABELS: Record<number, string> = { 1: '1st', 2: '2nd', 3: '3rd', 4: 'OT', 5: 'SO' }

function TeamDisc({ team }: { team: any }) {
  return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[9px] font-black text-white shrink-0"
      style={{ background: team?.color ?? '#333' }}>
      {team?.abbreviation}
    </div>
  )
}

function LiveGameCard({ game }: { game: any }) {
  const homeGoals = (game.goals ?? []).filter((g: any) => g.team_id === game.home_team_id && g.goal_type !== 'so').length
  const awayGoals = (game.goals ?? []).filter((g: any) => g.team_id === game.away_team_id && g.goal_type !== 'so').length
  const period = PERIOD_LABELS[game.current_period] ?? `P${game.current_period}`

  const events = [
    ...(game.goals ?? []).map((g: any) => ({ ...g, _type: 'goal', _sort: g.period * 10000 + parseInt(g.time_in_period?.replace(':','') ?? '0') })),
    ...(game.penalties ?? []).map((p: any) => ({ ...p, _type: 'penalty', _sort: p.period * 10000 + parseInt(p.time_in_period?.replace(':','') ?? '0') })),
  ].sort((a, b) => b._sort - a._sort).slice(0, 8)

  return (
    <div className="bg-rink-800 border border-green-500/30 rounded-lg overflow-hidden">
      {/* Live header */}
      <div className="px-4 py-2 bg-green-500/10 border-b border-green-500/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block" />
          <span className="text-[11px] font-black text-green-400 uppercase tracking-widest">Live</span>
        </div>
        <span className="text-[11px] font-bold text-green-400">{period} Period</span>
        <span className="text-[10px] text-dim uppercase tracking-wider">
          {game.game_type.replace('playoff-','').replace('regular','Regular Season')}
        </span>
      </div>

      {/* Score */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center px-5 py-4 gap-4">
        <div className="flex items-center gap-2.5">
          <TeamDisc team={game.home_team} />
          <div>
            <div className="text-[14px] font-bold text-white">{game.home_team?.name_en}</div>
            <div className="text-[10px] text-dim">Home</div>
          </div>
        </div>
        <div className="text-center">
          <div className="flex items-center gap-3 justify-center">
            <span className="text-4xl font-black text-white">{homeGoals}</span>
            <span className="text-xl text-dim">–</span>
            <span className="text-4xl font-black text-white">{awayGoals}</span>
          </div>
        </div>
        <div className="flex items-center gap-2.5 justify-end">
          <div className="text-right">
            <div className="text-[14px] font-bold text-white">{game.away_team?.name_en}</div>
            <div className="text-[10px] text-dim">Away</div>
          </div>
          <TeamDisc team={game.away_team} />
        </div>
      </div>

      {/* Recent events */}
      {events.length > 0 && (
        <div className="border-t border-white/[0.07]">
          <div className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-dim">Recent Events</div>
          {events.map((ev: any) => (
            <div key={`${ev._type}-${ev.id}`}
              className="flex items-center gap-2.5 px-4 py-2 border-t border-white/[0.04] text-[12px]">
              {ev._type === 'goal' ? (
                <>
                  <span className="text-green-400">🥅</span>
                  <span className="text-muted font-bold w-14">P{ev.period} {ev.time_in_period}</span>
                  <div className="w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-black text-white shrink-0"
                    style={{ background: ev.team_id === game.home_team_id ? game.home_team?.color : game.away_team?.color }}>
                    {ev.team_id === game.home_team_id ? game.home_team?.abbreviation : game.away_team?.abbreviation}
                  </div>
                  <span className="text-white font-semibold">
                    {ev.scorer?.first_name?.[0]}. {ev.scorer?.last_name}
                  </span>
                  {(ev.assist1 || ev.assist2) && (
                    <span className="text-dim text-[11px]">
                      ({[ev.assist1, ev.assist2].filter(Boolean).map((a: any) => a.last_name).join(', ')})
                    </span>
                  )}
                  {ev.goal_type !== 'ev' && (
                    <span className="text-[10px] font-black text-ice-light bg-ice/10 px-1.5 py-0.5 rounded ml-auto">
                      {ev.goal_type.toUpperCase()}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <span className="text-red-400">✋</span>
                  <span className="text-muted font-bold w-14">P{ev.period} {ev.time_in_period}</span>
                  <div className="w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-black text-white shrink-0"
                    style={{ background: ev.team_id === game.home_team_id ? game.home_team?.color : game.away_team?.color }}>
                    {ev.team_id === game.home_team_id ? game.home_team?.abbreviation : game.away_team?.abbreviation}
                  </div>
                  <span className="text-white font-semibold">
                    {ev.player?.last_name}
                  </span>
                  <span className="text-dim">{ev.infraction}</span>
                  <span className="text-amber-400 font-bold ml-auto">{ev.minutes} min</span>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function GameRow({ game }: { game: any }) {
  const isPlayed = game.home_score !== null
  const homeWon  = (game.home_score ?? 0) > (game.away_score ?? 0)
  const awayWon  = (game.away_score ?? 0) > (game.home_score ?? 0)
  const suffix   = game.overtime ? ' OT' : game.shootout ? ' SO' : ''

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center px-5 py-3 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors">
      <div className="flex items-center gap-2.5">
        <TeamDisc team={game.home_team} />
        <span className={`text-[14px] font-semibold ${isPlayed && homeWon ? 'text-white' : isPlayed ? 'text-muted' : 'text-white'}`}>
          {game.home_team?.name_en}
        </span>
      </div>
      <div className="text-center px-6 min-w-[120px]">
        {isPlayed ? (
          <>
            <div className="flex items-center justify-center gap-3">
              <span className={`text-2xl font-black ${homeWon ? 'text-white' : 'text-muted'}`}>{game.home_score}</span>
              <span className="text-dim text-sm">–</span>
              <span className={`text-2xl font-black ${awayWon ? 'text-white' : 'text-muted'}`}>{game.away_score}</span>
            </div>
            <div className="text-[10px] text-dim uppercase tracking-wider mt-0.5">Final{suffix}</div>
          </>
        ) : (
          <div className="text-[13px] font-black text-ice-light">
            {new Date(game.played_at).toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit' })}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2.5 justify-end">
        <span className={`text-[14px] font-semibold ${isPlayed && awayWon ? 'text-white' : isPlayed ? 'text-muted' : 'text-white'}`}>
          {game.away_team?.name_en}
        </span>
        <TeamDisc team={game.away_team} />
      </div>
    </div>
  )
}

export default async function ScoresPage() {
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
        assist2:players!assist2_id(id, first_name, last_name)
      ),
      penalties(*, player:players(id, first_name, last_name, jersey_number))
    `)
    .eq('season_id', 1)
    .eq('is_published', true)
    .order('played_at', { ascending: false })

  const games    = (data ?? []) as any[]
  const live     = games.filter(g => g.status === 'live')
  const upcoming = games.filter(g => g.home_score === null && g.status !== 'live')
  const played   = games.filter(g => g.home_score !== null && g.status !== 'live')

  const grouped: Record<string, any[]> = {}
  for (const game of played) {
    const month = new Date(game.played_at).toLocaleDateString('en-CA', { month: 'long', year: 'numeric' })
    if (!grouped[month]) grouped[month] = []
    grouped[month].push(game)
  }

  return (
    <div className="max-w-[900px] mx-auto px-6 py-8">
      <div className="mb-6">
        <div className="text-[11px] font-black uppercase tracking-widest text-ice-light mb-1">2025–26 Season</div>
        <h1 className="text-3xl font-black uppercase tracking-tight">Scores & Results</h1>
      </div>

      {/* Live games */}
      {live.length > 0 && (
        <div className="mb-8">
          <div className="text-[11px] font-black uppercase tracking-widest mb-3 flex items-center gap-2 text-green-400">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block" />
            Live Now
          </div>
          <div className="flex flex-col gap-4">
            {live.map(g => <LiveGameCard key={g.id} game={g} />)}
          </div>
        </div>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div className="mb-8">
          <div className="text-[11px] font-black uppercase tracking-widest text-muted mb-3">Upcoming</div>
          <div className="bg-rink-800 border border-white/[0.07] rounded-lg overflow-hidden">
            {upcoming.map(g => <GameRow key={g.id} game={g} />)}
          </div>
        </div>
      )}

      {/* Results by month */}
      {Object.keys(grouped).length === 0 && live.length === 0 ? (
        <div className="bg-rink-800 border border-white/[0.07] rounded-lg px-6 py-16 text-center text-[13px] text-dim">
          No results published yet.
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {Object.entries(grouped).map(([month, monthGames]) => (
            <div key={month}>
              <div className="text-[11px] font-black uppercase tracking-widest text-muted mb-3 flex items-center gap-2">
                <span className="w-0.5 h-3.5 bg-ice rounded-sm inline-block" />
                {month}
              </div>
              <div className="bg-rink-800 border border-white/[0.07] rounded-lg overflow-hidden">
                {monthGames.map(g => <GameRow key={g.id} game={g} />)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}