import { createServerSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AdminStatsPage() {
  const supabase = await createServerSupabaseClient()

  const { data: goalData } = await supabase
    .from('goals')
    .select(`
      scorer_id, assist1_id, assist2_id,
      scorer:players!scorer_id(id, first_name, last_name, team_id),
      game:games(season_id)
    `)

  const { data: players } = await supabase
    .from('players')
    .select('*, team:teams(name_en, abbreviation, color)')
    .eq('is_active', true)

  const statsMap: Record<number, { goals: number; assists: number }> = {}
  for (const goal of goalData ?? []) {
    if (goal.game?.season_id !== 1) continue
    if (goal.scorer_id) {
      if (!statsMap[goal.scorer_id]) statsMap[goal.scorer_id] = { goals: 0, assists: 0 }
      statsMap[goal.scorer_id].goals++
    }
    for (const aid of [goal.assist1_id, goal.assist2_id]) {
      if (aid) {
        if (!statsMap[aid]) statsMap[aid] = { goals: 0, assists: 0 }
        statsMap[aid].assists++
      }
    }
  }

  const stats = (players ?? [])
    .map((p: any) => ({
      ...p,
      goals:   statsMap[p.id]?.goals ?? 0,
      assists: statsMap[p.id]?.assists ?? 0,
      points:  (statsMap[p.id]?.goals ?? 0) + (statsMap[p.id]?.assists ?? 0),
    }))
    .filter((p: any) => p.points > 0)
    .sort((a: any, b: any) => b.points - a.points || b.goals - a.goals)

  return (
    <div className="p-6 flex flex-col gap-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-[18px] font-black">Player Stats</h1>
        <Link href="/stats" target="_blank"
          className="text-[12px] font-bold text-ice-light hover:text-white transition-colors">
          View public page ↗
        </Link>
      </div>

      <div className="bg-rink-800 border border-white/[0.07] rounded-lg overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-rink-700">
              {['#', 'Player', 'Team', 'Pos', 'G', 'A', 'PTS'].map(h => (
                <th key={h} className={`px-3 py-2 text-[10px] font-black uppercase tracking-widest text-dim ${h === 'Player' ? 'text-left' : 'text-center'}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stats.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-[13px] text-dim">
                No stats yet — publish some game scores first.
              </td></tr>
            ) : stats.map((p: any, i: number) => (
              <tr key={p.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] last:border-0">
                <td className="px-3 py-2.5 text-center text-[12px] text-dim">{i + 1}</td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[7px] font-black text-white shrink-0"
                      style={{ background: p.team?.color }}>
                      {p.team?.abbreviation}
                    </div>
                    <span className="text-[13px] font-semibold text-white">{p.first_name[0]}. {p.last_name}</span>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-center text-[12px] text-muted">{p.team?.abbreviation}</td>
                <td className="px-3 py-2.5 text-center text-[12px] text-muted">{p.position}</td>
                <td className="px-3 py-2.5 text-center text-[13px] text-muted">{p.goals}</td>
                <td className="px-3 py-2.5 text-center text-[13px] text-muted">{p.assists}</td>
                <td className="px-3 py-2.5 text-center text-[13px] font-black text-white">{p.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}