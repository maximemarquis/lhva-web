import type { Game } from '@/types'

interface Props {
  recentGames: Game[]
}

export function Hero({ recentGames }: Props) {
  return (
    <div className="bg-rink-800 border-b border-white/[0.07] relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 70% 50%, rgba(0,136,206,0.12) 0%, transparent 70%)' }} />

      <div className="max-w-[1200px] mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center relative">

        {/* Left: Title */}
        <div>
          <div className="text-[11px] font-black tracking-[0.14em] uppercase text-ice-light mb-3">
            2025–26 Regular Season Complete
          </div>
          <h1 className="text-5xl font-black uppercase leading-none tracking-tight mb-2">
            LHVA<br />
            <span className="text-ice-light">Playoffs</span><br />
            2026
          </h1>
          <p className="text-muted text-sm mb-5">
            Senior hockey in northwestern New Brunswick.<br />
            Madawaska &amp; Victoria counties.
          </p>
          <div className="flex gap-2 flex-wrap">
            <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-sm border border-green-500/40 text-green-400 bg-green-500/10">
              Semifinals underway
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-sm border border-white/10 text-muted">
              6 Teams
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-sm border border-white/10 text-muted">
              Est. 1991
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-sm border border-white/10 text-muted">
              NB Senior A
            </span>
          </div>
        </div>

        {/* Right: Score strip */}
        <div className="bg-rink-700 border border-white/10 rounded overflow-hidden">
          <div className="bg-rink-600 px-4 py-2.5 flex items-center justify-between border-b border-white/[0.07]">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted">
              Semifinal results — Game 3
            </span>
            <span className="flex items-center gap-1.5 text-[10px] font-black text-green-400 uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Playoffs
            </span>
          </div>

          {recentGames.length > 0 ? (
            recentGames.map(game => (
              <div key={game.id} className="grid grid-cols-[1fr_auto_1fr] items-center px-4 py-3 border-b border-white/[0.07] last:border-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black text-white shrink-0"
                    style={{ background: game.home_team?.color ?? '#333' }}>
                    {game.home_team?.abbreviation}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">{game.home_team?.name_en.split(' ').pop()}</div>
                    <div className="text-[10px] text-muted">{game.home_team?.city}</div>
                  </div>
                </div>
                <div className="text-center px-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-2xl font-black ${(game.home_score ?? 0) > (game.away_score ?? 0) ? 'text-ice-light' : 'text-white'}`}>
                      {game.home_score ?? '–'}
                    </span>
                    <span className="text-dim text-sm">–</span>
                    <span className={`text-2xl font-black ${(game.away_score ?? 0) > (game.home_score ?? 0) ? 'text-ice-light' : 'text-white'}`}>
                      {game.away_score ?? '–'}
                    </span>
                  </div>
                  <div className="text-[10px] text-dim uppercase tracking-wider mt-0.5">Final</div>
                </div>
                <div className="flex items-center gap-2 justify-end">
                  <div className="text-right">
                    <div className="text-sm font-bold text-white">{game.away_team?.name_en.split(' ').pop()}</div>
                    <div className="text-[10px] text-muted">{game.away_team?.city}</div>
                  </div>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black text-white shrink-0"
                    style={{ background: game.away_team?.color ?? '#333' }}>
                    {game.away_team?.abbreviation}
                  </div>
                </div>
              </div>
            ))
          ) : (
            /* Fallback static scores while DB is empty */
            <>
              <div className="grid grid-cols-[1fr_auto_1fr] items-center px-4 py-3 border-b border-white/[0.07]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#1a6fa8] flex items-center justify-center text-[10px] font-black">KD</div>
                  <div><div className="text-sm font-bold">Kedgwick</div><div className="text-[10px] text-muted">Dynamo</div></div>
                </div>
                <div className="text-center px-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black text-ice-light">5</span>
                    <span className="text-dim">–</span>
                    <span className="text-2xl font-black">2</span>
                  </div>
                  <div className="text-[10px] text-dim uppercase tracking-wider mt-0.5">Final · SF-A</div>
                </div>
                <div className="flex items-center gap-2 justify-end">
                  <div className="text-right"><div className="text-sm font-bold">St-Basile</div><div className="text-[10px] text-muted">As</div></div>
                  <div className="w-8 h-8 rounded-full bg-[#2e5a3a] flex items-center justify-center text-[10px] font-black">SB</div>
                </div>
              </div>
              <div className="grid grid-cols-[1fr_auto_1fr] items-center px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#7a3030] flex items-center justify-center text-[10px] font-black">SQ</div>
                  <div><div className="text-sm font-bold">St-Quentin</div><div className="text-[10px] text-muted">Castors</div></div>
                </div>
                <div className="text-center px-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black text-ice-light">3</span>
                    <span className="text-dim">–</span>
                    <span className="text-2xl font-black">1</span>
                  </div>
                  <div className="text-[10px] text-dim uppercase tracking-wider mt-0.5">Final · SF-B</div>
                </div>
                <div className="flex items-center gap-2 justify-end">
                  <div className="text-right"><div className="text-sm font-bold">Perth-Andover</div><div className="text-[10px] text-muted">River VT</div></div>
                  <div className="w-8 h-8 rounded-full bg-[#543080] flex items-center justify-center text-[10px] font-black">PA</div>
                </div>
              </div>
            </>
          )}
          <div className="bg-rink-600 px-4 py-2 text-center text-[11px] text-muted border-t border-white/[0.07]">
            Kedgwick leads series 3–0 &nbsp;·&nbsp; St-Quentin leads series 2–1
          </div>
        </div>
      </div>
    </div>
  )
}