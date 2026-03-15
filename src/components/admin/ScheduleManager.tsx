'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Team, Game } from '@/types'

interface Props {
  teams: Team[]
  initialGames: Game[]
}

interface GameForm {
  home_team_id: number
  away_team_id: number
  played_at: string
  game_type: string
}

const GAME_TYPE_LABEL: Record<string, string> = {
  regular:        'Regular Season',
  'playoff-qf':   'Quarterfinal',
  'playoff-sf':   'Semifinal',
  'playoff-final':'Final',
}

const EMPTY_FORM = (teams: Team[]): GameForm => ({
  home_team_id: teams[0]?.id ?? 0,
  away_team_id: teams[1]?.id ?? 0,
  played_at:    '',
  game_type:    'regular',
})

export function ScheduleManager({ teams, initialGames }: Props) {
  const supabase = createClient()
  const router = useRouter()

  const [games, setGames] = useState<Game[]>(initialGames)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<GameForm>(EMPTY_FORM(teams))
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'played'>('all')

  const filtered = games.filter(g => {
    if (filter === 'upcoming') return new Date(g.played_at) >= new Date()
    if (filter === 'played')   return new Date(g.played_at) < new Date()
    return true
  })

  // Group by month
  const grouped: Record<string, Game[]> = {}
  for (const game of filtered) {
    const month = new Date(game.played_at).toLocaleDateString('en-CA', {
      month: 'long', year: 'numeric',
    })
    if (!grouped[month]) grouped[month] = []
    grouped[month].push(game)
  }

  const handleAdd = async () => {
    if (!form.played_at) { setError('Date & time is required'); return }
    if (form.home_team_id === form.away_team_id) { setError('Home and away teams must be different'); return }
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

    setGames(g => [...g, data as Game].sort(
      (a, b) => new Date(a.played_at).getTime() - new Date(b.played_at).getTime()
    ))
    setShowForm(false)
    setForm(EMPTY_FORM(teams))
    setSaving(false)
    router.refresh()
  }

  const handleDelete = async (game: Game) => {
    if (game.home_score !== null) {
      if (!confirm('This game has a score entered. Delete it anyway?')) return
    } else {
      if (!confirm(`Delete this game?`)) return
    }
    setDeleting(game.id)
    await supabase.from('games').delete().eq('id', game.id)
    setGames(g => g.filter(x => x.id !== game.id))
    setDeleting(null)
    router.refresh()
  }

  const togglePublish = async (game: Game) => {
    const next = !game.is_published
    await supabase.from('games').update({ is_published: next }).eq('id', game.id)
    setGames(g => g.map(x => x.id === game.id ? { ...x, is_published: next } : x))
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-rink-700 border border-white/[0.07] rounded p-1">
          {(['all', 'upcoming', 'played'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded transition-colors ${
                filter === f ? 'bg-rink-500 text-white' : 'text-muted hover:text-white'
              }`}>
              {f}
            </button>
          ))}
        </div>
        <button onClick={() => { setShowForm(true); setError(null) }}
          className="px-4 py-1.5 text-[12px] font-bold bg-ice hover:bg-ice-light text-white rounded transition-colors">
          + Add Game
        </button>
      </div>

      {/* Add game form */}
      {showForm && (
        <div className="bg-rink-800 border border-ice/30 rounded-lg p-5 flex flex-col gap-4">
          <div className="text-[11px] font-black uppercase tracking-widest text-ice-light">New Game</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              <label className="text-[10px] font-black uppercase tracking-widest text-dim">Game Type</label>
              <select value={form.game_type} onChange={e => setForm(f => ({ ...f, game_type: e.target.value }))}
                className="bg-rink-700 border border-white/10 rounded px-3 py-2 text-sm text-white">
                {Object.entries(GAME_TYPE_LABEL).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
          </div>
          {error && <div className="text-[12px] text-red-400">{error}</div>}
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)}
              className="px-3 py-1.5 text-[12px] font-bold border border-white/10 rounded text-muted hover:text-white transition-colors">
              Cancel
            </button>
            <button onClick={handleAdd} disabled={saving}
              className="px-4 py-1.5 text-[12px] font-bold bg-ice hover:bg-ice-light text-white rounded disabled:opacity-50 transition-colors">
              {saving ? 'Saving…' : 'Add Game'}
            </button>
          </div>
        </div>
      )}

      {/* Game list */}
      {Object.keys(grouped).length === 0 ? (
        <div className="bg-rink-800 border border-white/[0.07] rounded-lg px-6 py-12 text-center text-[13px] text-dim">
          No games yet. Click <span className="text-ice-light">+ Add Game</span> to get started.
        </div>
      ) : (
        Object.entries(grouped).map(([month, monthGames]) => (
          <div key={month}>
            <div className="text-[10px] font-black uppercase tracking-widest text-dim mb-2 px-1">{month}</div>
            <div className="bg-rink-800 border border-white/[0.07] rounded-lg overflow-hidden">
              {monthGames.map(game => (
                <div key={game.id}
                  className="flex flex-col sm:grid sm:grid-cols-[1fr_auto_1fr_auto_auto_auto] sm:items-center sm:gap-4 px-4 py-3 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors gap-2">

                  {/* Mobile: teams + score row */}
                  <div className="flex items-center gap-2 sm:contents">
                    {/* Home */}
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-black text-white shrink-0"
                        style={{ background: game.home_team?.color ?? '#333' }}>
                        {game.home_team?.abbreviation}
                      </div>
                      <span className="text-[13px] font-semibold text-white truncate">{game.home_team?.name_en}</span>
                    </div>

                    {/* Score or time */}
                    <div className="text-center min-w-[80px] shrink-0">
                      {game.home_score !== null ? (
                        <span className="text-[14px] font-black text-white">
                          {game.home_score} – {game.away_score}
                        </span>
                      ) : (
                        <span className="text-[12px] font-bold text-ice-light">
                          {new Date(game.played_at).toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit' })}
                        </span>
                      )}
                      <div className="text-[9px] text-dim uppercase tracking-wider">
                        {new Date(game.played_at).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>

                    {/* Away */}
                    <div className="flex items-center gap-2 justify-end flex-1 min-w-0">
                      <span className="text-[13px] font-semibold text-white truncate">{game.away_team?.name_en}</span>
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-black text-white shrink-0"
                        style={{ background: game.away_team?.color ?? '#333' }}>
                        {game.away_team?.abbreviation}
                      </div>
                    </div>
                  </div>

                  {/* Actions row (mobile: full width; desktop: inline) */}
                  <div className="flex items-center gap-2 sm:contents">
                    {/* Type badge */}
                    <span className="text-[10px] font-bold text-dim uppercase tracking-wider whitespace-nowrap hidden lg:block">
                      {GAME_TYPE_LABEL[game.game_type] ?? game.game_type}
                    </span>

                    {/* Publish toggle */}
                    <button onClick={() => togglePublish(game)}
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-sm border transition-colors whitespace-nowrap ${
                        game.is_published
                          ? 'bg-ice/10 text-ice-light border-ice/20 hover:bg-red-500/10 hover:text-red-400 hover:border-red-400/20'
                          : 'bg-white/5 text-dim border-white/10 hover:bg-ice/10 hover:text-ice-light hover:border-ice/20'
                      }`}>
                      {game.is_published ? 'Published' : 'Draft'}
                    </button>

                    {/* Delete */}
                    <button onClick={() => handleDelete(game)} disabled={deleting === game.id}
                      className="text-[11px] font-bold text-dim hover:text-red-400 border border-white/10 hover:border-red-400/20 rounded px-2.5 py-1 transition-colors disabled:opacity-50">
                      {deleting === game.id ? '…' : 'Del'}
                    </button>
                  </div>

                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}