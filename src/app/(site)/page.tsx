import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Hero } from '@/components/home/Hero'
import { StandingsTable } from '@/components/home/StandingsTable'
import { LeagueLeaders } from '@/components/home/LeagueLeaders'
import { UpcomingGames } from '@/components/home/UpcomingGames'
import { NewsFeed } from '@/components/home/NewsFeed'
import type { StandingRow, Game, Article } from '@/types'

// Revalidate every 5 minutes
export const revalidate = 300

function SectionHeader({ title, href }: { title: string; href: string }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-white">
        <span className="w-0.5 h-3.5 bg-ice rounded-sm inline-block" />
        {title}
      </div>
      <a href={href} className="text-[11px] font-black uppercase tracking-wider text-ice-light hover:text-white transition-colors">
        View All →
      </a>
    </div>
  )
}

export default async function HomePage() {
  const supabase = await createServerSupabaseClient()

  // Fetch all data in parallel
  const [standingsRes, recentGamesRes, upcomingGamesRes, articlesRes] = await Promise.all([
    supabase
      .from('standings')
      .select('*')
      .eq('season_id', 1)
      .order('pts', { ascending: false }),

    supabase
      .from('games')
      .select(`*, home_team:teams!home_team_id(*), away_team:teams!away_team_id(*)`)
      .eq('is_published', true)
      .not('home_score', 'is', null)
      .order('played_at', { ascending: false })
      .limit(3),

    supabase
      .from('games')
      .select(`*, home_team:teams!home_team_id(*), away_team:teams!away_team_id(*)`)
      .is('home_score', null)
      .gte('played_at', new Date().toISOString())
      .order('played_at', { ascending: true })
      .limit(4),

    supabase
      .from('articles')
      .select('*, team:teams(name_en, abbreviation, color)')
      .eq('status', 'published')
      .lte('published_at', new Date().toISOString())
      .order('published_at', { ascending: false })
      .limit(4),
  ])

  // Use live data if available, otherwise components fall back to hardcoded data
  const standings = (standingsRes.data ?? []) as StandingRow[]
  const recentGames = (recentGamesRes.data ?? []) as Game[]
  const upcomingGames = (upcomingGamesRes.data ?? []) as Game[]
  const articles = (articlesRes.data ?? []) as Article[]

  return (
    <>
      <Hero recentGames={recentGames} />

      <div className="max-w-[1200px] mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">

        {/* LEFT COLUMN */}
        <div className="flex flex-col gap-7">
          <section>
            <SectionHeader title="Standings" href="/standings" />
            <StandingsTable rows={standings} />
          </section>

          <section>
            <SectionHeader title="League Leaders" href="/stats" />
            <LeagueLeaders />
          </section>
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="flex flex-col gap-7">
          <section>
            <SectionHeader title="Upcoming Games" href="/schedule" />
            <UpcomingGames games={upcomingGames} />
          </section>

          <section>
            <SectionHeader title="Latest News" href="/news" />
            <NewsFeed articles={articles} />
          </section>
        </div>

      </div>
    </>
  )
}