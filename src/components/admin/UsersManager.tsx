'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createAdminUser, updateAdminUser, deleteAdminUser, resetUserPassword } from '@/app/admin/(dashboard)/users/actions'
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

const inp = 'bg-rink-700 border border-white/10 rounded px-3 py-2.5 text-sm text-white placeholder:text-dim outline-none focus:border-ice/50 w-full transition-colors'
const sel = `${inp} cursor-pointer`

export function UsersManager({ teams, initialUsers }: Props) {
  const router = useRouter()
  const [users, setUsers]       = useState<AdminUser[]>(initialUsers)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [success, setSuccess]   = useState<string | null>(null)
  const [resetTarget, setResetTarget] = useState<AdminUser | null>(null)
  const [newPassword, setNewPassword] = useState('')

  // New user form
  const [email,     setEmail]     = useState('')
  const [fullName,  setFullName]  = useState('')
  const [role,      setRole]      = useState<AdminRole>('scorekeeper')
  const [teamId,    setTeamId]    = useState<number | null>(null)
  const [password,  setPassword]  = useState('')
  const [showPass,  setShowPass]  = useState(false)

  const generatePassword = () => {
    const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$'
    const pwd = Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    setPassword(pwd)
    setShowPass(true)
  }

  const handleCreate = async () => {
    if (!email.trim())    { setError('Email is required'); return }
    if (!password.trim()) { setError('Password is required — click Generate to create one'); return }
    setSaving(true); setError(null)

    const result = await createAdminUser({
      email: email.trim(),
      full_name: fullName.trim(),
      role, team_id: teamId, password,
    })

    if (result.error) { setError(result.error); setSaving(false); return }

    setSuccess(`User ${email} created successfully.`)
    setShowForm(false)
    setEmail(''); setFullName(''); setPassword(''); setRole('scorekeeper'); setTeamId(null)
    setSaving(false)
    router.refresh()
  }

  const handleRoleChange = async (user: AdminUser, newRole: AdminRole) => {
    const result = await updateAdminUser({ id: user.id, role: newRole, team_id: user.team_id, full_name: user.full_name ?? undefined })
    if (result.error) { setError(result.error); return }
    setUsers(u => u.map(x => x.id === user.id ? { ...x, role: newRole } : x))
  }

  const handleTeamChange = async (user: AdminUser, tid: number | null) => {
    const result = await updateAdminUser({ id: user.id, role: user.role, team_id: tid, full_name: user.full_name ?? undefined })
    if (result.error) { setError(result.error); return }
    setUsers(u => u.map(x => x.id === user.id ? { ...x, team_id: tid } : x))
  }

  const handleDelete = async (user: AdminUser) => {
    if (!confirm(`Remove ${user.email} from admin access? This will delete their login.`)) return
    const result = await deleteAdminUser(user.id)
    if (result.error) { setError(result.error); return }
    setUsers(u => u.filter(x => x.id !== user.id))
  }

  const handleResetPassword = async () => {
    if (!resetTarget || !newPassword.trim()) return
    setSaving(true)
    const result = await resetUserPassword(resetTarget.id, newPassword)
    if (result.error) { setError(result.error); setSaving(false); return }
    setSuccess(`Password updated for ${resetTarget.email}`)
    setResetTarget(null); setNewPassword(''); setSaving(false)
  }

  return (
    <div className="flex flex-col gap-5">

      {/* Role legend */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {ROLES.map(r => (
          <div key={r.value} className="bg-rink-800 border border-white/[0.07] rounded-lg px-4 py-3">
            <div className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-sm border inline-block mb-2 ${ROLE_STYLES[r.value]}`}>
              {r.label}
            </div>
            <div className="text-[11px] text-dim">{r.desc}</div>
          </div>
        ))}
      </div>

      {/* Alerts */}
      {error   && <div className="bg-red-500/10 border border-red-500/20 rounded px-4 py-3 text-[12px] text-red-400">{error}</div>}
      {success && <div className="bg-green-500/10 border border-green-500/20 rounded px-4 py-3 text-[12px] text-green-400">{success}</div>}

      {/* User list */}
      <div className="bg-rink-800 border border-white/[0.07] rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-white/[0.07] flex items-center justify-between bg-rink-700">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted">
            Admin Users ({users.length})
          </span>
          <button onClick={() => { setShowForm(true); setError(null); setSuccess(null) }}
            className="px-3 py-1 text-[11px] font-bold bg-ice hover:bg-ice-light text-white rounded transition-colors">
            + Add User
          </button>
        </div>

        {/* Create user form */}
        {showForm && (
          <div className="px-4 py-5 border-b border-white/[0.07] bg-rink-700/40 flex flex-col gap-4">
            <div className="text-[12px] font-black uppercase tracking-wider text-ice-light">New Admin User</div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-dim">Email *</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="user@example.com" className={inp} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-dim">Full Name</label>
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                  placeholder="Jean Dupont" className={inp} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-dim">Role</label>
                <select value={role} onChange={e => setRole(e.target.value as AdminRole)} className={sel}>
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-dim">Team (optional)</label>
                <select value={teamId ?? ''} onChange={e => setTeamId(Number(e.target.value) || null)} className={sel}>
                  <option value="">— All teams —</option>
                  {teams.map(t => <option key={t.id} value={t.id}>{t.name_en}</option>)}
                </select>
              </div>
            </div>

            {/* Password field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-dim">
                Temporary Password *
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter or generate a password"
                    className={inp}
                  />
                  <button onClick={() => setShowPass(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-dim hover:text-white">
                    {showPass ? 'Hide' : 'Show'}
                  </button>
                </div>
                <button onClick={generatePassword}
                  className="px-3 py-2 text-[11px] font-bold bg-rink-600 hover:bg-rink-500 border border-white/10 text-muted hover:text-white rounded transition-colors whitespace-nowrap">
                  Generate
                </button>
              </div>
              {password && showPass && (
                <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded px-3 py-2">
                  <span className="text-[11px] text-amber-400">
                    Share this password with the user: <strong className="font-mono">{password}</strong>
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end">
              <button onClick={() => { setShowForm(false); setError(null) }}
                className="px-3 py-1.5 text-[12px] font-bold border border-white/10 rounded text-muted hover:text-white transition-colors">
                Cancel
              </button>
              <button onClick={handleCreate} disabled={saving}
                className="px-4 py-1.5 text-[12px] font-bold bg-ice hover:bg-ice-light text-white rounded disabled:opacity-50 transition-colors">
                {saving ? 'Creating…' : 'Create User'}
              </button>
            </div>
          </div>
        )}

        {/* Reset password modal */}
        {resetTarget && (
          <div className="px-4 py-4 border-b border-white/[0.07] bg-rink-700/40 flex flex-col gap-3">
            <div className="text-[12px] font-black text-amber-400">Reset password for {resetTarget.email}</div>
            <div className="flex gap-2">
              <input type="text" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                placeholder="New password" className={`${inp} flex-1`} />
              <button onClick={() => {
                const pwd = Array.from({ length: 12 }, () =>
                  'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$'[
                    Math.floor(Math.random() * 64)
                  ]).join('')
                setNewPassword(pwd)
              }}
                className="px-3 text-[11px] font-bold bg-rink-600 border border-white/10 text-muted hover:text-white rounded transition-colors">
                Generate
              </button>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => { setResetTarget(null); setNewPassword('') }}
                className="px-3 py-1.5 text-[12px] font-bold border border-white/10 rounded text-muted hover:text-white transition-colors">
                Cancel
              </button>
              <button onClick={handleResetPassword} disabled={saving || !newPassword}
                className="px-4 py-1.5 text-[12px] font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 rounded disabled:opacity-50 transition-colors">
                {saving ? 'Saving…' : 'Reset Password'}
              </button>
            </div>
          </div>
        )}

        {users.length === 0 ? (
          <div className="px-4 py-10 text-center text-[13px] text-dim">No admin users yet.</div>
        ) : (
          users.map(user => (
            <div key={user.id}
              className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors">
              <div className="w-8 h-8 rounded-full bg-ice flex items-center justify-center text-[11px] font-black shrink-0">
                {(user.full_name ?? user.email).slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-white truncate">
                  {user.full_name ?? user.email}
                </div>
                {user.full_name && (
                  <div className="text-[11px] text-dim truncate">{user.email}</div>
                )}
              </div>
              <select value={user.role}
                onChange={e => handleRoleChange(user, e.target.value as AdminRole)}
                className="bg-rink-700 border border-white/10 rounded px-2 py-1.5 text-[12px] text-white">
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
              <select value={user.team_id ?? ''}
                onChange={e => handleTeamChange(user, Number(e.target.value) || null)}
                className="bg-rink-700 border border-white/10 rounded px-2 py-1.5 text-[12px] text-white">
                <option value="">All teams</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.abbreviation}</option>)}
              </select>
              <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-sm border whitespace-nowrap ${ROLE_STYLES[user.role]}`}>
                {ROLES.find(r => r.value === user.role)?.label}
              </span>
              <button onClick={() => { setResetTarget(user); setNewPassword('') }}
                className="text-[11px] font-bold text-dim hover:text-amber-400 border border-white/10 hover:border-amber-400/20 rounded px-2.5 py-1 transition-colors whitespace-nowrap">
                Reset PW
              </button>
              <button onClick={() => handleDelete(user)}
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