/**
 * The sidebar lists the page as it is laid out: a label per method group (POST REQUESTS,
 * GET REQUESTS, PUT / PATCH REQUESTS…) and under it a link to each of that group's sections.
 */
export function Sidebar({ groups, activeKey, onSelect, query, setQuery }) {
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 overflow-y-auto border-r border-[#2b2b2b] bg-[#1b1b1b] text-[#ebebeb] lg:block">
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
        {groups.map(({ group, tagSections }) => (
          <div key={group.key} className="mb-4">
            <div className="px-3 pb-2 pt-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#89bf04]">
              {group.label} Requests
            </div>
            {tagSections.map(({ tag, items }) => {
              const key = sectionKey(group.key, tag.id)
              const active = activeKey === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onSelect(key)}
                  className={`mb-1 flex w-full items-center justify-between rounded px-3 py-2 text-left text-sm ${
                    active ? "bg-[#89bf04] text-[#1b1b1b]" : "hover:bg-[#2a2a2a]"
                  }`}
                >
                  <span>{tag.name}</span>
                  <span className={`text-xs ${active ? "text-[#1b1b1b]" : "text-slate-400"}`}>{items.length}</span>
                </button>
              )
            })}
          </div>
        ))}
      </nav>
    </aside>
  )
}

/** One section's anchor: its method group and its id (Products is in POST, GET and PATCH). */
export function sectionKey(groupKey, tagId) {
  return `${groupKey}:${tagId}`
}
