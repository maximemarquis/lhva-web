import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ScoreEntryForm } from '@/components/admin/ScoreEntryForm'
import type { Team, Player } from '@/types'

export default async function ScoresPage() {
  const supabase = await createServerSupabaseClient()

  const [teamsRes, playersRes] = await Promise.all([
    supabase.from('teams').select('*').order('name_en'),
    supabase.from('players').select('*').eq('is_active', true).order('last_name'),
  ])

  const teams = (teamsRes.data ?? []) as Team[]
  const players = (playersRes.data ?? []) as Player[]

  // Group players by team_id for easy lookup in the form
  const playersByTeam: Record<number, Player[]> = {}
  for (const player of players) {
    if (!playersByTeam[player.team_id]) playersByTeam[player.team_id] = []
    playersByTeam[player.team_id].push(player)
  }

  return (
    <div className="p-6 flex flex-col gap-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-[18px] font-black">Enter Game Score</h1>
      </div>
      <ScoreEntryForm teams={teams} playersByTeam={playersByTeam} />
    </div>
  )
}