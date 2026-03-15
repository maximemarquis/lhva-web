import { createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Article } from '@/types'

interface Props {
  params: Promise<{ slug: string }>
}

/** Render body text: supports inline images via ![alt](url) on its own paragraph */
function renderBody(body: string) {
  return body.split('\n\n').map((para, i) => {
    const imgMatch = para.trim().match(/^!\[([^\]]*)\]\(([^)]+)\)$/)
    if (imgMatch) {
      return (
        <figure key={i} className="my-6">
          <img
            src={imgMatch[2]}
            alt={imgMatch[1]}
            className="w-full rounded-lg object-cover"
            loading="lazy"
          />
          {imgMatch[1] && (
            <figcaption className="text-center text-[11px] text-dim mt-2">{imgMatch[1]}</figcaption>
          )}
        </figure>
      )
    }
    return <p key={i} className="text-muted leading-relaxed">{para}</p>
  })
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params
  const supabase = await createServerSupabaseClient()

  const { data } = await supabase
    .from('articles')
    .select('*, team:teams(name_en, abbreviation, color)')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (!data) notFound()
  const article = data as Article

  return (
    <div className="max-w-[720px] mx-auto px-6 py-8">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[11px] text-dim mb-6">
        <Link href="/news" className="hover:text-white transition-colors">News</Link>
        <span>/</span>
        <span className="text-muted capitalize">{article.category}</span>
      </div>

      {/* Header */}
      <div className="mb-6">
        <div className="text-[11px] font-black uppercase tracking-widest text-ice-light mb-3">
          {article.category}
          {article.team && <span className="text-dim ml-2">· {(article.team as any).name_en}</span>}
        </div>
        <h1 className="text-4xl font-black uppercase tracking-tight leading-tight mb-4">
          {article.title_en}
        </h1>
        {article.title_fr && (
          <h2 className="text-xl text-muted font-semibold mb-4">{article.title_fr}</h2>
        )}
        <div className="flex items-center gap-3 text-[12px] text-dim border-t border-white/[0.07] pt-4">
          {article.published_at && (
            <span>{new Date(article.published_at).toLocaleDateString('en-CA', {
              weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
            })}</span>
          )}
          {article.author && <><span>·</span><span>{article.author}</span></>}
        </div>
      </div>

      {/* Cover Image */}
      {article.cover_image_url && (
        <div className="mb-8 -mx-6 md:mx-0">
          <img
            src={article.cover_image_url}
            alt={article.title_en}
            className="w-full h-[260px] md:h-[400px] object-cover md:rounded-lg"
            loading="lazy"
          />
        </div>
      )}

      {/* English Body */}
      {article.body_en && (
        <div className="prose prose-invert prose-sm max-w-none text-[15px] leading-relaxed space-y-4">
          {renderBody(article.body_en)}
        </div>
      )}

      {/* French body if different */}
      {article.body_fr && article.body_fr !== article.body_en && (
        <div className="mt-8 pt-8 border-t border-white/[0.07]">
          <div className="text-[10px] font-black uppercase tracking-widest text-dim mb-4">Français</div>
          <div className="space-y-4 text-[15px]">
            {renderBody(article.body_fr)}
          </div>
        </div>
      )}

      {/* Back */}
      <div className="mt-10 pt-6 border-t border-white/[0.07]">
        <Link href="/news"
          className="text-[12px] font-bold text-muted hover:text-white transition-colors">
          ← Back to News
        </Link>
      </div>

    </div>
  )
}
