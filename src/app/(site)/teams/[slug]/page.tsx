import { createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Team, Player } from '@/types'

interface Props {
  params: Promise<{ slug: string }>
}

const POSITION_LABEL: Record<string, string> = { F: 'Forward', D: 'Defence', G: 'Goalie' }

export default async function TeamPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createServerSupabaseClient()

  const { data: teamData } = await supabase
    .from('teams')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!teamData) notFound()
  const team = teamData as Team

  const { data: playerData } = await supabase
    .from('players')
    .select('*')
    .eq('team_id', team.id)
    .eq('is_active', true)
    .order('position')
    .order('jersey_number')

  const players = (playerData ?? []) as Player[]

  const forwards  = players.filter(p => p.position === 'F')
  const defence   = players.filter(p => p.position === 'D')
  const goalies   = players.filter(p => p.position === 'G')
  const groups    = [
    { label: 'Forwards',  players: forwards },
    { label: 'Defence',   players: defence },
    { label: 'Goalies',   players: goalies },
  ].filter(g => g.players.length > 0)

  return (
    <div className="max-w-[900px] mx-auto px-6 py-8">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[11px] text-dim mb-6">
        <Link href="/teams" className="hover:text-white transition-colors">Teams</Link>
        <span>/</span>
        <span className="text-muted">{team.name_en}</span>
      </div>

      {/* Team header */}
      <div className="bg-rink-800 border border-white/[0.07] rounded-lg p-6 mb-6 flex items-center gap-6">
        <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-black text-white shrink-0"
          style={{ background: team.color }}>
          {team.abbreviation}
        </div>
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight">{team.name_en}</h1>
          <div className="text-muted text-[14px] mt-0.5">{team.name_fr}</div>
          <div className="flex items-center gap-4 mt-3 text-[12px] text-dim">
            {team.arena && <span>🏟 {team.arena}</span>}
            {team.city  && <span>📍 {team.city}, NB</span>}
            <span>👥 {players.length} players</span>
          </div>
        </div>
      </div>

      {/* Roster */}
      <div className="mb-3 text-[11px] font-black uppercase tracking-widest text-white flex items-center gap-2">
        <span className="w-0.5 h-3.5 rounded-sm inline-block" style={{ background: team.color }} />
        2025–26 Roster
      </div>

      <div className="flex flex-col gap-4">
        {groups.map(group => (
          <div key={group.label} className="bg-rink-800 border border-white/[0.07] rounded-lg overflow-hidden">
            <div className="px-4 py-2.5 bg-rink-700 border-b border-white/[0.07]">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted">{group.label}</span>
            </div>
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-[10px] font-black uppercase tracking-widest text-dim w-14">#</th>
                  <th className="px-4 py-2 text-left text-[10px] font-black uppercase tracking-widest text-dim">Name</th>
                  <th className="px-4 py-2 text-center text-[10px] font-black uppercase tracking-widest text-dim">Pos</th>
                </tr>
              </thead>
              <tbody>
                {group.players.map(player => (
                  <tr key={player.id}
                    className="border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors cursor-pointer">
                    <td className="px-4 py-2.5">
                      <span className="text-[13px] font-black text-white">
                        {player.jersey_number ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <a href={`/players/${player.slug ?? player.id}`}
                        className="text-[13px] font-semibold text-white hover:text-ice-light transition-colors">
                        {player.first_name} {player.last_name}
                      </a>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <a href={`/players/${player.slug ?? player.id}`}
                        className="text-[11px] font-bold text-dim hover:text-ice-light transition-colors uppercase tracking-wider">
                        {POSITION_LABEL[player.position] ?? player.position} →
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

        {players.length === 0 && (
          <div className="bg-rink-800 border border-white/[0.07] rounded-lg px-6 py-10 text-center text-[13px] text-dim">
            Roster not yet available.
          </div>
        )}
      </div>

    </div>
  )
}