import { createServerSupabaseClient } from '@/lib/supabase/server'
import { LiveGameSheet } from '@/components/admin/LiveGameSheet'
import { notFound } from 'next/navigation'
import type { Team, Player } from '@/types'

interface Props {
  params: Promise<{ id: string }>
}

export default async function LiveGamePage({ params }: Props) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const [gameRes, teamsRes] = await Promise.all([
    supabase
      .from('games')
      .select(`
        *,
        home_team:teams!home_team_id(*),
        away_team:teams!away_team_id(*),
        goals(
          *,
          scorer:players!scorer_id(id, first_name, last_name, jersey_number),
          assist1:players!assist1_id(id, first_name, last_name, jersey_number),
          assist2:players!assist2_id(id, first_name, last_name, jersey_number)
        ),
        penalties(
          *,
          player:players(id, first_name, last_name, jersey_number)
        ),
        goalie_stats(
          *,
          player:players(id, first_name, last_name, jersey_number)
        ),
        game_pp_stats(*)
      `)
      .eq('id', id)
      .single(),
    supabase.from('teams').select('*'),
  ])

  if (!gameRes.data) notFound()

  const game = gameRes.data
  const teams = (teamsRes.data ?? []) as Team[]

  const { data: homePlayers } = await supabase
    .from('players')
    .select('*')
    .eq('team_id', game.home_team_id)
    .eq('is_active', true)
    .order('jersey_number')

  const { data: awayPlayers } = await supabase
    .from('players')
    .select('*')
    .eq('team_id', game.away_team_id)
    .eq('is_active', true)
    .order('jersey_number')

  const playersByTeam: Record<number, Player[]> = {
    [game.home_team_id]: (homePlayers ?? []) as Player[],
    [game.away_team_id]: (awayPlayers ?? []) as Player[],
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <LiveGameSheet
        game={game as any}
        teams={teams}
        playersByTeam={playersByTeam}
      />
    </div>
  )
}