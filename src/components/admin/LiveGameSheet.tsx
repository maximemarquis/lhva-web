'use client'

import { useState, useTransition, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Team, Player, GoalType } from '@/types'

// ── Types ──────────────────────────────────────────────────
interface GameData {
  id: number
  home_team_id: number
  away_team_id: number
  home_score: number | null
  away_score: number | null
  status: string
  current_period: number
  period_status: string
  overtime: boolean
  shootout: boolean
  game_type: string
  played_at: string
  home_team: Team
  away_team: Team
  goals: any[]
  penalties: any[]
  goalie_stats: any[]
  game_pp_stats: any[]
}

interface Props {
  game: GameData
  teams: Team[]
  playersByTeam: Record<number, Player[]>
}

type Modal = 'goal' | 'penalty' | null
type LineupMap = Record<string, number | null>
interface StaffRow { team_id: number; name: string; role: string }

const INFRACTIONS = [
  'Hooking','Tripping','Roughing','Slashing','High Sticking',
  'Interference','Holding','Cross-Checking','Charging','Boarding',
  'Elbowing','Fighting','Unsportsmanlike Conduct','Too Many Men',
  'Delay of Game','Misconduct','Game Misconduct','Match Penalty',
]
const PERIOD_LABELS = ['1st','2nd','3rd','OT','SO']

const statusColor: Record<string, string> = {
  scheduled: 'bg-white/10 text-muted',
  warmup:    'bg-amber-500/15 text-amber-400',
  live:      'bg-green-500/15 text-green-400',
  final:     'bg-ice/15 text-ice-light',
  postponed: 'bg-red-500/15 text-red-400',
}

const inp = 'bg-rink-700 border border-white/10 rounded px-3 py-2.5 text-sm text-white placeholder:text-dim outline-none focus:border-ice/50 w-full'
const sel = `${inp} cursor-pointer`
const btn = 'px-4 py-2.5 text-sm font-bold rounded transition-colors disabled:opacity-50'

