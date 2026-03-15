'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Team, AdminRole } from '@/types'

interface AdminUser {
  id: string
  email: string
  full_name: string | null
  role: AdminRole
  team_id: number | null
}

interface Props {
  teams: Team[]
  initialUsers: AdminUser[]
}

const ROLES: { value: AdminRole; label: string; desc: string }[] = [
  { value: 'commissioner', label: 'Commissioner',  desc: 'Full access to everything' },
  { value: 'scorekeeper',  label: 'Scorekeeper',   desc: 'Enter scores & goals only' },
  { value: 'team_rep',     label: 'Team Rep',      desc: 'Manage own team roster' },
  { value: 'readonly',     label: 'Read Only',     desc: 'View admin, no edits' },
]

const ROLE_STYLES: Record<AdminRole, string> = {
  commissioner: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  scorekeeper:  'bg-ice/10 text-ice-light border-ice/20',
  team_rep:     'bg-green-500/10 text-green-400 border-green-500/20',
  readonly:     'bg-white/5 text-dim border-white/10',
}

export function UsersManager({ teams, initialUsers }: Props) {
  const supabase = createClient()
  const router = useRouter()

  const [users, setUsers] = useState<AdminUser[]>(initialUsers)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [inviteRole, setInviteRole] = useState<AdminRole>('scorekeeper')
  const [inviteTeam, setInviteTeam] = useState<number | null>(null)
  const [invitePassword, setInvitePassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !invitePassword.trim()) {
      setError('Email and password are required')
      return
    }
    setSaving(true)
    setError(null)

    // Create auth user via Supabase Admin API (service role needed server-side)
    // For now we create the admin_users record — auth user must be created in Supabase dashboard
    const { error: insertErr } = await supabase.from('admin_users').insert({
      email:     inviteEmail.trim(),
      full_name: inviteName.trim() || null,
      role:      inviteRole,
      team_id:   inviteTeam || null,
    })

    if (insertErr) { setError(insertErr.message); setSaving(false); return }

    setSuccess(`User ${inviteEmail} added. They must also be created in Supabase Auth → Users.`)
    setShowInvite(false)
    setInviteEmail('')
    setInviteName('')
    setInvitePassword('')
    router.refresh()
    setSaving(false)
  }

  const handleRoleChange = async (user: AdminUser, role: AdminRole) => {
    await supabase.from('admin_users').update({ role }).eq('id', user.id)
    setUsers(u => u.map(x => x.id === user.id ? { ...x, role } : x))
  }

  const handleTeamChange = async (user: AdminUser, teamId: number | null) => {
    await supabase.from('admin_users').update({ team_id: teamId }).eq('id', user.id)
    setUsers(u => u.map(x => x.id === user.id ? { ...x, team_id: teamId } : x))
  }

  const handleRemove = async (user: AdminUser) => {
    if (!confirm(`Remove ${user.email} from admin access?`)) return
    await supabase.from('admin_users').delete().eq('id', user.id)
    setUsers(u => u.filter(x => x.id !== user.id))
  }

  return (
    <div className="flex flex-col gap-5">

      {/* Role legend */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {ROLES.map(role => (
          <div key={role.value} className="bg-rink-800 border border-white/[0.07] rounded-lg px-4 py-3">
            <div className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-sm border inline-block mb-2 ${ROLE_STYLES[role.value]}`}>
              {role.label}
            </div>
            <div className="text-[11px] text-dim">{role.desc}</div>
          </div>
        ))}
      </div>

      {/* User list */}
      <div className="bg-rink-800 border border-white/[0.07] rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-white/[0.07] flex items-center justify-between bg-rink-700">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted">Admin Users</span>
          <button onClick={() => { setShowInvite(true); setError(null); setSuccess(null) }}
            className="px-3 py-1 text-[11px] font-bold bg-ice hover:bg-ice-light text-white rounded transition-colors">
            + Add User
          </button>
        </div>

        {/* Add user form */}
        {showInvite && (
          <div className="px-4 py-4 border-b border-white/[0.07] bg-rink-700/50 flex flex-col gap-3">
            <div className="text-[11px] font-black uppercase tracking-widest text-ice-light">New Admin User</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-dim">Email</label>
                <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="bg-rink-700 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder:text-dim outline-none focus:border-ice/50" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-dim">Full Name</label>
                <input type="text" value={inviteName} onChange={e => setInviteName(e.target.value)}
                  placeholder="Jean Dupont"
                  className="bg-rink-700 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder:text-dim outline-none focus:border-ice/50" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-dim">Role</label>
                <select value={inviteRole} onChange={e => setInviteRole(e.target.value as AdminRole)}
                  className="bg-rink-700 border border-white/10 rounded px-3 py-2 text-sm text-white">
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-dim">Team (optional)</label>
                <select value={inviteTeam ?? ''} onChange={e => setInviteTeam(Number(e.target.value) || null)}
                  className="bg-rink-700 border border-white/10 rounded px-3 py-2 text-sm text-white">
                  <option value="">— All teams —</option>
                  {teams.map(t => <option key={t.id} value={t.id}>{t.name_en}</option>)}
                </select>
              </div>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded px-3 py-2 text-[11px] text-amber-400">
              After adding here, also create this user in <strong>Supabase Dashboard → Authentication → Users</strong> with the same email.
            </div>
            {error && <div className="text-[12px] text-red-400">{error}</div>}
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowInvite(false)}
                className="px-3 py-1.5 text-[12px] font-bold border border-white/10 rounded text-muted hover:text-white transition-colors">
                Cancel
              </button>
              <button onClick={handleInvite} disabled={saving}
                className="px-4 py-1.5 text-[12px] font-bold bg-ice hover:bg-ice-light text-white rounded disabled:opacity-50 transition-colors">
                {saving ? 'Saving…' : 'Add User'}
              </button>
            </div>
          </div>
        )}

        {success && (
          <div className="px-4 py-3 bg-green-500/10 border-b border-green-500/20 text-[12px] text-green-400">
            {success}
          </div>
        )}

        {users.length === 0 ? (
          <div className="px-4 py-10 text-center text-[13px] text-dim">
            No admin users yet.
          </div>
        ) : (
          users.map(user => (
            <div key={user.id}
              className="flex items-center gap-4 px-4 py-3 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors">

              {/* Avatar + info */}
              <div className="w-8 h-8 rounded-full bg-ice flex items-center justify-center text-[11px] font-black shrink-0">
                {user.email.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-white truncate">
                  {user.full_name ?? user.email}
                </div>
                {user.full_name && (
                  <div className="text-[11px] text-dim truncate">{user.email}</div>
                )}
              </div>

              {/* Role selector */}
              <select value={user.role}
                onChange={e => handleRoleChange(user, e.target.value as AdminRole)}
                className="bg-rink-700 border border-white/10 rounded px-2 py-1.5 text-[12px] text-white">
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>

              {/* Team selector */}
              <select value={user.team_id ?? ''}
                onChange={e => handleTeamChange(user, Number(e.target.value) || null)}
                className="bg-rink-700 border border-white/10 rounded px-2 py-1.5 text-[12px] text-white">
                <option value="">All teams</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.abbreviation}</option>)}
              </select>

              {/* Role badge */}
              <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-sm border whitespace-nowrap ${ROLE_STYLES[user.role]}`}>
                {ROLES.find(r => r.value === user.role)?.label}
              </span>

              {/* Remove */}
              <button onClick={() => handleRemove(user)}
                className="text-[11px] font-bold text-dim hover:text-red-400 border border-white/10 hover:border-red-400/20 rounded px-2.5 py-1 transition-colors">
                Remove
              </button>
            </div>
          ))
        )}
      </div>

    </div>
  )
}