'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Season } from '@/types'

interface Props { seasons: Season[] }

export function SettingsManager({ seasons: initialSeasons }: Props) {
  const supabase = createClient()
  const router = useRouter()

  const [seasons, setSeasons] = useState(initialSeasons)
  const [showNew, setShowNew] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [newStart, setNewStart] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSetActive = async (season: Season) => {
    // Deactivate all, then activate selected
    await supabase.from('seasons').update({ is_active: false }).neq('id', 0)
    await supabase.from('seasons').update({ is_active: true }).eq('id', season.id)
    setSeasons(s => s.map(x => ({ ...x, is_active: x.id === season.id })))
    router.refresh()
  }

  const handleAddSeason = async () => {
    if (!newLabel.trim() || !newStart) { setError('Label and start date are required'); return }
    setSaving(true)
    const { data, error: saveErr } = await supabase
      .from('seasons')
      .insert({ label: newLabel.trim(), start_date: newStart, is_active: false })
      .select()
      .single()
    if (saveErr) { setError(saveErr.message); setSaving(false); return }
    setSeasons(s => [data as Season, ...s])
    setShowNew(false)
    setNewLabel('')
    setNewStart('')
    setSaving(false)
  }

  const activeSeason = seasons.find(s => s.is_active)

  return (
    <div className="flex flex-col gap-5">

      {/* Active season banner */}
      {activeSeason && (
        <div className="bg-ice/10 border border-ice/30 rounded-lg px-4 py-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-ice-light mb-1">Active Season</div>
            <div className="text-xl font-black">{activeSeason.label}</div>
            <div className="text-[11px] text-muted mt-0.5">
              Started {new Date(activeSeason.start_date).toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
          <div className="text-[10px] font-black uppercase tracking-wider text-ice-light bg-ice/10 border border-ice/20 px-3 py-1.5 rounded-sm">
            Current
          </div>
        </div>
      )}

      {/* Seasons list */}
      <div className="bg-rink-800 border border-white/[0.07] rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-white/[0.07] bg-rink-700 flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted">All Seasons</span>
          <button onClick={() => setShowNew(true)}
            className="px-3 py-1 text-[11px] font-bold bg-ice hover:bg-ice-light text-white rounded transition-colors">
            + New Season
          </button>
        </div>

        {showNew && (
          <div className="px-4 py-4 border-b border-white/[0.07] bg-rink-700/50 flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-dim">Season Label</label>
                <input type="text" value={newLabel} onChange={e => setNewLabel(e.target.value)}
                  placeholder="2026-27"
                  className="bg-rink-700 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder:text-dim outline-none focus:border-ice/50" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-dim">Start Date</label>
                <input type="date" value={newStart} onChange={e => setNewStart(e.target.value)}
                  className="bg-rink-700 border border-white/10 rounded px-3 py-2 text-sm text-white outline-none focus:border-ice/50" />
              </div>
            </div>
            {error && <div className="text-[12px] text-red-400">{error}</div>}
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowNew(false)}
                className="px-3 py-1.5 text-[12px] font-bold border border-white/10 rounded text-muted hover:text-white transition-colors">
                Cancel
              </button>
              <button onClick={handleAddSeason} disabled={saving}
                className="px-4 py-1.5 text-[12px] font-bold bg-ice hover:bg-ice-light text-white rounded disabled:opacity-50 transition-colors">
                {saving ? 'Saving…' : 'Create Season'}
              </button>
            </div>
          </div>
        )}

        {seasons.map(season => (
          <div key={season.id}
            className="flex items-center gap-4 px-4 py-3 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors">
            <div className="flex-1">
              <div className="text-[14px] font-bold text-white">{season.label}</div>
              <div className="text-[11px] text-dim">
                Started {new Date(season.start_date).toLocaleDateString('en-CA', { month: 'long', year: 'numeric' })}
              </div>
            </div>
            {season.is_active ? (
              <span className="text-[10px] font-black uppercase tracking-wider text-ice-light bg-ice/10 border border-ice/20 px-2.5 py-1 rounded-sm">
                Active
              </span>
            ) : (
              <button onClick={() => handleSetActive(season)}
                className="text-[11px] font-bold text-muted hover:text-white border border-white/10 rounded px-3 py-1.5 transition-colors">
                Set Active
              </button>
            )}
          </div>
        ))}
      </div>

    </div>
  )
}