import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Game } from '@/types'

export const revalidate = 60

// ── Types ──────────────────────────────────────────────────
interface TeamInfo {
  id:    number
  name:  string
  abbr:  string
  color: string
}

interface GameResult {
  scoreA: number | null
  scoreB: number | null
}

interface Series {
  label:   string
  teamA:   TeamInfo
  teamB:   TeamInfo
  winsA:   number
  winsB:   number
  games:   GameResult[]
  done:    boolean
  winner:  'A' | 'B' | null
  round:   string
}

const MAX_GAMES = 7

// ── Build series from raw games ─────────────────────────────
function buildSeries(games: Game[], round: string): Series[] {
  const roundGames = games.filter(g => g.game_type === round)
  const pairs: Record<string, Game[]> = {}

  for (const game of roundGames) {
    const key = [game.home_team_id, game.away_team_id].sort().join('-')
    if (!pairs[key]) pairs[key] = []
    pairs[key].push(game)
  }

  return Object.values(pairs).map((seriesGames, index) => {
    const sorted = [...seriesGames].sort(
      (a, b) => new Date(a.played_at).getTime() - new Date(b.played_at).getTime()
    )
    const first  = sorted[0]
    const aId    = Math.min(first.home_team_id, first.away_team_id)
    const bId    = Math.max(first.home_team_id, first.away_team_id)
    const teamAData = first.home_team_id === aId ? first.home_team : first.away_team
    const teamBData = first.home_team_id === bId ? first.home_team : first.away_team

    let winsA = 0, winsB = 0
    const gameResults: GameResult[] = sorted.map(g => {
      if (g.home_score === null) return { scoreA: null, scoreB: null }
      const isHomeA = g.home_team_id === aId
      const scoreA = isHomeA ? g.home_score! : g.away_score!
      const scoreB = isHomeA ? g.away_score! : g.home_score!
      if (scoreA > scoreB) winsA++; else winsB++
      return { scoreA, scoreB }
    })

    const seriesLabel =
      round === 'playoff-final'  ? 'Championship Final' :
      round === 'playoff-sf'     ? `Semi-Finals — Series ${index + 1}` :
      round === 'playoff-qf'     ? `Quarter-Finals — Series ${index + 1}` :
      `Series ${index + 1}`

    const done = winsA >= 4 || winsB >= 4
    return {
      label:  seriesLabel,
      teamA:  { id: aId, name: teamAData?.name_en ?? '', abbr: teamAData?.abbreviation ?? '', color: teamAData?.color ?? '#333' },
      teamB:  { id: bId, name: teamBData?.name_en ?? '', abbr: teamBData?.abbreviation ?? '', color: teamBData?.color ?? '#333' },
      winsA, winsB,
      games:  gameResults,
      done,
      winner: done ? (winsA >= 4 ? 'A' : 'B') : null,
      round,
    }
  })
}

// ── Score box ───────────────────────────────────────────────
function ScoreBox({ score, won }: { score: number | null; won: boolean }) {
  return (
    <div className={`w-[22px] h-[22px] flex items-center justify-center text-[10px] font-black rounded-sm border flex-shrink-0 ${
      score === null
        ? 'border-white/10 text-white/20'
        : won
          ? 'bg-white/[0.18] border-white/20 text-white'
          : 'border-white/10 text-dim'
    }`}>
      {score !== null ? score : '·'}
    </div>
  )
}

