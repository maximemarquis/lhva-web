'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Team, Player, GoalType, LineupRole, StaffRole, GoalieDecision } from '@/types'

// ── Types ──────────────────────────────────────────────────
interface GoalEntry {
  period: string; time_in_period: string
  team_id: number | null; scorer_id: number | null
  assist1_id: number | null; assist2_id: number | null
  goal_type: GoalType
}
interface PenaltyEntry {
  period: string; time_in_period: string
  team_id: number | null; player_id: number | null
  infraction: string; minutes: string
}
interface LineupEntry { role: LineupRole; player_id: number | null; team_id: number }
interface StaffEntry  { team_id: number; name: string; role: StaffRole }
interface GoalieEntry {
  player_id: number | null; team_id: number
  shots_against: string; saves: string
  toi_minutes: string; decision: GoalieDecision | ''
  shutout: boolean
}
interface PPEntry { team_id: number; pp_opportunities: string; pp_goals: string }

interface Props {
  teams: Team[]
  playersByTeam: Record<number, Player[]>
  gameId?: number
}

// ── Constants ──────────────────────────────────────────────
const TABS = ['Score', 'Lineup', 'Penalties', 'Goalies', 'PP Stats', 'Staff'] as const
type Tab = typeof TABS[number]

const FORWARD_ROLES: { role: LineupRole; label: string }[] = [
  { role: 'F1L', label: 'L' }, { role: 'F1C', label: 'C' }, { role: 'F1R', label: 'R' },
  { role: 'F2L', label: 'L' }, { role: 'F2C', label: 'C' }, { role: 'F2R', label: 'R' },
  { role: 'F3L', label: 'L' }, { role: 'F3C', label: 'C' }, { role: 'F3R', label: 'R' },
  { role: 'F4L', label: 'L' }, { role: 'F4C', label: 'C' }, { role: 'F4R', label: 'R' },
]
const DEFENCE_ROLES: { role: LineupRole; label: string }[] = [
  { role: 'D1L', label: 'L' }, { role: 'D1R', label: 'R' },
  { role: 'D2L', label: 'L' }, { role: 'D2R', label: 'R' },
  { role: 'D3L', label: 'L' }, { role: 'D3R', label: 'R' },
]
const GOALIE_ROLES: { role: LineupRole; label: string }[] = [
  { role: 'G1', label: 'Starter' }, { role: 'G2', label: 'Backup' },
]
const SCRATCH_ROLES: LineupRole[] = ['scratch', 'healthy_scratch']

const STAFF_ROLES: { value: StaffRole; label: string }[] = [
  { value: 'head_coach',       label: 'Head Coach' },
  { value: 'assistant_coach',  label: 'Assistant Coach' },
  { value: 'goalie_coach',     label: 'Goalie Coach' },
  { value: 'trainer',          label: 'Trainer' },
  { value: 'manager',          label: 'Manager' },
]

const DECISIONS: { value: GoalieDecision; label: string }[] = [
  { value: 'W',   label: 'Win' },
  { value: 'L',   label: 'Loss' },
  { value: 'OTW', label: 'OT Win' },
  { value: 'OTL', label: 'OT Loss' },
  { value: 'SOW', label: 'SO Win' },
  { value: 'SOL', label: 'SO Loss' },
  { value: 'ND',  label: 'No Decision' },
]

const INFRACTIONS = [
  'Hooking', 'Tripping', 'Roughing', 'Slashing', 'High Sticking',
  'Interference', 'Holding', 'Cross-Checking', 'Charging', 'Boarding',
  'Elbowing', 'Kneeing', 'Fighting', 'Unsportsmanlike Conduct',
  'Too Many Men', 'Delay of Game', 'Misconduct', 'Game Misconduct',
  'Match Penalty', 'Checking from Behind',
]

// ── Helpers ────────────────────────────────────────────────
const cls = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ')
const inputCls = 'bg-rink-700 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder:text-dim outline-none focus:border-ice/50 transition-colors'
const selectCls = `${inputCls} cursor-pointer`
const btnGhost = 'px-3 py-1.5 text-xs font-bold border border-white/10 rounded text-muted hover:text-white hover:bg-white/[0.04] transition-colors disabled:opacity-50'
const btnPrimary = 'px-4 py-1.5 text-xs font-bold bg-ice hover:bg-ice-light text-white rounded transition-colors disabled:opacity-50'

