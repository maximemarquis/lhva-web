import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminDashboard() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('role, full_name')
    .eq('id', user!.id)
    .single()

  const role = adminUser?.role ?? 'scorekeeper'

  // Scorekeepers go straight to the scores/game list
  if (role === 'scorekeeper') redirect('/admin/scores')

  // ── Commissioner / team_rep dashboard ──
  const [gamesRes, articlesRes, playersRes] = await Promise.all([
    supabase.from('games').select('id, is_published, home_score, status').eq('season_id', 1),
    supabase.from('articles').select('id, status'),
    supabase.from('players').select('id').eq('is_active', true),
  ])

  const games    = gamesRes.data ?? []
  const articles = articlesRes.data ?? []
  const players  = playersRes.data ?? []

  const live         = games.filter((g: any) => g.status === 'live').length
  const gamesPlayed  = games.filter((g: any) => g.home_score !== null && g.is_published).length
  const gamesPending = games.filter((g: any) => g.home_score === null && g.status !== 'live').length
  const published    = articles.filter((a: any) => a.status === 'published').length
  const drafts       = articles.filter((a: any) => a.status === 'draft').length

  const stats = [
    { label: 'Games played',      value: gamesPlayed,    sub: 'this season' },
    { label: 'Live now',          value: live,           sub: 'in progress', accent: live > 0 ? 'text-green-400' : undefined },
    { label: 'Scores pending',    value: gamesPending,   sub: 'need entry',  accent: gamesPending > 0 ? 'text-amber-400' : undefined },
    { label: 'Articles published',value: published,      sub: `${drafts} draft${drafts !== 1 ? 's' : ''}` },
    { label: 'Active players',    value: players.length, sub: 'across 6 teams' },
  ]

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[18px] font-black">Dashboard</h1>
          {adminUser?.full_name && (
            <div className="text-[12px] text-muted mt-0.5">Welcome back, {adminUser.full_name}</div>
          )}
        </div>
        <div className="flex gap-2">
          <Link href="/" target="_blank"
            className="px-3 py-1.5 text-[12px] font-bold border border-white/10 rounded text-muted hover:text-white hover:bg-white/[0.04] transition-colors">
            View Site ↗
          </Link>
          <Link href="/admin/scores"
            className="px-4 py-1.5 text-[12px] font-bold bg-ice hover:bg-ice-light text-white rounded transition-colors">
            🏒 Scores
          </Link>
        </div>
      </div>

      {/* Live alert */}
      {live > 0 && (
        <Link href="/admin/scores"
          className="flex items-center gap-3 bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-3 hover:bg-green-500/15 transition-colors">
          <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse shrink-0" />
          <span className="text-[13px] font-bold text-green-400">
            {live} game{live !== 1 ? 's' : ''} live right now
          </span>
          <span className="text-[12px] text-green-400 ml-auto">Go to scores →</span>
        </Link>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {stats.map(stat => (
          <div key={stat.label} className="bg-rink-800 border border-white/[0.07] rounded-lg px-4 py-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-dim mb-2">{stat.label}</div>
            <div className={`text-3xl font-black leading-none mb-1 ${stat.accent ?? 'text-white'}`}>{stat.value}</div>
            <div className="text-[11px] text-muted">{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-rink-800 border border-white/[0.07] rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-white/[0.07] bg-rink-700">
            <span className="text-[11px] font-black uppercase tracking-widest text-muted">Quick Actions</span>
          </div>
          <div className="p-4 grid grid-cols-2 gap-3">
            {[
              { label: 'Manage scores',   href: '/admin/scores',   desc: 'Live game entry' },
              { label: 'Write article',   href: '/admin/articles', desc: 'EN + FR bilingual' },
              { label: 'Update roster',   href: '/admin/rosters',  desc: 'Add or move players' },
              { label: 'Season settings', href: '/admin/settings', desc: 'Playoffs, config' },
            ].map(action => (
              <Link key={action.href} href={action.href}
                className="bg-rink-700 border border-white/[0.07] rounded p-3 hover:bg-rink-600 hover:border-white/10 transition-colors group">
                <div className="text-[13px] font-bold text-white group-hover:text-ice-light transition-colors mb-1">{action.label}</div>
                <div className="text-[11px] text-dim">{action.desc}</div>
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-rink-800 border border-white/[0.07] rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-white/[0.07] bg-rink-700">
            <span className="text-[11px] font-black uppercase tracking-widest text-muted">Recent Articles</span>
          </div>
          {articles.length === 0 ? (
            <div className="px-4 py-6 text-center text-[12px] text-dim">
              No articles yet.{' '}
              <Link href="/admin/articles" className="text-ice-light hover:underline">Write one →</Link>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {articles.slice(0, 5).map((a: any) => (
                <div key={a.id} className="px-4 py-3 flex items-center justify-between">
                  <span className="text-[12px] text-white">Article #{a.id}</span>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-sm ${
                    a.status === 'published' ? 'bg-ice/15 text-ice-light' : 'bg-amber-500/10 text-amber-400'
                  }`}>{a.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}