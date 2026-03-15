import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Game } from '@/types'

export const revalidate = 300

function GameRow({ game }: { game: Game }) {
  const isPlayed = game.home_score !== null
  const homeWon  = (game.home_score ?? 0) > (game.away_score ?? 0)
  const awayWon  = (game.away_score ?? 0) > (game.home_score ?? 0)
  const suffix   = game.overtime ? ' OT' : game.shootout ? ' SO' : ''

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center px-5 py-3 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors">
      {/* Home */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[9px] font-black text-white shrink-0"
          style={{ background: game.home_team?.color ?? '#333' }}>
          {game.home_team?.abbreviation}
        </div>
        <span className={`text-[14px] font-semibold ${isPlayed && homeWon ? 'text-white' : isPlayed ? 'text-muted' : 'text-white'}`}>
          {game.home_team?.name_en}
        </span>
      </div>

      {/* Score / time */}
      <div className="text-center px-6 min-w-[120px]">
        {isPlayed ? (
          <>
            <div className="flex items-center justify-center gap-3">
              <span className={`text-2xl font-black ${homeWon ? 'text-white' : 'text-muted'}`}>{game.home_score}</span>
              <span className="text-dim text-sm">–</span>
              <span className={`text-2xl font-black ${awayWon ? 'text-white' : 'text-muted'}`}>{game.away_score}</span>
            </div>
            <div className="text-[10px] text-dim uppercase tracking-wider mt-0.5">Final{suffix}</div>
            <div className="text-[10px] text-dim mt-0.5">
              {new Date(game.played_at).toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Moncton' })}
            </div>
          </>
        ) : (
          <div className="text-[13px] font-black text-ice-light">
            {new Date(game.played_at).toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Moncton' })}
          </div>
        )}
      </div>

      {/* Away */}
      <div className="flex items-center gap-2.5 justify-end">
        <span className={`text-[14px] font-semibold ${isPlayed && awayWon ? 'text-white' : isPlayed ? 'text-muted' : 'text-white'}`}>
          {game.away_team?.name_en}
        </span>
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[9px] font-black text-white shrink-0"
          style={{ background: game.away_team?.color ?? '#333' }}>
          {game.away_team?.abbreviation}
        </div>
      </div>
    </div>
  )
}

export default async function SchedulePage() {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('games')
    .select(`*, home_team:teams!home_team_id(*), away_team:teams!away_team_id(*)`)
    .eq('season_id', 1)
    .eq('is_published', true)
    .order('played_at', { ascending: true })

  const games = (data ?? []) as Game[]

  // Group games by date
  const grouped: Record<string, Game[]> = {}
  for (const game of games) {
    const date = new Date(game.played_at).toLocaleDateString('en-CA', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'America/Moncton'
    })
    if (!grouped[date]) grouped[date] = []
    grouped[date].push(game)
  }

  const upcoming = games.filter(g => g.home_score === null)
  const played   = games.filter(g => g.home_score !== null)

  return (
    <div className="max-w-[900px] mx-auto px-6 py-8">

      <div className="mb-6">
        <div className="text-[11px] font-black uppercase tracking-widest text-ice-light mb-1">2025–26 Season</div>
        <h1 className="text-3xl font-black uppercase tracking-tight">Schedule & Results</h1>
      </div>

      {/* Summary pills */}
      <div className="flex gap-3 mb-6">
        <div className="bg-rink-800 border border-white/[0.07] rounded px-4 py-2 text-center">
          <div className="text-xl font-black text-white">{played.length}</div>
          <div className="text-[10px] text-dim uppercase tracking-wider">Played</div>
        </div>
        <div className="bg-rink-800 border border-white/[0.07] rounded px-4 py-2 text-center">
          <div className="text-xl font-black text-ice-light">{upcoming.length}</div>
          <div className="text-[10px] text-dim uppercase tracking-wider">Remaining</div>
        </div>
        <div className="bg-rink-800 border border-white/[0.07] rounded px-4 py-2 text-center">
          <div className="text-xl font-black text-white">{games.length}</div>
          <div className="text-[10px] text-dim uppercase tracking-wider">Total</div>
        </div>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div className="bg-rink-800 border border-white/[0.07] rounded-lg px-6 py-12 text-center text-[13px] text-dim">
          No games scheduled yet.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {Object.entries(grouped).map(([date, dayGames]) => (
            <div key={date} className="bg-rink-800 border border-white/[0.07] rounded-lg overflow-hidden">
              <div className="px-5 py-2.5 bg-rink-700 border-b border-white/[0.07]">
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