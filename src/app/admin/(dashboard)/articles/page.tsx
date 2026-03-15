import { createServerSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Article } from '@/types'

const STATUS_STYLES: Record<string, string> = {
  published: 'bg-ice/15 text-ice-light border-ice/20',
  draft:     'bg-amber-500/10 text-amber-400 border-amber-500/20',
  scheduled: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  archived:  'bg-white/5 text-dim border-white/10',
}

export default async function ArticlesPage() {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('articles')
    .select('*')
    .order('created_at', { ascending: false })

  const articles = (data ?? []) as Article[]

  return (
    <div className="p-6 flex flex-col gap-6">

      <div className="flex items-center justify-between">
        <h1 className="text-[18px] font-black">Articles</h1>
        <Link href="/admin/articles/new"
          className="px-4 py-1.5 text-[12px] font-bold bg-ice hover:bg-ice-light text-white rounded transition-colors">
          + New Article
        </Link>
      </div>

      <div className="bg-rink-800 border border-white/[0.07] rounded-lg overflow-hidden">

        {/* Header */}
        <div className="grid grid-cols-[1fr_120px_120px_100px_80px] gap-4 px-4 py-2.5 border-b border-white/[0.07] bg-rink-700">
          {['Title', 'Category', 'Status', 'Date', ''].map(h => (
            <div key={h} className="text-[10px] font-black uppercase tracking-widest text-dim">{h}</div>
          ))}
        </div>

        {articles.length === 0 ? (
          <div className="px-4 py-12 text-center text-[13px] text-dim">
            No articles yet.{' '}
            <Link href="/admin/articles/new" className="text-ice-light hover:underline">Write your first one →</Link>
          </div>
        ) : (
          articles.map(article => (
            <div key={article.id}
              className="grid grid-cols-[1fr_120px_120px_100px_80px] gap-4 px-4 py-3 border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors items-center last:border-0">
              <div>
                <div className="text-[13px] font-semibold text-white leading-snug">{article.title_en}</div>
                {article.title_fr && (
                  <div className="text-[11px] text-dim mt-0.5">{article.title_fr}</div>
                )}
              </div>
              <div className="text-[12px] text-muted capitalize">{article.category}</div>
              <div>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-sm border ${STATUS_STYLES[article.status] ?? ''}`}>
                  {article.status}
                </span>
              </div>
              <div className="text-[11px] text-dim">
                {article.published_at
                  ? new Date(article.published_at).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })
                  : '—'}
              </div>
              <div className="flex gap-2">
                <Link href={`/admin/articles/${article.id}`}
                  className="text-[11px] font-bold text-muted hover:text-white border border-white/10 rounded px-2 py-1 transition-colors">
                  Edit
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}