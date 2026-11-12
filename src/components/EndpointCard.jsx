import { useEffect, useMemo, useState } from "react"
import { CALC_NOTES } from "../data/calcNotes.js"
import { defaultHeaders, migrateLegacyPlanBody } from "../lib/storage.js"
import { buildUrl, sendRequest } from "../lib/request.js"
import { defaultOf, noteWithoutDefault, ruleOf, typeOf } from "../data/bodyFields.js"
import { allToggles, buildBody, defaultToggles } from "../data/bodyBuilder.js"
import { JsonEditor, JsonView, Modal, ViewButton } from "./DocUi.jsx"
import { REPORT_COMMON, REPORT_SECTION, enumsFor, queryRowsFor } from "../data/reportSections.js"

const METHOD_CLASS = {
  GET: "method-get",
  POST: "method-post",
  PUT: "method-put",
  PATCH: "method-patch",
  DELETE: "method-delete",
}

const OP_CLASS = {
  GET: "op-get",
  POST: "op-post",
  PUT: "op-put",
  PATCH: "op-patch",
  DELETE: "op-delete",
}

function pretty(value) {
  return JSON.stringify(value, null, 2)
}

/** Enums modal: each attribute with every value it accepts. */
export function ResourceEnums({ enums }) {
  if (!enums || !Object.keys(enums).length) return null
  return (
    <div className="overflow-hidden rounded-md border border-slate-200">
      <div className="grid grid-cols-[minmax(140px,0.6fr)_minmax(0,1.4fr)] gap-3 bg-slate-50 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-slate-500">
        <span>Attribute</span>
        <span>Values</span>
      </div>
      {Object.entries(enums).map(([key, values]) => (
        <div
          key={key}
          className="grid grid-cols-[minmax(140px,0.6fr)_minmax(0,1.4fr)] items-start gap-3 border-t border-slate-100 px-4 py-2.5"
        >
          <code className="break-all font-mono text-sm font-semibold text-slate-800">{key}</code>
          <div className="flex flex-wrap gap-1.5">
            {values.map((value) => (
              <span key={String(value)} className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-700">
                {String(value)}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// Drops the endpoint's store-admin-only keys (top level and inside items[] rows) for any other role.
function bodyForRole(body, adminOnly, role) {
  if (body == null || !adminOnly?.length || role === "store_admin") return body
  const strip = (value) => {
    if (Array.isArray(value)) return value.map(strip)
    if (!value || typeof value !== "object") return value
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !adminOnly.includes(key))
        .map(([key, inner]) => [key, key === "items" ? strip(inner) : inner])
    )
  }
  return strip(body)
}

function fieldsForRole(fields, adminOnly, role) {
  if (!fields || !adminOnly?.length || role === "store_admin") return fields
  return Object.fromEntries(Object.entries(fields).filter(([key]) => !adminOnly.includes(key)))
}

function savedBodyForRole(text, adminOnly, role) {
  if (!text || !adminOnly?.length || role === "store_admin") return text
  try {
    return pretty(bodyForRole(JSON.parse(text), adminOnly, role))
  } catch {
    return text
  }
}

export function EndpointCard({
  endpoint,
  session,
  onCapture,
  savedBody,
  onSaveBody,
  defaultOpen = false,
}) {
  const [open, setOpen] = useState(defaultOpen)
  // Which "View …" dialog is open: headers | fields | enums | path | query | files.
  const [modal, setModal] = useState(null)
  const [pathParams, setPathParams] = useState(
    Object.fromEntries(endpoint.pathParams.map((p) => [p.name, p.default ?? ""]))
  )
  const [query, setQuery] = useState(
    Object.fromEntries(endpoint.query.map((q) => [q.name, q.default ?? ""]))
  )
  // Detailed Reporting: the :section in the path decides which filters the query parameters show.
  const hasSections = Boolean(endpoint.sections?.length)
  const sectionId = hasSections ? String(pathParams.section || "").trim() : null
  const queryRows = hasSections
    ? queryRowsFor(sectionId)
    : (endpoint.query || []).map((row) => (row.values || !endpoint.enums?.[row.name] ? row : { ...row, values: endpoint.enums[row.name] }))
  const sectionEnums = hasSections ? enumsFor(sectionId) : null
  // The section the "View Section Filters" dialog shows (null = the one in :section).
  const [filterSection, setFilterSection] = useState(null)
  useEffect(() => {
    if (!hasSections) return
    // Another section: keep the values of the parameters it shares (dates, location, page…), drop the rest.
    setQuery((current) => {
      const next = {}
      for (const row of queryRowsFor(sectionId)) next[row.name] = row.name in current ? current[row.name] : row.default ?? ""
      return next
    })
  }, [hasSections, sectionId])
  const [headerMap, setHeaderMap] = useState(() =>
    defaultHeaders(endpoint.auth, endpoint.method, session)
  )
  // A bodyBuilder endpoint (see data/bodyBuilder.js) regenerates its body from the selected
  // radio variant and checkboxes, so a body saved from an older template is not restored.
  const builder = endpoint.bodyBuilder
  const [variantId, setVariantId] = useState(builder?.variants[0].id ?? null)
  const [scopeId, setScopeId] = useState(builder?.scopes?.[0].id ?? null)
  const [toggles, setToggles] = useState(() => (builder ? defaultToggles(builder) : {}))
  const adminOnly = endpoint.adminOnly || []
  const activeBody = bodyForRole(
    builder ? buildBody(builder, variantId, toggles, scopeId) : endpoint.body,
    adminOnly,
    session.role
  )
  const [bodyText, setBodyText] = useState(() =>
    migrateLegacyPlanBody(
      (builder ? null : savedBodyForRole(savedBody, adminOnly, session.role)) ??
        (activeBody == null ? "" : pretty(activeBody))
    )
  )
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState("")
  const [result, setResult] = useState(null)
  const [fileMap, setFileMap] = useState({})
  const fileFields = endpoint.files || []
  // An upload form shows its file picker as an input above the body, not as a button.
  const uploadForm = Boolean(endpoint.uploadForm) && fileFields.length > 0

  useEffect(() => {
    if (!session.licenseKey || !bodyText) return
    const next = applySessionPlaceholders(bodyText)
    if (next !== bodyText) setBodyText(next)
  }, [session.licenseKey])

  const shownHeaders = useMemo(() => {
    const hasFiles = fileFields.some((field) => fileMap[field.name])
    const merged = {
      ...defaultHeaders(endpoint.auth, endpoint.method, session, {
        multipart: hasFiles,
      }),
      ...headerMap,
    }
    if (hasFiles) {
      delete merged["Content-Type"]
      delete merged["content-type"]
    }
    if (session.accessToken && endpoint.auth !== "public") {
      merged.Authorization = `Bearer ${session.accessToken}`
    } else if (endpoint.auth === "public") {
      delete merged.Authorization
    }
    return merged
  }, [headerMap, session.accessToken, endpoint.auth, endpoint.method, fileMap, fileFields, session])

  function applySessionPlaceholders(text) {
    if (!text) return text
    try {
      const obj = JSON.parse(text)
      if (!obj || typeof obj !== "object") return text
      if (
        "license_key" in obj &&
        session.licenseKey &&
        (!obj.license_key ||
          obj.license_key === "FROM_AUTHORIZE" ||
          obj.license_key === "PAK-XXXX-XXXX-XXXX")
      ) {
        obj.license_key = session.licenseKey
      }
      if ("refresh_token" in obj && session.refreshToken && !obj.refresh_token) {
        obj.refresh_token = session.refreshToken
      }
      return JSON.stringify(obj, null, 2)
    } catch {
      return text
    }
  }

  async function execute() {
    setBusy(true)
    setError("")
    setResult(null)
    try {
      const outgoingBody = endpoint.body == null ? null : applySessionPlaceholders(bodyText)
      if (outgoingBody != null) {
        JSON.parse(outgoingBody || "{}")
        setBodyText(outgoingBody)
        onSaveBody(endpoint.id, outgoingBody)
      }
      const headers = { ...shownHeaders }
      const res = await sendRequest({
        baseUrl: session.baseUrl,
        method: endpoint.method,
        path: endpoint.path,
        pathParams,
        query,
        headers,
        bodyText: outgoingBody,
        files: fileMap,
      })
      setResult(res)
      if (res.json && endpoint.capture) onCapture(res.json, endpoint.capture)
    } catch (err) {
      setError(err.message || "Request failed")
    } finally {
      setBusy(false)
    }
  }

  function showBody(body) {
    const shown = bodyForRole(body, adminOnly, session.role)
    const next = shown == null ? "" : pretty(shown)
    setBodyText(next)
    onSaveBody(endpoint.id, next)
  }

  // Signing in as another role shows / hides the store-admin-only fields right away.
  const [shownRole, setShownRole] = useState(session.role)
  useEffect(() => {
    if (!adminOnly.length || shownRole === session.role) return
    setShownRole(session.role)
    showBody(builder ? buildBody(builder, variantId, toggles, scopeId) : endpoint.body)
  }, [session.role])

  function resetBody() {
    if (!builder) return showBody(endpoint.body)
    const defaults = defaultToggles(builder)
    setVariantId(builder.variants[0].id)
    setToggles(defaults)
    setScopeId(builder.scopes?.[0].id ?? null)
    showBody(buildBody(builder, builder.variants[0].id, defaults, builder.scopes?.[0].id))
  }

  function selectVariant(id) {
    setVariantId(id)
    showBody(buildBody(builder, id, toggles, scopeId))
  }

  function selectScope(id) {
    setScopeId(id)
    showBody(buildBody(builder, variantId, toggles, id))
  }

  function flipToggle(id) {
    const next = { ...toggles, [id]: !toggles[id] }
    setToggles(next)
    showBody(buildBody(builder, variantId, next, scopeId))
  }

  // Path / query values live in their modals, so the URL next to Execute shows them filled in.
  let requestUrl = `${session.baseUrl.replace(/\/$/, "")}${endpoint.path}`
  try {
    requestUrl = buildUrl(session.baseUrl, endpoint.path, pathParams, query)
  } catch {
    // An unparsable Base URL: keep the plain text above.
  }

  async function copyBody() {
    try {
      await navigator.clipboard.writeText(bodyText)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard API unavailable (e.g. insecure context) — nothing to recover from here.
    }
  }

  const enumCount = hasSections ? Object.keys(sectionEnums).length : endpoint.enums ? Object.keys(endpoint.enums).length : 0
  // GET requests show their path parameters right above Execute instead of in a dialog.
  const inlinePathParams = endpoint.method === "GET" && endpoint.pathParams.length > 0
  const shownFields = fieldsForRole(endpoint.fields, adminOnly, session.role)
  const fieldCount = shownFields ? Object.keys(shownFields).length : 0
  const showVariants =
    builder &&
    !builder.bulk &&
    builder.variants.length > 1 &&
    (!builder.adminOnlyVariants || session.role === "store_admin")
  // Where it applies (e.g. offers): only the store admin chooses; others use their location.
  const showScopes = Boolean(
    builder && !builder.bulk && builder.scopes?.length && session.role === "store_admin"
  )
  const showToggles = Boolean(builder && !builder.bulk && builder.toggles.length)
  let bodyInvalid = false
  if (endpoint.body != null && bodyText) {
    try {
      JSON.parse(bodyText)
    } catch {
      bodyInvalid = true
    }
  }

  // The sample reply under Execute: the section's own one (Detailed Reporting), else the variant's / the first.
  const sampleShown = hasSections
    ? endpoint.responses?.find((row) => row.section === sectionId)
    : endpoint.responses?.find((row) => row.variant && row.variant === variantId) || endpoint.responses?.[0]
  // View Response: the section in :section first.
  const sampleList = hasSections ? [...(endpoint.responses || [])].sort((a, b) => Number(b.section === sectionId) - Number(a.section === sectionId)) : endpoint.responses

  return (
    <article className={`overflow-hidden rounded border ${OP_CLASS[endpoint.method]}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-3 py-2 text-left"
      >
        <span
          className={`w-20 shrink-0 rounded py-1 text-center text-xs font-bold tracking-wide text-white ${METHOD_CLASS[endpoint.method]}`}
        >
          {endpoint.method}
        </span>
        <code className="font-mono text-sm font-semibold text-slate-800">{endpoint.path}</code>
        <span className="hidden min-w-0 flex-1 truncate text-sm text-slate-600 sm:block">
          {endpoint.summary}
        </span>
        <span className="rounded bg-white/70 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-500">
          {endpoint.auth}
        </span>
      </button>

      {open ? (
        <div className="space-y-4 border-t border-black/10 bg-white/70 p-4">
          <div className="flex flex-wrap gap-2">
            <ViewButton
              label="View Headers"
              count={Object.keys(shownHeaders).length}
              onClick={() => setModal("headers")}
            />
            {fieldCount && !uploadForm ? (
              <ViewButton label="View Attributes" count={fieldCount} onClick={() => setModal("fields")} />
            ) : null}
            {enumCount && !uploadForm ? (
              <ViewButton label="View Enums" count={enumCount} onClick={() => setModal("enums")} />
            ) : null}
            {endpoint.pathParams.length && !inlinePathParams ? (
              <ViewButton
                label="View Path Parameters"
                count={endpoint.pathParams.length}
                onClick={() => setModal("path")}
              />
            ) : null}
            {queryRows.length ? (
              <ViewButton
                label="View Query Parameters"
                count={queryRows.length}
                onClick={() => setModal("query")}
              />
            ) : null}
            {hasSections ? (
              <>
                <ViewButton label="View Section Names" count={endpoint.sections.length} onClick={() => setModal("sectionNames")} />
                <ViewButton
                  label="View Section Filters"
                  count={REPORT_SECTION[sectionId]?.filters.length ?? 0}
                  onClick={() => {
                    setFilterSection(null)
                    setModal("sectionFilters")
                  }}
                />
              </>
            ) : null}
            {endpoint.responses?.length && !uploadForm && endpoint.method !== "GET" ? (
              <ViewButton
                label="View Response"
                count={endpoint.responses.length}
                onClick={() => setModal("responses")}
              />
            ) : null}
            {fileFields.length && !uploadForm ? (
              <ViewButton
                label="Attach Files"
                count={fileFields.filter((field) => fileMap[field.name]).length || null}
                onClick={() => setModal("files")}
              />
            ) : null}
          </div>

          {showVariants || showScopes || showToggles ? (
            <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              {showVariants ? (
                <OptionGroup label={builder.variantsLabel || "Type"}>
                  <Segmented
                    name={`${endpoint.id}-variant`}
                    options={builder.variants}
                    value={variantId}
                    onChange={selectVariant}
                  />
                </OptionGroup>
              ) : null}
              {showScopes ? (
                <OptionGroup label="Locations">
                  <Segmented
                    name={`${endpoint.id}-scope`}
                    options={builder.scopes}
                    value={scopeId}
                    onChange={selectScope}
                  />
                </OptionGroup>
              ) : null}
              {showToggles ? (
                <OptionGroup label="Include">
                  <div className="flex flex-wrap gap-2">
                    {builder.toggles.map((toggle) => (
                      <ToggleChip
                        key={toggle.id}
                        label={toggle.label}
                        checked={Boolean(toggles[toggle.id])}
                        onChange={() => flipToggle(toggle.id)}
                      />
                    ))}
                  </div>
                </OptionGroup>
              ) : null}
            </div>
          ) : null}

          {CALC_NOTES[endpoint.id] ? <CalcNote note={CALC_NOTES[endpoint.id]} /> : null}

          {uploadForm ? (
            <section className="space-y-2">
              <h4 className="text-sm font-semibold text-slate-700">
                Attach file <span className="font-normal text-slate-400">optional · multipart/form-data</span>
              </h4>
              {fileFields.map((field) => (
                <label
                  key={field.name}
                  className="flex items-center gap-3 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  <span className="w-24 shrink-0 text-sm font-semibold text-slate-700">{field.label || field.name}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="min-w-0 flex-1 text-sm"
                    onChange={(e) => setFileMap((prev) => ({ ...prev, [field.name]: e.target.files?.[0] || null }))}
                  />
                </label>
              ))}
              <p className="text-xs text-slate-500">
                When a file is selected, the JSON body below is sent as form fields with the file.
              </p>
            </section>
          ) : null}

          {endpoint.body != null ? (
            <section>
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-700">
                  Request body <span className="font-normal text-slate-400">application/json</span>
                </h4>
                <div className="flex items-center gap-2">
                  {bodyInvalid ? (
                    <span className="text-xs font-medium text-red-600">Invalid JSON</span>
                  ) : null}
                  <button
                    type="button"
                    onClick={copyBody}
                    className="h-8 rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                  <button
                    type="button"
                    onClick={resetBody}
                    className="h-8 rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-[#547f00] hover:bg-slate-50"
                  >
                    Reset defaults
                  </button>
                </div>
              </div>
              <JsonEditor value={bodyText} onChange={setBodyText} invalid={bodyInvalid} />
              {endpoint.computed ? <ComputedTotals compute={endpoint.computed} bodyText={bodyText} /> : null}
            </section>
          ) : (
            <p className="text-sm text-slate-500">No request body.</p>
          )}

          {inlinePathParams ? (
            <section>
              <h4 className="mb-2 text-sm font-semibold text-slate-700">Path Parameters</h4>
              {hasSections ? (
                <SectionInput sections={endpoint.sections} value={pathParams.section ?? ""} onChange={(value) => setPathParams({ ...pathParams, section: value })} />
              ) : (
                <KeyValueInputs rows={endpoint.pathParams} values={pathParams} onChange={setPathParams} />
              )}
            </section>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={execute}
              disabled={busy}
              className="h-10 rounded-md bg-[#4990e2] px-6 text-sm font-semibold text-white hover:bg-[#357abd] disabled:opacity-60"
            >
              {busy ? "Sending…" : "Execute"}
            </button>
            <span className="min-w-0 break-all font-mono text-xs text-slate-500">{requestUrl}</span>
          </div>

          {error ? (
            <pre className="overflow-auto rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </pre>
          ) : null}

          {/* The live reply once executed; before that, the prepared sample reply. */}
          {result ? (
            <ResponsePanel result={result} />
          ) : endpoint.responses?.length && sampleShown ? (
            <SampleResponsePanel sample={sampleShown} more={uploadForm || endpoint.method === "GET" ? 0 : endpoint.responses.length - 1} onMore={() => setModal("responses")} />
          ) : null}
        </div>
      ) : null}

      {modal === "headers" ? (
        <Modal title="Headers" onClose={() => setModal(null)}>
          <p className="mb-3 text-sm text-slate-500">
            Editable. Authorization is filled from Authorize when a token is saved.
          </p>
          <KeyValueInputs
            rows={Object.keys(shownHeaders).map((name) => ({ name }))}
            values={shownHeaders}
            onChange={(next) => setHeaderMap(next)}
          />
        </Modal>
      ) : null}
      {modal === "fields" ? (
        <Modal title="Attributes" wide onClose={() => setModal(null)}>
          <BodyFields
            fields={shownFields}
            bulk={Boolean(builder?.bulk) || endpoint.id.endsWith("-bulk") || Array.isArray(activeBody?.items)}
            body={builder ? buildBody(builder, variantId, allToggles(builder), scopeId) : activeBody}
          />
        </Modal>
      ) : null}
      {modal === "responses" ? (
        <Modal title="Sample Responses" wide onClose={() => setModal(null)}>
          <div className="space-y-4">
            {sampleList.map((sample) => (
              <div key={sample.label} className="overflow-hidden rounded-md border border-slate-200">
                <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                  {sample.label}
                  <CopyButton text={JSON.stringify(sample.body, null, 2)} />
                </div>
                <JsonView text={JSON.stringify(sample.body, null, 2)} className="max-h-[420px]" />
              </div>
            ))}
          </div>
        </Modal>
      ) : null}
      {modal === "enums" ? (
        <Modal title="Enums" onClose={() => setModal(null)}>
          {hasSections ? (
            <p className="mb-3 text-sm text-slate-500">The values the filters of <code className="font-mono font-semibold">{sectionId}</code> accept. Change :section to see another section's.</p>
          ) : null}
          <ResourceEnums enums={hasSections ? sectionEnums : endpoint.enums} />
        </Modal>
      ) : null}
      {modal === "path" ? (
        <Modal title="Path Parameters" onClose={() => setModal(null)}>
          <KeyValueInputs rows={endpoint.pathParams} values={pathParams} onChange={setPathParams} />
        </Modal>
      ) : null}
      {modal === "query" ? (
        <Modal title="Query Parameters" onClose={() => setModal(null)}>
          {hasSections ? (
            <p className="mb-3 text-sm text-slate-500">
              The parameters of the section <code className="font-mono font-semibold">{sectionId || "—"}</code>: the ones every section takes, then its own filters. They change when you change :section. A box left empty is not sent.
            </p>
          ) : null}
          <KeyValueInputs rows={queryRows} values={query} onChange={setQuery} />
        </Modal>
      ) : null}
      {modal === "sectionNames" ? (
        <Modal title="Section Names" wide onClose={() => setModal(null)}>
          <p className="mb-3 text-sm text-slate-500">
            Put one of these in <code className="font-mono font-semibold">:section</code>. The POS shows the ten marked POS; the dashboard shows all of them, from this same endpoint. Plan = the store plan that unlocks it.
          </p>
          <SectionNamesTable
            sections={endpoint.sections}
            active={sectionId}
            onUse={(id) => {
              setPathParams({ ...pathParams, section: id })
              setModal(null)
            }}
          />
        </Modal>
      ) : null}
      {modal === "sectionFilters" ? (
        <Modal title="Section Filters" wide onClose={() => setModal(null)}>
          <SectionFiltersPanel
            sections={endpoint.sections}
            value={filterSection ?? (REPORT_SECTION[sectionId] ? sectionId : endpoint.sections[0].id)}
            onPick={setFilterSection}
            onUse={(id) => {
              setPathParams({ ...pathParams, section: id })
              setModal(null)
            }}
          />
        </Modal>
      ) : null}
      {modal === "files" ? (
        <Modal title="Attach Files" onClose={() => setModal(null)}>
          <p className="mb-3 text-sm text-slate-500">
            Optional. When a file is selected, the JSON body is sent as form fields with the file
            (multipart/form-data).
          </p>
          <div className="space-y-2">
            {fileFields.map((field) => (
              <label
                key={field.name}
                className="flex items-center gap-3 rounded-md border border-slate-200 px-3 py-2 text-sm"
              >
                <span className="w-40 shrink-0 font-mono text-sm font-semibold">
                  {field.label || field.name}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="min-w-0 flex-1 text-sm"
                  onChange={(e) =>
                    setFileMap((prev) => ({
                      ...prev,
                      [field.name]: e.target.files?.[0] || null,
                    }))
                  }
                />
              </label>
            ))}
          </div>
        </Modal>
      ) : null}
    </article>
  )
}

/** One labelled row in the options panel (radios / checkboxes). */
function OptionGroup({ label, children }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <span className="w-24 shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      {children}
    </div>
  )
}

/** Radio buttons drawn as a segmented control. */
function Segmented({ name, options, value, onChange }) {
  return (
    <div role="radiogroup" className="inline-flex rounded-lg border border-slate-300 bg-slate-50 p-1">
      {options.map((option) => {
        const active = value === option.id
        return (
          <label
            key={option.id}
            className={`cursor-pointer rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              active ? "bg-[#4990e2] text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <input
              type="radio"
              name={name}
              className="sr-only"
              checked={active}
              onChange={() => onChange(option.id)}
            />
            {option.label}
          </label>
        )
      })}
    </div>
  )
}

/** Checkbox drawn as an on/off chip. */
function ToggleChip({ label, checked, onChange }) {
  return (
    <label
      className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
        checked
          ? "border-[#49cc90] bg-[#49cc90]/10 text-[#1f7a52]"
          : "border-slate-300 bg-white text-slate-500 hover:border-slate-400"
      }`}
    >
      <input type="checkbox" className="sr-only" checked={checked} onChange={onChange} />
      <span
        aria-hidden="true"
        className={`flex h-4 w-4 items-center justify-center rounded border text-[10px] leading-none ${
          checked ? "border-[#49cc90] bg-[#49cc90] text-white" : "border-slate-300 bg-white"
        }`}
      >
        {checked ? "✓" : ""}
      </span>
      {label}
    </label>
  )
}

/** Name / value inputs for headers, path and query parameters. */
function KeyValueInputs({ rows, values, onChange }) {
  return (
    <div className="overflow-hidden rounded-md border border-slate-200">
      {rows.map((row) => (
        <div
          key={row.name}
          className="grid grid-cols-[200px_1fr] border-b border-slate-100 last:border-b-0"
        >
          <div className="bg-slate-50 px-3 py-2.5" title={row.description || undefined}>
            <div className="font-mono text-sm font-semibold text-slate-800">{row.name}</div>
            {row.required ? (
              <div className="text-[10px] font-semibold uppercase text-red-500">required</div>
            ) : row.type ? (
              <div className="text-[10px] uppercase text-slate-400">{row.type}</div>
            ) : null}
          </div>
          {row.values && row.multi ? (
            <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 bg-white px-3 py-2.5 text-sm">
              {row.values.map((value) => {
                const picked = String(values[row.name] ?? "").split(",").map((item) => item.trim()).filter(Boolean)
                return (
                  <label key={value} className="flex cursor-pointer items-center gap-1.5 font-mono">
                    <input
                      type="checkbox"
                      checked={picked.includes(value)}
                      onChange={() => {
                        const next = picked.includes(value) ? picked.filter((item) => item !== value) : [...picked, value]
                        onChange({ ...values, [row.name]: row.values.filter((item) => next.includes(item)).join(",") })
                      }}
                    />
                    {value}
                  </label>
                )
              })}
              <span className="text-xs text-slate-400">none ticked = not sent</span>
            </div>
          ) : row.values ? (
            <select
              className="min-w-0 bg-white px-3 py-2.5 font-mono text-sm outline-none focus:bg-[#f5f9ff]"
              value={values[row.name] ?? ""}
              onChange={(e) => onChange({ ...values, [row.name]: e.target.value })}
            >
              <option value="">(not set)</option>
              {row.values.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          ) : (
            <input
              className="min-w-0 bg-white px-3 py-2.5 font-mono text-sm outline-none focus:bg-[#f5f9ff]"
              value={values[row.name] ?? ""}
              onChange={(e) => onChange({ ...values, [row.name]: e.target.value })}
            />
          )}
        </div>
      ))}
    </div>
  )
}

/** Example value at "a.b" / "items[].product_id" (first row of an array). */
function exampleAt(body, path) {
  const [head, ...rest] = path.split(".")
  if (body == null) return undefined
  if (!head.endsWith("[]")) return rest.length ? exampleAt(body[head], rest.join(".")) : body[head]
  // Array rows: the first row that has the field (rows of a bulk body may differ).
  const rows = Array.isArray(body[head.slice(0, -2)]) ? body[head.slice(0, -2)] : []
  if (!rest.length) return rows[0]
  for (const row of rows) {
    const value = exampleAt(row, rest.join("."))
    if (value !== undefined) return value
  }
  return undefined
}

const BODY_FIELDS_GRID =
  "grid-cols-[minmax(150px,1.1fr)_110px_70px_minmax(100px,0.8fr)_minmax(0,1.5fr)]"

/** Values the server derives from the body (not sent), recalculated as the body is edited. */
function ComputedTotals({ compute, bodyText }) {
  let items
  try {
    const body = JSON.parse(bodyText || "{}")
    items = Array.isArray(body) ? body : Array.isArray(body.items) ? body.items : [body]
  } catch {
    return null
  }
  const rows = items
    .map((item, index) => ({ index, totals: item && typeof item === "object" ? compute(item) : [] }))
    .filter((row) => row.totals.length)
  if (!rows.length) return null
  return (
    <div className="mt-3 rounded border border-[#89bf04]/40 bg-[#f6fbea] px-3 py-2 text-xs">
      <div className="font-bold uppercase tracking-wide text-slate-500">
        Calculated by the server (not sent)
      </div>
      {rows.map(({ index, totals }) => (
        <div key={index} className="mt-1 flex flex-wrap gap-x-5 gap-y-1">
          {items.length > 1 ? <span className="text-slate-500">items[{index}]</span> : null}
          {totals.map(([label, value]) => (
            <span key={label}>
              <code className="font-mono font-semibold text-slate-800">{label}</code>
              <span className="text-slate-500">: </span>
              <code className="font-mono text-slate-800">{value}</code>
            </span>
          ))}
        </div>
      ))}
    </div>
  )
}

/** Required attributes are left blank; optional ones read "(optional)". */
function BodyFields({ fields, body, bulk = false }) {
  const rows = Object.entries(fields || {})
  if (!rows.length) return null
  return (
    <div className="overflow-hidden rounded-md border border-slate-200">
      <div
        className={`grid ${BODY_FIELDS_GRID} gap-3 bg-slate-50 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-slate-500`}
      >
        <span>Name</span>
        <span>Data Type</span>
        <span>Required</span>
        <span>Default Value</span>
        <span>Notes</span>
      </div>
      {rows.map(([path, rule]) => {
        const { required } = ruleOf(rule)
        const type = typeOf(path, rule, exampleAt(body, path))
        let fallback = defaultOf(rule)
        if (type === "boolean" && (fallback === "on" || fallback === "off")) fallback = String(fallback === "on")
        return (
          <div
            key={path}
            className={`grid ${BODY_FIELDS_GRID} items-start gap-3 border-t border-slate-100 px-4 py-2.5 text-sm`}
          >
            <code className="break-all font-mono font-semibold text-slate-800">
              {/* A bulk row's fields read as plain names (title, not items[].title). */}
              {bulk && path.startsWith("items[].") ? path.slice("items[].".length) : path}
            </code>
            <span className="text-slate-500">{type}</span>
            <span className={required ? "font-semibold text-[#f93e3e]" : "text-slate-500"}>{required ? "Yes" : "No"}</span>
            <code className="break-all font-mono text-slate-600">{fallback ?? "—"}</code>
            <span className="text-slate-600">{noteWithoutDefault(rule)}</span>
          </div>
        )
      })}
    </div>
  )
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard API unavailable (e.g. insecure context) — nothing to recover from here.
    }
  }
  return (
    <button
      type="button"
      onClick={copy}
      className="ml-auto h-7 rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  )
}

/** The prepared reply shown before the request is executed. */
function SampleResponsePanel({ sample, more, onMore }) {
  const body = pretty(sample.body)
  const ok = sample.status < 300
  return (
    <section className="overflow-hidden rounded-md border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 bg-slate-50 px-4 py-2 text-sm">
        <span className="font-semibold text-slate-700">Response</span>
        <span className={`font-bold ${ok ? "text-[#2f9e6e]" : "text-[#f93e3e]"}`}>{sample.label}</span>
        {more > 0 ? (
          <button type="button" onClick={onMore} className="text-xs font-semibold text-[#4990e2] hover:underline">
            +{more} more
          </button>
        ) : null}
        <CopyButton text={body} />
      </div>
      <JsonView text={body} className="max-h-[480px]" />
    </section>
  )
}

function ResponsePanel({ result }) {
  const body = result.json ? pretty(result.json) : result.text || "(empty)"
  return (
    <section className="overflow-hidden rounded-md border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 bg-slate-50 px-4 py-2 text-sm">
        <span className={`font-bold ${result.ok ? "text-[#2f9e6e]" : "text-[#f93e3e]"}`}>
          {result.status} {result.statusText}
        </span>
        <span className="text-slate-500">{result.elapsedMs} ms</span>
        <span className="min-w-0 truncate font-mono text-xs text-slate-400">{result.url}</span>
        <CopyButton text={body} />
      </div>
      {result.json ? (
        <JsonView text={body} className="max-h-[480px]" />
      ) : (
        <pre className="max-h-[480px] overflow-auto p-4 font-mono text-sm leading-6 text-slate-800">
          {body}
        </pre>
      )}
    </section>
  )
}

/** The backend's calculation, step by step, in a collapsible yellow note above the request body. */
function CalcNote({ note }) {
  return (
    <details className="group rounded-md border border-[#e6c200] bg-[#fff7c2] text-black">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-2.5 text-sm font-semibold">
        <span>📒 {note.title}</span>
        <span className="text-xs font-normal text-black/70 group-open:hidden">Show</span>
        <span className="hidden text-xs font-normal text-black/70 group-open:inline">Hide</span>
      </summary>
      <div className="space-y-3 border-t border-[#e6c200] px-4 py-3 text-sm leading-6">
        <p>{note.intro}</p>
        {note.sections.map((section) => (
          <div key={section.heading}>
            <p className="font-bold">{section.heading}</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-5">
              {section.lines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </details>
  )
}

const LEVEL_CLASS = { basic: "bg-emerald-50 text-emerald-700", standard: "bg-sky-50 text-sky-700", advanced: "bg-violet-50 text-violet-700" }

/** The :section path parameter: a text box that suggests the section names. */
function SectionInput({ sections, value, onChange }) {
  return (
    <div className="overflow-hidden rounded-md border border-slate-200">
      <div className="grid grid-cols-[200px_1fr] border-b border-slate-100 last:border-b-0">
        <div className="bg-slate-50 px-3 py-2.5">
          <div className="font-mono text-sm font-semibold text-slate-800">section</div>
          <div className="text-[10px] font-semibold uppercase text-red-500">required</div>
        </div>
        <input
          list="report-section-names"
          className="min-w-0 bg-white px-3 py-2.5 font-mono text-sm outline-none focus:bg-[#f5f9ff]"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Pick or type a section name"
        />
        <datalist id="report-section-names">
          {sections.map((section) => (
            <option key={section.id} value={section.id}>{section.label}</option>
          ))}
        </datalist>
      </div>
    </div>
  )
}

/** Every section: its name, plan and what it shows. "Use" puts it in :section. */
function SectionNamesTable({ sections, active, onUse }) {
  const grid = "grid-cols-[minmax(120px,0.8fr)_minmax(110px,0.8fr)_84px_92px_84px_minmax(0,2fr)_56px]"
  return (
    <div className="overflow-hidden rounded-md border border-slate-200">
      <div className={`grid ${grid} gap-3 bg-slate-50 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-slate-500`}>
        <span>Section</span>
        <span>Name</span>
        <span>Plan</span>
        <span>Shown in</span>
        <span>In the API</span>
        <span>Shows</span>
        <span />
      </div>
      {sections.map((section) => (
        <div key={section.id} className={`grid ${grid} items-start gap-3 border-t border-slate-100 px-4 py-2.5 text-sm ${section.id === active ? "bg-[#f5f9ff]" : ""}`}>
          <code className="break-all font-mono font-semibold text-slate-800">{section.id}</code>
          <span className="font-medium text-slate-800">{section.label}</span>
          <span className={`w-fit rounded px-2 py-0.5 text-xs font-semibold capitalize ${LEVEL_CLASS[section.level] || "bg-slate-100 text-slate-600"}`}>{section.level}</span>
          <span className={`w-fit rounded px-2 py-0.5 text-xs font-semibold ${section.pos ? "bg-sky-50 text-sky-700" : "bg-slate-100 text-slate-600"}`}>{section.pos ? "POS + dashboard" : "Dashboard"}</span>
          <span className={`w-fit rounded px-2 py-0.5 text-xs font-semibold ${section.ready ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{section.ready ? "Ready" : "To build"}</span>
          <span className="text-slate-600">
            {section.about}
            {section.today ? <span className="mt-1 block text-xs text-amber-700">{section.today}</span> : null}
          </span>
          <button type="button" onClick={() => onUse(section.id)} className="h-7 rounded-md border border-slate-300 bg-white px-2 text-xs font-semibold text-[#4990e2] hover:bg-slate-50">
            Use
          </button>
        </div>
      ))}
    </div>
  )
}

