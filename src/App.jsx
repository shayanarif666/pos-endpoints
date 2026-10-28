import { useMemo, useState } from "react"
import { endpoints, getSections, patchSections, postSections, tags } from "./data/endpoints.js"
import { missingBodyFields } from "./data/bodyFields.js"
import { allToggles, buildBody } from "./data/bodyBuilder.js"

// Dev guard: every attribute in an example body (each bodyBuilder variant with every checkbox
// on) must be marked required or optional.
if (import.meta.env.DEV) {
  for (const endpoint of endpoints) {
    const builder = endpoint.bodyBuilder
    const bodies = builder
      ? builder.variants.map((v) => buildBody(builder, v.id, allToggles(builder)))
      : [endpoint.body]
    for (const body of bodies) {
      const missing = missingBodyFields({ ...endpoint, body })
      if (missing.length) console.warn(`[docs] ${endpoint.id}: no required/optional rule for`, missing)
    }
  }
}
import { getByPath, loadSession, saveSession } from "./lib/storage.js"
import { AuthorizeBar } from "./components/AuthorizeBar.jsx"
import { EndpointCard } from "./components/EndpointCard.jsx"
import { Sidebar, sectionKey } from "./components/Sidebar.jsx"

const SECTION_LISTS = { post: postSections, get: getSections, "put-patch": patchSections }

/** The listed sections (their ids in order), then any other request of the group under "Other". */
function sectionsOf(sections, items) {
  const listed = new Set(sections.flatMap((section) => section.ids))
  const rows = sections.map((section) => ({
    tag: { id: section.id, name: section.name, navTag: section.tag },
    items: section.ids.map((id) => items.find((item) => item.id === id)).filter(Boolean),
  }))
  const rest = items.filter((item) => !listed.has(item.id))
  if (rest.length) rows.push({ tag: { id: "other-" + rest[0].method, name: "Other" }, items: rest })
  return rows
}

export default function App() {
  const [session, setSession] = useState(loadSession)
  const [authOpen, setAuthOpen] = useState(true)
  const [activeSection, setActiveSection] = useState(null)
  const [query, setQuery] = useState("")

  function updateSession(patch) {
    setSession((prev) => {
      const next = { ...prev, ...patch }
      saveSession(next)
      return next
    })
  }

  function clearTokens() {
    updateSession({ accessToken: "", refreshToken: "", licenseKey: "", role: "" })
  }

  function onCapture(payload, map) {
    const patch = {}
    for (const [key, pathOrPaths] of Object.entries(map)) {
      // A capture entry may list several paths (e.g. channel=web's data.access_token vs.
      // channel=pos's data.token on the same login endpoint) — first one that resolves wins.
      const paths = Array.isArray(pathOrPaths) ? pathOrPaths : [pathOrPaths]
      for (const path of paths) {
        const value = getByPath(payload, path)
        if (typeof value === "string" && value) {
          patch[key] = value
          break
        }
      }
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

  // Top-level grouping by method, in this fixed order (GET right under POST); PUT and PATCH share one group.
  const METHOD_GROUPS = [
    { key: "post", label: "POST", test: (m) => m === "POST" },
    { key: "get", label: "GET", test: (m) => m === "GET" },
    { key: "put-patch", label: "PUT / PATCH", test: (m) => m === "PUT" || m === "PATCH" },
    { key: "delete", label: "DELETE", test: (m) => m === "DELETE" },
  ]

  // For each group: which tags have at least one matching endpoint, each with its filtered list.
  const groupedSections = useMemo(
    () =>
      METHOD_GROUPS.map((group) => ({
        group,
        // POST and GET follow their own section lists (in that order); the others go by tag.
        tagSections: (SECTION_LISTS[group.key]
          ? sectionsOf(SECTION_LISTS[group.key], filtered.filter((item) => group.test(item.method)))
          : tags.map((tag) => ({
              tag,
              items: filtered.filter((item) => item.tag === tag.id && group.test(item.method)),
            }))
        ).filter((section) => section.items.length),
      })).filter((g) => g.tagSections.length),
    [filtered]
  )

  // The sidebar links to one section of one method group (e.g. GET → Products).
  function scrollToSection(key) {
    document.querySelector(`[data-section="${key}"]`)?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar
        groups={groupedSections}
        activeKey={activeSection}
        onSelect={(key) => {
          setActiveSection(key)
          scrollToSection(key)
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

        <main className="mx-auto max-w-5xl space-y-10 px-4 py-6">
          {(() => {
            // Each section shows only its name; enums live in each request's View Enums dialog.
            return groupedSections.map(({ group, tagSections }) => (
              <section key={group.key} id={`method-${group.key}`}>
                <h1 className="mb-4 text-2xl font-bold text-slate-900">{group.label}</h1>
                <div className="space-y-8">
                  {tagSections.map(({ tag, items }) => {
                    return (
                      <div key={tag.id} data-tag={tag.navTag || tag.id} data-section={sectionKey(group.key, tag.id)} className="scroll-mt-4">
                        <h2 className="mb-3 text-xl font-semibold text-slate-800">{tag.name}</h2>
                        <div className="space-y-3">
                          {items.map((item) => (
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
                      </div>
                    )
                  })}
                </div>
              </section>
            ))
          })()}
          {!groupedSections.length ? (
            <p className="text-sm text-slate-500">No endpoints match that filter.</p>
          ) : null}
        </main>
      </div>
    </div>
  )
}