// ── Component ──────────────────────────────────────────────
export function ScoreEntryForm({ teams, playersByTeam, gameId }: Props) {
  const supabase = createClient()
  const router = useRouter()

  // Core game state
  const [homeTeamId, setHomeTeamId] = useState(teams[0]?.id ?? 0)
  const [awayTeamId, setAwayTeamId] = useState(teams[1]?.id ?? 0)
  const [homeScore, setHomeScore]   = useState(0)
  const [awayScore, setAwayScore]   = useState(0)
  const [playedAt, setPlayedAt]     = useState('')
  const [gameType, setGameType]     = useState('regular')
  const [overtime, setOvertime]     = useState(false)
  const [shootout, setShootout]     = useState(false)
  const [scorekeeper, setScorekeeper] = useState('')

  // Tab state
  const [tab, setTab] = useState<Tab>('Score')

  // Goals
  const [goals, setGoals] = useState<GoalEntry[]>([])

  // Penalties
  const [penalties, setPenalties] = useState<PenaltyEntry[]>([])

  // Lineup — one entry per role per team
  const makeLineup = (teamId: number): LineupEntry[] => [
    ...FORWARD_ROLES.map(r => ({ role: r.role, player_id: null, team_id: teamId })),
    ...DEFENCE_ROLES.map(r => ({ role: r.role, player_id: null, team_id: teamId })),
    ...GOALIE_ROLES.map(r => ({ role: r.role, player_id: null, team_id: teamId })),
  ]
  const [homeLineup, setHomeLineup] = useState<LineupEntry[]>(() => makeLineup(teams[0]?.id ?? 0))
  const [awayLineup, setAwayLineup] = useState<LineupEntry[]>(() => makeLineup(teams[1]?.id ?? 0))
  const [homeScratches, setHomeScratches] = useState<number[]>([])
  const [awayScratches, setAwayScratches] = useState<number[]>([])

  // Goalie stats
  const [goalieStats, setGoalieStats] = useState<GoalieEntry[]>([
    { player_id: null, team_id: teams[0]?.id ?? 0, shots_against: '', saves: '', toi_minutes: '', decision: '', shutout: false },
    { player_id: null, team_id: teams[1]?.id ?? 0, shots_against: '', saves: '', toi_minutes: '', decision: '', shutout: false },
  ])

  // PP stats
  const [ppStats, setPPStats] = useState<PPEntry[]>([
    { team_id: teams[0]?.id ?? 0, pp_opportunities: '', pp_goals: '' },
    { team_id: teams[1]?.id ?? 0, pp_opportunities: '', pp_goals: '' },
  ])

  // Staff
  const [staff, setStaff] = useState<StaffEntry[]>([])

  // UI state
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const playersFor = (teamId: number | null) => teamId ? (playersByTeam[teamId] ?? []) : []
  const goaliesFor = (teamId: number) => playersFor(teamId).filter(p => p.position === 'G')
  const skatersFor = (teamId: number) => playersFor(teamId).filter(p => p.position !== 'G')

  // ── Update helpers ──
  const updateGoal = (i: number, patch: Partial<GoalEntry>) =>
    setGoals(g => g.map((x, idx) => idx === i ? { ...x, ...patch } : x))
  const updatePenalty = (i: number, patch: Partial<PenaltyEntry>) =>
    setPenalties(p => p.map((x, idx) => idx === i ? { ...x, ...patch } : x))
  const updateLineup = (lineup: LineupEntry[], set: (v: LineupEntry[]) => void, role: LineupRole, playerId: number | null) =>
    set(lineup.map(x => x.role === role ? { ...x, player_id: playerId } : x))
  const updateGoalie = (i: number, patch: Partial<GoalieEntry>) =>
    setGoalieStats(g => g.map((x, idx) => idx === i ? { ...x, ...patch } : x))
  const updatePP = (i: number, patch: Partial<PPEntry>) =>
    setPPStats(p => p.map((x, idx) => idx === i ? { ...x, ...patch } : x))

  const handleResultChange = (val: string) => {
    setOvertime(val === 'ot'); setShootout(val === 'so')
  }

  // ── Save ──
  const handleSave = async (publish: boolean) => {
    setSaving(true); setError(null)
    try {
      // 1. Upsert game
      const { data: game, error: gameErr } = await supabase
        .from('games')
        .upsert({
          ...(gameId ? { id: gameId } : {}),
          season_id: 1, home_team_id: homeTeamId, away_team_id: awayTeamId,
          home_score: homeScore, away_score: awayScore,
          played_at: playedAt || new Date().toISOString(),
          game_type: gameType, overtime, shootout,
          scorekeeper: scorekeeper || null, is_published: publish,
        })
        .select().single()
      if (gameErr) throw gameErr
      const gid = game.id

      // 2. Goals
      if (gameId) await supabase.from('goals').delete().eq('game_id', gid)
      if (goals.length > 0) {
        const { error: ge } = await supabase.from('goals').insert(
          goals.filter(g => g.scorer_id).map(g => ({
            game_id: gid, team_id: g.team_id, scorer_id: g.scorer_id,
            assist1_id: g.assist1_id || null, assist2_id: g.assist2_id || null,
            period: parseInt(g.period) || 1,
            time_in_period: g.time_in_period || '0:00', goal_type: g.goal_type,
          }))
        )
        if (ge) throw ge
      }

      // 3. Penalties
      if (gameId) await supabase.from('penalties').delete().eq('game_id', gid)
      const validPenalties = penalties.filter(p => p.player_id && p.infraction)
      if (validPenalties.length > 0) {
        const { error: pe } = await supabase.from('penalties').insert(
          validPenalties.map(p => ({
            game_id: gid, team_id: p.team_id, player_id: p.player_id,
            period: parseInt(p.period) || 1,
            time_in_period: p.time_in_period || '0:00',
            infraction: p.infraction, minutes: parseInt(p.minutes) || 2,
          }))
        )
        if (pe) throw pe
      }

      // 4. Lineup
      if (gameId) await supabase.from('game_lineup').delete().eq('game_id', gid)
      const allLineup = [
        ...homeLineup, ...awayLineup,
        ...homeScratches.map(pid => ({ role: 'scratch' as LineupRole, player_id: pid, team_id: homeTeamId })),
        ...awayScratches.map(pid => ({ role: 'scratch' as LineupRole, player_id: pid, team_id: awayTeamId })),
      ].filter(l => l.player_id)
      if (allLineup.length > 0) {
        const { error: le } = await supabase.from('game_lineup').insert(
          allLineup.map(l => ({ game_id: gid, player_id: l.player_id, role: l.role, team_id: l.team_id }))
        )
        if (le) throw le
      }

      // 5. Goalie stats
      if (gameId) await supabase.from('goalie_stats').delete().eq('game_id', gid)
      const validGoalies = goalieStats.filter(g => g.player_id)
      if (validGoalies.length > 0) {
        const { error: gse } = await supabase.from('goalie_stats').insert(
          validGoalies.map(g => ({
            game_id: gid, player_id: g.player_id, team_id: g.team_id,
            shots_against: parseInt(g.shots_against) || 0,
            saves: parseInt(g.saves) || 0,
            goals_against: (parseInt(g.shots_against) || 0) - (parseInt(g.saves) || 0),
            toi_minutes: g.toi_minutes ? parseInt(g.toi_minutes) : null,
            decision: g.decision || null, shutout: g.shutout,
          }))
        )
        if (gse) throw gse
      }

      // 6. PP stats
      if (gameId) await supabase.from('game_pp_stats').delete().eq('game_id', gid)
      const validPP = ppStats.filter(p => p.pp_opportunities)
      if (validPP.length > 0) {
        const { error: ppe } = await supabase.from('game_pp_stats').insert(
          validPP.map(p => ({
            game_id: gid, team_id: p.team_id,
            pp_opportunities: parseInt(p.pp_opportunities) || 0,
            pp_goals: parseInt(p.pp_goals) || 0,
          }))
        )
        if (ppe) throw ppe
      }

      // 7. Staff
      if (gameId) await supabase.from('game_staff').delete().eq('game_id', gid)
      const validStaff = staff.filter(s => s.name.trim())
      if (validStaff.length > 0) {
        const { error: se } = await supabase.from('game_staff').insert(
          validStaff.map(s => ({ game_id: gid, team_id: s.team_id, name: s.name.trim(), role: s.role }))
        )
        if (se) throw se
      }

      setSuccess(true)
      setTimeout(() => { router.push('/admin'); router.refresh() }, 1200)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const team = (id: number) => teams.find(t => t.id === id)
  const scoreMismatch = goals.length > 0 && (homeScore + awayScore) !== goals.length

  // ── Render ──
  return (
    <div className="bg-rink-800 border border-white/[0.07] rounded-lg overflow-hidden">

      {/* Team + Score header */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-2 md:gap-4 items-end p-3 md:p-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-dim">Home Team</label>
          <select value={homeTeamId} onChange={e => setHomeTeamId(Number(e.target.value))} className={selectCls}>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name_en}</option>)}
          </select>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-dim">Score</span>
          <div className="flex items-center gap-2">
            <input type="number" min={0} value={homeScore} onChange={e => setHomeScore(Number(e.target.value))}
              className="w-14 bg-rink-700 border border-white/10 rounded text-white text-3xl font-black text-center py-1.5 outline-none focus:border-ice/50" />
            <span className="text-xl text-dim">–</span>
            <input type="number" min={0} value={awayScore} onChange={e => setAwayScore(Number(e.target.value))}
              className="w-14 bg-rink-700 border border-white/10 rounded text-white text-3xl font-black text-center py-1.5 outline-none focus:border-ice/50" />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-dim">Away Team</label>
          <select value={awayTeamId} onChange={e => setAwayTeamId(Number(e.target.value))} className={selectCls}>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name_en}</option>)}
          </select>
        </div>
      </div>

      {/* Meta row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-3 md:px-5 pb-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-dim">Date & Time</label>
          <input type="datetime-local" value={playedAt} onChange={e => setPlayedAt(e.target.value)} className={inputCls} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-dim">Game Type</label>
          <select value={gameType} onChange={e => setGameType(e.target.value)} className={selectCls}>
            <option value="regular">Regular Season</option>
            <option value="playoff-qf">Quarterfinal</option>
            <option value="playoff-sf">Semifinal</option>
            <option value="playoff-final">Final</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-dim">Result</label>
          <select onChange={e => handleResultChange(e.target.value)} className={selectCls}>
            <option value="reg">Regulation</option>
            <option value="ot">Overtime</option>
            <option value="so">Shootout</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-dim">Scorekeeper</label>
          <input type="text" value={scorekeeper} onChange={e => setScorekeeper(e.target.value)}
            placeholder="Full name" className={inputCls} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto border-t border-b border-white/[0.07] bg-rink-700 scrollbar-none">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cls(
              'px-4 py-2.5 text-[11px] font-black uppercase tracking-wider border-b-2 -mb-px transition-colors',
              tab === t ? 'text-white border-ice' : 'text-muted border-transparent hover:text-white'
            )}>
            {t}
            {t === 'Score' && goals.length > 0 && (
              <span className="ml-1.5 text-[9px] bg-ice/20 text-ice-light px-1.5 py-0.5 rounded-full">{goals.length}</span>
            )}
            {t === 'Penalties' && penalties.length > 0 && (
              <span className="ml-1.5 text-[9px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full">{penalties.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── SCORE TAB ── */}
      {tab === 'Score' && (
        <div className="p-4 flex flex-col gap-3">
          {goals.length === 0 && (
            <div className="text-[12px] text-dim text-center py-4 border border-dashed border-white/10 rounded">
              No goals added yet
            </div>
          )}
          {goals.map((g, i) => (
            <div key={i} className="overflow-x-auto">
            <div className="grid grid-cols-[82px_1fr_1fr_1fr_1fr_68px_28px] gap-2 items-center bg-rink-700 rounded px-3 py-2 min-w-[560px]">
              <div className="flex gap-1">
                <input type="text" value={g.period} placeholder="Per." onChange={e => updateGoal(i, { period: e.target.value })}
                  className="w-8 bg-rink-600 border border-white/10 rounded text-white text-xs px-1.5 py-1.5 text-center outline-none" />
                <input type="text" value={g.time_in_period} placeholder="0:00" onChange={e => updateGoal(i, { time_in_period: e.target.value })}
                  className="w-12 bg-rink-600 border border-white/10 rounded text-white text-xs px-1.5 py-1.5 text-center outline-none" />
              </div>
              <select value={g.team_id ?? ''} onChange={e => updateGoal(i, { team_id: Number(e.target.value), scorer_id: null })}
                className="bg-rink-600 border border-white/10 rounded text-white text-xs px-2 py-1.5">
                {[homeTeamId, awayTeamId].map(tid => {
                  const t = teams.find(t => t.id === tid)
                  return t ? <option key={t.id} value={t.id}>{t.abbreviation}</option> : null
                })}
              </select>
              <select value={g.scorer_id ?? ''} onChange={e => updateGoal(i, { scorer_id: Number(e.target.value) || null })}
                className="bg-rink-600 border border-white/10 rounded text-white text-xs px-2 py-1.5">
                <option value="">Scorer</option>
                {playersFor(g.team_id).map(p => <option key={p.id} value={p.id}>#{p.jersey_number} {p.last_name}</option>)}
              </select>
              <select value={g.assist1_id ?? ''} onChange={e => updateGoal(i, { assist1_id: Number(e.target.value) || null })}
                className="bg-rink-600 border border-white/10 rounded text-white text-xs px-2 py-1.5">
                <option value="">Assist 1</option>
                {playersFor(g.team_id).map(p => <option key={p.id} value={p.id}>#{p.jersey_number} {p.last_name}</option>)}
              </select>
              <select value={g.assist2_id ?? ''} onChange={e => updateGoal(i, { assist2_id: Number(e.target.value) || null })}
                className="bg-rink-600 border border-white/10 rounded text-white text-xs px-2 py-1.5">
                <option value="">Assist 2</option>
                {playersFor(g.team_id).map(p => <option key={p.id} value={p.id}>#{p.jersey_number} {p.last_name}</option>)}
              </select>
              <select value={g.goal_type} onChange={e => updateGoal(i, { goal_type: e.target.value as GoalType })}
                className="bg-rink-600 border border-white/10 rounded text-white text-xs px-2 py-1.5">
                {(['ev','pp','sh','en','so'] as GoalType[]).map(gt => <option key={gt} value={gt}>{gt.toUpperCase()}</option>)}
              </select>
              <button onClick={() => setGoals(g => g.filter((_, idx) => idx !== i))}
                className="text-dim hover:text-red-400 border border-white/10 rounded px-1.5 py-1.5 text-sm transition-colors">✕</button>
            </div>
            </div>
          ))}
          <button onClick={() => setGoals(g => [...g, { period: '1', time_in_period: '', team_id: homeTeamId, scorer_id: null, assist1_id: null, assist2_id: null, goal_type: 'ev' }])}
            className="w-full text-[11px] font-black uppercase tracking-wider text-muted border border-dashed border-white/10 rounded py-2 hover:bg-white/[0.03] hover:text-white transition-colors">
            + Add Goal
          </button>
          {scoreMismatch && (
            <div className="text-[11px] text-amber-400 text-center">
              ⚠ Score total ({homeScore + awayScore}) ≠ goals entered ({goals.length})
            </div>
          )}
        </div>
      )}

      {/* ── PENALTIES TAB ── */}
      {tab === 'Penalties' && (
        <div className="p-4 flex flex-col gap-3">
          {penalties.length === 0 && (
            <div className="text-[12px] text-dim text-center py-4 border border-dashed border-white/10 rounded">No penalties entered</div>
          )}
          {penalties.map((p, i) => (
            <div key={i} className="overflow-x-auto">
            <div className="grid grid-cols-[82px_90px_1fr_1fr_60px_28px] gap-2 items-center bg-rink-700 rounded px-3 py-2 min-w-[500px]">
              <div className="flex gap-1">
                <input type="text" value={p.period} placeholder="Per." onChange={e => updatePenalty(i, { period: e.target.value })}
                  className="w-8 bg-rink-600 border border-white/10 rounded text-white text-xs px-1.5 py-1.5 text-center outline-none" />
                <input type="text" value={p.time_in_period} placeholder="0:00" onChange={e => updatePenalty(i, { time_in_period: e.target.value })}
                  className="w-12 bg-rink-600 border border-white/10 rounded text-white text-xs px-1.5 py-1.5 text-center outline-none" />
              </div>
              <select value={p.team_id ?? ''} onChange={e => updatePenalty(i, { team_id: Number(e.target.value), player_id: null })}
                className="bg-rink-600 border border-white/10 rounded text-white text-xs px-2 py-1.5">
                {[homeTeamId, awayTeamId].map(tid => {
                  const t = teams.find(t => t.id === tid)
                  return t ? <option key={t.id} value={t.id}>{t.abbreviation}</option> : null
                })}
              </select>
              <select value={p.player_id ?? ''} onChange={e => updatePenalty(i, { player_id: Number(e.target.value) || null })}
                className="bg-rink-600 border border-white/10 rounded text-white text-xs px-2 py-1.5">
                <option value="">Player</option>
                {playersFor(p.team_id).map(pl => <option key={pl.id} value={pl.id}>#{pl.jersey_number} {pl.last_name}</option>)}
              </select>
              <select value={p.infraction} onChange={e => updatePenalty(i, { infraction: e.target.value })}
                className="bg-rink-600 border border-white/10 rounded text-white text-xs px-2 py-1.5">
                <option value="">Infraction</option>
                {INFRACTIONS.map(inf => <option key={inf} value={inf}>{inf}</option>)}
              </select>
              <select value={p.minutes} onChange={e => updatePenalty(i, { minutes: e.target.value })}
                className="bg-rink-600 border border-white/10 rounded text-white text-xs px-2 py-1.5">
                <option value="">Min</option>
                {['2','4','5','10'].map(m => <option key={m} value={m}>{m} min</option>)}
              </select>
              <button onClick={() => setPenalties(p => p.filter((_, idx) => idx !== i))}
                className="text-dim hover:text-red-400 border border-white/10 rounded px-1.5 py-1.5 text-sm transition-colors">✕</button>
            </div>
            </div>
          ))}
          <button onClick={() => setPenalties(p => [...p, { period: '1', time_in_period: '', team_id: homeTeamId, player_id: null, infraction: '', minutes: '2' }])}
            className="w-full text-[11px] font-black uppercase tracking-wider text-muted border border-dashed border-white/10 rounded py-2 hover:bg-white/[0.03] hover:text-white transition-colors">
            + Add Penalty
          </button>
        </div>
      )}

      {/* ── LINEUP TAB ── */}
      {tab === 'Lineup' && (
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {[{ teamId: homeTeamId, lineup: homeLineup, setLineup: setHomeLineup, scratches: homeScratches, setScratches: setHomeScratches },
            { teamId: awayTeamId, lineup: awayLineup, setLineup: setAwayLineup, scratches: awayScratches, setScratches: setAwayScratches }
          ].map(({ teamId, lineup, setLineup, scratches, setScratches }) => (
            <div key={teamId}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black text-white"
                  style={{ background: team(teamId)?.color }}>{team(teamId)?.abbreviation}</div>
                <span className="text-[12px] font-black text-white">{team(teamId)?.name_en}</span>
              </div>

              {/* Forwards */}
              <div className="text-[10px] font-black uppercase tracking-widest text-dim mb-2">Forwards</div>
              {[1,2,3,4].map(line => (
                <div key={line} className="flex gap-1 mb-1 items-center">
                  <span className="text-[10px] text-dim w-4">{line}</span>
                  {(['L','C','R'] as const).map(pos => {
                    const role = `F${line}${pos}` as LineupRole
                    const entry = lineup.find(l => l.role === role)
                    return (
                      <select key={pos} value={entry?.player_id ?? ''}
                        onChange={e => updateLineup(lineup, setLineup, role, Number(e.target.value) || null)}
                        className="flex-1 bg-rink-700 border border-white/10 rounded text-white text-[11px] px-1.5 py-1 truncate">
                        <option value="">{pos}</option>
                        {skatersFor(teamId).map(p => <option key={p.id} value={p.id}>#{p.jersey_number} {p.last_name}</option>)}
                      </select>
                    )
                  })}
                </div>
              ))}

              {/* Defence */}
              <div className="text-[10px] font-black uppercase tracking-widest text-dim mb-2 mt-3">Defence</div>
              {[1,2,3].map(pair => (
                <div key={pair} className="flex gap-1 mb-1 items-center">
                  <span className="text-[10px] text-dim w-4">{pair}</span>
                  {(['L','R'] as const).map(pos => {
                    const role = `D${pair}${pos}` as LineupRole
                    const entry = lineup.find(l => l.role === role)
                    return (
                      <select key={pos} value={entry?.player_id ?? ''}
                        onChange={e => updateLineup(lineup, setLineup, role, Number(e.target.value) || null)}
                        className="flex-1 bg-rink-700 border border-white/10 rounded text-white text-[11px] px-1.5 py-1 truncate">
                        <option value="">{pos}</option>
                        {skatersFor(teamId).map(p => <option key={p.id} value={p.id}>#{p.jersey_number} {p.last_name}</option>)}
                      </select>
                    )
                  })}
                </div>
              ))}

              {/* Goalies */}
              <div className="text-[10px] font-black uppercase tracking-widest text-dim mb-2 mt-3">Goalies</div>
              {GOALIE_ROLES.map(({ role, label }) => {
                const entry = lineup.find(l => l.role === role)
                return (
                  <div key={role} className="flex gap-2 mb-1 items-center">
                    <span className="text-[10px] text-dim w-12">{label}</span>
                    <select value={entry?.player_id ?? ''}
                      onChange={e => updateLineup(lineup, setLineup, role, Number(e.target.value) || null)}
                      className="flex-1 bg-rink-700 border border-white/10 rounded text-white text-[11px] px-2 py-1">
                      <option value="">—</option>
                      {goaliesFor(teamId).map(p => <option key={p.id} value={p.id}>#{p.jersey_number} {p.last_name}</option>)}
                    </select>
                  </div>
                )
              })}

              {/* Scratches */}
              <div className="text-[10px] font-black uppercase tracking-widest text-dim mb-2 mt-3">Scratches</div>
              <div className="flex flex-wrap gap-1">
                {playersFor(teamId).map(p => (
                  <button key={p.id}
                    onClick={() => setScratches(s => s.includes(p.id) ? s.filter(x => x !== p.id) : [...s, p.id])}
                    className={cls(
                      'text-[10px] px-2 py-1 rounded border transition-colors',
                      scratches.includes(p.id)
                        ? 'bg-red-500/15 border-red-500/30 text-red-400'
                        : 'bg-rink-700 border-white/10 text-muted hover:text-white'
                    )}>
                    #{p.jersey_number} {p.last_name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── GOALIES TAB ── */}
      {tab === 'Goalies' && (
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-5">
          {goalieStats.map((g, i) => (
            <div key={i} className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black text-white"
                  style={{ background: team(g.team_id)?.color }}>{team(g.team_id)?.abbreviation}</div>
                <span className="text-[12px] font-black">{team(g.team_id)?.name_en}</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-dim">Goalie</label>
                <select value={g.player_id ?? ''} onChange={e => updateGoalie(i, { player_id: Number(e.target.value) || null })} className={selectCls}>
                  <option value="">— Select —</option>
                  {goaliesFor(g.team_id).map(p => <option key={p.id} value={p.id}>#{p.jersey_number} {p.first_name} {p.last_name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Shots Against', key: 'shots_against' as const },
                  { label: 'Saves',         key: 'saves' as const },
                  { label: 'TOI (min)',      key: 'toi_minutes' as const },
                ].map(f => (
                  <div key={f.key} className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-dim">{f.label}</label>
                    <input type="number" min={0} value={g[f.key]} onChange={e => updateGoalie(i, { [f.key]: e.target.value })}
                      className={inputCls} />
                  </div>
                ))}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-dim">Decision</label>
                  <select value={g.decision} onChange={e => updateGoalie(i, { decision: e.target.value as GoalieDecision })} className={selectCls}>
                    <option value="">—</option>
                    {DECISIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-2 text-[12px] text-muted cursor-pointer">
                <input type="checkbox" checked={g.shutout} onChange={e => updateGoalie(i, { shutout: e.target.checked })}
                  className="w-4 h-4 accent-ice" />
                Shutout
              </label>
              {g.shots_against && g.saves && (
                <div className="text-[11px] text-dim">
                  GA: {Math.max(0, parseInt(g.shots_against) - parseInt(g.saves))} &nbsp;·&nbsp;
                  SV%: {((parseInt(g.saves) / parseInt(g.shots_against)) * 100).toFixed(1)}%
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── PP STATS TAB ── */}
      {tab === 'PP Stats' && (
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-5">
          {ppStats.map((p, i) => (
            <div key={i} className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black text-white"
                  style={{ background: team(p.team_id)?.color }}>{team(p.team_id)?.abbreviation}</div>
                <span className="text-[12px] font-black">{team(p.team_id)?.name_en}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-dim">PP Opportunities</label>
                  <input type="number" min={0} value={p.pp_opportunities}
                    onChange={e => updatePP(i, { pp_opportunities: e.target.value })} className={inputCls} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-dim">PP Goals</label>
                  <input type="number" min={0} value={p.pp_goals}
                    onChange={e => updatePP(i, { pp_goals: e.target.value })} className={inputCls} />
                </div>
              </div>
              {p.pp_opportunities && (
                <div className="text-[11px] text-dim">
                  PP%: {((parseInt(p.pp_goals || '0') / parseInt(p.pp_opportunities)) * 100).toFixed(1)}%
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── STAFF TAB ── */}
      {tab === 'Staff' && (
        <div className="p-4 flex flex-col gap-3">
          {staff.length === 0 && (
            <div className="text-[12px] text-dim text-center py-4 border border-dashed border-white/10 rounded">No staff entered</div>
          )}
          {staff.map((s, i) => (
            <div key={i} className="overflow-x-auto">
            <div className="grid grid-cols-[120px_1fr_1fr_28px] gap-2 items-center bg-rink-700 rounded px-3 py-2 min-w-[380px]">
              <select value={s.team_id} onChange={e => setStaff(st => st.map((x, idx) => idx === i ? { ...x, team_id: Number(e.target.value) } : x))}
                className="bg-rink-600 border border-white/10 rounded text-white text-xs px-2 py-1.5">
                {[homeTeamId, awayTeamId].map(tid => {
                  const t = teams.find(t => t.id === tid)
                  return t ? <option key={t.id} value={t.id}>{t.abbreviation}</option> : null
                })}
              </select>
              <input type="text" value={s.name} placeholder="Full name"
                onChange={e => setStaff(st => st.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x))}
                className="bg-rink-600 border border-white/10 rounded text-white text-xs px-2 py-1.5 outline-none" />
              <select value={s.role} onChange={e => setStaff(st => st.map((x, idx) => idx === i ? { ...x, role: e.target.value as StaffRole } : x))}
                className="bg-rink-600 border border-white/10 rounded text-white text-xs px-2 py-1.5">
                {STAFF_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
              <button onClick={() => setStaff(st => st.filter((_, idx) => idx !== i))}
                className="text-dim hover:text-red-400 border border-white/10 rounded px-1.5 py-1.5 text-sm transition-colors">✕</button>
            </div>
            </div>
          ))}
          <button onClick={() => setStaff(s => [...s, { team_id: homeTeamId, name: '', role: 'head_coach' }])}
            className="w-full text-[11px] font-black uppercase tracking-wider text-muted border border-dashed border-white/10 rounded py-2 hover:bg-white/[0.03] hover:text-white transition-colors">
            + Add Staff Member
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-white/[0.07] px-5 py-3 flex items-center justify-between">
        <div className="text-xs text-dim">
          {goals.length}G · {penalties.length} PEN · {staff.length} staff
        </div>
        <div className="flex items-center gap-2">
          {error   && <span className="text-red-400 text-xs">{error}</span>}
          {success && <span className="text-green-400 text-xs">Saved! Redirecting…</span>}
          <button onClick={() => handleSave(false)} disabled={saving} className={btnGhost}>Save Draft</button>
          <button onClick={() => handleSave(true)}  disabled={saving} className={btnPrimary}>
            {saving ? 'Saving…' : 'Publish Score'}
          </button>
        </div>
      </div>
    </div>
  )
}