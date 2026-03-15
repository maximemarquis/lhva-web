'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { Article } from '@/types'

const CATEGORY_COLOR: Record<string, string> = {
  playoffs: '#0088ce',
  players:  '#f59e0b',
  awards:   '#eab308',
  league:   '#22c55e',
  recap:    '#a855f7',
  general:  '#8892a4',
}

export function FeaturedCarousel({ articles }: { articles: Article[] }) {
  const [idx, setIdx] = useState(0)
  const count = articles.length

  // Auto-rotate every 5.5 s
  useEffect(() => {
    if (count < 2) return
    const t = setInterval(() => setIdx(i => (i + 1) % count), 5500)
    return () => clearInterval(t)
  }, [count])

  if (!count) return null

  const a = articles[idx]
  const color = CATEGORY_COLOR[a.category] ?? '#8892a4'

  return (
    <div className="relative w-full h-[280px] md:h-[390px] overflow-hidden bg-rink-900">

      {/* Slide backgrounds */}
      {articles.map((art, i) => (
        <div
          key={art.id}
          className={`absolute inset-0 transition-opacity duration-700 ${i === idx ? 'opacity-100' : 'opacity-0'}`}
        >
          {art.cover_image_url ? (
            <img
              src={art.cover_image_url}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div
              className="w-full h-full"
              style={{
                background: `
                  radial-gradient(ellipse at 15% 60%, ${CATEGORY_COLOR[art.category] ?? '#0088ce'}50 0%, transparent 55%),
                  radial-gradient(ellipse at 85% 20%, ${CATEGORY_COLOR[art.category] ?? '#0088ce'}25 0%, transparent 50%)
                `,
              }}
            />
          )}
          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/92 via-black/55 to-black/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />
        </div>
      ))}

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-center px-6 md:px-12 pb-6">
        <div className="max-w-[580px]">

          {/* Category badge */}
          <div
            className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest mb-3 px-2.5 py-1 rounded-sm"
            style={{
              color,
              backgroundColor: `${color}25`,
              border: `1px solid ${color}50`,
            }}
          >
            ★ Featured · {a.category}
          </div>

          {/* Title */}
          <Link href={`/news/${a.slug}`} className="block group mb-2">
            <h2 className="text-xl md:text-[28px] font-black uppercase tracking-tight text-white leading-tight group-hover:text-ice-light transition-colors duration-200">
              {a.title_en}
            </h2>
          </Link>

          {/* Excerpt */}
          {a.body_en && (
            <p className="text-white/45 text-[13px] leading-relaxed mb-5 line-clamp-2 max-w-[480px]">
              {a.body_en.replace(/!\[[^\]]*\]\([^)]+\)/g, '').slice(0, 180)}
            </p>
          )}

          {/* CTA + date */}
          <div className="flex items-center gap-4">
            <Link
              href={`/news/${a.slug}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded text-[12px] font-bold text-white border border-white/25 bg-white/10 hover:bg-white/20 transition-colors"
            >
              Read Article →
            </Link>
            {a.published_at && (
              <span className="text-[11px] text-white/30">
                {new Date(a.published_at).toLocaleDateString('en-CA', {
                  month: 'short', day: 'numeric', year: 'numeric'
                })}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Controls — only if more than one slide */}
      {count > 1 && (
        <>
          {/* Prev */}
          <button
            onClick={() => setIdx(i => (i - 1 + count) % count)}
            aria-label="Previous article"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/75 border border-white/15 flex items-center justify-center text-white transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Next */}
          <button
            onClick={() => setIdx(i => (i + 1) % count)}
            aria-label="Next article"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/75 border border-white/15 flex items-center justify-center text-white transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Dot indicators */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {articles.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                aria-label={`Go to article ${i + 1}`}
                className={`rounded-full transition-all duration-300 ${
                  i === idx
                    ? 'w-6 h-1.5 bg-white'
                    : 'w-1.5 h-1.5 bg-white/30 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
