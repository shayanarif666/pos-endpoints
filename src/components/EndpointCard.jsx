import { useEffect, useMemo, useState } from "react"
import { defaultHeaders, migrateLegacyPlanBody } from "../lib/storage.js"
import { sendRequest } from "../lib/request.js"
import { ruleOf, synthesizeExample, typeOf } from "../data/bodyFields.js"
import { allToggles, buildBody, defaultToggles } from "../data/bodyBuilder.js"

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

export function ResourceEnums({ enums, className = "" }) {
  if (!enums || !Object.keys(enums).length) return null
  return (
    <div className={`rounded border border-slate-200 bg-white p-3 ${className}`}>
      <h3 className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Enums</h3>
      <div className="mt-2 space-y-2">
        {Object.entries(enums).map(([key, values]) => (
          <div key={key}>
            <div className="font-mono text-xs font-semibold text-slate-700">{key}</div>
            <div className="mt-1 flex flex-wrap gap-1">
              {(Array.isArray(values) ? values : []).map((value) => (
                <span
                  key={value}
                  className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-700"
                >
                  {value}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function EndpointCard({ endpoint, session, onCapture, savedBody, onSaveBody }) {
  const [open, setOpen] = useState(false)
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
  const [toggles, setToggles] = useState(() => (builder ? defaultToggles(builder) : {}))
  const activeBody = builder ? buildBody(builder, variantId, toggles) : endpoint.body
  const [bodyText, setBodyText] = useState(() =>
    migrateLegacyPlanBody(
      (builder ? null : savedBody) ?? (activeBody == null ? "" : pretty(activeBody))
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
    const next = body == null ? "" : pretty(body)
    setBodyText(next)
    onSaveBody(endpoint.id, next)
  }

  function resetBody() {
    if (!builder) return showBody(endpoint.body)
    const defaults = defaultToggles(builder)
    setVariantId(builder.variants[0].id)
    setToggles(defaults)
    showBody(buildBody(builder, builder.variants[0].id, defaults))
  }

  function selectVariant(id) {
    setVariantId(id)
    showBody(buildBody(builder, id, toggles))
  }

  function flipToggle(id) {
    const next = { ...toggles, [id]: !toggles[id] }
    setToggles(next)
    showBody(buildBody(builder, variantId, next))
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
        <div className="border-t border-black/10 bg-white/70 p-4">
          <p className="text-sm leading-6 text-slate-600">{endpoint.description}</p>
          <ResourceEnums enums={endpoint.enums} className="mt-3" />

          {endpoint.pathParams.length ? (
            <ParamTable
              title="Path parameters"
              rows={endpoint.pathParams}
              values={pathParams}
              onChange={setPathParams}
            />
          ) : null}

          {endpoint.query.length ? (
            <ParamTable title="Query" rows={endpoint.query} values={query} onChange={setQuery} />
          ) : null}

          <section className="mt-4">
            <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">Headers</h4>
            <p className="mt-1 text-xs text-slate-500">
              Edit values. Authorization is filled from Authorize when a token is saved.
            </p>
            <div className="mt-2 overflow-hidden rounded border border-slate-200">
              {Object.entries(shownHeaders).map(([key, value]) => (
                <div key={key} className="grid grid-cols-[180px_1fr] border-b border-slate-100 last:border-b-0">
                  <div className="bg-slate-50 px-3 py-2 font-mono text-xs font-semibold">{key}</div>
                  <input
                    className="bg-white px-3 py-2 font-mono text-xs outline-none"
                    value={value}
                    onChange={(e) => setHeaderMap((prev) => ({ ...shownHeaders, [key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
          </section>

          {fileFields.length ? (
            <section className="mt-4">
              <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Files — multipart/form-data
              </h4>
              <p className="mt-1 text-xs text-slate-500">
                Optional. When a file is selected, the JSON body is sent as form fields with the file.
              </p>
              <div className="mt-2 space-y-2">
                {fileFields.map((field) => (
                  <label
                    key={field.name}
                    className="flex items-center gap-3 rounded border border-slate-200 bg-white px-3 py-2 text-sm"
                  >
                    <span className="w-40 shrink-0 font-mono text-xs font-semibold">
                      {field.label || field.name}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="min-w-0 flex-1 text-xs"
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
            </section>
          ) : null}

          {endpoint.body != null ? (
            <section className="mt-4">
              {builder && !builder.bulk && builder.variants.length > 1 ? (
                <div className="mb-3 flex items-center gap-4 rounded border border-slate-200 bg-white px-3 py-2">
                  {builder.variants.map((variant) => (
                    <label
                      key={variant.id}
                      className="flex cursor-pointer items-center gap-2 text-sm text-slate-700"
                    >
                      <input
                        type="radio"
                        name={`${endpoint.id}-variant`}
                        checked={variantId === variant.id}
                        onChange={() => selectVariant(variant.id)}
                      />
                      {variant.label}
                    </label>
                  ))}
                </div>
              ) : null}
              {builder && !builder.bulk && builder.toggles.length ? (
                <div className="mb-3 flex flex-wrap items-center gap-4 rounded border border-slate-200 bg-white px-3 py-2">
                  {builder.toggles.map((toggle) => (
                    <label
                      key={toggle.id}
                      className="flex cursor-pointer items-center gap-2 text-sm text-slate-700"
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(toggles[toggle.id])}
                        onChange={() => flipToggle(toggle.id)}
                      />
                      {toggle.label}
                    </label>
                  ))}
                </div>
              ) : null}
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Request body — application/json
                </h4>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={copyBody}
                    className="text-xs font-semibold text-slate-600 hover:underline"
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                  <button
                    type="button"
                    onClick={resetBody}
                    className="text-xs font-semibold text-[#547f00] hover:underline"
                  >
                    Reset defaults
                  </button>
                </div>
              </div>
              <textarea
                className="mt-2 min-h-[180px] w-full rounded border border-slate-300 bg-[#1b1b1b] p-3 font-mono text-xs leading-5 text-[#f5f5f5] outline-none focus:border-[#89bf04]"
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
                spellCheck={false}
              />
              {endpoint.computed ? <ComputedTotals compute={endpoint.computed} bodyText={bodyText} /> : null}
              <BodyFields
                fields={endpoint.fields}
                body={builder ? buildBody(builder, variantId, allToggles(builder)) : activeBody}
              />
            </section>
          ) : (
            <p className="mt-4 text-xs text-slate-500">No request body.</p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={execute}
              disabled={busy}
              className="h-9 rounded bg-[#4990e2] px-5 text-sm font-semibold text-white hover:bg-[#357abd] disabled:opacity-60"
            >
              {busy ? "Sending…" : "Execute"}
            </button>
            <span className="font-mono text-xs text-slate-500">
              {session.baseUrl.replace(/\/$/, "")}
              {endpoint.path}
            </span>
          </div>

          {error ? (
            <pre className="mt-3 overflow-auto rounded border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              {error}
            </pre>
          ) : null}

          {result ? <ResponsePanel result={result} /> : null}
        </div>
      ) : null}
    </article>
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
    <div className="mt-3 overflow-hidden rounded border border-slate-200">
      <div
        className={`grid ${BODY_FIELDS_GRID} bg-slate-50 px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-slate-500`}
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
            className={`grid ${BODY_FIELDS_GRID} items-start gap-2 border-t border-slate-100 px-3 py-2 text-xs`}
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

function ParamTable({ title, rows, values, onChange }) {
  return (
    <section className="mt-4">
      <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">{title}</h4>
      <div className="mt-2 overflow-hidden rounded border border-slate-200">
        {rows.map((row) => (
          <div key={row.name} className="grid grid-cols-[180px_1fr] border-b border-slate-100 last:border-b-0">
            <div className="bg-slate-50 px-3 py-2">
              <div className="font-mono text-xs font-semibold">{row.name}</div>
              {row.required ? <div className="text-[10px] uppercase text-red-500">required</div> : null}
            </div>
            <input
              className="bg-white px-3 py-2 font-mono text-xs outline-none"
              value={values[row.name] ?? ""}
              onChange={(e) => onChange({ ...values, [row.name]: e.target.value })}
            />
          </div>
        ))}
      </div>
    </section>
  )
}

function ResponsePanel({ result }) {
  const body = result.json ? pretty(result.json) : result.text || "(empty)"
  return (
    <section className="mt-4 rounded border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-3 py-2 text-xs">
        <span className={`font-bold ${result.ok ? "text-[#49cc90]" : "text-[#f93e3e]"}`}>
          {result.status} {result.statusText}
        </span>
        <span className="text-slate-500">{result.elapsedMs} ms</span>
        <span className="min-w-0 truncate font-mono text-slate-400">{result.url}</span>
      </div>
      <pre className="max-h-[420px] overflow-auto p-3 font-mono text-xs leading-5 text-slate-800">{body}</pre>
    </section>
  )
}
