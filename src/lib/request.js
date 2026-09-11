function fillPath(path, params) {
  return path.replace(/:([A-Za-z0-9_]+)/g, (_, key) => {
    const value = params[key]
    if (value == null || value === "") return `:${key}`
    return encodeURIComponent(String(value))
  })
}

export function buildUrl(baseUrl, path, pathParams, query) {
  const filled = fillPath(path, pathParams)
  const url = new URL(filled, baseUrl.replace(/\/$/, "") + "/")
  for (const [key, value] of Object.entries(query || {})) {
    if (value === undefined || value === null || value === "") continue
    url.searchParams.set(key, String(value))
  }
  return url.toString()
}

function appendFormValue(form, key, value) {
  if (value === undefined || value === null) return
  if (typeof value === "object") {
    form.append(key, JSON.stringify(value))
    return
  }
  form.append(key, String(value))
}

export async function sendRequest({
  baseUrl,
  method,
  path,
  pathParams,
  query,
  headers,
  bodyText,
  files,
}) {
  const url = buildUrl(baseUrl, path, pathParams, query)
  const init = { method, headers: { ...headers } }
  const fileEntries = Object.entries(files || {}).filter(([, file]) => Boolean(file))

  if (method !== "GET" && method !== "HEAD") {
    if (fileEntries.length) {
      delete init.headers["Content-Type"]
      delete init.headers["content-type"]
      const form = new FormData()
      if (bodyText) {
        const obj = JSON.parse(bodyText || "{}")
        for (const [key, value] of Object.entries(obj)) {
          appendFormValue(form, key, value)
        }
      }
      for (const [name, file] of fileEntries) {
        form.append(name, file)
      }
      init.body = form
    } else if (bodyText != null && bodyText !== "") {
      init.body = bodyText
    }
  }

  const started = performance.now()
  const response = await fetch(url, init)
  const elapsedMs = Math.round(performance.now() - started)
  const text = await response.text()
  let json = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = null
  }

  return {
    url,
    status: response.status,
    statusText: response.statusText,
    ok: response.ok,
    elapsedMs,
    headers: Object.fromEntries(response.headers.entries()),
    text,
    json,
  }
}
