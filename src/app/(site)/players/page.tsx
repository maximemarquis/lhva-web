import { createServerSupabaseClient } from '@/lib/supabase/server'
import { PlayersClient } from '@/components/players/PlayersClient'
import { Suspense } from 'react'

export const revalidate = 300

export default async function PlayersPage() {
  const supabase = await createServerSupabaseClient()

  const [{ data: players }, { data: teams }] = await Promise.all([
    supabase
      .from('players')
      .select('*, team:teams(*)')
      .eq('is_active', true)
      .order('jersey_number', { ascending: true, nullsFirst: false }),
    supabase
      .from('teams')
      .select('*')
      .order('name_en'),
  ])

  return (
    <Suspense>
      <PlayersClient players={players ?? []} teams={teams ?? []} />
    </Suspense>
  )
}
