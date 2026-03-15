import { createServerSupabaseClient } from '@/lib/supabase/server'
import { PlayoffsManager } from '@/components/admin/PlayoffsManager'
import type { Team, Game } from '@/types'

export default async function AdminPlayoffsPage() {
  const supabase = await createServerSupabaseClient()

  const [teamsRes, gamesRes] = await Promise.all([
    supabase.from('teams').select('*').order('name_en'),
    supabase
      .from('games')
      .select(`*, home_team:teams!home_team_id(*), away_team:teams!away_team_id(*)`)
      .eq('season_id', 1)
      .in('game_type', ['playoff-qf', 'playoff-sf', 'playoff-final'])
      .order('played_at', { ascending: true }),
  ])

  const teams = (teamsRes.data ?? []) as Team[]
  const games = (gamesRes.data ?? []) as Game[]

  return (
    <div className="p-6 flex flex-col gap-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-[18px] font-black">Playoffs</h1>
        <a href="/playoffs" target="_blank"
          className="text-[12px] font-bold text-ice-light hover:text-white transition-colors">
          View public page ↗
        </a>
      </div>
      <PlayoffsManager teams={teams} games={games} />
    </div>
  )
}