// ── Series card ─────────────────────────────────────────────
function SeriesCard({ series }: { series: Series }) {
  const { teamA, teamB, winsA, winsB, done, winner, games, label } = series
  const slots = Array.from({ length: MAX_GAMES }, (_, i) => games[i] ?? null)

  const statusText = done
    ? `${winner === 'A' ? teamA.name : teamB.name} wins series`
    : winsA === 0 && winsB === 0
      ? 'Series not yet started'
      : winsA === winsB
        ? `Series tied ${winsA}–${winsB}`
        : `${winsA > winsB ? teamA.abbr : teamB.abbr} leads ${Math.max(winsA, winsB)}–${Math.min(winsA, winsB)}`

  return (
    <div className={`bg-rink-800 rounded-lg overflow-hidden w-full border ${
      done ? 'border-white/[0.12]' : 'border-white/[0.07]'
    }`}>
      {/* Label */}
      <div className="px-3 py-1.5 bg-rink-700 border-b border-white/[0.07] flex items-center justify-between">
        <span className="text-[9px] font-black uppercase tracking-widest text-dim">{label}</span>
        <span className="text-[9px] text-white/20 font-bold">Bo7</span>
      </div>

      {/* Team A */}
      <div className={`flex items-center gap-2.5 px-3 py-2.5 border-b border-white/[0.04] ${done && winner === 'A' ? 'bg-white/[0.025]' : ''}`}>
        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[7px] font-black text-white shrink-0"
          style={{ background: teamA.color }}>{teamA.abbr}</div>
        <span className={`text-[12px] font-semibold flex-1 min-w-0 truncate ${done && winner !== 'A' ? 'text-dim' : 'text-white'}`}>
          {teamA.name}
        </span>
        <div className="flex gap-[3px] shrink-0">
          {slots.map((g, i) => (
            <ScoreBox key={i}
              score={g?.scoreA ?? null}
              won={g !== null && g.scoreA !== null && g.scoreA! > (g.scoreB ?? -1)} />
          ))}
        </div>
        <span className={`text-[16px] font-black w-5 text-right shrink-0 ${done && winner === 'A' ? 'text-white' : 'text-muted'}`}>
          {winsA}
        </span>
      </div>

      {/* Team B */}
      <div className={`flex items-center gap-2.5 px-3 py-2.5 ${done && winner === 'B' ? 'bg-white/[0.025]' : ''}`}>
        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[7px] font-black text-white shrink-0"
          style={{ background: teamB.color }}>{teamB.abbr}</div>
        <span className={`text-[12px] font-semibold flex-1 min-w-0 truncate ${done && winner !== 'B' ? 'text-dim' : 'text-white'}`}>
          {teamB.name}
        </span>
        <div className="flex gap-[3px] shrink-0">
          {slots.map((g, i) => (
            <ScoreBox key={i}
              score={g?.scoreB ?? null}
              won={g !== null && g.scoreB !== null && g.scoreB! > (g.scoreA ?? -1)} />
          ))}
        </div>
        <span className={`text-[16px] font-black w-5 text-right shrink-0 ${done && winner === 'B' ? 'text-white' : 'text-muted'}`}>
          {winsB}
        </span>
      </div>

      {/* Status */}
      <div className={`px-3 py-1.5 border-t border-white/[0.07] ${done ? 'bg-green-500/5' : 'bg-rink-700'}`}>
        <span className={`text-[9px] font-bold uppercase tracking-wider ${done ? 'text-green-400' : 'text-dim'}`}>
          {statusText}
        </span>
      </div>
    </div>
  )
}

// ── TBD placeholder card ────────────────────────────────────
function TBDCard({ label }: { label: string }) {
  return (
    <div className="bg-rink-800 border border-dashed border-white/[0.07] rounded-lg overflow-hidden w-full">
      <div className="px-3 py-1.5 bg-rink-700 border-b border-white/[0.07]">
        <span className="text-[9px] font-black uppercase tracking-widest text-dim">{label}</span>
      </div>
      <div className="px-3 py-8 text-center text-[12px] text-dim/50">TBD</div>
    </div>
  )
}

// ── Round header ────────────────────────────────────────────
function RoundHeader({ label, accent = false }: { label: string; accent?: boolean }) {
  return (
    <div className={`rounded px-4 py-2 text-center border ${
      accent
        ? 'bg-ice/10 border-ice/20'
        : 'bg-rink-700 border-white/[0.07]'
    }`}>
      <span className={`text-[11px] font-black uppercase tracking-widest ${accent ? 'text-ice-light' : 'text-muted'}`}>
        {label}
      </span>
    </div>
  )
}

// ── Bracket connector (CSS lines) ──────────────────────────
// Splits into 4 flex-1 parts; middle two form the ─┐ and ─┘ shapes.
// Works best when both SF cards are equal height.
function BracketConnector() {
  return (
    <div className="flex flex-col self-stretch w-10 flex-shrink-0">
      <div className="h-9 flex-shrink-0" /> {/* offset for round header */}
      <div className="flex-1" />
      <div className="flex-1 border-t-2 border-r-2 border-white/[0.12]" />
      <div className="flex-1 border-b-2 border-r-2 border-white/[0.12]" />
      <div className="flex-1" />
    </div>
  )
}

