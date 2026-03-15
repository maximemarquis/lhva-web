'use server'

import { createClient } from '@supabase/supabase-js'
import type { AdminRole } from '@/types'

// Service role client — bypasses RLS, server-only
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

interface CreateUserParams {
  email: string
  full_name: string
  role: AdminRole
  team_id: number | null
  password: string
}

export async function createAdminUser(params: CreateUserParams) {
  const admin = getAdminClient()

  // 1. Create auth user
  const { data: authData, error: authErr } = await admin.auth.admin.createUser({
    email:           params.email,
    password:        params.password,
    email_confirm:   true, // skip email verification
    user_metadata:   { full_name: params.full_name },
  })

  if (authErr) return { error: authErr.message }

  // 2. Create admin_users record
  const { error: dbErr } = await admin
    .from('admin_users')
    .insert({
      id:        authData.user.id,
      email:     params.email,
      full_name: params.full_name || null,
      role:      params.role,
      team_id:   params.team_id || null,
    })

  if (dbErr) {
    // Rollback auth user if DB insert fails
    await admin.auth.admin.deleteUser(authData.user.id)
    return { error: dbErr.message }
  }

  return { success: true, userId: authData.user.id }
}

interface UpdateUserParams {
  id: string
  role: AdminRole
  team_id: number | null
  full_name?: string
}

export async function updateAdminUser(params: UpdateUserParams) {
  const admin = getAdminClient()
  const { error } = await admin
    .from('admin_users')
    .update({
      role:      params.role,
      team_id:   params.team_id || null,
      full_name: params.full_name || null,
    })
    .eq('id', params.id)

  if (error) return { error: error.message }
  return { success: true }
}

export async function deleteAdminUser(id: string) {
  const admin = getAdminClient()

  // Delete from admin_users first
  await admin.from('admin_users').delete().eq('id', id)

  // Delete auth user
  const { error } = await admin.auth.admin.deleteUser(id)
  if (error) return { error: error.message }

  return { success: true }
}

export async function resetUserPassword(id: string, newPassword: string) {
  const admin = getAdminClient()
  const { error } = await admin.auth.admin.updateUserById(id, {
    password: newPassword,
  })
  if (error) return { error: error.message }
  return { success: true }
}