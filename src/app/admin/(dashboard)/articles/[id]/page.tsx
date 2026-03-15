import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ArticleEditor } from '@/components/admin/ArticleEditor'
import type { Article, Team } from '@/types'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ArticleEditorPage({ params }: Props) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const [teamsRes, articleRes] = await Promise.all([
    supabase.from('teams').select('id, name_en, abbreviation').order('name_en'),
    id === 'new'
      ? { data: null }
      : supabase.from('articles').select('*').eq('id', id).single(),
  ])

  const teams = (teamsRes.data ?? []) as Team[]
  const article = articleRes.data as Article | null

  return (
    <div className="p-6 flex flex-col gap-6 max-w-3xl">
      <h1 className="text-[18px] font-black">
        {id === 'new' ? 'New Article' : 'Edit Article'}
      </h1>
      <ArticleEditor article={article} teams={teams} />
    </div>
  )
}