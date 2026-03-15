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
              className="bg-rink-800 border border-white/[0.07] rounded-lg overflow-hidden hover:border-white/20 transition-colors group">

              {/* Featured (first) article — big with cover image */}
              {i === 0 ? (
                <div>
                  {article.cover_image_url && (
                    <div className="w-full h-52 overflow-hidden">
                      <img
                        src={article.cover_image_url}
                        alt={article.title_en}
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${CATEGORY_COLOR[article.category] ?? 'text-muted'}`}>
                      {article.category}
                      {article.team && (
                        <span className="text-dim ml-2">· {(article.team as any).name_en}</span>
                      )}
                    </div>
                    <h2 className="text-2xl font-black uppercase tracking-tight leading-tight group-hover:text-ice-light transition-colors">
                      {article.title_en}
                    </h2>
                    {article.body_en && (
                      <p className="text-muted text-sm mt-2 leading-relaxed line-clamp-2">
                        {article.body_en.replace(/!\[[^\]]*\]\([^)]+\)/g, '').slice(0, 220)}
                      </p>
                    )}
                    <div className="text-[11px] text-dim mt-3">
                      {article.published_at
                        ? new Date(article.published_at).toLocaleDateString('en-CA', {
                            month: 'long', day: 'numeric', year: 'numeric'
                          })
                        : ''}
                      {article.author && <span className="ml-2">· {article.author}</span>}
                    </div>
                  </div>
                </div>
              ) : (
                /* Regular articles — small row with optional thumbnail */
                <div className="flex items-center gap-4 p-4">
                  {/* Thumbnail or placeholder */}
                  {article.cover_image_url ? (
                    <div className="w-20 h-14 rounded overflow-hidden shrink-0">
                      <img
                        src={article.cover_image_url}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-14 rounded bg-rink-700 flex items-center justify-center shrink-0 text-2xl">
                      {article.category === 'playoffs' ? '🏒'
                       : article.category === 'awards' ? '🏆'
                       : article.category === 'players' ? '⭐'
                       : article.category === 'recap' ? '📰'
                       : article.category === 'league' ? '📋'
                       : '📣'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className={`text-[10px] font-black uppercase tracking-widest mb-1 ${CATEGORY_COLOR[article.category] ?? 'text-muted'}`}>
                      {article.category}
                      {article.team && (
                        <span className="text-dim ml-2">· {(article.team as any).name_en}</span>
                      )}
                    </div>
                    <h2 className="text-[15px] font-black uppercase tracking-tight group-hover:text-ice-light transition-colors leading-snug line-clamp-2">
                      {article.title_en}
                    </h2>
                    <div className="text-[11px] text-dim mt-1">
                      {article.published_at
                        ? new Date(article.published_at).toLocaleDateString('en-CA', {
                            month: 'long', day: 'numeric', year: 'numeric'
                          })
                        : ''}
                    </div>
                  </div>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

    </div>
  )
}
