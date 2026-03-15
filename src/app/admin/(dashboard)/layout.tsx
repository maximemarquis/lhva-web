import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { AdminSidebar } from '@/components/admin/AdminSidebar'

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
    <div className="flex min-h-screen bg-rink-900">
      <AdminSidebar
        userEmail={user.email ?? ''}
        userName={adminUser?.full_name ?? undefined}
        role={role}
      />
      <div className="flex-1 flex flex-col min-w-0">
        {children}
      </div>
    </div>
  )
}