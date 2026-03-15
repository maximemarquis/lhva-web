import { createServerSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Team } from '@/types'

export const revalidate = 300

export default async function TeamsPage() {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase.from('teams').select('*').order('name_en')
  const teams = (data ?? []) as Team[]

  return (
    <div className="max-w-[1000px] mx-auto px-6 py-8">
      <div className="mb-6">
        <div className="text-[11px] font-black uppercase tracking-widest text-ice-light mb-1">2025–26 Season</div>
        <h1 className="text-3xl font-black uppercase tracking-tight">Teams</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teams.map(team => (
          <Link key={team.id} href={`/teams/${team.slug}`}
            className="bg-rink-800 border border-white/[0.07] rounded-lg p-5 hover:border-white/20 transition-colors group">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-[16px] font-black text-white shrink-0"
                style={{ background: team.color }}>
                {team.abbreviation}
              </div>
              <div>
                <div className="text-[15px] font-black text-white group-hover:text-ice-light transition-colors leading-tight">
                  {team.name_en}
                </div>
                <div className="text-[11px] text-muted mt-0.5">{team.name_fr}</div>
              </div>
            </div>
            <div className="border-t border-white/[0.07] pt-3 flex items-center justify-between">
              <div className="text-[11px] text-dim">{team.arena ?? 'Arena TBD'}</div>
              <div className="text-[11px] font-bold text-ice-light group-hover:translate-x-0.5 transition-transform">
                Roster →
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}