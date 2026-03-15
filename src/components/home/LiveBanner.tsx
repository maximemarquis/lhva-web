import Link from 'next/link'

const PERIOD_LABELS: Record<number, string> = { 1: '1st', 2: '2nd', 3: '3rd', 4: 'OT', 5: 'SO' }

interface Props {
  games: any[]
}

export function LiveBanner({ games }: Props) {
  return (
    <div className="bg-green-500/10 border-b border-green-500/20">
      <div className="max-w-[1200px] mx-auto px-6 py-3 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 shrink-0">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block" />
          <span className="text-[11px] font-black text-green-400 uppercase tracking-widest">Live Now</span>
        </div>

        {games.map(game => {
          const homeGoals = (game.goals ?? []).filter((g: any) =>
            g.team_id === game.home_team_id && g.goal_type !== 'so'
          ).length
          const awayGoals = (game.goals ?? []).filter((g: any) =>
            g.team_id === game.away_team_id && g.goal_type !== 'so'
          ).length
          const period = PERIOD_LABELS[game.current_period] ?? `P${game.current_period}`

          return (
            <Link key={game.id} href="/scores"
              className="flex items-center gap-3 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 rounded-lg px-3 py-1.5 transition-colors group">
              {/* Home */}
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[7px] font-black text-white shrink-0"
                  style={{ background: game.home_team?.color }}>{game.home_team?.abbreviation}</div>
                <span className="text-[12px] font-bold text-white">{game.home_team?.name_en.split(' ').pop()}</span>
              </div>
              {/* Score */}
              <div className="flex items-center gap-1.5 text-center">
                <span className="text-[16px] font-black text-white">{homeGoals}</span>
                <span className="text-dim text-xs">–</span>
                <span className="text-[16px] font-black text-white">{awayGoals}</span>
              </div>
              {/* Away */}
              <div className="flex items-center gap-1.5">
                <span className="text-[12px] font-bold text-white">{game.away_team?.name_en.split(' ').pop()}</span>
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[7px] font-black text-white shrink-0"
                  style={{ background: game.away_team?.color }}>{game.away_team?.abbreviation}</div>
              </div>
              {/* Period */}
              <span className="text-[10px] font-black text-green-400 bg-green-500/15 px-1.5 py-0.5 rounded">
                {period}
              </span>
              <span className="text-[10px] text-green-400 group-hover:translate-x-0.5 transition-transform">→</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}