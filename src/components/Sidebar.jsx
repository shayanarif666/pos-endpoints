/**
 * The sidebar lists the page as it is laid out: a coloured label per method group (POST, GET,
 * PUT / PATCH, DELETE — the same colours as the request cards) and under it a link to each of
 * that group's sections.
 */
const GROUP_STYLE = {
  post: { dot: "bg-[#49cc90]", label: "text-[#2f9e6c]", chip: "bg-[#49cc90]/10", active: "bg-[#49cc90] text-white", count: "bg-[#49cc90]/15 text-[#2f9e6c]" },
  get: { dot: "bg-[#61affe]", label: "text-[#2f7fd1]", chip: "bg-[#61affe]/10", active: "bg-[#61affe] text-white", count: "bg-[#61affe]/15 text-[#2f7fd1]" },
  "put-patch": { dot: "bg-[#fca130]", label: "text-[#d27d10]", chip: "bg-[#fca130]/10", active: "bg-[#fca130] text-white", count: "bg-[#fca130]/15 text-[#d27d10]" },
  delete: { dot: "bg-[#f93e3e]", label: "text-[#d42a2a]", chip: "bg-[#f93e3e]/10", active: "bg-[#f93e3e] text-white", count: "bg-[#f93e3e]/15 text-[#d42a2a]" },
}

export function Sidebar({ groups, activeKey, onSelect, query, setQuery }) {
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 overflow-y-auto border-r border-slate-200 bg-white lg:block">
      <div className="sticky top-0 z-10 border-b border-slate-100 bg-white p-4">
        <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#49cc90]">POS API</div>
        <div className="mt-0.5 text-lg font-bold text-slate-900">Endpoint docs</div>
        <input
          className="mt-3 h-9 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-[#49cc90] focus:bg-white focus:ring-2 focus:ring-[#49cc90]/20"
          placeholder="Filter paths…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <nav className="space-y-5 p-3">
        {groups.map(({ group, tagSections }) => {
          const style = GROUP_STYLE[group.key] || GROUP_STYLE.get
          return (
            <div key={group.key}>
              <div className={`mb-1.5 flex items-center gap-2 rounded-md px-3 py-1.5 ${style.chip}`}>
                <span className={`h-2 w-2 rounded-full ${style.dot}`} />
                <span className={`text-[11px] font-bold uppercase tracking-[0.14em] ${style.label}`}>
                  {group.label} Requests
                </span>
              </div>
              {tagSections.map(({ tag, items }) => {
                const key = sectionKey(group.key, tag.id)
                const active = activeKey === key
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onSelect(key)}
                    className={`mb-0.5 flex w-full items-center justify-between rounded-md px-3 py-1.5 text-left text-sm transition-colors ${
                      active ? `${style.active} font-semibold shadow-sm` : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <span className="truncate">{tag.name}</span>
                    <span
                      className={`ml-2 min-w-[1.5rem] rounded-full px-1.5 text-center text-[11px] font-semibold ${
                        active ? "bg-white/25 text-white" : style.count
                      }`}
                    >
                      {items.length}
                    </span>
                  </button>
                )
              })}
            </div>
          )
        })}
      </nav>
    </aside>
  )
}

/** One section's anchor: its method group and its id (Products is in POST, GET and PATCH). */
export function sectionKey(groupKey, tagId) {
  return `${groupKey}:${tagId}`
}