// ── PreGameSetup ───────────────────────────────────────────
function PreGameSetup({ game, playersByTeam }: {
  game: GameData
  playersByTeam: Record<number, Player[]>
}) {
  const supabase = createClient()
  const router   = useRouter()

  const [open, setOpen]           = useState(game.status === 'scheduled' || game.status === 'warmup')
  const [activeTab, setActiveTab] = useState<'lineup' | 'staff'>('lineup')
  const [saving, setSaving]       = useState(false)
  const [success, setSuccess]     = useState(false)

  const playersFor = (teamId: number) => playersByTeam[teamId] ?? []
  const skatersFor = (teamId: number) => playersFor(teamId).filter(p => p.position !== 'G')
  const goaliesFor = (teamId: number) => playersFor(teamId).filter(p => p.position === 'G')

  const [homeLineup,    setHomeLineup]    = useState<LineupMap>({})
  const [awayLineup,    setAwayLineup]    = useState<LineupMap>({})
  const [homeScratches, setHomeScratches] = useState<number[]>([])
  const [awayScratches, setAwayScratches] = useState<number[]>([])
  const [staff, setStaff]                 = useState<StaffRow[]>([])

  const updateLineup = (map: LineupMap, set: (v: LineupMap) => void, role: string, pid: number | null) =>
    set({ ...map, [role]: pid })

  const toggleScratch = (list: number[], set: (v: number[]) => void, pid: number) =>
    set(list.includes(pid) ? list.filter(x => x !== pid) : [...list, pid])

  const handleSaveLineup = async () => {
    setSaving(true)
    await supabase.from('game_lineup').delete().eq('game_id', game.id)
    const rows: any[] = []
    Object.entries(homeLineup).forEach(([role, pid]) => {
      if (pid) rows.push({ game_id: game.id, player_id: pid, role, team_id: game.home_team_id })
    })
    homeScratches.forEach(pid =>
      rows.push({ game_id: game.id, player_id: pid, role: 'scratch', team_id: game.home_team_id })
    )
    Object.entries(awayLineup).forEach(([role, pid]) => {
      if (pid) rows.push({ game_id: game.id, player_id: pid, role, team_id: game.away_team_id })
    })
    awayScratches.forEach(pid =>
      rows.push({ game_id: game.id, player_id: pid, role: 'scratch', team_id: game.away_team_id })
    )
    if (rows.length > 0) await supabase.from('game_lineup').insert(rows)
    setSaving(false); setSuccess(true)
    setTimeout(() => setSuccess(false), 2000)
    router.refresh()
  }

  const handleSaveStaff = async () => {
    setSaving(true)
    await supabase.from('game_staff').delete().eq('game_id', game.id)
    const valid = staff.filter(s => s.name.trim())
    if (valid.length > 0)
      await supabase.from('game_staff').insert(valid.map(s => ({ game_id: game.id, ...s })))
    setSaving(false); setSuccess(true)
    setTimeout(() => setSuccess(false), 2000)
  }

  const inpSm = 'bg-rink-700 border border-white/10 rounded px-2 py-1.5 text-sm text-white placeholder:text-dim outline-none focus:border-ice/50 w-full'
  const selSm = `${inpSm} cursor-pointer`

  const LineupTeam = ({ teamId, team, lineup, setLineup, scratches, setScratches }: {
    teamId: number; team: any
    lineup: LineupMap; setLineup: (v: LineupMap) => void
    scratches: number[]; setScratches: (v: number[]) => void
  }) => (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black text-white"
          style={{ background: team.color }}>{team.abbreviation}</div>
        <span className="text-[13px] font-black">{team.name_en}</span>
      </div>
      <div className="text-[10px] font-black uppercase tracking-widest text-dim mb-1.5">Forwards</div>
      {[1,2,3,4].map(line => (
        <div key={line} className="flex gap-1 mb-1 items-center">
          <span className="text-[10px] text-dim w-4 shrink-0">{line}</span>
          {(['L','C','R'] as const).map(pos => {
            const role = `F${line}${pos}`
            return (
              <select key={pos} value={lineup[role] ?? ''}
                onChange={e => updateLineup(lineup, setLineup, role, Number(e.target.value) || null)}
                className="flex-1 bg-rink-700 border border-white/10 rounded text-white text-[11px] px-1.5 py-1.5 min-w-0">
                <option value="">{pos}</option>
                {skatersFor(teamId).map(p => (
                  <option key={p.id} value={p.id}>#{p.jersey_number} {p.last_name}</option>
                ))}
              </select>
            )
          })}
        </div>
      ))}
      <div className="text-[10px] font-black uppercase tracking-widest text-dim mb-1.5 mt-3">Defence</div>
      {[1,2,3].map(pair => (
        <div key={pair} className="flex gap-1 mb-1 items-center">
          <span className="text-[10px] text-dim w-4 shrink-0">{pair}</span>
          {(['L','R'] as const).map(pos => {
            const role = `D${pair}${pos}`
            return (
              <select key={pos} value={lineup[role] ?? ''}
                onChange={e => updateLineup(lineup, setLineup, role, Number(e.target.value) || null)}
                className="flex-1 bg-rink-700 border border-white/10 rounded text-white text-[11px] px-1.5 py-1.5 min-w-0">
                <option value="">{pos}</option>
                {skatersFor(teamId).map(p => (
                  <option key={p.id} value={p.id}>#{p.jersey_number} {p.last_name}</option>
                ))}
              </select>
            )
          })}
        </div>
      ))}
      <div className="text-[10px] font-black uppercase tracking-widest text-dim mb-1.5 mt-3">Goalies</div>
      {[{ role: 'G1', label: 'Starter' }, { role: 'G2', label: 'Backup' }].map(({ role, label }) => (
        <div key={role} className="flex gap-2 mb-1 items-center">
          <span className="text-[10px] text-dim w-12 shrink-0">{label}</span>
          <select value={lineup[role] ?? ''}
            onChange={e => updateLineup(lineup, setLineup, role, Number(e.target.value) || null)}
            className="flex-1 bg-rink-700 border border-white/10 rounded text-white text-[11px] px-2 py-1.5">
            <option value="">—</option>
            {goaliesFor(teamId).map(p => (
              <option key={p.id} value={p.id}>#{p.jersey_number} {p.last_name}</option>
            ))}
          </select>
        </div>
      ))}
      <div className="text-[10px] font-black uppercase tracking-widest text-dim mb-1.5 mt-3">Scratches</div>
      <div className="flex flex-wrap gap-1">
        {playersFor(teamId).map(p => (
          <button key={p.id}
            onClick={() => toggleScratch(scratches, setScratches, p.id)}
            className={`text-[10px] px-2 py-1 rounded border transition-colors ${
              scratches.includes(p.id)
                ? 'bg-red-500/15 border-red-500/30 text-red-400'
                : 'bg-rink-700 border-white/10 text-muted hover:text-white'
            }`}>
            #{p.jersey_number} {p.last_name}
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <div className="bg-rink-800 border border-white/[0.07] rounded-xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors">
        <span className="text-[12px] font-black uppercase tracking-wider text-muted">
          Pre-game Setup — Lineup & Staff
        </span>
        <span className="text-dim text-lg">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="border-t border-white/[0.07]">
          <div className="flex border-b border-white/[0.07] bg-rink-700">
            {(['lineup', 'staff'] as const).map(t => (
              <button key={t} onClick={() => setActiveTab(t)}
                className={`px-5 py-2.5 text-[11px] font-black uppercase tracking-wider border-b-2 -mb-px transition-colors ${
                  activeTab === t ? 'text-white border-ice' : 'text-muted border-transparent hover:text-white'
                }`}>
                {t === 'lineup' ? 'Lineup' : 'Staff & Coaches'}
              </button>
            ))}
          </div>
          {activeTab === 'lineup' && (
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <LineupTeam teamId={game.home_team_id} team={game.home_team}
                  lineup={homeLineup} setLineup={setHomeLineup}
                  scratches={homeScratches} setScratches={setHomeScratches} />
                <LineupTeam teamId={game.away_team_id} team={game.away_team}
                  lineup={awayLineup} setLineup={setAwayLineup}
                  scratches={awayScratches} setScratches={setAwayScratches} />
              </div>
              <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-white/[0.07]">
                {success && <span className="text-[12px] text-green-400">Lineup saved!</span>}
                <button onClick={handleSaveLineup} disabled={saving}
                  className="px-4 py-2 text-[12px] font-bold bg-ice hover:bg-ice-light text-white rounded disabled:opacity-50">
                  {saving ? 'Saving…' : 'Save Lineup'}
                </button>
              </div>
            </div>
          )}
          {activeTab === 'staff' && (
            <div className="p-4 flex flex-col gap-3">
              {staff.length === 0 && (
                <div className="text-[12px] text-dim text-center py-4 border border-dashed border-white/10 rounded">
                  No staff entered yet
                </div>
              )}
              {staff.map((s, i) => (
                <div key={i} className="grid grid-cols-[110px_1fr_1fr_28px] gap-2 items-center">
                  <select value={s.team_id}
                    onChange={e => setStaff(st => st.map((x, idx) => idx === i ? { ...x, team_id: Number(e.target.value) } : x))}
                    className={selSm}>
                    <option value={game.home_team_id}>{game.home_team.abbreviation}</option>
                    <option value={game.away_team_id}>{game.away_team.abbreviation}</option>
                  </select>
                  <input type="text" value={s.name} placeholder="Full name"
                    onChange={e => setStaff(st => st.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x))}
                    className={inpSm} />
                  <select value={s.role}
                    onChange={e => setStaff(st => st.map((x, idx) => idx === i ? { ...x, role: e.target.value } : x))}
                    className={selSm}>
                    <option value="head_coach">Head Coach</option>
                    <option value="assistant_coach">Assistant Coach</option>
                    <option value="goalie_coach">Goalie Coach</option>
                    <option value="trainer">Trainer</option>
                    <option value="manager">Manager</option>
                  </select>
                  <button onClick={() => setStaff(st => st.filter((_, idx) => idx !== i))}
                    className="text-dim hover:text-red-400 border border-white/10 rounded px-1.5 py-1.5 text-sm">✕</button>
                </div>
              ))}
              <button onClick={() => setStaff(s => [...s, { team_id: game.home_team_id, name: '', role: 'head_coach' }])}
                className="w-full text-[11px] font-black uppercase tracking-wider text-muted border border-dashed border-white/10 rounded py-2 hover:bg-white/[0.03] hover:text-white">
                + Add Staff Member
              </button>
              <div className="flex items-center justify-end gap-3 pt-2">
                {success && <span className="text-[12px] text-green-400">Staff saved!</span>}
                <button onClick={handleSaveStaff} disabled={saving}
                  className="px-4 py-2 text-[12px] font-bold bg-ice hover:bg-ice-light text-white rounded disabled:opacity-50">
                  {saving ? 'Saving…' : 'Save Staff'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── LiveGameSheet ──────────────────────────────────────────
export function LiveGameSheet({ game: initialGame, playersByTeam }: Props) {
  const supabase = createClient()
  const router   = useRouter()
  const [isPending, startTransition] = useTransition()

  const [game, setGame]           = useState(initialGame)
  const [modal, setModal]         = useState<Modal>(null)

  // Sync server data back into local state after router.refresh()
  useEffect(() => {
    setGame(initialGame)
  }, [initialGame])
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  // Goal form state
  const [goalTeam,    setGoalTeam]    = useState(game.home_team_id)
  const [goalScorer,  setGoalScorer]  = useState<number | ''>('')
  const [goalAssist1, setGoalAssist1] = useState<number | ''>('')
  const [goalAssist2, setGoalAssist2] = useState<number | ''>('')
  const [goalPeriod,  setGoalPeriod]  = useState(String(game.current_period || 1))
  const [goalTime,    setGoalTime]    = useState('')
  const [goalType,    setGoalType]    = useState<GoalType>('ev')

  // Penalty form state
  const [penTeam,       setPenTeam]       = useState(game.home_team_id)
  const [penPlayer,     setPenPlayer]     = useState<number | ''>('')
  const [penInfraction, setPenInfraction] = useState('')
  const [penMinutes,    setPenMinutes]    = useState('2')
  const [penPeriod,     setPenPeriod]     = useState(String(game.current_period || 1))
  const [penTime,       setPenTime]       = useState('')

  const refresh = () => startTransition(() => router.refresh())

  const playersFor = (teamId: number) => playersByTeam[teamId] ?? []
  const skatersFor = (teamId: number) => playersFor(teamId).filter(p => p.position !== 'G')

  const homeScore = game.goals?.filter((g: any) =>
    g.team_id === game.home_team_id && g.goal_type !== 'so'
  ).length ?? 0
  const awayScore = game.goals?.filter((g: any) =>
    g.team_id === game.away_team_id && g.goal_type !== 'so'
  ).length ?? 0

  const setStatus = async (status: string, period?: number) => {
    const update: any = { status }
    if (period !== undefined) { update.current_period = period; update.period_status = 'in_progress' }
    if (status === 'final')   { update.is_published = true; update.home_score = homeScore; update.away_score = awayScore }
    await supabase.from('games').update(update).eq('id', game.id)
    setGame(g => ({ ...g, ...update }))
    refresh()
  }

  const handleAddGoal = async () => {
    if (!goalScorer) { setError('Select a scorer'); return }
    setSaving(true); setError(null)
    const { data, error: e } = await supabase.from('goals').insert({
      game_id: game.id, team_id: goalTeam, scorer_id: goalScorer,
      assist1_id: goalAssist1 || null, assist2_id: goalAssist2 || null,
      period: parseInt(goalPeriod) || game.current_period || 1,
      time_in_period: goalTime || '0:00', goal_type: goalType,
    }).select(`
      *,
      scorer:players!scorer_id(id, first_name, last_name, jersey_number),
      assist1:players!assist1_id(id, first_name, last_name, jersey_number),
      assist2:players!assist2_id(id, first_name, last_name, jersey_number)
    `).single()
    if (e) { setError(e.message); setSaving(false); return }
    // Update local state immediately — no refresh needed
    setGame(g => ({ ...g, goals: [...(g.goals ?? []), data] }))
    setModal(null)
    setGoalScorer(''); setGoalAssist1(''); setGoalAssist2(''); setGoalTime(''); setGoalType('ev')
    setSaving(false)
  }

  const handleDeleteGoal = async (id: number) => {
    if (!confirm('Remove this goal?')) return
    await supabase.from('goals').delete().eq('id', id)
    setGame(g => ({ ...g, goals: (g.goals ?? []).filter((x: any) => x.id !== id) }))
  }

  const handleAddPenalty = async () => {
    if (!penPlayer || !penInfraction) { setError('Select player and infraction'); return }
    setSaving(true); setError(null)
    const { data, error: e } = await supabase.from('penalties').insert({
      game_id: game.id, team_id: penTeam, player_id: penPlayer,
      period: parseInt(penPeriod) || game.current_period || 1,
      time_in_period: penTime || '0:00', infraction: penInfraction,
      minutes: parseInt(penMinutes) || 2,
    }).select(`
      *,
      player:players(id, first_name, last_name, jersey_number)
    `).single()
    if (e) { setError(e.message); setSaving(false); return }
    // Update local state immediately
    setGame(g => ({ ...g, penalties: [...(g.penalties ?? []), data] }))
    setModal(null)
    setPenPlayer(''); setPenInfraction(''); setPenTime('')
    setSaving(false)
  }

  const handleDeletePenalty = async (id: number) => {
    if (!confirm('Remove this penalty?')) return
    await supabase.from('penalties').delete().eq('id', id)
    setGame(g => ({ ...g, penalties: (g.penalties ?? []).filter((x: any) => x.id !== id) }))
  }

  const isPast = new Date(game.played_at) < new Date()

  const periodLabel = game.current_period > 0
    ? (PERIOD_LABELS[game.current_period - 1] ?? `P${game.current_period}`)
    : '—'

  const events = [
    ...(game.goals ?? []).map((g: any) => ({ ...g, _type: 'goal',    _sort: g.period * 10000 + parseInt(g.time_in_period?.replace(':','') ?? '0') })),
    ...(game.penalties ?? []).map((p: any) => ({ ...p, _type: 'penalty', _sort: p.period * 10000 + parseInt(p.time_in_period?.replace(':','') ?? '0') })),
  ].sort((a, b) => a._sort - b._sort)

  return (
    <div className="flex flex-col gap-4">

      {/* Scoreboard */}
      <div className="bg-rink-800 border border-white/[0.07] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 bg-rink-700 border-b border-white/[0.07]">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded ${
              game.status === 'scheduled' && isPast
                ? 'bg-amber-500/15 text-amber-400'
                : statusColor[game.status] ?? ''
            }`}>
              {game.status === 'scheduled' && isPast ? 'Score Pending' : game.status}
            </span>
            {isPending && <span className="text-[10px] text-amber-400 animate-pulse">Syncing…</span>}
          </div>
          {game.status === 'live' && (
            <span className="text-[11px] font-black text-white">{periodLabel} Period</span>
          )}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-dim uppercase tracking-wider">
              {game.game_type.replace('playoff-','').replace('regular','Reg')}
            </span>
            <span className="text-[10px] text-dim">
              {lastRefresh.toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center px-6 py-5 gap-4">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-[14px] font-black text-white mx-auto mb-2"
              style={{ background: game.home_team.color }}>{game.home_team.abbreviation}</div>
            <div className="text-[13px] font-bold text-white leading-tight">{game.home_team.name_en}</div>
          </div>
          <div className="text-center">
            <div className="flex items-center gap-4 justify-center">
              <span className="text-5xl font-black text-white">{homeScore}</span>
              <span className="text-2xl text-dim">–</span>
              <span className="text-5xl font-black text-white">{awayScore}</span>
            </div>
            <div className="text-[10px] text-dim mt-1 uppercase tracking-wider">
              {game.status === 'final' ? 'Final' : game.status === 'live' ? `${periodLabel} Period` : isPast ? 'Score Pending' : 'Upcoming'}
              {game.overtime && !game.shootout ? ' · OT' : ''}
              {game.shootout ? ' · SO' : ''}
            </div>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-[14px] font-black text-white mx-auto mb-2"
              style={{ background: game.away_team.color }}>{game.away_team.abbreviation}</div>
            <div className="text-[13px] font-bold text-white leading-tight">{game.away_team.name_en}</div>
          </div>
        </div>

        <div className="px-4 pb-4 flex flex-wrap gap-2 justify-center">
          {game.status === 'scheduled' && !isPast && (
            <button onClick={() => setStatus('warmup')}
              className="px-4 py-2 text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 rounded-lg">
              Start Warmup
            </button>
          )}
          {game.status === 'scheduled' && isPast && (
            <button onClick={() => setStatus('live', 1)}
              className="px-4 py-2 text-xs font-bold bg-ice/15 text-ice-light border border-ice/30 rounded-lg">
              Enter Score (Retroactive)
            </button>
          )}
          {game.status === 'warmup' && (
            <button onClick={() => setStatus('live', 1)}
              className="px-4 py-2 text-xs font-bold bg-green-500/15 text-green-400 border border-green-500/30 rounded-lg">
              🏒 Start Game (P1)
            </button>
          )}
          {game.status === 'live' && (
            <>
              <span className="text-[10px] text-dim uppercase tracking-wider">Period</span>
              {[1,2,3,4].map(p => (
                <button key={p} onClick={() => setStatus('live', p)}
                  className={`px-3 py-2 text-xs font-bold rounded-lg border transition-colors ${
                    game.current_period === p
                      ? 'bg-ice/20 text-ice-light border-ice/30'
                      : 'bg-rink-700 text-muted border-white/10 hover:text-white'
                  }`}>
                  {PERIOD_LABELS[p-1]}
                  {game.current_period === p && <span className="block text-[8px] uppercase tracking-wider opacity-70">Current</span>}
                </button>
              ))}
              <button onClick={() => setStatus('final')}
                className="px-4 py-2 text-xs font-bold bg-ice/15 text-ice-light border border-ice/30 rounded-lg ml-2">
                End Game — Final
              </button>
            </>
          )}
          {game.status === 'final' && (
            <button onClick={() => setStatus('live', game.current_period || 3)}
              className="px-3 py-2 text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg">
              Reopen Game
            </button>
          )}
        </div>
      </div>

      {/* Pre-game setup */}
      <PreGameSetup game={game} playersByTeam={playersByTeam} />

      {/* Action buttons */}
      {(game.status !== 'scheduled' || isPast) && (
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => { setModal('goal'); setError(null); setGoalPeriod(String(game.current_period || 1)) }}
            className="flex items-center justify-center gap-2 bg-green-500/15 hover:bg-green-500/25 text-green-400 border border-green-500/30 rounded-xl py-4 text-[15px] font-black transition-colors">
            🥅 Goal
          </button>
          <button onClick={() => { setModal('penalty'); setError(null); setPenPeriod(String(game.current_period || 1)) }}
            className="flex items-center justify-center gap-2 bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 rounded-xl py-4 text-[15px] font-black transition-colors">
            ✋ Penalty
          </button>
        </div>
      )}

      {/* Goal modal */}
      {modal === 'goal' && (
        <div className="bg-rink-800 border border-green-500/30 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-black text-green-400">Add Goal</span>
            <button onClick={() => setModal(null)} className="text-dim hover:text-white text-lg">✕</button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-dim block mb-1">Team</label>
              <select value={goalTeam} onChange={e => { setGoalTeam(Number(e.target.value)); setGoalScorer('') }} className={sel}>
                <option value={game.home_team_id}>{game.home_team.abbreviation} (Home)</option>
                <option value={game.away_team_id}>{game.away_team.abbreviation} (Away)</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-dim block mb-1">Type</label>
              <select value={goalType} onChange={e => setGoalType(e.target.value as GoalType)} className={sel}>
                {(['ev','pp','sh','en','so'] as GoalType[]).map(t => (
                  <option key={t} value={t}>{t.toUpperCase()}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-dim block mb-1">Scorer *</label>
            <select value={goalScorer} onChange={e => setGoalScorer(Number(e.target.value))} className={sel}>
              <option value="">— Select scorer —</option>
              {skatersFor(goalTeam).map(p => (
                <option key={p.id} value={p.id}>#{p.jersey_number} {p.last_name}, {p.first_name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-dim block mb-1">Assist 1</label>
              <select value={goalAssist1} onChange={e => setGoalAssist1(Number(e.target.value) || '')} className={sel}>
                <option value="">—</option>
                {skatersFor(goalTeam).map(p => (
                  <option key={p.id} value={p.id}>#{p.jersey_number} {p.last_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-dim block mb-1">Assist 2</label>
              <select value={goalAssist2} onChange={e => setGoalAssist2(Number(e.target.value) || '')} className={sel}>
                <option value="">—</option>
                {skatersFor(goalTeam).map(p => (
                  <option key={p.id} value={p.id}>#{p.jersey_number} {p.last_name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-dim block mb-1">Period</label>
              <select value={goalPeriod} onChange={e => setGoalPeriod(e.target.value)} className={sel}>
                {[1,2,3,4,5].map(p => <option key={p} value={p}>{PERIOD_LABELS[p-1]}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-dim block mb-1">Time</label>
              <input type="text" value={goalTime} onChange={e => setGoalTime(e.target.value)}
                placeholder="14:32" className={inp} />
            </div>
          </div>
          {error && <div className="text-[12px] text-red-400">{error}</div>}
          <button onClick={handleAddGoal} disabled={saving}
            className={`${btn} bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 w-full`}>
            {saving ? 'Saving…' : '+ Add Goal'}
          </button>
        </div>
      )}

      {/* Penalty modal */}
      {modal === 'penalty' && (
        <div className="bg-rink-800 border border-red-500/30 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-black text-red-400">Add Penalty</span>
            <button onClick={() => setModal(null)} className="text-dim hover:text-white text-lg">✕</button>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-dim block mb-1">Team</label>
            <select value={penTeam} onChange={e => { setPenTeam(Number(e.target.value)); setPenPlayer('') }} className={sel}>
              <option value={game.home_team_id}>{game.home_team.abbreviation} (Home)</option>
              <option value={game.away_team_id}>{game.away_team.abbreviation} (Away)</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-dim block mb-1">Player *</label>
            <select value={penPlayer} onChange={e => setPenPlayer(Number(e.target.value))} className={sel}>
              <option value="">— Select player —</option>
              {playersFor(penTeam).map(p => (
                <option key={p.id} value={p.id}>#{p.jersey_number} {p.last_name}, {p.first_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-dim block mb-1">Infraction *</label>
            <select value={penInfraction} onChange={e => setPenInfraction(e.target.value)} className={sel}>
              <option value="">— Select —</option>
              {INFRACTIONS.map(inf => <option key={inf} value={inf}>{inf}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-dim block mb-1">Minutes</label>
              <select value={penMinutes} onChange={e => setPenMinutes(e.target.value)} className={sel}>
                {['2','4','5','10'].map(m => <option key={m} value={m}>{m} min</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-dim block mb-1">Period</label>
              <select value={penPeriod} onChange={e => setPenPeriod(e.target.value)} className={sel}>
                {[1,2,3,4,5].map(p => <option key={p} value={p}>{PERIOD_LABELS[p-1]}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-dim block mb-1">Time</label>
              <input type="text" value={penTime} onChange={e => setPenTime(e.target.value)}
                placeholder="7:42" className={inp} />
            </div>
          </div>
          {error && <div className="text-[12px] text-red-400">{error}</div>}
          <button onClick={handleAddPenalty} disabled={saving}
            className={`${btn} bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 w-full`}>
            {saving ? 'Saving…' : '+ Add Penalty'}
          </button>
        </div>
      )}

      {/* Event log */}
      {events.length > 0 && (
        <div className="bg-rink-800 border border-white/[0.07] rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 bg-rink-700 border-b border-white/[0.07]">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted">Play by Play</span>
          </div>
          {events.map((ev: any) => (
            <div key={`${ev._type}-${ev.id}`}
              className="flex items-center gap-3 px-4 py-2.5 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] group">
              {ev._type === 'goal' ? (
                <>
                  <span className="text-green-400 text-lg">🥅</span>
                  <div className="flex-1 min-w-0 flex flex-wrap items-center gap-2 text-[12px]">
                    <span className="text-muted font-bold">P{ev.period} {ev.time_in_period}</span>
                    <div className="w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-black text-white shrink-0"
                      style={{ background: ev.team_id === game.home_team_id ? game.home_team.color : game.away_team.color }}>
                      {ev.team_id === game.home_team_id ? game.home_team.abbreviation : game.away_team.abbreviation}
                    </div>
                    <span className="text-white font-bold">#{ev.scorer?.jersey_number} {ev.scorer?.last_name}</span>
                    {(ev.assist1 || ev.assist2) && (
                      <span className="text-dim text-[11px]">
                        ({[ev.assist1, ev.assist2].filter(Boolean).map((a: any) => a.last_name).join(', ')})
                      </span>
                    )}
                    {ev.goal_type !== 'ev' && (
                      <span className="text-[10px] font-black text-ice-light bg-ice/10 px-1.5 py-0.5 rounded">
                        {ev.goal_type.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <button onClick={() => handleDeleteGoal(ev.id)}
                    className="opacity-0 group-hover:opacity-100 text-dim hover:text-red-400 text-xs border border-white/10 rounded px-2 py-1 transition-all">
                    Del
                  </button>
                </>
              ) : (
                <>
                  <span className="text-red-400 text-lg">✋</span>
                  <div className="flex-1 min-w-0 flex flex-wrap items-center gap-2 text-[12px]">
                    <span className="text-muted font-bold">P{ev.period} {ev.time_in_period}</span>
                    <div className="w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-black text-white shrink-0"
                      style={{ background: ev.team_id === game.home_team_id ? game.home_team.color : game.away_team.color }}>
                      {ev.team_id === game.home_team_id ? game.home_team.abbreviation : game.away_team.abbreviation}
                    </div>
                    <span className="text-white font-bold">#{ev.player?.jersey_number} {ev.player?.last_name}</span>
                    <span className="text-dim">{ev.infraction}</span>
                    <span className="text-amber-400 font-bold">{ev.minutes} min</span>
                  </div>
                  <button onClick={() => handleDeletePenalty(ev.id)}
                    className="opacity-0 group-hover:opacity-100 text-dim hover:text-red-400 text-xs border border-white/10 rounded px-2 py-1 transition-all">
                    Del
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <a href="/admin/scores" className="text-[12px] font-bold text-dim hover:text-white transition-colors text-center block">
        ← Back to Game Data
      </a>
    </div>
  )
}