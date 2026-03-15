import { createServerSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Article } from '@/types'

export const revalidate = 300

const CATEGORY_COLOR: Record<string, string> = {
  playoffs: 'text-ice-light',
  players:  'text-amber-400',
  awards:   'text-yellow-400',
  league:   'text-green-400',
  recap:    'text-purple-400',
  general:  'text-muted',
}

export default async function NewsPage() {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('articles')
    .select('*, team:teams(name_en, abbreviation, color)')
    .eq('status', 'published')
    .lte('published_at', new Date().toISOString())
    .order('published_at', { ascending: false })

  const articles = (data ?? []) as Article[]

  return (
    <div className="max-w-[900px] mx-auto px-6 py-8">

      <div className="mb-6">
        <div className="text-[11px] font-black uppercase tracking-widest text-ice-light mb-1">LHVA / AVHL</div>
        <h1 className="text-3xl font-black uppercase tracking-tight">News</h1>
      </div>

      {articles.length === 0 ? (
        <div className="bg-rink-800 border border-white/[0.07] rounded-lg px-6 py-16 text-center text-[13px] text-dim">
          No articles published yet. Check back soon.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {articles.map((article, i) => (
            <Link key={article.id} href={`/news/${article.slug}`}
              className={`bg-rink-800 border border-white/[0.07] rounded-lg overflow-hidden hover:border-white/20 transition-colors group ${
                i === 0 ? 'p-6' : 'p-4'
              }`}>
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${CATEGORY_COLOR[article.category] ?? 'text-muted'}`}>
                    {article.category}
                    {article.team && (
                      <span className="text-dim ml-2">· {(article.team as any).name_en}</span>
                    )}
                  </div>
                  <h2 className={`font-black uppercase tracking-tight group-hover:text-ice-light transition-colors ${
                    i === 0 ? 'text-2xl leading-tight' : 'text-[15px]'
                  }`}>
                    {article.title_en}
                  </h2>
                  {i === 0 && article.body_en && (
                    <p className="text-muted text-sm mt-2 leading-relaxed line-clamp-2">
                      {article.body_en.slice(0, 200)}…
                    </p>
                  )}
                  <div className="text-[11px] text-dim mt-2">
                    {article.published_at
                      ? new Date(article.published_at).toLocaleDateString('en-CA', {
                          month: 'long', day: 'numeric', year: 'numeric'
                        })
                      : ''}
                    {article.author && <span className="ml-2">· {article.author}</span>}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

    </div>
  )
}