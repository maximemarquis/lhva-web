export function TopBar() {
  return (
    <div className="bg-rink-800 border-b border-white/[0.07] h-9 flex items-center justify-between px-6">
      <div className="flex gap-5">
        {['Season 2025–26', 'Awards', 'History', 'Contact'].map(label => (
          <a key={label} href="#"
            className="text-[11px] uppercase tracking-widest text-muted hover:text-white transition-colors">
            {label}
          </a>
        ))}
      </div>
      <div className="flex border border-white/10 rounded overflow-hidden">
        {['EN', 'FR'].map((lang, i) => (
          <button key={lang}
            className={`text-[11px] px-2.5 py-1 font-bold tracking-widest ${
              i === 0 ? 'bg-ice text-white' : 'text-muted hover:text-white'
            }`}>
            {lang}
          </button>
        ))}
      </div>
    </div>
  )
}