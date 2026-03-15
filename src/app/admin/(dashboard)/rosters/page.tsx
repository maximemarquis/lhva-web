import { createServerSupabaseClient } from '@/lib/supabase/server'
import { RosterManager } from '@/components/admin/RosterManager'
import type { Team, Player } from '@/types'

export default async function RostersPage() {
  const supabase = await createServerSupabaseClient()

  const [teamsRes, playersRes] = await Promise.all([
    supabase.from('teams').select('*').order('name_en'),
    supabase.from('players').select('*').eq('is_active', true)
      .order('last_name'),
  ])

  const teams = (teamsRes.data ?? []) as Team[]
  const players = (playersRes.data ?? []) as Player[]

  const playersByTeam: Record<number, Player[]> = {}
  for (const player of players) {
    if (!playersByTeam[player.team_id]) playersByTeam[player.team_id] = []
    playersByTeam[player.team_id].push(player)
  }

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-[18px] font-black">Roster Management</h1>
        <div className="text-[12px] text-dim">{players.length} active players across {teams.length} teams</div>
      </div>
      <RosterManager teams={teams} playersByTeam={playersByTeam} />
    </div>
  )
}