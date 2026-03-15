'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Article, Team, ArticleCategory } from '@/types'

interface Props {
  article: Article | null  // null = new article
  teams: Team[]
}

const CATEGORIES: ArticleCategory[] = ['playoffs', 'players', 'awards', 'league', 'recap', 'general']

export function ArticleEditor({ article, teams }: Props) {
  const supabase = createClient()
  const router = useRouter()

  const [titleEn, setTitleEn]           = useState(article?.title_en ?? '')
  const [titleFr, setTitleFr]           = useState(article?.title_fr ?? '')
  const [bodyEn, setBodyEn]             = useState(article?.body_en ?? '')
  const [bodyFr, setBodyFr]             = useState(article?.body_fr ?? '')
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(article?.cover_image_url ?? null)
  const [category, setCategory]         = useState<ArticleCategory>(article?.category ?? 'general')
  const [teamId, setTeamId]             = useState<number | null>(article?.team_id ?? null)
  const [publishedAt, setPublishedAt]   = useState(
    article?.published_at
      ? new Date(article.published_at).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16)
  )
  const [saving, setSaving]             = useState(false)
  const [error, setError]               = useState<string | null>(null)
  const [success, setSuccess]           = useState<string | null>(null)
  const [activeLang, setActiveLang]     = useState<'en' | 'fr'>('en')
  const [uploadingCover, setUploadingCover]   = useState(false)
  const [uploadingInline, setUploadingInline] = useState(false)

  const coverInputRef  = useRef<HTMLInputElement>(null)
  const inlineImgRef   = useRef<HTMLInputElement>(null)

  const slugify = (text: string) =>
    text.toLowerCase()
      .replace(/[àâä]/g, 'a').replace(/[éèêë]/g, 'e')
      .replace(/[îï]/g, 'i').replace(/[ôö]/g, 'o').replace(/[ùûü]/g, 'u')
      .replace(/ç/g, 'c').replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

  /* ─── Cover image upload ─── */
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingCover(true)
    const slug = slugify(titleEn) || `cover-${Date.now()}`
    const ext  = file.name.split('.').pop()
    const path = `covers/${slug}-${Date.now()}.${ext}`
    const { data, error: upErr } = await supabase.storage
      .from('article-images')
      .upload(path, file, { upsert: true })
    if (!upErr && data) {
      const { data: urlData } = supabase.storage.from('article-images').getPublicUrl(data.path)
      setCoverImageUrl(urlData.publicUrl)
    } else if (upErr) {
      setError(`Cover upload failed: ${upErr.message}`)
    }
    setUploadingCover(false)
    if (coverInputRef.current) coverInputRef.current.value = ''
  }

  /* ─── Inline image upload ─── */
  const handleInlineImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingInline(true)
    const ext  = file.name.split('.').pop()
    const path = `inline/${Date.now()}.${ext}`
    const { data, error: upErr } = await supabase.storage
      .from('article-images')
      .upload(path, file, { upsert: true })
    if (!upErr && data) {
      const { data: urlData } = supabase.storage.from('article-images').getPublicUrl(data.path)
      const insertion = `\n\n![](${urlData.publicUrl})\n\n`
      if (activeLang === 'en') setBodyEn(prev => prev + insertion)
      else                     setBodyFr(prev => prev + insertion)
    } else if (upErr) {
      setError(`Image upload failed: ${upErr.message}`)
    }
    setUploadingInline(false)
    if (inlineImgRef.current) inlineImgRef.current.value = ''
  }

  /* ─── Save ─── */
  const handleSave = async (status: 'draft' | 'published' | 'scheduled') => {
    if (!titleEn.trim()) { setError('English title is required'); return }
    setSaving(true)
    setError(null)

    const payload = {
      title_en:        titleEn.trim(),
      title_fr:        titleFr.trim() || null,
      slug:            slugify(titleEn),
      body_en:         bodyEn.trim() || null,
      body_fr:         bodyFr.trim() || null,
      cover_image_url: coverImageUrl || null,
      category,
      team_id:         teamId || null,
      status,
      published_at:    status === 'draft' ? null : new Date(publishedAt).toISOString(),
      updated_at:      new Date().toISOString(),
    }

    const { error: saveErr } = article
      ? await supabase.from('articles').update(payload).eq('id', article.id)
      : await supabase.from('articles').insert({ ...payload, author: 'Admin' })

    if (saveErr) {
      if (saveErr.code === '23505') {
        setError('A slug conflict occurred — try changing the title slightly.')
      } else {
        setError(saveErr.message)
      }
      setSaving(false)
      return
    }

    setSuccess(status === 'draft' ? 'Draft saved!' : 'Published!')
    setTimeout(() => {
      router.push('/admin/articles')
      router.refresh()
    }, 1000)
    setSaving(false)
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Hidden file inputs */}
      <input ref={coverInputRef}  type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
      <input ref={inlineImgRef}   type="file" accept="image/*" className="hidden" onChange={handleInlineImageUpload} />

      {/* Cover Image */}
      <div className="bg-rink-800 border border-white/[0.07] rounded-lg p-5">
        <label className="text-[10px] font-black uppercase tracking-widest text-dim mb-3 block">
          Cover / Main Image
        </label>
        {coverImageUrl ? (
          <div className="relative">
            <img
              src={coverImageUrl}
              alt="Cover preview"
              className="w-full h-48 object-cover rounded-lg"
            />
            <div className="absolute top-2 right-2 flex gap-1.5">
              <button
                onClick={() => coverInputRef.current?.click()}
                className="px-2.5 py-1 text-[11px] font-bold bg-black/60 hover:bg-black/80 text-white rounded border border-white/20 transition-colors">
                Replace
              </button>
              <button
                onClick={() => setCoverImageUrl(null)}
                className="px-2.5 py-1 text-[11px] font-bold bg-black/60 hover:bg-red-500/70 text-white rounded border border-white/20 transition-colors">
                Remove
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => coverInputRef.current?.click()}
            disabled={uploadingCover}
            className="flex flex-col items-center justify-center w-full h-32 bg-rink-700 border border-dashed border-white/20 rounded-lg hover:border-ice/50 hover:bg-rink-700/80 transition-colors disabled:opacity-50">
            {uploadingCover ? (
              <span className="text-ice text-[12px]">Uploading…</span>
            ) : (
              <>
                <span className="text-2xl mb-1.5">🖼️</span>
                <span className="text-[12px] text-muted">Click to upload cover image</span>
                <span className="text-[10px] text-dim mt-1">JPG, PNG, WebP</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Titles */}
      <div className="bg-rink-800 border border-white/[0.07] rounded-lg p-5 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-dim">Title (English) *</label>
          <input type="text" value={titleEn} onChange={e => setTitleEn(e.target.value)}
            placeholder="Article title in English…"
            className="bg-rink-700 border border-white/10 rounded px-3 py-2.5 text-sm text-white placeholder:text-dim outline-none focus:border-ice/50 transition-colors" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-dim">Title (Français)</label>
          <input type="text" value={titleFr} onChange={e => setTitleFr(e.target.value)}
            placeholder="Titre de l'article en français…"
            className="bg-rink-700 border border-white/10 rounded px-3 py-2.5 text-sm text-white placeholder:text-dim outline-none focus:border-ice/50 transition-colors" />
        </div>
      </div>

      {/* Body editor */}
      <div className="bg-rink-800 border border-white/[0.07] rounded-lg overflow-hidden">
        {/* Lang tabs */}
        <div className="flex border-b border-white/[0.07]">
          {(['en', 'fr'] as const).map(lang => (
            <button key={lang} onClick={() => setActiveLang(lang)}
              className={`px-5 py-2.5 text-[11px] font-black uppercase tracking-wider border-b-2 -mb-px transition-colors ${
                activeLang === lang
                  ? 'text-white border-ice'
                  : 'text-muted border-transparent hover:text-white'
              }`}>
              {lang === 'en' ? 'English' : 'Français'}
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-1 px-3 py-2 border-b border-white/[0.07] bg-rink-700 flex-wrap">
          {['B', 'I', 'U', '|', 'H2', 'H3', '|', 'Link'].map((btn, i) =>
            btn === '|' ? (
              <div key={i} className="w-px h-4 bg-white/10 mx-1" />
            ) : (
              <button key={btn}
                className="px-2 py-1 text-[11px] font-bold text-muted hover:text-white hover:bg-white/[0.06] border border-transparent hover:border-white/10 rounded transition-colors">
                {btn}
              </button>
            )
          )}
          <div className="w-px h-4 bg-white/10 mx-1" />
          {/* Insert Image button */}
          <button
            onClick={() => inlineImgRef.current?.click()}
            disabled={uploadingInline}
            title="Insert image into article body"
            className="flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-muted hover:text-white hover:bg-white/[0.06] border border-transparent hover:border-white/10 rounded transition-colors disabled:opacity-50">
            {uploadingInline ? (
              <span className="text-ice">Uploading…</span>
            ) : (
              <>🖼️ <span>Image</span></>
            )}
          </button>
        </div>

        {/* Body textarea */}
        <textarea
          value={activeLang === 'en' ? bodyEn : bodyFr}
          onChange={e => activeLang === 'en' ? setBodyEn(e.target.value) : setBodyFr(e.target.value)}
          placeholder={activeLang === 'en'
            ? 'Write your article in English…\n\nTip: Use the 🖼️ Image button in the toolbar to insert photos inline.'
            : 'Rédigez votre article en français…'}
          rows={14}
          className="w-full bg-rink-800 px-4 py-3 text-sm text-white placeholder:text-dim outline-none resize-none leading-relaxed"
        />
      </div>

      {/* Meta */}
      <div className="bg-rink-800 border border-white/[0.07] rounded-lg p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-dim">Category</label>
          <select value={category} onChange={e => setCategory(e.target.value as ArticleCategory)}
            className="bg-rink-700 border border-white/10 rounded px-3 py-2 text-sm text-white capitalize">
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-dim">Team tag</label>
          <select value={teamId ?? ''} onChange={e => setTeamId(Number(e.target.value) || null)}
            className="bg-rink-700 border border-white/10 rounded px-3 py-2 text-sm text-white">
            <option value="">— All teams —</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name_en}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-dim">Publish date</label>
          <input type="datetime-local" value={publishedAt} onChange={e => setPublishedAt(e.target.value)}
            className="bg-rink-700 border border-white/10 rounded px-3 py-2 text-sm text-white outline-none focus:border-ice/50 transition-colors" />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <button onClick={() => router.back()}
          className="text-[12px] font-bold text-dim hover:text-white transition-colors">
          ← Back
        </button>
        <div className="flex items-center gap-2 flex-wrap">
          {error   && <span className="text-red-400 text-xs">{error}</span>}
          {success && <span className="text-green-400 text-xs">{success}</span>}
          <button onClick={() => handleSave('draft')} disabled={saving}
            className="px-4 py-1.5 text-[12px] font-bold border border-white/10 rounded text-muted hover:text-white hover:bg-white/[0.04] disabled:opacity-50 transition-colors">
            Save Draft
          </button>
          <button onClick={() => handleSave('scheduled')} disabled={saving}
            className="px-4 py-1.5 text-[12px] font-bold border border-purple-500/30 rounded text-purple-400 hover:bg-purple-500/10 disabled:opacity-50 transition-colors">
            Schedule
          </button>
          <button onClick={() => handleSave('published')} disabled={saving}
            className="px-4 py-1.5 text-[12px] font-bold bg-ice hover:bg-ice-light text-white rounded disabled:opacity-50 transition-colors">
            {saving ? 'Saving…' : 'Publish Now'}
          </button>
        </div>
      </div>

    </div>
  )
}
