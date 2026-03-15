import { createServerSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Game } from '@/types'

export default async function ScoresPage() {
  const supabase = await createServerSupabaseClient()

  const { data } = await supabase
    .from('games')
    .select(`*, home_team:teams!home_team_id(*), away_team:teams!away_team_id(*)`)
    .eq('season_id', 1)
    .order('played_at', { ascending: false })

  const games = (data ?? []) as Game[]

  const now      = new Date().toISOString()
  const live     = games.filter(g => (g as any).status === 'live')
  const upcoming = games.filter(g => g.home_score === null && g.played_at > now && (g as any).status !== 'live')
  const unscored = games.filter(g => g.home_score === null && g.played_at <= now && (g as any).status !== 'live')
  const recent   = games.filter(g => g.home_score !== null).slice(0, 10)

  const statusBadge = (game: any) => {
    const styles: Record<string, string> = {
      scheduled: 'bg-white/5 text-dim border-white/10',
      warmup:    'bg-amber-500/10 text-amber-400 border-amber-500/20',
      live:      'bg-green-500/10 text-green-400 border-green-500/20',
      final:     'bg-ice/10 text-ice-light border-ice/20',
    }
    return styles[game.status] ?? styles.scheduled
  }

  const GameRow = ({ game }: { game: any }) => (
    <div className="flex items-center gap-4 px-4 py-3 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-black text-white shrink-0"
          style={{ background: game.home_team?.color }}>{game.home_team?.abbreviation}</div>
        <span className="text-[13px] font-semibold text-white truncate">{game.home_team?.name_en}</span>
      </div>
      <div className="text-center min-w-[80px]">
        {game.status === 'final' ? (
          <span className="text-[15px] font-black text-white">{game.home_score} – {game.away_score}</span>
        ) : game.status === 'live' ? (
          <div>
            <span className="text-[15px] font-black text-white">
              {game.goals?.filter((g: any) => g.team_id === game.home_team_id).length ?? 0}
              {' – '}
              {game.goals?.filter((g: any) => g.team_id === game.away_team_id).length ?? 0}
            </span>
            <div className="text-[9px] text-green-400 font-black uppercase">Live</div>
          </div>
        ) : (
          <span className="text-[12px] font-bold text-ice-light">
            {new Date(game.played_at).toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Moncton' })}
          </span>
        )}
        <div className="text-[9px] text-dim">
          {new Date(game.played_at).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', timeZone: 'America/Moncton' })}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
        <span className="text-[13px] font-semibold text-white truncate">{game.away_team?.name_en}</span>
        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-black text-white shrink-0"
          style={{ background: game.away_team?.color }}>{game.away_team?.abbreviation}</div>
      </div>
      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-sm border whitespace-nowrap ${statusBadge(game)}`}>
        {game.status}
      </span>
      <Link href={`/admin/scores/${game.id}`}
        className="text-[11px] font-bold text-white bg-ice hover:bg-ice-light px-3 py-1.5 rounded transition-colors whitespace-nowrap">
        {game.status === 'live' ? '🔴 Live' : game.status === 'final' ? 'Review' : 'Manage'}
      </Link>
    </div>
  )

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-[18px] font-black">Game Data</h1>
        <Link href="/admin/schedule"
          className="text-[12px] font-bold text-ice-light hover:text-white transition-colors">
          Schedule & Playoffs →
        </Link>
      </div>

      {live.length > 0 && (
        <div>
          <div className="text-[11px] font-black uppercase tracking-widest text-green-400 mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block" />
            Live Now
          </div>
          <div className="bg-rink-800 border border-green-500/20 rounded-lg overflow-hidden">
            {live.map(g => <GameRow key={g.id} game={g} />)}
          </div>
        </div>
      )}

      {unscored.length > 0 && (
        <div>
          <div className="text-[11px] font-black uppercase tracking-widest text-amber-400 mb-2">⚠ Score Pending</div>
          <div className="bg-rink-800 border border-amber-500/20 rounded-lg overflow-hidden">
            {unscored.map(g => <GameRow key={g.id} game={g} />)}
          </div>
        </div>
      )}

      {upcoming.length > 0 && (
        <div>
          <div className="text-[11px] font-black uppercase tracking-widest text-muted mb-2">Upcoming</div>
          <div className="bg-rink-800 border border-white/[0.07] rounded-lg overflow-hidden">
            {upcoming.map(g => <GameRow key={g.id} game={g} />)}
          </div>
        </div>
      )}

      {recent.length > 0 && (
        <div>
          <div className="text-[11px] font-black uppercase tracking-widest text-muted mb-2">Recent Results</div>
          <div className="bg-rink-800 border border-white/[0.07] rounded-lg overflow-hidden">
            {recent.map(g => <GameRow key={g.id} game={g} />)}
          </div>
        </div>
      )}

      {games.length === 0 && (
        <div className="bg-rink-800 border border-white/[0.07] rounded-lg px-6 py-12 text-center text-[13px] text-dim">
          No games yet. <Link href="/admin/schedule" className="text-ice-light hover:underline">Add games to the schedule →</Link>
        </div>
      )}
    </div>
  )
}