import type { Game } from '@/types'

const FALLBACK_GAMES = [
  {
    id: 1, date: 'Sat, Mar 15', time: '7:30 PM',
    homeAbbr: 'KD', homeName: 'Kedgwick',      homeColor: '#1a6fa8',
    awayAbbr: 'SB', awayName: 'St-Basile',     awayColor: '#2e5a3a',
    venue: 'Aréna de Kedgwick', badge: 'SF-A · Game 4 · KD leads 3–0',
  },
  {
    id: 2, date: 'Sat, Mar 15', time: '8:00 PM',
    homeAbbr: 'SQ', homeName: 'St-Quentin',    homeColor: '#7a3030',
    awayAbbr: 'PA', awayName: 'Perth-Andover', awayColor: '#543080',
    venue: 'Aréna de St-Quentin', badge: 'SF-B · Game 4 · SQ leads 2–1',
  },
  {
    id: 3, date: 'Sat, Mar 22', time: 'TBD',
    homeAbbr: '?', homeName: 'TBD', homeColor: '#333',
    awayAbbr: '?', awayName: 'TBD', awayColor: '#333',
    venue: 'Coupe LHVA — Final, Game 1', badge: null,
  },
]

interface Props {
  games?: Game[]
}

export function UpcomingGames({ games }: Props) {
  // If we have live games from DB, use those — otherwise show fallback
  const hasLiveData = games && games.length > 0

  if (hasLiveData) {
    return (
      <div className="border border-white/[0.07] rounded overflow-hidden">
        {games.map(game => (
          <div key={game.id}
            className="px-4 py-3 border-b border-white/[0.07] last:border-0 hover:bg-white/[0.02] transition-colors">
            <div className="text-[10px] font-bold uppercase tracking-wider text-dim mb-2">
              {new Date(game.played_at).toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 flex-1">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-black text-white shrink-0"
                  style={{ background: game.home_team?.color ?? '#333' }}>
                  {game.home_team?.abbreviation}
                </div>
                <span className="text-[13px] font-semibold text-white">{game.home_team?.name_en.split(' ').pop()}</span>
              </div>
              <div className="text-[12px] font-black px-2 text-ice-light">
                {new Date(game.played_at).toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit' })}
              </div>
              <div className="flex items-center gap-1.5 flex-1 justify-end">
                <span className="text-[13px] font-semibold text-white">{game.away_team?.name_en.split(' ').pop()}</span>
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-black text-white shrink-0"
                  style={{ background: game.away_team?.color ?? '#333' }}>
                  {game.away_team?.abbreviation}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Fallback
  return (
    <div className="border border-white/[0.07] rounded overflow-hidden">
      {FALLBACK_GAMES.map(game => (
        <div key={game.id}
          className="px-4 py-3 border-b border-white/[0.07] last:border-0 hover:bg-white/[0.02] transition-colors">
          <div className="text-[10px] font-bold uppercase tracking-wider text-dim mb-2">{game.date}</div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 flex-1">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-black text-white shrink-0"
                style={{ background: game.homeColor }}>{game.homeAbbr}</div>
              <span className={`text-[13px] font-semibold ${game.homeName === 'TBD' ? 'text-dim' : 'text-white'}`}>{game.homeName}</span>
            </div>
            <div className={`text-[12px] font-black px-2 ${game.time === 'TBD' ? 'text-dim' : 'text-ice-light'}`}>{game.time}</div>
            <div className="flex items-center gap-1.5 flex-1 justify-end">
              <span className={`text-[13px] font-semibold ${game.awayName === 'TBD' ? 'text-dim' : 'text-white'}`}>{game.awayName}</span>
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-black text-white shrink-0"
                style={{ background: game.awayColor }}>{game.awayAbbr}</div>
            </div>
          </div>
          <div className="text-[10px] text-dim mt-1.5">{game.venue}</div>
          {game.badge && (
            <div className="mt-1.5 inline-block text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-sm bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {game.badge}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}