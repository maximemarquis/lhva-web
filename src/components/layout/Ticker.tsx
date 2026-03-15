const TICKER_ITEMS = [
  'Kedgwick def. St-Basile 5–2 · SF Game 3',
  'St-Quentin def. Perth-Andover 3–1 · SF Game 3',
  'M. Thériault (KD) leads league with 52 pts',
  'Playoffs SF Game 4 — Sat Mar 15 · 7:30 PM',
  'Award nominees announced · Vote now',
]

export function Ticker() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS] // duplicate for seamless loop
  return (
    <div className="bg-ice h-8 flex items-center overflow-hidden">
      <div className="bg-rink-900 text-ice-light text-[10px] font-black tracking-[0.12em] uppercase px-4 h-full flex items-center shrink-0">
        Latest
      </div>
      <div className="overflow-hidden flex-1 h-full relative">
        <div className="flex items-center h-full gap-10 animate-ticker whitespace-nowrap"
          style={{ width: 'max-content' }}>
          {items.map((item, i) => (
            <span key={i} className="text-[11px] font-bold tracking-wide text-rink-900 uppercase">
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}