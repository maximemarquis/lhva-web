import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Game, Goal } from '@/types'

export const revalidate = 60

function GoalList({ goals, teamId }: { goals: Goal[], teamId: number }) {
  const teamGoals = goals
    .filter(g => g.team_id === teamId)
    .sort((a, b) => a.period - b.period || a.time_in_period.localeCompare(b.time_in_period))

  if (teamGoals.length === 0) return null

  return (
    <div className="mt-2 flex flex-col gap-1">
      {teamGoals.map(goal => (
        <div key={goal.id} className="flex items-center gap-2 text-[11px] text-dim">
          <span className="font-bold text-muted">
            P{goal.period} {goal.time_in_period}
          </span>
          <span className="text-white font-semibold">
            {goal.scorer?.first_name[0]}. {goal.scorer?.last_name}
          </span>
          {(goal.assist1 || goal.assist2) && (
            <span className="text-dim">
              ({[goal.assist1, goal.assist2].filter(Boolean).map(p => `${p?.first_name[0]}. ${p?.last_name}`).join(', ')})
            </span>
          )}
          {goal.goal_type !== 'ev' && (
            <span className="text-[9px] font-black uppercase text-ice-light">{goal.goal_type}</span>
          )}
        </div>
      ))}
    </div>
  )
}

function GameCard({ game }: { game: Game }) {
  const goals = (game.goals ?? []) as Goal[]
  const homeWon = (game.home_score ?? 0) > (game.away_score ?? 0)
  const awayWon = (game.away_score ?? 0) > (game.home_score ?? 0)
  const suffix  = game.overtime ? ' OT' : game.shootout ? ' SO' : ''
  const isPlayed = game.home_score !== null

  const gameTypeLabel: Record<string, string> = {
    regular: 'Regular Season',
    'playoff-qf': 'Quarterfinal',
    'playoff-sf': 'Semifinal',
    'playoff-final': 'Final',
  }

  return (
    <div className="bg-rink-800 border border-white/[0.07] rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2 bg-rink-700 border-b border-white/[0.07] flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-widest text-dim">
          {gameTypeLabel[game.game_type] ?? game.game_type}
        </span>
        <span className="text-[10px] text-dim">
          {new Date(game.played_at).toLocaleDateString('en-CA', {
            month: 'short', day: 'numeric', year: 'numeric'
          })}
        </span>
      </div>

      {/* Score */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-4 px-5 py-4">
        {/* Home */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-[9px] font-black text-white shrink-0"
              style={{ background: game.home_team?.color ?? '#333' }}>
              {game.home_team?.abbreviation}
            </div>
            <span className={`text-[14px] font-bold ${isPlayed && homeWon ? 'text-white' : isPlayed ? 'text-muted' : 'text-white'}`}>
              {game.home_team?.name_en}
            </span>
          </div>
          {isPlayed && <GoalList goals={goals} teamId={game.home_team_id} />}
        </div>

        {/* Score display */}
        <div className="text-center pt-1 min-w-[100px]">
          {isPlayed ? (
            <>
              <div className="flex items-center justify-center gap-3">
                <span className={`text-3xl font-black ${homeWon ? 'text-white' : 'text-muted'}`}>{game.home_score}</span>
                <span className="text-dim">–</span>
                <span className={`text-3xl font-black ${awayWon ? 'text-white' : 'text-muted'}`}>{game.away_score}</span>
              </div>
              <div className="text-[10px] text-dim uppercase tracking-wider mt-1">Final{suffix}</div>
            </>
          ) : (
            <div className="text-[14px] font-black text-ice-light">
              {new Date(game.played_at).toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit' })}
            </div>
          )}
        </div>

        {/* Away */}
        <div className="text-right">
          <div className="flex items-center gap-2 justify-end mb-1">
            <span className={`text-[14px] font-bold ${isPlayed && awayWon ? 'text-white' : isPlayed ? 'text-muted' : 'text-white'}`}>
              {game.away_team?.name_en}
            </span>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-[9px] font-black text-white shrink-0"
              style={{ background: game.away_team?.color ?? '#333' }}>
              {game.away_team?.abbreviation}
            </div>
          </div>
          {isPlayed && <GoalList goals={goals} teamId={game.away_team_id} />}
        </div>
      </div>

      {/* Scorekeeper */}
      {game.scorekeeper && (
        <div className="px-4 py-2 border-t border-white/[0.04] text-[10px] text-dim">
          Scorekeeper: {game.scorekeeper}
        </div>
      )}
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
      )
    `)
    .eq('season_id', 1)
    .eq('is_published', true)
    .not('home_score', 'is', null)
    .order('played_at', { ascending: false })

  const games = (data ?? []) as Game[]

  // Group by month
  const grouped: Record<string, Game[]> = {}
  for (const game of games) {
    const month = new Date(game.played_at).toLocaleDateString('en-CA', {
      month: 'long', year: 'numeric'
    })
    if (!grouped[month]) grouped[month] = []
    grouped[month].push(game)
  }

  return (
    <div className="max-w-[900px] mx-auto px-6 py-8">

      <div className="mb-6">
        <div className="text-[11px] font-black uppercase tracking-widest text-ice-light mb-1">2025–26 Season</div>
        <h1 className="text-3xl font-black uppercase tracking-tight">Scores & Results</h1>
      </div>

      {games.length === 0 ? (
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
              <div className="flex flex-col gap-3">
                {monthGames.map(game => <GameCard key={game.id} game={game} />)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}