// ── Page ────────────────────────────────────────────────────
export default async function PlayoffsPage() {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('games')
    .select(`*, home_team:teams!home_team_id(*), away_team:teams!away_team_id(*)`)
    .eq('season_id', 1)
    .eq('is_published', true)
    .in('game_type', ['playoff-qf', 'playoff-sf', 'playoff-final'])
    .order('played_at', { ascending: true })

  const games   = (data ?? []) as Game[]
  const qf      = buildSeries(games, 'playoff-qf')
  const sf      = buildSeries(games, 'playoff-sf')
  const finals  = buildSeries(games, 'playoff-final')
  const hasGames = games.length > 0

  const champion = finals.find(s => s.done)
    ? (finals[0].winner === 'A' ? finals[0].teamA : finals[0].teamB)
    : null

  // Determine bracket shape
  const hasQF     = qf.length > 0
  const hasSF     = sf.length > 0
  const hasFinal  = finals.length > 0

  return (
    <div className="max-w-[1100px] mx-auto px-4 md:px-6 py-8">

      {/* Page header */}
      <div className="mb-8">
        <div className="text-[11px] font-black uppercase tracking-widest text-ice-light mb-1">2025–26 Season</div>
        <h1 className="text-3xl font-black uppercase tracking-tight">Playoffs</h1>
      </div>

      {!hasGames ? (
        <div className="bg-rink-800 border border-white/[0.07] rounded-lg px-6 py-16 text-center text-[13px] text-dim">
          Playoff games have not been entered yet. Check back soon.
        </div>
      ) : (
        <div className="flex flex-col gap-10">

          {/* Champion banner */}
          {champion && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-6 py-5 flex items-center gap-4">
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

          {/* ── Desktop horizontal bracket ──────────────────── */}
          <div className="hidden lg:block">
            <div className="flex items-stretch gap-0">

              {/* QF column (if any) */}
              {hasQF && (
                <>
                  <div className="flex flex-col gap-3 flex-1 min-w-0">
                    <RoundHeader label="Quarter-Finals" />
                    {qf.map((s, i) => <SeriesCard key={i} series={s} />)}
                  </div>
                  <BracketConnector />
                  <div className="self-center w-3 h-px bg-white/[0.12] flex-shrink-0" />
                </>
              )}

              {/* SF column */}
              {(hasSF || hasQF) && (
                <>
                  <div className="flex flex-col gap-3 flex-1 min-w-0">
                    <RoundHeader label="Semi-Finals" />
                    {hasSF
                      ? sf.map((s, i) => <SeriesCard key={i} series={s} />)
                      : [0, 1].map(i => <TBDCard key={i} label={`Semi-Finals — Series ${i + 1}`} />)
                    }
                  </div>
                  <BracketConnector />
                  <div className="self-center w-3 h-px bg-white/[0.12] flex-shrink-0" />
                </>
              )}

              {/* Final column */}
              <div className="flex flex-col gap-3 flex-1 min-w-0">
                <RoundHeader label="Championship Final" accent />
                <div className="flex items-center flex-1">
                  {hasFinal
                    ? <SeriesCard series={finals[0]} />
                    : <TBDCard label="Championship Final" />
                  }
                </div>
              </div>

            </div>
          </div>

          {/* ── Mobile stacked layout ───────────────────────── */}
          <div className="lg:hidden flex flex-col gap-8">

            {hasFinal && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-0.5 h-3.5 bg-amber-400 rounded-sm inline-block" />
                  <span className="text-[11px] font-black uppercase tracking-widest text-white">Championship Final</span>
                </div>
                {finals.map((s, i) => <SeriesCard key={i} series={s} />)}
              </div>
            )}

            {hasSF && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-0.5 h-3.5 bg-ice rounded-sm inline-block" />
                  <span className="text-[11px] font-black uppercase tracking-widest text-white">Semi-Finals</span>
                </div>
                {sf.map((s, i) => <SeriesCard key={i} series={s} />)}
              </div>
            )}

            {hasQF && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-0.5 h-3.5 bg-ice/60 rounded-sm inline-block" />
                  <span className="text-[11px] font-black uppercase tracking-widest text-white">Quarter-Finals</span>
                </div>
                {qf.map((s, i) => <SeriesCard key={i} series={s} />)}
              </div>
            )}

          </div>

        </div>
      )}
    </div>
  )
}
