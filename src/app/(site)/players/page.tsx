import { createServerSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const revalidate = 300

export default async function PlayersPage() {
  const supabase = await createServerSupabaseClient()

  const { data: teams } = await supabase
    .from('teams')
    .select('*, players(*)')
    .order('name_en')

  return (
    <div className="max-w-[1000px] mx-auto px-6 py-8">
      <div className="mb-6">
        <div className="text-[11px] font-black uppercase tracking-widest text-ice-light mb-1">2025–26 Season</div>
        <h1 className="text-3xl font-black uppercase tracking-tight">Players</h1>
      </div>

      <div className="flex flex-col gap-8">
        {(teams ?? []).map((team: any) => (
          <div key={team.id}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black text-white shrink-0"
                style={{ background: team.color }}>{team.abbreviation}</div>
              <h2 className="text-[15px] font-black uppercase tracking-wide">{team.name_en}</h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {(team.players ?? [])
                .filter((p: any) => p.is_active)
                .sort((a: any, b: any) => (a.jersey_number ?? 99) - (b.jersey_number ?? 99))
                .map((player: any) => (
                  <Link key={player.id}
                    href={`/players/${player.slug ?? player.id}`}
                    className="bg-rink-800 border border-white/[0.07] rounded-lg p-3 hover:border-white/20 hover:bg-rink-700 transition-colors group">

                    {/* Photo or placeholder */}
                    <div className="w-full aspect-square rounded-lg mb-2 overflow-hidden bg-rink-700 flex items-center justify-center">
                      {player.photo_url ? (
                        <img src={player.photo_url} alt={`${player.first_name} ${player.last_name}`}
                          className="w-full h-full object-cover object-top" />
                      ) : (
                        <div className="text-3xl font-black text-rink-600"
                          style={{ color: team.color + '40' }}>
                          {player.jersey_number ?? '#'}
                        </div>
                      )}
                    </div>

                    <div className="text-[11px] text-dim mb-0.5">#{player.jersey_number}</div>
                    <div className="text-[13px] font-bold text-white leading-tight group-hover:text-ice-light transition-colors">
                      {player.first_name} {player.last_name}
                    </div>
                    <div className="text-[10px] text-dim mt-0.5 uppercase tracking-wider">
                      {player.position === 'F' ? 'Forward' : player.position === 'D' ? 'Defence' : 'Goalie'}
                    </div>
                  </Link>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}