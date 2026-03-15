import { createServerSupabaseClient } from '@/lib/supabase/server'
import { AwardsManager } from '@/components/admin/AwardsManager'

export default async function AwardsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: players } = await supabase
    .from('players')
    .select('id, first_name, last_name, team:teams(name_en, abbreviation, color)')
    .eq('is_active', true)
    .order('last_name')

  return (
    <div className="p-6 flex flex-col gap-6 max-w-2xl">
      <h1 className="text-[18px] font-black">Awards</h1>
      <AwardsManager players={players ?? []} />
    </div>
  )
}