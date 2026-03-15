'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Team } from '@/types'

interface Props { teams: Team[] }

export function TeamsEditor({ teams: initialTeams }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [teams, setTeams] = useState(initialTeams)
  const [editing, setEditing] = useState<Team | null>(null)
  const [form, setForm] = useState<Partial<Team>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const openEdit = (team: Team) => {
    setEditing(team)
    setForm({ ...team })
    setError(null)
  }

  const handleSave = async () => {
    if (!editing) return
    setSaving(true)
    const { error: saveErr } = await supabase
      .from('teams')
      .update({
        name_en:     form.name_en,
        name_fr:     form.name_fr,
        abbreviation: form.abbreviation,
        color:       form.color,
        arena:       form.arena,
        city:        form.city,
      })
      .eq('id', editing.id)

    if (saveErr) { setError(saveErr.message); setSaving(false); return }
    setTeams(t => t.map(x => x.id === editing.id ? { ...x, ...form } as Team : x))
    setEditing(null)
    router.refresh()
    setSaving(false)
  }

  return (
    <div className="flex flex-col gap-3">
      {teams.map(team => (
        <div key={team.id} className="bg-rink-800 border border-white/[0.07] rounded-lg overflow-hidden">
          {editing?.id === team.id ? (
            <div className="p-5 flex flex-col gap-4">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black text-white shrink-0"
                  style={{ background: form.color ?? team.color }}>{form.abbreviation ?? team.abbreviation}</div>
                <span className="text-[14px] font-black">Editing: {team.name_en}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'name_en',      label: 'Name (EN)',     placeholder: 'Dynamo Kedgwick' },
                  { key: 'name_fr',      label: 'Name (FR)',     placeholder: 'Dynamo de Kedgwick' },
                  { key: 'abbreviation', label: 'Abbreviation',  placeholder: 'KD' },
                  { key: 'color',        label: 'Team Color',    placeholder: '#0088ce', type: 'color' },
                  { key: 'arena',        label: 'Arena',         placeholder: 'Aréna de Kedgwick' },
                  { key: 'city',         label: 'City',          placeholder: 'Kedgwick' },
                ].map(field => (
                  <div key={field.key} className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-dim">{field.label}</label>
                    {field.type === 'color' ? (
                      <div className="flex items-center gap-2">
                        <input type="color" value={form[field.key as keyof Team] as string ?? '#0088ce'}
                          onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                          className="w-10 h-9 rounded cursor-pointer bg-transparent border border-white/10" />
                        <input type="text" value={form[field.key as keyof Team] as string ?? ''}
                          onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                          className="flex-1 bg-rink-700 border border-white/10 rounded px-3 py-2 text-sm text-white outline-none focus:border-ice/50" />
                      </div>
                    ) : (
                      <input type="text"
                        value={form[field.key as keyof Team] as string ?? ''}
                        onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                        placeholder={field.placeholder}
                        className="bg-rink-700 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder:text-dim outline-none focus:border-ice/50" />
                    )}
                  </div>
                ))}
              </div>
              {error && <div className="text-[12px] text-red-400">{error}</div>}
              <div className="flex gap-2 justify-end">
                <button onClick={() => setEditing(null)}
                  className="px-3 py-1.5 text-[12px] font-bold border border-white/10 rounded text-muted hover:text-white transition-colors">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="px-4 py-1.5 text-[12px] font-bold bg-ice hover:bg-ice-light text-white rounded disabled:opacity-50 transition-colors">
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4 px-4 py-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-black text-white shrink-0"
                style={{ background: team.color }}>{team.abbreviation}</div>
              <div className="flex-1">
                <div className="text-[14px] font-bold text-white">{team.name_en}</div>
                <div className="text-[11px] text-dim">{team.name_fr} · {team.arena ?? 'No arena'} · {team.city ?? 'No city'}</div>
              </div>
              <button onClick={() => openEdit(team)}
                className="text-[11px] font-bold text-muted hover:text-white border border-white/10 rounded px-3 py-1.5 transition-colors">
                Edit
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}