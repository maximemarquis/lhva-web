import type { StandingRow } from '@/types'

// Static fallback data while the DB is empty
const FALLBACK: StandingRow[] = [
  { season_id:1, team_id:1, name_en:'Dynamo Kedgwick',         name_fr:'Dynamo de Kedgwick',        abbreviation:'KD', color:'#1a6fa8', slug:'kedgwick',     gp:28, w:21, l:5,  otl:2, gf:118, ga:79,  pts:44, diff:39 },
  { season_id:1, team_id:2, name_en:'As de St-Basile',         name_fr:'As de Saint-Basile',        abbreviation:'SB', color:'#2e5a3a', slug:'st-basile',    gp:28, w:19, l:7,  otl:2, gf:108, ga:88,  pts:40, diff:20 },
  { season_id:1, team_id:3, name_en:'River VT Perth-Andover',  name_fr:'River VT de Perth-Andover', abbreviation:'PA', color:'#543080', slug:'perth-andover',gp:28, w:16, l:10, otl:2, gf:99,  ga:95,  pts:34, diff:4  },
  { season_id:1, team_id:4, name_en:'Castors St-Quentin',      name_fr:'Castors de Saint-Quentin',  abbreviation:'SQ', color:'#7a3030', slug:'st-quentin',   gp:28, w:13, l:14, otl:1, gf:91,  ga:102, pts:27, diff:-11},
  { season_id:1, team_id:5, name_en:'Draveurs Bas-Madawaska',  name_fr:'Draveurs du Bas-Madawaska', abbreviation:'BM', color:'#7a6020', slug:'bas-madawaska', gp:28, w:10, l:16, otl:2, gf:84,  ga:108, pts:22, diff:-24},
  { season_id:1, team_id:6, name_en:'Ambassadeurs St-Jacques', name_fr:'Ambassadeurs de St-Jacques',abbreviation:'SJ', color:'#35607a', slug:'st-jacques',    gp:28, w:7,  l:19, otl:2, gf:72,  ga:120, pts:16, diff:-48},
]

interface Props {
  rows?: StandingRow[]
}

export function StandingsTable({ rows }: Props) {
  const data = (rows && rows.length > 0) ? rows : FALLBACK

  return (
    <div className="border border-white/[0.07] rounded overflow-hidden">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-rink-700">
            <th className="px-3 py-2 text-left text-[10px] font-black uppercase tracking-widest text-dim w-[42%]">Team</th>
            <th className="px-2 py-2 text-center text-[10px] font-black uppercase tracking-widest text-dim">GP</th>
            <th className="px-2 py-2 text-center text-[10px] font-black uppercase tracking-widest text-dim">W</th>
            <th className="px-2 py-2 text-center text-[10px] font-black uppercase tracking-widest text-dim">L</th>
            <th className="px-2 py-2 text-center text-[10px] font-black uppercase tracking-widest text-dim">OTL</th>
            <th className="px-2 py-2 text-center text-[10px] font-black uppercase tracking-widest text-white">PTS</th>
            <th className="px-2 py-2 text-center text-[10px] font-black uppercase tracking-widest text-dim">GF</th>
            <th className="px-2 py-2 text-center text-[10px] font-black uppercase tracking-widest text-dim">GA</th>
            <th className="px-2 py-2 text-center text-[10px] font-black uppercase tracking-widest text-dim">DIFF</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={row.team_id}
              className={`border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors ${
                i === 3 ? 'border-t-2 border-t-ice/30' : ''
              }`}>
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-dim w-4">{i + 1}</span>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black text-white shrink-0"
                    style={{ background: row.color }}>
                    {row.abbreviation}
                  </div>
                  <span className="text-[13px] font-semibold text-white">{row.name_en}</span>
                </div>
              </td>
              <td className="px-2 py-2.5 text-center text-[13px] text-muted">{row.gp}</td>
              <td className="px-2 py-2.5 text-center text-[13px] text-muted">{row.w}</td>
              <td className="px-2 py-2.5 text-center text-[13px] text-muted">{row.l}</td>
              <td className="px-2 py-2.5 text-center text-[13px] text-muted">{row.otl}</td>
              <td className="px-2 py-2.5 text-center text-[13px] font-black text-white">{row.pts}</td>
              <td className="px-2 py-2.5 text-center text-[13px] text-muted">{row.gf}</td>
              <td className="px-2 py-2.5 text-center text-[13px] text-muted">{row.ga}</td>
              <td className={`px-2 py-2.5 text-center text-[13px] font-semibold ${
                row.diff > 0 ? 'text-green-400' : row.diff < 0 ? 'text-red-400' : 'text-muted'
              }`}>
                {row.diff > 0 ? `+${row.diff}` : row.diff}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}