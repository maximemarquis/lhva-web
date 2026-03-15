'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Team, Player, GoalType } from '@/types'

interface GoalEntry {
  period: string
  time_in_period: string
  team_id: number | null
  scorer_id: number | null
  assist1_id: number | null
  assist2_id: number | null
  goal_type: GoalType
}

interface Props {
  teams: Team[]
  playersByTeam: Record<number, Player[]>
}

export function ScoreEntryForm({ teams, playersByTeam }: Props) {
  const supabase = createClient()
  const router = useRouter()

  const [homeTeamId, setHomeTeamId] = useState<number>(teams[0]?.id ?? 0)
  const [awayTeamId, setAwayTeamId] = useState<number>(teams[1]?.id ?? 0)
  const [homeScore, setHomeScore] = useState(0)
  const [awayScore, setAwayScore] = useState(0)
  const [playedAt, setPlayedAt] = useState('')
  const [gameType, setGameType] = useState('regular')
  const [overtime, setOvertime] = useState(false)
  const [shootout, setShootout] = useState(false)
  const [scorekeeper, setScorekeeper] = useState('')
  const [goals, setGoals] = useState<GoalEntry[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const addGoal = () => setGoals(g => [...g, {
    period: '1', time_in_period: '',
    team_id: homeTeamId, scorer_id: null,
    assist1_id: null, assist2_id: null,
    goal_type: 'ev',
  }])

  const updateGoal = (i: number, patch: Partial<GoalEntry>) =>
    setGoals(g => g.map((goal, idx) => idx === i ? { ...goal, ...patch } : goal))

  const removeGoal = (i: number) =>
    setGoals(g => g.filter((_, idx) => idx !== i))

  const handleResultChange = (val: string) => {
    setOvertime(val === 'ot')
    setShootout(val === 'so')
  }

  const handleSave = async (publish: boolean) => {
    setSaving(true)
    setError(null)
    try {
      const { data: game, error: gameErr } = await supabase
        .from('games')
        .insert({
          season_id: 1,
          home_team_id: homeTeamId,
          away_team_id: awayTeamId,
          home_score: homeScore,
          away_score: awayScore,
          played_at: playedAt || new Date().toISOString(),
          game_type: gameType,
          overtime,
          shootout,
          scorekeeper: scorekeeper || null,
          is_published: publish,
        })
        .select()
        .single()

      if (gameErr) throw gameErr

      if (goals.length > 0) {
        const { error: goalsErr } = await supabase.from('goals').insert(
          goals
            .filter(g => g.scorer_id !== null)
            .map(g => ({
              game_id: game.id,
              team_id: g.team_id,
              scorer_id: g.scorer_id,
              assist1_id: g.assist1_id || null,
              assist2_id: g.assist2_id || null,
              period: parseInt(g.period) || 1,
              time_in_period: g.time_in_period || '0:00',
              goal_type: g.goal_type,
            }))
        )
        if (goalsErr) throw goalsErr
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/admin')
        router.refresh()
      }, 1200)

    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const playersFor = (teamId: number | null) =>
    teamId ? (playersByTeam[teamId] ?? []) : []

  const scoreMismatch = goals.length > 0 && (homeScore + awayScore) !== goals.length

  return (
    <div className="bg-rink-800 border border-white/[0.07] rounded-lg overflow-hidden">

      {/* Team pickers + score */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-end p-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-dim">Home Team</label>
          <select value={homeTeamId} onChange={e => setHomeTeamId(Number(e.target.value))}
            className="bg-rink-700 border border-white/10 rounded px-3 py-2 text-sm text-white">
            {teams.map(t => <option key={t.id} value={t.id}>{t.name_en}</option>)}
          </select>
        </div>

        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-dim">Score</span>
          <div className="flex items-center gap-2">
            <input type="number" min={0} value={homeScore}
              onChange={e => setHomeScore(Number(e.target.value))}
              className="w-14 bg-rink-700 border border-white/10 rounded text-white text-3xl font-black text-center py-1.5 outline-none focus:border-ice/50" />
            <span className="text-xl text-dim">–</span>
            <input type="number" min={0} value={awayScore}
              onChange={e => setAwayScore(Number(e.target.value))}
              className="w-14 bg-rink-700 border border-white/10 rounded text-white text-3xl font-black text-center py-1.5 outline-none focus:border-ice/50" />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-dim">Away Team</label>
          <select value={awayTeamId} onChange={e => setAwayTeamId(Number(e.target.value))}
            className="bg-rink-700 border border-white/10 rounded px-3 py-2 text-sm text-white">
            {teams.map(t => <option key={t.id} value={t.id}>{t.name_en}</option>)}
          </select>
        </div>
      </div>

      {/* Meta */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 px-5 pb-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-dim">Date & Time</label>
          <input type="datetime-local" value={playedAt} onChange={e => setPlayedAt(e.target.value)}
            className="bg-rink-700 border border-white/10 rounded px-3 py-2 text-xs text-white outline-none focus:border-ice/50" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-dim">Game Type</label>
          <select value={gameType} onChange={e => setGameType(e.target.value)}
            className="bg-rink-700 border border-white/10 rounded px-3 py-2 text-xs text-white">
            <option value="regular">Regular Season</option>
            <option value="playoff-qf">Quarterfinal</option>
            <option value="playoff-sf">Semifinal</option>
            <option value="playoff-final">Final</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-dim">Result</label>
          <select onChange={e => handleResultChange(e.target.value)}
            className="bg-rink-700 border border-white/10 rounded px-3 py-2 text-xs text-white">
            <option value="reg">Regulation</option>
            <option value="ot">Overtime</option>
            <option value="so">Shootout</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-dim">Scorekeeper</label>
          <input type="text" value={scorekeeper} onChange={e => setScorekeeper(e.target.value)}
            placeholder="Full name"
            className="bg-rink-700 border border-white/10 rounded px-3 py-2 text-xs text-white placeholder:text-dim outline-none focus:border-ice/50" />
        </div>
      </div>

      {/* Goal log */}
      <div className="border-t border-white/[0.07] px-5 py-4">
        <div className="text-[10px] font-black uppercase tracking-widest text-dim mb-3">Goals Scored</div>

        {goals.length === 0 && (
          <div className="text-[12px] text-dim text-center py-4 border border-dashed border-white/10 rounded mb-3">
            No goals added yet — click below to add
          </div>
        )}

        <div className="flex flex-col gap-2 mb-3">
          {goals.map((g, i) => (
            <div key={i} className="grid grid-cols-[82px_1fr_1fr_1fr_1fr_68px_28px] gap-2 items-center bg-rink-700 rounded px-3 py-2">
              {/* Period + Time */}
              <div className="flex gap-1">
                <input type="text" value={g.period} placeholder="Per."
                  onChange={e => updateGoal(i, { period: e.target.value })}
                  className="w-8 bg-rink-600 border border-white/10 rounded text-white text-xs px-1.5 py-1.5 text-center outline-none focus:border-ice/50" />
                <input type="text" value={g.time_in_period} placeholder="0:00"
                  onChange={e => updateGoal(i, { time_in_period: e.target.value })}
                  className="w-12 bg-rink-600 border border-white/10 rounded text-white text-xs px-1.5 py-1.5 text-center outline-none focus:border-ice/50" />
              </div>
              {/* Team */}
              <select value={g.team_id ?? ''} onChange={e => updateGoal(i, { team_id: Number(e.target.value), scorer_id: null })}
                className="bg-rink-600 border border-white/10 rounded text-white text-xs px-2 py-1.5">
                {[homeTeamId, awayTeamId].map(tid => {
                  const t = teams.find(t => t.id === tid)
                  return t ? <option key={t.id} value={t.id}>{t.abbreviation}</option> : null
                })}
              </select>
              {/* Scorer */}
              <select value={g.scorer_id ?? ''} onChange={e => updateGoal(i, { scorer_id: Number(e.target.value) || null })}
                className="bg-rink-600 border border-white/10 rounded text-white text-xs px-2 py-1.5">
                <option value="">Scorer</option>
                {playersFor(g.team_id).map(p =>
                  <option key={p.id} value={p.id}>#{p.jersey_number} {p.last_name}</option>
                )}
              </select>
              {/* Assist 1 */}
              <select value={g.assist1_id ?? ''} onChange={e => updateGoal(i, { assist1_id: Number(e.target.value) || null })}
                className="bg-rink-600 border border-white/10 rounded text-white text-xs px-2 py-1.5">
                <option value="">Assist 1</option>
                {playersFor(g.team_id).map(p =>
                  <option key={p.id} value={p.id}>#{p.jersey_number} {p.last_name}</option>
                )}
              </select>
              {/* Assist 2 */}
              <select value={g.assist2_id ?? ''} onChange={e => updateGoal(i, { assist2_id: Number(e.target.value) || null })}
                className="bg-rink-600 border border-white/10 rounded text-white text-xs px-2 py-1.5">
                <option value="">Assist 2</option>
                {playersFor(g.team_id).map(p =>
                  <option key={p.id} value={p.id}>#{p.jersey_number} {p.last_name}</option>
                )}
              </select>
              {/* Goal type */}
              <select value={g.goal_type} onChange={e => updateGoal(i, { goal_type: e.target.value as GoalType })}
                className="bg-rink-600 border border-white/10 rounded text-white text-xs px-2 py-1.5">
                <option value="ev">EV</option>
                <option value="pp">PP</option>
                <option value="sh">SH</option>
                <option value="en">EN</option>
                <option value="so">SO</option>
              </select>
              <button onClick={() => removeGoal(i)}
                className="text-dim hover:text-red-400 border border-white/10 rounded px-1.5 py-1.5 text-sm transition-colors">
                ✕
              </button>
            </div>
          ))}
        </div>

        <button onClick={addGoal}
          className="w-full text-[11px] font-black uppercase tracking-wider text-muted border border-dashed border-white/10 rounded py-2 hover:bg-white/[0.03] hover:text-white transition-colors">
          + Add Goal
        </button>
      </div>

      {/* Footer actions */}
      <div className="border-t border-white/[0.07] px-5 py-3 flex items-center justify-between">
        <div className="text-xs text-dim">
          {goals.length} goal{goals.length !== 1 ? 's' : ''} entered
          {scoreMismatch && (
            <span className="text-amber-400 ml-2">
              ⚠ Score ({homeScore + awayScore}) ≠ goals entered ({goals.length})
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {error && <span className="text-red-400 text-xs">{error}</span>}
          {success && <span className="text-green-400 text-xs">Saved! Redirecting…</span>}
          <button onClick={() => handleSave(false)} disabled={saving}
            className="px-3 py-1.5 text-xs font-bold border border-white/10 rounded text-muted hover:bg-white/[0.04] hover:text-white disabled:opacity-50 transition-colors">
            Save Draft
          </button>
          <button onClick={() => handleSave(true)} disabled={saving}
            className="px-4 py-1.5 text-xs font-bold bg-ice hover:bg-ice-light text-white rounded disabled:opacity-50 transition-colors">
            {saving ? 'Saving…' : 'Publish Score'}
          </button>
        </div>
      </div>

    </div>
  )
}