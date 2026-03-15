'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const supabase = createClient()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/admin')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-rink-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex items-center gap-3 justify-center mb-8">
          <svg viewBox="0 0 36 40" className="w-10 h-11">
            <path d="M18 1L35 8V22C35 31 27 37 18 39C9 37 1 31 1 22V8L18 1Z"
              fill="#0088ce" stroke="#00aaff" strokeWidth="0.8"/>
            <text x="18" y="26" textAnchor="middle" fill="white"
              fontSize="11" fontWeight="900" fontFamily="system-ui">LH</text>
          </svg>
          <div>
            <div className="text-xl font-black tracking-wide">LHVA Admin</div>
            <div className="text-[11px] text-muted">Appalachian Valley Hockey</div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-rink-800 border border-white/[0.07] rounded-lg p-6">
          <h1 className="text-[15px] font-bold mb-5">Sign in to your account</h1>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-dim">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="bg-rink-700 border border-white/10 rounded px-3 py-2.5 text-sm text-white placeholder:text-dim outline-none focus:border-ice/60 transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-dim">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="bg-rink-700 border border-white/10 rounded px-3 py-2.5 text-sm text-white placeholder:text-dim outline-none focus:border-ice/60 transition-colors"
              />
            </div>

            {error && (
              <div className="text-[12px] text-red-400 bg-red-500/10 border border-red-500/20 rounded px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="bg-ice hover:bg-ice-light text-white font-bold text-sm py-2.5 rounded transition-colors disabled:opacity-50 mt-1">
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] text-dim mt-4">
          LHVA admin access only. Contact the commissioner for access.
        </p>
      </div>
    </div>
  )
}