const FILTER_GRID = "grid-cols-[minmax(120px,0.9fr)_72px_minmax(120px,1.1fr)_90px_104px_minmax(0,2fr)]"

/** Filters as a table: name, type, accepted values, default, whether the API applies it, what it does. */
function FilterTable({ rows, empty }) {
  if (!rows.length) return <p className="rounded-md border border-slate-200 px-4 py-3 text-sm text-slate-500">{empty}</p>
  return (
    <div className="overflow-hidden rounded-md border border-slate-200">
      <div className={`grid ${FILTER_GRID} gap-3 bg-slate-50 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-slate-500`}>
        <span>Name</span>
        <span>Type</span>
        <span>Values</span>
        <span>Default</span>
        <span>API</span>
        <span>What it does</span>
      </div>
      {rows.map((row) => (
        <div key={row.name} className={`grid ${FILTER_GRID} items-start gap-3 border-t border-slate-100 px-4 py-2.5 text-sm`}>
          <code className="break-all font-mono font-semibold text-slate-800">{row.name}</code>
          <span className="text-slate-500">{row.type}</span>
          <div className="flex flex-wrap gap-1">
            {row.values ? row.values.map((value) => <span key={value} className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-700">{value}</span>) : <span className="text-slate-400">—</span>}
          </div>
          <code className="break-all font-mono text-slate-600">{row.default || "—"}</code>
          <span className={`w-fit rounded px-2 py-0.5 text-xs font-semibold ${row.live ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{row.live ? "Applied" : "Not applied yet"}</span>
          <span className="text-slate-600">{row.description}</span>
        </div>
      ))}
    </div>
  )
}

/** The Section Filters dialog: pick a section, see every filter it takes and the lists it returns. */
function SectionFiltersPanel({ sections, value, onPick, onUse }) {
  const section = sections.find((row) => row.id === value) || sections[0]
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm font-semibold text-slate-700" htmlFor="report-filter-section">Section</label>
        <select
          id="report-filter-section"
          value={section.id}
          onChange={(e) => onPick(e.target.value)}
          className="h-9 rounded-md border border-slate-300 bg-white px-3 font-mono text-sm"
        >
          {sections.map((row) => (
            <option key={row.id} value={row.id}>{row.id} — {row.label}</option>
          ))}
        </select>
        <button type="button" onClick={() => onUse(section.id)} className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-[#4990e2] hover:bg-slate-50">
          Use this section
        </button>
      </div>
      <div>
        <p className="text-sm text-slate-700">{section.about}</p>
        <p className="mt-1 text-sm text-slate-500">
          Lists in the reply (<code className="font-mono">table=</code>):{" "}
          {section.tables.map((name) => (
            <code key={name} className="mr-1 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-700">{name}</code>
          ))}
          <span className={`ml-2 rounded px-2 py-0.5 text-xs font-semibold capitalize ${LEVEL_CLASS[section.level]}`}>{section.level} plan</span>
        </p>
        {section.today ? <p className="mt-1 text-xs text-amber-700">{section.today}</p> : null}
      </div>
      <div>
        <h4 className="mb-2 text-sm font-semibold text-slate-700">Filters of {section.label}</h4>
        <FilterTable rows={section.filters} empty="This section has no filters of its own." />
      </div>
      <div>
        <h4 className="mb-2 text-sm font-semibold text-slate-700">Every section takes</h4>
        <FilterTable rows={REPORT_COMMON} empty="" />
      </div>
      {[...section.filters, ...REPORT_COMMON].some((row) => !row.live) ? (
        <p className="text-xs text-slate-500">A filter marked "Not applied yet" is agreed but the API does not apply it yet: it is ignored, not an error.</p>
      ) : (
        <p className="text-xs text-slate-500">Every filter above is applied by the API. A filter the section does not know is ignored; a value that does not fit is a 400.</p>
      )}
    </div>
  )
}
