'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Team, Player, PlayerPosition } from '@/types'

interface Props {
  teams: Team[]
  playersByTeam: Record<number, Player[]>
}

const POSITIONS: PlayerPosition[] = ['F', 'D', 'G']
const POSITION_LABEL: Record<string, string> = { F: 'Forward', D: 'Defence', G: 'Goalie' }

interface PlayerForm {
  first_name: string
  last_name: string
  jersey_number: string
  position: PlayerPosition
  team_id: number
}

const EMPTY_FORM = (teamId: number): PlayerForm => ({
  first_name: '', last_name: '', jersey_number: '', position: 'F', team_id: teamId,
})

export function RosterManager({ teams, playersByTeam }: Props) {
  const supabase = createClient()
  const router = useRouter()

  const [activeTeam, setActiveTeam] = useState<number>(teams[0]?.id ?? 0)
  const [showForm, setShowForm] = useState(false)
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null)
  const [form, setForm] = useState<PlayerForm>(EMPTY_FORM(teams[0]?.id ?? 0))
  const [saving, setSaving] = useState(false)
  const [removing, setRemoving] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const team = teams.find(t => t.id === activeTeam)
  const players = playersByTeam[activeTeam] ?? []
  const forwards = players.filter(p => p.position === 'F').sort((a, b) => (a.jersey_number ?? 0) - (b.jersey_number ?? 0))
  const defence  = players.filter(p => p.position === 'D').sort((a, b) => (a.jersey_number ?? 0) - (b.jersey_number ?? 0))
  const goalies  = players.filter(p => p.position === 'G').sort((a, b) => (a.jersey_number ?? 0) - (b.jersey_number ?? 0))

  const openAdd = () => {
    setEditingPlayer(null)
    setForm(EMPTY_FORM(activeTeam))
    setShowForm(true)
    setError(null)
  }

  const openEdit = (player: Player) => {
    setEditingPlayer(player)
    setForm({
      first_name:    player.first_name,
      last_name:     player.last_name,
      jersey_number: player.jersey_number?.toString() ?? '',
      position:      player.position,
      team_id:       player.team_id,
    })
    setShowForm(true)
    setError(null)
  }

  const handleSave = async () => {
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setError('First and last name are required')
      return
    }
    setSaving(true)
    setError(null)

    const payload = {
      first_name:    form.first_name.trim(),
      last_name:     form.last_name.trim(),
      jersey_number: form.jersey_number ? parseInt(form.jersey_number) : null,
      position:      form.position,
      team_id:       form.team_id,
      is_active:     true,
    }

    const { error: saveErr } = editingPlayer
      ? await supabase.from('players').update(payload).eq('id', editingPlayer.id)
      : await supabase.from('players').insert(payload)

    if (saveErr) { setError(saveErr.message); setSaving(false); return }

    setShowForm(false)
    setEditingPlayer(null)
    router.refresh()
    setSaving(false)
  }

  const handleRemove = async (player: Player) => {
    if (!confirm(`Remove ${player.first_name} ${player.last_name} from the roster?`)) return
    setRemoving(player.id)
    await supabase.from('players').update({ is_active: false }).eq('id', player.id)
    setRemoving(null)
    router.refresh()
  }

  const handleTransfer = async (player: Player, newTeamId: number) => {
    await supabase.from('players').update({ team_id: newTeamId }).eq('id', player.id)
    router.refresh()
  }

  return (
    <div className="grid grid-cols-[220px_1fr] gap-5">

      {/* Team selector */}
      <div className="flex flex-col gap-1">
        {teams.map(t => (
          <button key={t.id} onClick={() => { setActiveTeam(t.id); setShowForm(false) }}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded text-left transition-colors ${
              activeTeam === t.id
                ? 'bg-rink-600 border border-white/10'
                : 'hover:bg-rink-700 border border-transparent'
            }`}>
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-black text-white shrink-0"
              style={{ background: t.color }}>{t.abbreviation}</div>
            <div>
              <div className="text-[12px] font-semibold text-white leading-tight">{t.name_en}</div>
              <div className="text-[10px] text-dim">{(playersByTeam[t.id] ?? []).length} players</div>
            </div>
          </button>
        ))}
      </div>

      {/* Roster panel */}
      <div className="flex flex-col gap-4">

        {/* Panel header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-black text-white"
              style={{ background: team?.color }}>{team?.abbreviation}</div>
            <span className="text-[15px] font-black">{team?.name_en}</span>
          </div>
          <button onClick={openAdd}
            className="px-4 py-1.5 text-[12px] font-bold bg-ice hover:bg-ice-light text-white rounded transition-colors">
            + Add Player
          </button>
        </div>

        {/* Add/Edit form */}
        {showForm && (
          <div className="bg-rink-800 border border-ice/30 rounded-lg p-4 flex flex-col gap-3">
            <div className="text-[11px] font-black uppercase tracking-widest text-ice-light">
              {editingPlayer ? 'Edit Player' : 'Add New Player'}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-dim">First Name</label>
                <input type="text" value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
                  placeholder="First name"
                  className="bg-rink-700 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder:text-dim outline-none focus:border-ice/50" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-dim">Last Name</label>
                <input type="text" value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
                  placeholder="Last name"
                  className="bg-rink-700 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder:text-dim outline-none focus:border-ice/50" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-dim">Jersey #</label>
                <input type="number" min={1} max={99} value={form.jersey_number}
                  onChange={e => setForm(f => ({ ...f, jersey_number: e.target.value }))}
                  placeholder="00"
                  className="bg-rink-700 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder:text-dim outline-none focus:border-ice/50" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-dim">Position</label>
                <select value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value as PlayerPosition }))}
                  className="bg-rink-700 border border-white/10 rounded px-3 py-2 text-sm text-white">
                  {POSITIONS.map(p => <option key={p} value={p}>{POSITION_LABEL[p]}</option>)}
                </select>
              </div>
              {editingPlayer && (
                <div className="flex flex-col gap-1.5 col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-dim">Transfer to team</label>
                  <select value={form.team_id} onChange={e => setForm(f => ({ ...f, team_id: Number(e.target.value) }))}
                    className="bg-rink-700 border border-white/10 rounded px-3 py-2 text-sm text-white">
                    {teams.map(t => <option key={t.id} value={t.id}>{t.name_en}</option>)}
                  </select>
                </div>
              )}
            </div>
            {error && <div className="text-[12px] text-red-400">{error}</div>}
            <div className="flex gap-2 justify-end">
              <button onClick={() => { setShowForm(false); setEditingPlayer(null) }}
                className="px-3 py-1.5 text-[12px] font-bold border border-white/10 rounded text-muted hover:text-white transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="px-4 py-1.5 text-[12px] font-bold bg-ice hover:bg-ice-light text-white rounded disabled:opacity-50 transition-colors">
                {saving ? 'Saving…' : editingPlayer ? 'Save Changes' : 'Add Player'}
              </button>
            </div>
          </div>
        )}

        {/* Player groups */}
        {[
          { label: 'Forwards', players: forwards },
          { label: 'Defence',  players: defence },
          { label: 'Goalies',  players: goalies },
        ].filter(g => g.players.length > 0).map(group => (
          <div key={group.label} className="bg-rink-800 border border-white/[0.07] rounded-lg overflow-hidden">
            <div className="px-4 py-2.5 bg-rink-700 border-b border-white/[0.07]">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted">{group.label}</span>
            </div>
            {group.players.map(player => (
              <div key={player.id}
                className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-[13px] font-black text-white w-8 text-right">
                    {player.jersey_number ?? '—'}
                  </span>
                  <span className="text-[13px] font-semibold text-white">
                    {player.first_name} {player.last_name}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(player)}
                    className="text-[11px] font-bold text-muted hover:text-white border border-white/10 rounded px-2.5 py-1 transition-colors">
                    Edit
                  </button>
                  <button onClick={() => handleRemove(player)} disabled={removing === player.id}
                    className="text-[11px] font-bold text-muted hover:text-red-400 border border-white/10 hover:border-red-400/30 rounded px-2.5 py-1 transition-colors disabled:opacity-50">
                    {removing === player.id ? '…' : 'Remove'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}

        {players.length === 0 && !showForm && (
          <div className="bg-rink-800 border border-white/[0.07] rounded-lg px-6 py-10 text-center text-[13px] text-dim">
            No players on this roster yet.{' '}
            <button onClick={openAdd} className="text-ice-light hover:underline">Add the first one →</button>
          </div>
        )}

      </div>
    </div>
  )
}