import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Game } from '@/types'

export const revalidate = 300

interface SeriesResult {
  teamA: { name: string; abbr: string; color: string }
  teamB: { name: string; abbr: string; color: string }
  winsA: number
  winsB: number
  round: string
  done: boolean
  winner: 'A' | 'B' | null
}

function buildSeries(games: Game[], round: string): SeriesResult[] {
  const roundGames = games.filter(g => g.game_type === round)
  const pairs: Record<string, Game[]> = {}

  for (const game of roundGames) {
    const key = [game.home_team_id, game.away_team_id].sort().join('-')
    if (!pairs[key]) pairs[key] = []
    pairs[key].push(game)
  }

  return Object.values(pairs).map(seriesGames => {
    const first = seriesGames[0]
    const teamAId = Math.min(first.home_team_id, first.away_team_id)
    const teamBId = Math.max(first.home_team_id, first.away_team_id)
    const teamA = first.home_team_id === teamAId ? first.home_team : first.away_team
    const teamB = first.home_team_id === teamBId ? first.home_team : first.away_team

    let winsA = 0, winsB = 0
    for (const g of seriesGames) {
      if (g.home_score === null) continue
      const homeWon = (g.home_score ?? 0) > (g.away_score ?? 0)
      if (g.home_team_id === teamAId) {
        homeWon ? winsA++ : winsB++
      } else {
        homeWon ? winsB++ : winsA++
      }
    }

    const done = winsA >= 4 || winsB >= 4
    return {
      teamA: { name: teamA?.name_en ?? '', abbr: teamA?.abbreviation ?? '', color: teamA?.color ?? '#333' },
      teamB: { name: teamB?.name_en ?? '', abbr: teamB?.abbreviation ?? '', color: teamB?.color ?? '#333' },
      winsA, winsB, round, done,
      winner: done ? (winsA > winsB ? 'A' : 'B') : null,
    }
  })
}

function SeriesCard({ series }: { series: SeriesResult }) {
  const { teamA, teamB, winsA, winsB, done, winner } = series
  return (
    <div className="bg-rink-800 border border-white/[0.07] rounded-lg overflow-hidden">
      {/* Team A */}
      <div className={`flex items-center justify-between px-4 py-3 border-b border-white/[0.07] ${
        done && winner === 'A' ? 'bg-white/[0.03]' : ''
      }`}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-black text-white shrink-0"
            style={{ background: teamA.color }}>{teamA.abbr}</div>
          <span className={`text-[13px] font-bold ${done && winner !== 'A' ? 'text-muted' : 'text-white'}`}>
            {teamA.name}
          </span>
          {done && winner === 'A' && (
            <span className="text-[9px] font-black uppercase tracking-wider text-green-400 bg-green-400/10 border border-green-400/20 px-1.5 py-0.5 rounded-sm">
              Adv
            </span>
          )}
        </div>
        <span className={`text-xl font-black ${done && winner === 'A' ? 'text-white' : 'text-muted'}`}>{winsA}</span>
      </div>
      {/* Team B */}
      <div className={`flex items-center justify-between px-4 py-3 ${
        done && winner === 'B' ? 'bg-white/[0.03]' : ''
      }`}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-black text-white shrink-0"
            style={{ background: teamB.color }}>{teamB.abbr}</div>
          <span className={`text-[13px] font-bold ${done && winner !== 'B' ? 'text-muted' : 'text-white'}`}>
            {teamB.name}
          </span>
          {done && winner === 'B' && (
            <span className="text-[9px] font-black uppercase tracking-wider text-green-400 bg-green-400/10 border border-green-400/20 px-1.5 py-0.5 rounded-sm">
              Adv
            </span>
          )}
        </div>
        <span className={`text-xl font-black ${done && winner === 'B' ? 'text-white' : 'text-muted'}`}>{winsB}</span>
      </div>
      {/* Series status */}
      <div className="px-4 py-2 bg-rink-700 border-t border-white/[0.07]">
        <span className="text-[10px] text-dim uppercase tracking-wider font-bold">
          {done
            ? `${winner === 'A' ? teamA.name : teamB.name} wins series`
            : winsA === winsB
              ? `Series tied ${winsA}–${winsB}`
              : `${winsA > winsB ? teamA.name : teamB.name} leads ${Math.max(winsA, winsB)}–${Math.min(winsA, winsB)}`
          }
        </span>
      </div>
    </div>
  )
}

export default async function PlayoffsPage() {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('games')
    .select(`*, home_team:teams!home_team_id(*), away_team:teams!away_team_id(*)`)
    .eq('season_id', 1)
    .eq('is_published', true)
    .in('game_type', ['playoff-qf', 'playoff-sf', 'playoff-final'])
    .order('played_at', { ascending: true })

  const games = (data ?? []) as Game[]
  const qf     = buildSeries(games, 'playoff-qf')
  const sf     = buildSeries(games, 'playoff-sf')
  const final  = buildSeries(games, 'playoff-final')

  const champion = final.find(s => s.done)
    ? (final[0].winner === 'A' ? final[0].teamA : final[0].teamB)
    : null

  const hasGames = games.length > 0

  return (
    <div className="max-w-[1000px] mx-auto px-6 py-8">

      <div className="mb-6">
        <div className="text-[11px] font-black uppercase tracking-widest text-ice-light mb-1">2025–26 Season</div>
        <h1 className="text-3xl font-black uppercase tracking-tight">Playoffs</h1>
      </div>

      {!hasGames ? (
        <div className="bg-rink-800 border border-white/[0.07] rounded-lg px-6 py-16 text-center text-[13px] text-dim">
          Playoff games have not been entered yet. Check back soon.
        </div>
      ) : (
        <div className="flex flex-col gap-8">

          {/* Champion banner */}
          {champion && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-6 py-5 flex items-center gap-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-black text-white shrink-0"
                style={{ background: champion.color }}>{champion.abbr}</div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-1">
                  2025–26 Coupe LHVA Champion
                </div>
                <div className="text-2xl font-black uppercase">{champion.name}</div>
              </div>
            </div>
          )}

          {/* Finals */}
          {final.length > 0 && (
            <div>
              <div className="text-[11px] font-black uppercase tracking-widest text-white mb-3 flex items-center gap-2">
                <span className="w-0.5 h-3.5 bg-amber-400 rounded-sm inline-block" />
                Coupe LHVA — Final
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {final.map((s, i) => <SeriesCard key={i} series={s} />)}
              </div>
            </div>
          )}

          {/* Semifinals */}
          {sf.length > 0 && (
            <div>
              <div className="text-[11px] font-black uppercase tracking-widest text-white mb-3 flex items-center gap-2">
                <span className="w-0.5 h-3.5 bg-ice rounded-sm inline-block" />
                Semifinals
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sf.map((s, i) => <SeriesCard key={i} series={s} />)}
              </div>
            </div>
          )}

          {/* Quarterfinals */}
          {qf.length > 0 && (
            <div>
              <div className="text-[11px] font-black uppercase tracking-widest text-white mb-3 flex items-center gap-2">
                <span className="w-0.5 h-3.5 bg-ice rounded-sm inline-block" />
                Quarterfinals
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {qf.map((s, i) => <SeriesCard key={i} series={s} />)}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  )
}