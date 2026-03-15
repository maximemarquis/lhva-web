import { createServerSupabaseClient } from '@/lib/supabase/server'
import { StandingsTable } from '@/components/home/StandingsTable'
import type { StandingRow } from '@/types'
import Link from 'next/link'

export default async function AdminStandingsPage() {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('standings')
    .select('*')
    .eq('season_id', 1)
    .order('pts', { ascending: false })

  const rows = (data ?? []) as StandingRow[]

  return (
    <div className="p-6 flex flex-col gap-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-[18px] font-black">Standings</h1>
        <Link href="/standings" target="_blank"
          className="text-[12px] font-bold text-ice-light hover:text-white transition-colors">
          View public page ↗
        </Link>
      </div>
      <div className="bg-rink-800 border border-white/[0.07] rounded px-4 py-3 text-[12px] text-dim">
        Standings are computed automatically from published game scores. To update standings, publish a game score from the <Link href="/admin/scores" className="text-ice-light hover:underline">Enter Score</Link> page.
      </div>
      <StandingsTable rows={rows} />
    </div>
  )
}