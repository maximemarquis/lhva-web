import { createServerSupabaseClient } from '@/lib/supabase/server'
import { UsersManager } from '@/components/admin/UsersManager'
import type { Team } from '@/types'

export default async function UsersPage() {
  const supabase = await createServerSupabaseClient()

  const [teamsRes, usersRes] = await Promise.all([
    supabase.from('teams').select('id, name_en, abbreviation, color').order('name_en'),
    supabase.from('admin_users').select('*'),
  ])

  const teams = (teamsRes.data ?? []) as Team[]
  const users = usersRes.data ?? []

  return (
    <div className="p-6 flex flex-col gap-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-[18px] font-black">Users & Roles</h1>
        <div className="text-[12px] text-dim">{users.length} admin user{users.length !== 1 ? 's' : ''}</div>
      </div>
      <UsersManager teams={teams} initialUsers={users} />
    </div>
  )
}