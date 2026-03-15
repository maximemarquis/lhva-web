'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Team, Game } from '@/types'

interface Props {
  teams: Team[]
  games: Game[]
}

const ROUNDS = [
  { value: 'playoff-qf',    label: 'Quarterfinals',  short: 'QF' },
  { value: 'playoff-sf',    label: 'Semifinals',     short: 'SF' },
  { value: 'playoff-final', label: 'Final',          short: 'F'  },
]

interface SeriesGame {
  id: number
  played_at: string
  home_team: Team | null
  away_team: Team | null
  home_score: number | null
  away_score: number | null
  is_published: boolean
}

interface GameForm {
  home_team_id: number
  away_team_id: number
  played_at: string
  game_type: string
}

export function PlayoffsManager({ teams, games: initialGames }: Props) {
  const supabase = createClient()
  const router = useRouter()

  const [games, setGames] = useState<Game[]>(initialGames)
  const [activeRound, setActiveRound] = useState('playoff-sf')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<GameForm>({
    home_team_id: teams[0]?.id ?? 0,
    away_team_id: teams[1]?.id ?? 0,
    played_at: '',
    game_type: 'playoff-sf',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const roundGames = games.filter(g => g.game_type === activeRound)

  // Build series summaries
  const seriesMap: Record<string, { games: Game[]; teamA: Team | null; teamB: Team | null; winsA: number; winsB: number }> = {}
  for (const game of roundGames) {
    const key = [game.home_team_id, game.away_team_id].sort().join('-')
    if (!seriesMap[key]) {
      const aId = Math.min(game.home_team_id, game.away_team_id)
      const bId = Math.max(game.home_team_id, game.away_team_id)
      seriesMap[key] = {
        games: [],
        teamA: game.home_team_id === aId ? (game.home_team ?? null) : (game.away_team ?? null),
        teamB: game.home_team_id === bId ? (game.home_team ?? null) : (game.away_team ?? null),
        winsA: 0, winsB: 0,
      }
    }
    seriesMap[key].games.push(game)
    if (game.home_score !== null) {
      const aId = Math.min(game.home_team_id, game.away_team_id)
      const homeWon = (game.home_score ?? 0) > (game.away_score ?? 0)
      if (game.home_team_id === aId) homeWon ? seriesMap[key].winsA++ : seriesMap[key].winsB++
      else homeWon ? seriesMap[key].winsB++ : seriesMap[key].winsA++
    }
  }

  const handleAddGame = async () => {
    if (!form.played_at) { setError('Date & time is required'); return }
    if (form.home_team_id === form.away_team_id) { setError('Teams must be different'); return }
    setSaving(true)
    setError(null)

    const { data, error: saveErr } = await supabase
      .from('games')
      .insert({
        season_id:    1,
        home_team_id: form.home_team_id,
        away_team_id: form.away_team_id,
        played_at:    new Date(form.played_at).toISOString(),
        game_type:    form.game_type,
        is_published: true,
      })
      .select(`*, home_team:teams!home_team_id(*), away_team:teams!away_team_id(*)`)
      .single()

    if (saveErr) { setError(saveErr.message); setSaving(false); return }
    setGames(g => [...g, data as Game])
    setShowForm(false)
    setActiveRound(form.game_type)
    setSaving(false)
    router.refresh()
  }

  const handleDelete = async (game: Game) => {
    if (!confirm('Delete this playoff game?')) return
    await supabase.from('games').delete().eq('id', game.id)
    setGames(g => g.filter(x => x.id !== game.id))
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-5">

      {/* Round tabs */}
      <div className="flex gap-1 border-b border-white/[0.07] pb-0">
        {ROUNDS.map(round => (
          <button key={round.value} onClick={() => setActiveRound(round.value)}
            className={`px-5 py-2.5 text-[12px] font-bold uppercase tracking-wider border-b-2 -mb-px transition-colors ${
              activeRound === round.value
                ? 'text-white border-ice'
                : 'text-muted border-transparent hover:text-white'
            }`}>
            {round.label}
            <span className="ml-1.5 text-[10px] text-dim">
              ({games.filter(g => g.game_type === round.value).length})
            </span>
          </button>
        ))}
        <button onClick={() => { setShowForm(true); setForm(f => ({ ...f, game_type: activeRound })); setError(null) }}
          className="ml-auto px-4 py-1.5 text-[12px] font-bold bg-ice hover:bg-ice-light text-white rounded mb-1 transition-colors">
          + Add Game
        </button>
      </div>

      {/* Add game form */}
      {showForm && (
        <div className="bg-rink-800 border border-ice/30 rounded-lg p-5 flex flex-col gap-4">
          <div className="text-[11px] font-black uppercase tracking-widest text-ice-light">
            New {ROUNDS.find(r => r.value === form.game_type)?.label} Game
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-dim">Home Team</label>
              <select value={form.home_team_id} onChange={e => setForm(f => ({ ...f, home_team_id: Number(e.target.value) }))}
                className="bg-rink-700 border border-white/10 rounded px-3 py-2 text-sm text-white">
                {teams.map(t => <option key={t.id} value={t.id}>{t.name_en}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-dim">Away Team</label>
              <select value={form.away_team_id} onChange={e => setForm(f => ({ ...f, away_team_id: Number(e.target.value) }))}
                className="bg-rink-700 border border-white/10 rounded px-3 py-2 text-sm text-white">
                {teams.map(t => <option key={t.id} value={t.id}>{t.name_en}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-dim">Date & Time</label>
              <input type="datetime-local" value={form.played_at}
                onChange={e => setForm(f => ({ ...f, played_at: e.target.value }))}
                className="bg-rink-700 border border-white/10 rounded px-3 py-2 text-sm text-white outline-none focus:border-ice/50" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-dim">Round</label>
              <select value={form.game_type} onChange={e => setForm(f => ({ ...f, game_type: e.target.value }))}
                className="bg-rink-700 border border-white/10 rounded px-3 py-2 text-sm text-white">
                {ROUNDS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
          </div>
          {error && <div className="text-[12px] text-red-400">{error}</div>}
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)}
              className="px-3 py-1.5 text-[12px] font-bold border border-white/10 rounded text-muted hover:text-white transition-colors">
              Cancel
            </button>
            <button onClick={handleAddGame} disabled={saving}
              className="px-4 py-1.5 text-[12px] font-bold bg-ice hover:bg-ice-light text-white rounded disabled:opacity-50 transition-colors">
              {saving ? 'Saving…' : 'Add Game'}
            </button>
          </div>
        </div>
      )}

      {/* Series view */}
      {Object.keys(seriesMap).length === 0 ? (
        <div className="bg-rink-800 border border-white/[0.07] rounded-lg px-6 py-12 text-center text-[13px] text-dim">
          No {ROUNDS.find(r => r.value === activeRound)?.label.toLowerCase()} games yet.{' '}
          <button onClick={() => { setShowForm(true); setError(null) }} className="text-ice-light hover:underline">
            Add the first one →
          </button>
        </div>
      ) : (
        Object.entries(seriesMap).map(([key, series]) => (
          <div key={key} className="bg-rink-800 border border-white/[0.07] rounded-lg overflow-hidden">
            {/* Series header */}
            <div className="px-4 py-3 bg-rink-700 border-b border-white/[0.07] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-black text-white"
                    style={{ background: series.teamA?.color }}>{series.teamA?.abbreviation}</div>
                  <span className="text-[13px] font-bold text-white">{series.teamA?.name_en}</span>
                </div>
                <div className="text-[16px] font-black text-white px-2">
                  {series.winsA} – {series.winsB}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-white">{series.teamB?.name_en}</span>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-black text-white"
                    style={{ background: series.teamB?.color }}>{series.teamB?.abbreviation}</div>
                </div>
              </div>
              <div className="text-[11px] text-dim">
                {series.games.length} game{series.games.length !== 1 ? 's' : ''} played
              </div>
            </div>

            {/* Individual games */}
            {series.games.map((game, i) => (
              <div key={game.id}
                className="flex items-center gap-4 px-4 py-2.5 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors">
                <span className="text-[11px] text-dim min-w-[50px]">Game {i + 1}</span>
                <span className="text-[12px] text-muted">
                  {new Date(game.played_at).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}
                </span>
                <div className="flex-1 flex items-center gap-2 text-[12px]">
                  <span className={game.home_score !== null && (game.home_score ?? 0) > (game.away_score ?? 0) ? 'text-white font-bold' : 'text-muted'}>
                    {game.home_team?.abbreviation}
                  </span>
                  {game.home_score !== null ? (
                    <span className="font-black text-white">{game.home_score} – {game.away_score}</span>
                  ) : (
                    <span className="text-ice-light font-bold">
                      {new Date(game.played_at).toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit' })}
                    </span>
                  )}
                  <span className={game.home_score !== null && (game.away_score ?? 0) > (game.home_score ?? 0) ? 'text-white font-bold' : 'text-muted'}>
                    {game.away_team?.abbreviation}
                  </span>
                </div>
                {game.home_score === null && (
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-sm">
                    Upcoming
                  </span>
                )}
                <button onClick={() => handleDelete(game)}
                  className="text-[11px] font-bold text-dim hover:text-red-400 border border-white/10 hover:border-red-400/20 rounded px-2 py-1 transition-colors">
                  Del
                </button>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  )
}