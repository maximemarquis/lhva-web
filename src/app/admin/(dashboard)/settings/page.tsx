import { createServerSupabaseClient } from '@/lib/supabase/server'
import { SettingsManager } from '@/components/admin/SettingsManager'

export default async function SettingsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: seasons } = await supabase
    .from('seasons')
    .select('*')
    .order('start_date', { ascending: false })

  return (
    <div className="p-6 flex flex-col gap-6 max-w-2xl">
      <h1 className="text-[18px] font-black">Season Config</h1>
      <SettingsManager seasons={seasons ?? []} />
    </div>
  )
}