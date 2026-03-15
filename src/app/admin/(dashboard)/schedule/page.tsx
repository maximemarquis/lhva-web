import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ScheduleManager } from '@/components/admin/ScheduleManager'
import { PlayoffsManager } from '@/components/admin/PlayoffsManager'
import type { Team, Game } from '@/types'

export default async function AdminSchedulePage() {
  const supabase = await createServerSupabaseClient()

  const [teamsRes, allGamesRes, playoffGamesRes] = await Promise.all([
    supabase.from('teams').select('*').order('name_en'),
    supabase
      .from('games')
      .select(`*, home_team:teams!home_team_id(*), away_team:teams!away_team_id(*)`)
      .eq('season_id', 1)
      .order('played_at', { ascending: true }),
    supabase
      .from('games')
      .select(`*, home_team:teams!home_team_id(*), away_team:teams!away_team_id(*)`)
      .eq('season_id', 1)
      .in('game_type', ['playoff-qf', 'playoff-sf', 'playoff-final'])
      .order('played_at', { ascending: true }),
  ])

  const teams       = (teamsRes.data ?? []) as Team[]
  const allGames    = (allGamesRes.data ?? []) as Game[]
  const playoffGames = (playoffGamesRes.data ?? []) as Game[]

  return (
    <div className="p-6 flex flex-col gap-10">

      {/* Schedule section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-[18px] font-black">Schedule</h1>
          <div className="text-[12px] text-dim">{allGames.length} games total</div>
        </div>
        <ScheduleManager teams={teams} initialGames={allGames} />
      </div>

      {/* Divider */}
      <div className="border-t border-white/[0.07]" />

      {/* Playoffs section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[18px] font-black">Playoff Bracket</h2>
          <a href="/playoffs" target="_blank"
            className="text-[12px] font-bold text-ice-light hover:text-white transition-colors">
            View public page ↗
          </a>
        </div>
        <PlayoffsManager teams={teams} games={playoffGames} />
      </div>

    </div>
  )
}
