import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { AdminShell } from '@/components/admin/AdminShell'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/admin/login')

  // Fetch role from admin_users table
  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('role, full_name, team_id')
    .eq('id', user.id)
    .single()

  // If no admin_users record, treat as scorekeeper (new user)
  const role = adminUser?.role ?? 'scorekeeper'

  // Scorekeepers go straight to scores page
  // (only redirect if they somehow land on /admin root)

  return (
    <AdminShell
      userEmail={user.email ?? ''}
      userName={adminUser?.full_name ?? undefined}
      role={role}
    >
      {children}
    </AdminShell>
  )
}
