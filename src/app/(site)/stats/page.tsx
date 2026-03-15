import { createServerSupabaseClient } from '@/lib/supabase/server'

export const revalidate = 300

interface PlayerStat {
  player_id: number
  first_name: string
  last_name: string
  jersey_number: number
  position: string
  team_name: string
  team_color: string
  team_abbr: string
  goals: number
  assists: number
  points: number
  pim: number
  gp: number
}

async function getPlayerStats(supabase: any): Promise<PlayerStat[]> {
  // Aggregate goals and assists per player from the goals table
  const { data: goalData } = await supabase
    .from('goals')
    .select(`
      scorer_id,
      assist1_id,
      assist2_id,
      game:games(season_id)
    `)

  if (!goalData) return []

  const { data: players } = await supabase
    .from('players')
    .select('*, team:teams(name_en, abbreviation, color)')
    .eq('is_active', true)

  if (!players) return []

  // Count stats per player
  const statsMap: Record<number, { goals: number; assists: number; pim: number }> = {}

  for (const goal of goalData) {
    if (goal.game?.season_id !== 1) continue
    if (goal.scorer_id) {
      if (!statsMap[goal.scorer_id]) statsMap[goal.scorer_id] = { goals: 0, assists: 0, pim: 0 }
      statsMap[goal.scorer_id].goals++
    }
    for (const aid of [goal.assist1_id, goal.assist2_id]) {
      if (aid) {
        if (!statsMap[aid]) statsMap[aid] = { goals: 0, assists: 0, pim: 0 }
        statsMap[aid].assists++
      }
    }
  }

  return players
    .map((p: any) => ({
      player_id:    p.id,
      first_name:   p.first_name,
      last_name:    p.last_name,
      jersey_number: p.jersey_number,
      position:     p.position,
      team_name:    p.team?.name_en ?? '',
      team_color:   p.team?.color ?? '#333',
      team_abbr:    p.team?.abbreviation ?? '',
      goals:        statsMap[p.id]?.goals ?? 0,
      assists:      statsMap[p.id]?.assists ?? 0,
      points:       (statsMap[p.id]?.goals ?? 0) + (statsMap[p.id]?.assists ?? 0),
      pim:          statsMap[p.id]?.pim ?? 0,
      gp:           0,
    }))
    .filter((p: PlayerStat) => p.points > 0 || p.goals > 0)
    .sort((a: PlayerStat, b: PlayerStat) => b.points - a.points || b.goals - a.goals)
}

function StatTable({ players, sortKey }: { players: PlayerStat[], sortKey: keyof PlayerStat }) {
  const sorted = [...players].sort((a, b) => (b[sortKey] as number) - (a[sortKey] as number))
  return (
    <div className="bg-rink-800 border border-white/[0.07] rounded-lg overflow-hidden">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-rink-700">
            <th className="px-3 py-2 text-left text-[10px] font-black uppercase tracking-widest text-dim w-8">#</th>
            <th className="px-3 py-2 text-left text-[10px] font-black uppercase tracking-widest text-dim">Player</th>
            <th className="px-3 py-2 text-center text-[10px] font-black uppercase tracking-widest text-dim">Team</th>
            <th className="px-3 py-2 text-center text-[10px] font-black uppercase tracking-widest text-dim">Pos</th>
            <th className="px-3 py-2 text-center text-[10px] font-black uppercase tracking-widest text-dim">G</th>
            <th className="px-3 py-2 text-center text-[10px] font-black uppercase tracking-widest text-dim">A</th>
            <th className="px-3 py-2 text-center text-[10px] font-black uppercase tracking-widest text-white">PTS</th>
            <th className="px-3 py-2 text-center text-[10px] font-black uppercase tracking-widest text-dim">PIM</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((p, i) => (
            <tr key={p.player_id}
              className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors last:border-0">
              <td className="px-3 py-2.5 text-[12px] text-dim">{i + 1}</td>
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-[7px] font-black text-white shrink-0"
                    style={{ background: p.team_color }}>
                    {p.team_abbr}
                  </div>
                  <span className="text-[13px] font-semibold text-white">
                    {p.first_name[0]}. {p.last_name}
                  </span>
                </div>
              </td>
              <td className="px-3 py-2.5 text-center text-[12px] text-muted">{p.team_abbr}</td>
              <td className="px-3 py-2.5 text-center text-[12px] text-muted">{p.position}</td>
              <td className="px-3 py-2.5 text-center text-[13px] text-muted">{p.goals}</td>
              <td className="px-3 py-2.5 text-center text-[13px] text-muted">{p.assists}</td>
              <td className="px-3 py-2.5 text-center text-[13px] font-black text-white">{p.points}</td>
              <td className="px-3 py-2.5 text-center text-[13px] text-muted">{p.pim}</td>
            </tr>
          ))}
          {sorted.length === 0 && (
            <tr><td colSpan={8} className="px-4 py-10 text-center text-[13px] text-dim">
              No stats yet — scores must be published first.
            </td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

export default async function StatsPage() {
  const supabase = await createServerSupabaseClient()
  const players = await getPlayerStats(supabase)

  const scorers  = [...players].sort((a, b) => b.goals - a.goals).slice(0, 5)
  const leaders  = [...players].sort((a, b) => b.points - a.points).slice(0, 5)

  return (
    <div className="max-w-[1000px] mx-auto px-6 py-8">

      <div className="mb-6">
        <div className="text-[11px] font-black uppercase tracking-widest text-ice-light mb-1">2025–26 Season</div>
        <h1 className="text-3xl font-black uppercase tracking-tight">Statistics</h1>
      </div>

      {/* Leaders strip */}
      {players.length > 0 && (
        <div className="grid grid-cols-2 gap-4 mb-8">
          {[
            { title: 'Points Leaders', data: leaders, key: 'points' as const },
            { title: 'Goals Leaders',  data: scorers, key: 'goals' as const },
          ].map(({ title, data, key }) => (
            <div key={title} className="bg-rink-800 border border-white/[0.07] rounded-lg overflow-hidden">
              <div className="px-4 py-2.5 border-b border-white/[0.07] bg-rink-700">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted">{title}</span>
              </div>
              {data.map((p, i) => (
                <div key={p.player_id}
                  className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.04] last:border-0">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[11px] text-dim w-4">{i + 1}</span>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-black text-white shrink-0"
                      style={{ background: p.team_color }}>{p.team_abbr}</div>
                    <div>
                      <div className="text-[13px] font-bold text-white">{p.first_name[0]}. {p.last_name}</div>
                      <div className="text-[10px] text-dim">{p.team_name}</div>
                    </div>
                  </div>
                  <div className={`text-xl font-black ${i === 0 ? 'text-amber-400' : 'text-ice-light'}`}>
                    {p[key]}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Full table */}
      <div className="mb-3 text-[11px] font-black uppercase tracking-widest text-white flex items-center gap-2">
        <span className="w-0.5 h-3.5 bg-ice rounded-sm inline-block" />
        Skater Stats — Full Table
      </div>
      <StatTable players={players} sortKey="points" />

    </div>
  )
}