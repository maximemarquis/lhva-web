import { createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export const revalidate = 300

interface Props {
  params: Promise<{ slug: string }>
}

const POSITION_LABEL: Record<string, string> = { F: 'Forward', D: 'Defence', G: 'Goalie' }
const SHOOTS_LABEL:   Record<string, string> = { L: 'Left',    R: 'Right' }

function StatCell({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center">
      <div className="text-xl font-black text-white">{value}</div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-dim mt-0.5">{label}</div>
    </div>
  )
}

export default async function PlayerProfilePage({ params }: Props) {
  const { slug } = await params
  const supabase = await createServerSupabaseClient()

  // Try slug first, fall back to ID
  const isId = /^\d+$/.test(slug)
  const query = supabase
    .from('players')
    .select('*, team:teams(*)')
    .eq('is_active', true)

  const { data } = isId
    ? await query.eq('id', parseInt(slug)).single()
    : await query.eq('slug', slug).single()

  if (!data) notFound()
  const player = data as any
  const team   = player.team

  // Fetch career stats from the view
  const { data: careerStats } = await supabase
    .from('player_career_stats')
    .select('*')
    .eq('player_id', player.id)
    .order('season_id', { ascending: false })

  const regularStats  = (careerStats ?? []).filter((s: any) => s.game_type === 'regular')
  const playoffStats  = (careerStats ?? []).filter((s: any) => s.game_type !== 'regular')

  // Career totals
  const totals = regularStats.reduce((acc: any, s: any) => ({
    gp:      acc.gp      + (s.gp      ?? 0),
    goals:   acc.goals   + (s.goals   ?? 0),
    assists: acc.assists + (s.assists ?? 0),
    points:  acc.points  + (s.points  ?? 0),
    pim:     acc.pim     + (s.pim     ?? 0),
  }), { gp: 0, goals: 0, assists: 0, points: 0, pim: 0 })

  const age = player.date_of_birth
    ? Math.floor((Date.now() - new Date(player.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null

  const StatsTable = ({ rows, showTotal }: { rows: any[]; showTotal?: boolean }) => (
    <div className="bg-rink-800 border border-white/[0.07] rounded-lg overflow-hidden">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-rink-700">
            <th className="px-4 py-2 text-left text-[10px] font-black uppercase tracking-widest text-dim">Season</th>
            <th className="px-4 py-2 text-left text-[10px] font-black uppercase tracking-widest text-dim">Team</th>
            <th className="px-3 py-2 text-center text-[10px] font-black uppercase tracking-widest text-dim">GP</th>
            <th className="px-3 py-2 text-center text-[10px] font-black uppercase tracking-widest text-dim">G</th>
            <th className="px-3 py-2 text-center text-[10px] font-black uppercase tracking-widest text-dim">A</th>
            <th className="px-3 py-2 text-center text-[10px] font-black uppercase tracking-widest text-white">PTS</th>
            <th className="px-3 py-2 text-center text-[10px] font-black uppercase tracking-widest text-dim">PIM</th>
            <th className="px-3 py-2 text-center text-[10px] font-black uppercase tracking-widest text-dim">PPG</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={8} className="px-4 py-8 text-center text-[12px] text-dim">No stats available yet.</td></tr>
          ) : (
            rows.map((s: any, i: number) => (
              <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.02] last:border-0">
                <td className="px-4 py-2.5 text-[13px] font-semibold text-white">{s.season_label}</td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-black text-white shrink-0"
                      style={{ background: s.team_color }}>{s.team_abbr}</div>
                    <span className="text-[12px] text-muted">{s.team_name}</span>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-center text-[13px] text-muted">{s.gp}</td>
                <td className="px-3 py-2.5 text-center text-[13px] text-muted">{s.goals}</td>
                <td className="px-3 py-2.5 text-center text-[13px] text-muted">{s.assists}</td>
                <td className="px-3 py-2.5 text-center text-[13px] font-black text-white">{s.points}</td>
                <td className="px-3 py-2.5 text-center text-[13px] text-muted">{s.pim}</td>
                <td className="px-3 py-2.5 text-center text-[13px] text-muted">
                  {s.gp > 0 ? (s.points / s.gp).toFixed(2) : '—'}
                </td>
              </tr>
            ))
          )}
          {showTotal && rows.length > 1 && (
            <tr className="border-t-2 border-white/10 bg-rink-700">
              <td className="px-4 py-2.5 text-[12px] font-black text-white uppercase tracking-wider" colSpan={2}>Career Total</td>
              <td className="px-3 py-2.5 text-center text-[13px] font-black text-white">{totals.gp}</td>
              <td className="px-3 py-2.5 text-center text-[13px] font-black text-white">{totals.goals}</td>
              <td className="px-3 py-2.5 text-center text-[13px] font-black text-white">{totals.assists}</td>
              <td className="px-3 py-2.5 text-center text-[13px] font-black text-amber-400">{totals.points}</td>
              <td className="px-3 py-2.5 text-center text-[13px] font-black text-white">{totals.pim}</td>
              <td className="px-3 py-2.5 text-center text-[13px] font-black text-white">
                {totals.gp > 0 ? (totals.points / totals.gp).toFixed(2) : '—'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )

  return (
    <div className="max-w-[900px] mx-auto px-6 py-8">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[11px] text-dim mb-6">
        <Link href="/players" className="hover:text-white transition-colors">Players</Link>
        <span>/</span>
        <span className="text-muted">{player.first_name} {player.last_name}</span>
      </div>

      {/* Player header */}
      <div className="bg-rink-800 border border-white/[0.07] rounded-xl overflow-hidden mb-6">
        <div className="grid grid-cols-[auto_1fr] gap-0">

          {/* Photo */}
          <div className="w-40 h-48 bg-rink-700 flex items-center justify-center overflow-hidden shrink-0"
            style={{ borderRight: `3px solid ${team?.color ?? '#0088ce'}` }}>
            {player.photo_url ? (
              <img src={player.photo_url} alt={`${player.first_name} ${player.last_name}`}
                className="w-full h-full object-cover object-top" />
            ) : (
              <div className="flex flex-col items-center gap-1">
                <div className="text-4xl font-black" style={{ color: team?.color ?? '#0088ce' }}>
                  #{player.jersey_number ?? '?'}
                </div>
                <div className="text-[10px] text-dim uppercase tracking-wider">No photo</div>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="p-5">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-[7px] font-black text-white shrink-0"
                style={{ background: team?.color }}>{team?.abbreviation}</div>
              <span className="text-[11px] text-muted uppercase tracking-wider">{team?.name_en}</span>
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tight leading-tight mb-1">
              {player.first_name} {player.last_name}
            </h1>
            <div className="flex items-center gap-3 text-[12px] text-muted mb-4">
              <span>#{player.jersey_number}</span>
              <span>·</span>
              <span>{POSITION_LABEL[player.position] ?? player.position}</span>
              {player.shoots && <><span>·</span><span>Shoots {SHOOTS_LABEL[player.shoots]}</span></>}
              {age && <><span>·</span><span>Age {age}</span></>}
              {player.hometown && <><span>·</span><span>{player.hometown}</span></>}
            </div>

            {/* Current season quick stats */}
            {regularStats.length > 0 && (
              <div className="flex gap-6">
                <StatCell label="GP"  value={regularStats[0].gp} />
                <StatCell label="G"   value={regularStats[0].goals} />
                <StatCell label="A"   value={regularStats[0].assists} />
                <StatCell label="PTS" value={regularStats[0].points} />
                <StatCell label="PIM" value={regularStats[0].pim} />
              </div>
            )}
          </div>
        </div>

        {/* Bio */}
        {player.bio && (
          <div className="px-5 py-4 border-t border-white/[0.07] text-[13px] text-muted leading-relaxed">
            {player.bio}
          </div>
        )}
      </div>

      {/* Stats tabs */}
      <div className="flex flex-col gap-5">
        <div>
          <div className="text-[11px] font-black uppercase tracking-widest text-white flex items-center gap-2 mb-3">
            <span className="w-0.5 h-3.5 bg-ice rounded-sm inline-block" />
            Regular Season
          </div>
          <StatsTable rows={regularStats} showTotal />
        </div>

        {playoffStats.length > 0 && (
          <div>
            <div className="text-[11px] font-black uppercase tracking-widest text-white flex items-center gap-2 mb-3">
              <span className="w-0.5 h-3.5 bg-amber-400 rounded-sm inline-block" />
              Playoffs
            </div>
            <StatsTable rows={playoffStats} />
          </div>
        )}
      </div>

    </div>
  )
}