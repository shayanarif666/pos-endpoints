import { useEffect, useMemo, useState } from "react"
import { defaultHeaders, migrateLegacyPlanBody } from "../lib/storage.js"
import { buildUrl, sendRequest } from "../lib/request.js"
import { ruleOf, synthesizeExample, typeOf } from "../data/bodyFields.js"
import { allToggles, buildBody, defaultToggles } from "../data/bodyBuilder.js"
import { JsonEditor, JsonView, Modal, ViewButton } from "./DocUi.jsx"

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

/** `bare` drops the box and heading and uses larger text (the Enums modal). */
export function ResourceEnums({ enums, className = "", bare = false }) {
  if (!enums || !Object.keys(enums).length) return null
  const list = (
    <div className={bare ? "space-y-4" : "mt-2 space-y-2"}>
      {Object.entries(enums).map(([key, values]) => (
        <div key={key}>
          <div
            className={`font-mono font-semibold text-slate-700 ${bare ? "text-sm" : "text-xs"}`}
          >
            {key}
          </div>
          <div className="mt-1 flex flex-wrap gap-1">
            {(Array.isArray(values) ? values : []).map((value) => (
              <span
                key={value}
                className={`rounded bg-slate-100 px-2 py-0.5 font-mono text-slate-700 ${
                  bare ? "text-xs" : "text-[11px]"
                }`}
              >
                {value}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
  if (bare) return list
  return (
    <div className={`rounded border border-slate-200 bg-white p-3 ${className}`}>
      <h3 className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Enums</h3>
      {list}
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
    // The location picker (store admin only) owns this header, whatever was typed earlier.
    delete merged["X-Location-Id"]
    const chosen = defaultHeaders(endpoint.auth, endpoint.method, session)["X-Location-Id"]
    if (chosen) merged["X-Location-Id"] = chosen
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

  const enumCount = endpoint.enums ? Object.keys(endpoint.enums).length : 0
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
            {fieldCount ? (
              <ViewButton label="View Attributes" count={fieldCount} onClick={() => setModal("fields")} />
            ) : null}
            {enumCount ? (
              <ViewButton label="View Enums" count={enumCount} onClick={() => setModal("enums")} />
            ) : null}
            {endpoint.pathParams.length ? (
              <ViewButton
                label="View Path Parameters"
                count={endpoint.pathParams.length}
                onClick={() => setModal("path")}
              />
            ) : null}
            {endpoint.query.length ? (
              <ViewButton
                label="View Query Parameters"
                count={endpoint.query.length}
                onClick={() => setModal("query")}
              />
            ) : null}
            {fileFields.length ? (
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

          {result ? <ResponsePanel result={result} /> : null}
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
            body={builder ? buildBody(builder, variantId, allToggles(builder), scopeId) : activeBody}
          />
        </Modal>
      ) : null}
      {modal === "enums" ? (
        <Modal title="Enums" onClose={() => setModal(null)}>
          <ResourceEnums enums={endpoint.enums} bare />
        </Modal>
      ) : null}
      {modal === "path" ? (
        <Modal title="Path Parameters" onClose={() => setModal(null)}>
          <KeyValueInputs rows={endpoint.pathParams} values={pathParams} onChange={setPathParams} />
        </Modal>
      ) : null}
      {modal === "query" ? (
        <Modal title="Query Parameters" onClose={() => setModal(null)}>
          <KeyValueInputs rows={endpoint.query} values={query} onChange={setQuery} />
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
          <div className="bg-slate-50 px-3 py-2.5">
            <div className="font-mono text-sm font-semibold text-slate-800">{row.name}</div>
            {row.required ? (
              <div className="text-[10px] font-semibold uppercase text-red-500">required</div>
            ) : null}
          </div>
          <input
            className="min-w-0 bg-white px-3 py-2.5 font-mono text-sm outline-none focus:bg-[#f5f9ff]"
            value={values[row.name] ?? ""}
            onChange={(e) => onChange({ ...values, [row.name]: e.target.value })}
          />
        </div>
      ))}
    </div>
  )
}

/** Example value at "a.b" / "items[].product_id" (first row of an array). */
function exampleAt(body, path) {
  let value = body
  for (const part of path.split(".")) {
    if (value == null) return undefined
    const isRows = part.endsWith("[]")
    value = value[isRows ? part.slice(0, -2) : part]
    if (isRows) value = Array.isArray(value) ? value[0] : undefined
  }
  return value
}

function formatExample(value) {
  if (value === undefined) return ""
  if (Array.isArray(value)) return value.length && typeof value[0] === "object" ? "[ … ]" : JSON.stringify(value)
  if (value && typeof value === "object") return "{ … }"
  return JSON.stringify(value)
}

const BODY_FIELDS_GRID =
  "grid-cols-[minmax(150px,1.1fr)_80px_minmax(100px,0.8fr)_90px_minmax(0,1.5fr)]"

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
function BodyFields({ fields, body }) {
  const rows = Object.entries(fields || {})
  if (!rows.length) return null
  return (
    <div className="overflow-hidden rounded-md border border-slate-200">
      <div
        className={`grid ${BODY_FIELDS_GRID} gap-3 bg-slate-50 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-slate-500`}
      >
        <span>Attribute</span>
        <span>Data Type</span>
        <span>Example</span>
        <span>Required</span>
        <span>Notes</span>
      </div>
      {rows.map(([path, rule]) => {
        const { required, note } = ruleOf(rule)
        const bodyValue = exampleAt(body, path)
        const type = typeOf(path, rule, bodyValue)
        const example = bodyValue !== undefined ? bodyValue : synthesizeExample(type, rule)
        return (
          <div
            key={path}
            className={`grid ${BODY_FIELDS_GRID} items-start gap-3 border-t border-slate-100 px-4 py-2.5 text-sm`}
          >
            <code className="break-all font-mono font-semibold text-slate-800">{path}</code>
            <span className="text-slate-500">{type}</span>
            <code className="break-all font-mono text-slate-500">{formatExample(example)}</code>
            <span className={required ? "" : "italic text-slate-500"}>{required ? "" : "(optional)"}</span>
            <span className="text-slate-600">{note}</span>
          </div>
        )
      })}
    </div>
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
