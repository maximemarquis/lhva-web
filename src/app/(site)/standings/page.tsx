import { createServerSupabaseClient } from '@/lib/supabase/server'
import { StandingsTable } from '@/components/home/StandingsTable'
import type { StandingRow } from '@/types'

export const revalidate = 300

export default async function StandingsPage() {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('standings')
    .select('*')
    .eq('season_id', 1)
    .order('pts', { ascending: false })

  const rows = (data ?? []) as StandingRow[]

  return (
    <div className="max-w-[1000px] mx-auto px-6 py-8">

      {/* Page header */}
      <div className="mb-6">
        <div className="text-[11px] font-black uppercase tracking-widest text-ice-light mb-1">
          2025–26 Season
        </div>
        <h1 className="text-3xl font-black uppercase tracking-tight">Standings</h1>
      </div>

      {/* Season selector tabs */}
      <div className="flex gap-1 mb-5 border-b border-white/[0.07] pb-0">
        {['2025–26', '2024–25', '2023–24'].map((season, i) => (
          <button key={season}
            className={`px-4 py-2 text-[12px] font-bold uppercase tracking-wider border-b-2 -mb-px transition-colors ${
              i === 0
                ? 'text-white border-ice'
                : 'text-muted border-transparent hover:text-white'
            }`}>
            {season}
          </button>
        ))}
      </div>

      {/* Main standings */}
      <StandingsTable rows={rows} />

      {/* Legend */}
      <div className="flex items-center gap-5 mt-4 text-[11px] text-dim">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 bg-ice/40" />
          <span>Playoff cutoff line</span>
        </div>
        <span>GP = Games Played</span>
        <span>W = Wins</span>
        <span>L = Losses</span>
        <span>OTL = Overtime Loss</span>
        <span>PTS = Points</span>
        <span>DIFF = Goal Differential</span>
      </div>

    </div>
  )
}