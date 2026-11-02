const KEY = "pos-api-docs"

const LEGACY_PLAN_FLAGS = [
  "offline_enabled",
  "pin_override_enabled",
  "approval_enabled",
  "advanced_reports",
  "backup_restore_enabled",
  "multi_branch_enabled",
  "has_dedicated_am",
]

// The API moved from Railway to Render (its own database): a session still on the old URL moves
// over, and its tokens / license key (issued by the old server) are dropped.
const OLD_BASE_URLS = ["https://pak-pos-backend-production.up.railway.app/", "https://pak-pos-backend-production.up.railway.app"]

// `npm run dev` talks to the local API; the deployed build to production.
const PRODUCTION_BASE_URL = "https://pak-pos-backend.onrender.com/"
const LOCAL_BASE_URL = "http://localhost:5000/"
const DEFAULT_BASE_URL = import.meta.env.DEV ? LOCAL_BASE_URL : PRODUCTION_BASE_URL
// A session saved by the other mode moves to this mode's server (its tokens belong to the other one).
const OTHER_BASE_URLS = import.meta.env.DEV
  ? [PRODUCTION_BASE_URL, PRODUCTION_BASE_URL.slice(0, -1)]
  : [LOCAL_BASE_URL, LOCAL_BASE_URL.slice(0, -1)]

const defaults = {
  baseUrl: DEFAULT_BASE_URL,
  accessToken: "",
  refreshToken: "",
  licenseKey: "",
  // Captured from login: store-admin-only body fields are shown only to a store admin.
  role: "",
  // Edited request bodies live in memory only: a page refresh shows the default payloads again.
  bodies: {},
}

function pretty(value) {
  return JSON.stringify(value, null, 2)
}

export function migrateLegacyPlanBody(text) {
  if (!text) return text
  try {
    const obj = JSON.parse(text)
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) return text
    let changed = false
    const present = LEGACY_PLAN_FLAGS.filter((key) =>
      Object.prototype.hasOwnProperty.call(obj, key)
    )
    if (present.length) {
      const features = Array.isArray(obj.features)
        ? obj.features.filter((item) => typeof item === "string" && item.trim())
        : []
      for (const key of present) {
        if (obj[key] === true && !features.includes(key)) features.push(key)
        delete obj[key]
      }
      obj.features = features
      changed = true
    }
    if ("store_id" in obj) {
      delete obj.store_id
      changed = true
    }
    return changed ? pretty(obj) : text
  } catch {
    return text
  }
}

export function loadSession() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...defaults }
    let parsed = { ...defaults, ...JSON.parse(raw) }
    if (OLD_BASE_URLS.includes(parsed.baseUrl) || OTHER_BASE_URLS.includes(parsed.baseUrl)) {
      parsed = { ...parsed, baseUrl: defaults.baseUrl, accessToken: "", refreshToken: "", licenseKey: "", role: "" }
    }
    return { ...parsed, bodies: {} }
  } catch {
    return { ...defaults }
  }
}

export function saveSession(next) {
  // Bodies are never stored (an older session's saved bodies are dropped on the next save).
  const { bodies: _bodies, ...rest } = next
  localStorage.setItem(KEY, JSON.stringify(rest))
}

export function defaultHeaders(
  auth,
  method,
  { accessToken },
  { multipart = false } = {}
) {
  const headers = { Accept: "application/json" }
  if (!multipart && method !== "GET" && method !== "DELETE") {
    headers["Content-Type"] = "application/json"
  }
  if (auth !== "public" && accessToken) {
    headers.Authorization = `Bearer ${accessToken}`
  }
  return headers
}

export function getByPath(obj, path) {
  return path.split(".").reduce((acc, key) => (acc == null ? acc : acc[key]), obj)
}
