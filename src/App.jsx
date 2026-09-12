import { useMemo, useState } from "react"
import { endpoints, tags } from "./data/endpoints.js"
import { getByPath, loadSession, saveSession } from "./lib/storage.js"
import { AuthorizeBar } from "./components/AuthorizeBar.jsx"
import { EndpointCard, ResourceEnums } from "./components/EndpointCard.jsx"
import { Sidebar } from "./components/Sidebar.jsx"

export default function App() {
  const [session, setSession] = useState(loadSession)
  const [authOpen, setAuthOpen] = useState(true)
  const [activeTag, setActiveTag] = useState(tags[0].id)
  const [query, setQuery] = useState("")

  function updateSession(patch) {
    setSession((prev) => {
      const next = { ...prev, ...patch }
      saveSession(next)
      return next
    })
  }

  function clearTokens() {
    updateSession({ accessToken: "", refreshToken: "", licenseKey: "" })
  }

  function onCapture(payload, map) {
    const patch = {}
    for (const [key, path] of Object.entries(map)) {
      const value = getByPath(payload, path)
      if (typeof value === "string" && value) patch[key] = value
    }
    if (Object.keys(patch).length) updateSession(patch)
  }

  function onSaveBody(id, text) {
    updateSession({ bodies: { ...session.bodies, [id]: text } })
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return endpoints
    return endpoints.filter((item) =>
      `${item.method} ${item.path} ${item.summary} ${item.description}`.toLowerCase().includes(q)
    )
  }, [query])

  const visibleTags = useMemo(
    () => tags.filter((tag) => filtered.some((item) => item.tag === tag.id)),
    [filtered]
  )

  return (
    <div className="flex min-h-screen">
      <Sidebar
        tags={tags}
        endpoints={endpoints}
        activeTag={activeTag}
        onSelect={(id) => {
          setActiveTag(id)
          document.getElementById(`tag-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" })
        }}
        query={query}
        setQuery={setQuery}
      />

      <div className="min-w-0 flex-1">
        <header className="border-b border-slate-200 bg-[#1b1b1b] px-4 py-4 text-white">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#89bf04]">
                Multi Tenant Ecommerce
              </div>
              <h1 className="mt-1 text-2xl font-semibold">POS web API</h1>
              <p className="mt-1 max-w-3xl text-sm text-slate-300">
                Only routes the POS web app calls, plus Plans and Authentication (including store
                register). Coupons, approvals, transfers, backup, and unused admin extras are omitted.
              </p>
            </div>
            <div className="rounded border border-[#333] bg-[#111] px-3 py-2 font-mono text-xs text-slate-300">
              {filtered.length} operations
            </div>
          </div>
        </header>

        <AuthorizeBar
          session={session}
          onChange={updateSession}
          onClear={clearTokens}
          open={authOpen}
          setOpen={setAuthOpen}
        />

        <main className="mx-auto max-w-5xl space-y-8 px-4 py-6">
          {visibleTags.map((tag) => (
            <section key={tag.id} id={`tag-${tag.id}`}>
              <h2 className="text-xl font-semibold text-slate-800">{tag.name}</h2>
              <p className="mt-1 mb-3 text-sm text-slate-500">{tag.description}</p>
              <ResourceEnums enums={tag.enums} className="mb-3" />
              <div className="space-y-3">
                {filtered
                  .filter((item) => item.tag === tag.id)
                  .map((item) => (
                    <EndpointCard
                      key={item.id}
                      endpoint={item}
                      session={session}
                      onCapture={onCapture}
                      savedBody={session.bodies?.[item.id]}
                      onSaveBody={onSaveBody}
                    />
                  ))}
              </div>
            </section>
          ))}
          {!visibleTags.length ? (
            <p className="text-sm text-slate-500">No endpoints match that filter.</p>
          ) : null}
        </main>
      </div>
    </div>
  )
}
