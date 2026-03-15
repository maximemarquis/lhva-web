import type { Article } from '@/types'

const FALLBACK_NEWS = [
  { id: 1, tag: 'Playoffs', title: 'Kedgwick one win away from Finals after dominant Game 3', date: 'March 13, 2026', emoji: '🏒' },
  { id: 2, tag: 'Awards',   title: 'LHVA end-of-season award nominees revealed',              date: 'March 10, 2026', emoji: '🏆' },
  { id: 3, tag: 'League',   title: '2026–27 team registration opens in May',                  date: 'March 8, 2026',  emoji: '📋' },
  { id: 4, tag: 'Players',  title: 'Thériault breaks single-season points record with 52 pts', date: 'March 5, 2026', emoji: '⭐' },
]

const CATEGORY_EMOJI: Record<string, string> = {
  playoffs: '🏒', awards: '🏆', league: '📋', players: '⭐', recap: '📰', general: '📣',
}

interface Props {
  articles?: Article[]
}

export function NewsFeed({ articles }: Props) {
  const hasLiveData = articles && articles.length > 0

  if (hasLiveData) {
    return (
      <div className="border border-white/[0.07] rounded overflow-hidden">
        {articles.map(article => (
          <a key={article.id} href={`/news/${article.slug}`}
            className="flex items-start gap-3 px-4 py-3 border-b border-white/[0.07] last:border-0 hover:bg-white/[0.02] transition-colors group">

            {/* Thumbnail or emoji icon */}
            {article.cover_image_url ? (
              <div className="w-12 h-10 rounded overflow-hidden shrink-0">
                <img
                  src={article.cover_image_url}
                  alt=""
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </div>
            ) : (
              <div className="w-9 h-9 bg-rink-700 rounded flex items-center justify-center text-base shrink-0">
                {CATEGORY_EMOJI[article.category] ?? '📣'}
              </div>
            )}

            <div className="min-w-0">
              <div className="text-[10px] font-black uppercase tracking-wider text-ice-light mb-1">
                {article.category}
              </div>
              <div className="text-[13px] font-semibold text-white leading-snug group-hover:text-ice-light transition-colors line-clamp-2">
                {article.title_en}
              </div>
              <div className="text-[10px] text-dim mt-1">
                {article.published_at
                  ? new Date(article.published_at).toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' })
                  : ''}
              </div>
            </div>
          </a>
        ))}
      </div>
    )
  }

  // Fallback
  return (
    <div className="border border-white/[0.07] rounded overflow-hidden">
      {FALLBACK_NEWS.map(article => (
        <a key={article.id} href={`/news/${article.id}`}
          className="flex items-start gap-3 px-4 py-3 border-b border-white/[0.07] last:border-0 hover:bg-white/[0.02] transition-colors group">
          <div className="w-9 h-9 bg-rink-700 rounded flex items-center justify-center text-base shrink-0">
            {article.emoji}
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-ice-light mb-1">{article.tag}</div>
            <div className="text-[13px] font-semibold text-white leading-snug group-hover:text-ice-light transition-colors">{article.title}</div>
            <div className="text-[10px] text-dim mt-1">{article.date}</div>
          </div>
        </a>
      ))}
    </div>
  )
}
