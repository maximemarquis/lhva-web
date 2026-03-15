import { createServerSupabaseClient } from '@/lib/supabase/server'
import { TeamsEditor } from '@/components/admin/TeamsEditor'
import type { Team } from '@/types'

export default async function AdminTeamsPage() {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase.from('teams').select('*').order('name_en')
  const teams = (data ?? []) as Team[]

  return (
    <div className="p-6 flex flex-col gap-6 max-w-3xl">
      <h1 className="text-[18px] font-black">Teams</h1>
      <TeamsEditor teams={teams} />
    </div>
  )
}