export function Sidebar({ tags, endpoints, activeTag, onSelect, query, setQuery }) {
  const counts = Object.fromEntries(
    tags.map((tag) => [tag.id, endpoints.filter((item) => item.tag === tag.id).length])
  )

  return (
    <aside className="hidden w-64 shrink-0 overflow-y-auto border-r border-[#2b2b2b] bg-[#1b1b1b] text-[#ebebeb] lg:block">
      <div className="sticky top-0 z-10 border-b border-[#333] bg-[#1b1b1b] p-4">
        <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#89bf04]">POS API</div>
        <div className="mt-1 text-lg font-semibold">Endpoint docs</div>
        <input
          className="mt-3 h-9 w-full rounded border border-[#444] bg-[#111] px-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-[#89bf04]"
          placeholder="Filter paths…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <nav className="p-3">
        {tags.map((tag) => (
          <button
            key={tag.id}
            type="button"
            onClick={() => onSelect(tag.id)}
            className={`mb-1 flex w-full items-center justify-between rounded px-3 py-2 text-left text-sm ${
              activeTag === tag.id ? "bg-[#89bf04] text-[#1b1b1b]" : "hover:bg-[#2a2a2a]"
            }`}
          >
            <span>{tag.name}</span>
            <span className={`text-xs ${activeTag === tag.id ? "text-[#1b1b1b]" : "text-slate-400"}`}>
              {counts[tag.id]}
            </span>
          </button>
        ))}
      </nav>
    </aside>
  )
}
