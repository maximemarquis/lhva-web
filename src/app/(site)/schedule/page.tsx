import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Game, Team } from '@/types'
import { ScheduleClient } from '@/components/schedule/ScheduleClient'

export const revalidate = 60

export default async function SchedulePage() {
  const supabase = await createServerSupabaseClient()

  const [gamesRes, teamsRes] = await Promise.all([
    supabase
      .from('games')
      .select(`*, home_team:teams!home_team_id(*), away_team:teams!away_team_id(*)`)
      .eq('season_id', 1)
      .eq('is_published', true)
      .order('played_at', { ascending: false }),
    supabase
      .from('teams')
      .select('*')
      .order('name_en'),
  ])

  const games = (gamesRes.data ?? []) as Game[]
  const teams = (teamsRes.data ?? []) as Team[]

  return <ScheduleClient games={games} teams={teams} />
}
