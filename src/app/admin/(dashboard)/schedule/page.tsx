import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ScheduleManager } from '@/components/admin/ScheduleManager'
import type { Team, Game } from '@/types'

export default async function AdminSchedulePage() {
  const supabase = await createServerSupabaseClient()

  const [teamsRes, gamesRes] = await Promise.all([
    supabase.from('teams').select('*').order('name_en'),
    supabase
      .from('games')
      .select(`*, home_team:teams!home_team_id(*), away_team:teams!away_team_id(*)`)
      .eq('season_id', 1)
      .order('played_at', { ascending: true }),
  ])

  const teams = (teamsRes.data ?? []) as Team[]
  const games = (gamesRes.data ?? []) as Game[]

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-[18px] font-black">Schedule</h1>
        <div className="text-[12px] text-dim">{games.length} games total</div>
      </div>
      <ScheduleManager teams={teams} initialGames={games} />
    </div>
  )
}