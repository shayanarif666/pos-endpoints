import { useEffect, useMemo, useState } from "react"
import { defaultHeaders, migrateLegacyPlanBody } from "../lib/storage.js"
import { sendRequest } from "../lib/request.js"

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
  const [bodyText, setBodyText] = useState(() =>
    migrateLegacyPlanBody(
      savedBody ?? (endpoint.body == null ? "" : pretty(endpoint.body))
    )
  )
  const [busy, setBusy] = useState(false)
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

  function resetBody() {
    const next = endpoint.body == null ? "" : pretty(endpoint.body)
    setBodyText(next)
    onSaveBody(endpoint.id, next)
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
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Request body — application/json
                </h4>
                <button
                  type="button"
                  onClick={resetBody}
                  className="text-xs font-semibold text-[#547f00] hover:underline"
                >
                  Reset defaults
                </button>
              </div>
              <textarea
                className="mt-2 min-h-[180px] w-full rounded border border-slate-300 bg-[#1b1b1b] p-3 font-mono text-xs leading-5 text-[#f5f5f5] outline-none focus:border-[#89bf04]"
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
                spellCheck={false}
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
